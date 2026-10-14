import { NextResponse } from 'next/server'
import { z } from 'zod'

import { askJSON, backupPath } from '@/lib/claude'
import { currentUser, loadContext } from '@/lib/context'
import { logActivity } from '@/lib/activity'
import { flattenPage, getAtPath, setAtPath } from '@/lib/flatten'
import { dedupe, runFixedRules, type Finding } from '@/lib/preflightRules'

const SYSTEM = `You pre-check web pages for Halden Health before human compliance review. You flag problems and suggest fixes; you never approve anything. You reply with one JSON object and nothing else.`

const AiFindings = z.object({
  findings: z.array(z.object({
    type: z.string(),
    severity: z.enum(['critical', 'warning']),
    path: z.string(),
    quote: z.string(),
    message: z.string(),
    fix: z.object({ replacement: z.string(), claimId: z.string().optional() }).nullable().optional(),
  })),
})

export async function POST(req: Request) {
  const { id, action = 'check', finding } = await req.json()
  const { payload, claims, bannedWords, brandRules, claimsList } = await loadContext()
  const user = await currentUser(payload, req)
  const page: any = await payload.findByID({ collection: 'pages', id, draft: true })

  if (action === 'apply' && finding) {
    const f = finding as Finding
    const data: any = { layout: page.layout, metaDescription: page.metaDescription, disclaimer: page.disclaimer }
    const cur = getAtPath(data, f.path)
    if (typeof cur === 'string' && f.fix) {
      setAtPath(data, f.path, f.quote ? cur.replace(f.quote, f.fix.replacement) : `${cur} ${f.fix.replacement}`.trim())
    }
    const claim = claims.find((c) => c.claimId === f.fix?.claimId)
    if (claim?.disclaimer && claim.disclaimer !== 'None' && f.path !== 'disclaimer') {
      const have = (data.disclaimer ?? '') as string
      const missing = claim.disclaimer.split(/(?<=[.!?])\s+/).filter((s) => !have.toLowerCase().includes(s.toLowerCase().replace(/\.$/, '')))
      data.disclaimer = [have, ...missing].filter(Boolean).join(' ')
    }
    await payload.update({ collection: 'pages', id, data, draft: true })
    await logActivity(payload, { task: 'preflight-fix', page: id, inputSummary: f.quote, output: f.fix, accepted: true, userId: user?.id })
    return NextResponse.json({ ok: true })
  }

  const flat = flattenPage(page)
  const rules = runFixedRules(page, claims, bannedWords)
  const { data, usedBackup } = await askJSON({
    system: SYSTEM,
    user: `Approved claims (id: claim | required disclaimer):
${claimsList}

Brand voice: ${brandRules}

Page fields, each with its path:
${flat.map((f) => JSON.stringify({ path: f.path, text: f.text })).join('\n')}

Find:
1. Any statement about the product's effect, speed, safety or comparison with other products that is not an approved claim, word for word or in meaning. Severity: critical. Suggest the closest approved claim as the replacement and give its id; if none fits, set fix to null.
2. Any sentence that breaks the brand voice. Severity: warning. Suggest a rewrite.

Do not flag approved claims that are used correctly. Quote the exact text you flag.

Return:
{ "findings": [{ "type": "unapproved_claim", "severity": "critical", "path": "", "quote": "",
  "message": "", "fix": { "replacement": "", "claimId": "C-02" } }] }`,
    schema: AiFindings,
    backup: backupPath('preflight.json'),
  })

  // Only keep AI findings whose quote really is on the page.
  const aiFindings: Finding[] = data.findings
    .filter((f) => !f.quote || String(getAtPath(page, f.path) ?? '').includes(f.quote))
    .map((f) => ({ ...f, type: (f.type as Finding['type']) || 'voice', fix: f.fix ?? null, source: 'ai' as const }))
  const findings = dedupe([...rules, ...aiFindings])

  const critical = findings.filter((f) => f.severity === 'critical').length
  if (action === 'submit' && critical === 0) {
    await payload.update({ collection: 'pages', id, data: { reviewStatus: 'in-review' } as any, draft: true })
  }
  await logActivity(payload, { task: `preflight (${action})`, page: id, output: { critical, total: findings.length }, accepted: action === 'submit' && critical === 0, usedBackup, userId: user?.id })
  return NextResponse.json({ findings, critical, submitted: action === 'submit' && critical === 0, usedBackup })
}
