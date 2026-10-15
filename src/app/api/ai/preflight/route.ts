import { NextResponse } from 'next/server'

import { currentUser, loadContext } from '@/lib/context'
import { canTouch } from '@/lib/dealer'
import { logActivity } from '@/lib/activity'
import { evaluatePage } from '@/lib/gate'
import { getAtPath, setAtPath } from '@/lib/flatten'
import type { Finding } from '@/lib/preflightRules'

/** Pre-flight check, and one-click fixes. Publishing itself happens in /api/dealer/publish, which uses the same gate. */
export async function POST(req: Request) {
  const { id, action = 'check', finding } = await req.json()
  const { payload, claims } = await loadContext()
  const user: any = await currentUser(payload, req)
  const page: any = await payload.findByID({ collection: 'pages', id, draft: true, depth: 0 })
  if (user && !canTouch(user, page)) return NextResponse.json({ error: 'Not your page' }, { status: 403 })

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

  const gate = await evaluatePage(page)
  await logActivity(payload, { task: 'preflight-check', page: id, output: { critical: gate.critical, review: gate.review, total: gate.findings.length }, usedBackup: gate.usedBackup, userId: user?.id })
  return NextResponse.json({ findings: gate.findings, critical: gate.critical, review: gate.review, decision: gate.decision, usedBackup: gate.usedBackup })
}
