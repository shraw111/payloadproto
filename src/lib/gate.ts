import { z } from 'zod'

import { askJSON, backupPath } from './claude'
import { loadContext } from './context'
import { flattenPage, getAtPath } from './flatten'
import { dedupe, runFixedRules, runOfferRules, type Finding } from './preflightRules'

const SYSTEM = `You pre-check vehicle web pages before human compliance review. You flag problems and suggest fixes; you never approve anything. You reply with one JSON object and nothing else.`

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

export type GateResult = {
  findings: Finding[]
  critical: number
  review: number
  decision: 'publish' | 'blocked' | 'sent-to-hq'
  reason: string
  usedBackup: boolean
}

/**
 * The publish gate. Fixed rules decide; the AI check only adds findings.
 * Any critical finding blocks. Otherwise any review finding sends the page to HQ. Otherwise it can publish.
 */
export async function evaluatePage(page: any, opts: { withAI?: boolean } = {}): Promise<GateResult> {
  const { payload, claims, bannedWords, brandRules, claimsList } = await loadContext()
  const rules: any = await payload.findGlobal({ slug: 'brand-rules' })
  const maxDiscount = Number(rules.maxDealerDiscount ?? 2000)
  const standardTerms = String(rules.standardTerms ?? 'Subject to availability. Terms apply.')

  const fixed = [...runFixedRules(page, claims, bannedWords), ...runOfferRules(page, { maxDiscount, standardTerms })]
  let ai: Finding[] = []
  let usedBackup = true
  if (opts.withAI !== false) {
    const flat = flattenPage(page)
    const res = await askJSON({
      system: SYSTEM,
      user: `Approved claims (id: claim | required disclaimer):
${claimsList}

Brand voice: ${brandRules}

Page fields, each with its path:
${flat.map((f) => JSON.stringify({ path: f.path, text: f.text })).join('\n')}

Find:
1. Any statement about the product's effect, speed, safety, price or comparison with other products that is not an approved claim, word for word or in meaning. Severity: critical. Suggest the closest approved claim as the replacement and give its id; if none fits, set fix to null.
2. Any sentence that breaks the brand voice. Severity: warning. Suggest a rewrite.

Do not flag approved claims that are used correctly, and do not flag the dealer's own offer amount or dates. Quote the exact text you flag.

Return:
{ "findings": [{ "type": "unapproved_claim", "severity": "critical", "path": "", "quote": "",
  "message": "", "fix": { "replacement": "", "claimId": "C-02" } }] }`,
      schema: AiFindings,
      backup: backupPath('preflight.json'),
      offline: () => ({ findings: [] }),
    })
    usedBackup = res.usedBackup
    // Keep only AI findings whose quote really is on the page.
    ai = res.data.findings
      .filter((f) => !f.quote || String(getAtPath(page, f.path) ?? '').includes(f.quote))
      .map((f) => ({ ...f, type: (f.type as Finding['type']) || 'voice', fix: f.fix ?? null, source: 'ai' as const }))
  }
  const findings = dedupe([...fixed, ...ai])
  const critical = findings.filter((f) => f.severity === 'critical').length
  const review = findings.filter((f) => f.severity === 'review').length
  const decision = critical ? 'blocked' : review ? 'sent-to-hq' : 'publish'
  const reason = (findings.find((f) => f.severity === (critical ? 'critical' : 'review'))?.message ?? '').slice(0, 300)
  return { findings, critical, review, decision, reason, usedBackup }
}
