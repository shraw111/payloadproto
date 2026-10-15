import { NextResponse } from 'next/server'

import { loadContext } from '@/lib/context'
import { canTouch, requireUser } from '@/lib/dealer'
import { evaluatePage } from '@/lib/gate'
import { logActivity } from '@/lib/activity'

/**
 * One-click publish, gated by pre-flight.
 * Clean: publishes (or schedules, if startsAt is in the future). Critical finding: blocked.
 * Review finding (discount over the cap, finance wording): sent to HQ. A person always clicks; the gate decides if the click works.
 */
export async function POST(req: Request) {
  const { id, startsAt } = await req.json()
  const { payload } = await loadContext()
  const user = await requireUser(payload, req)
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  let page: any = await payload.findByID({ collection: 'pages', id, draft: true, depth: 1 })
  if (!canTouch(user, page)) return NextResponse.json({ error: 'Not your page' }, { status: 403 })

  if (startsAt) {
    await payload.update({ collection: 'pages', id, data: { offer: { ...(page.offer ?? {}), startsAt } } as any, draft: true })
    page = await payload.findByID({ collection: 'pages', id, draft: true, depth: 1 })
  }
  const gate = await evaluatePage(page)
  const now = new Date().toISOString()
  const dealer = page.dealer && typeof page.dealer === 'object' ? page.dealer : null
  const common = { collection: 'pages' as const, id }

  if (gate.decision === 'blocked') {
    await payload.update({ ...common, data: { reviewStatus: 'draft', gate: { result: 'blocked', reason: gate.reason, at: now } } as any, draft: true })
    await logActivity(payload, { task: 'publish-blocked', page: id, output: { reason: gate.reason }, usedBackup: gate.usedBackup, userId: user.id })
  } else if (gate.decision === 'sent-to-hq') {
    await payload.update({ ...common, data: { reviewStatus: 'needs-hq', gate: { result: 'sent-to-hq', reason: gate.reason, at: now } } as any, draft: true })
    await logActivity(payload, { task: 'publish-sent-to-hq', page: id, output: { reason: gate.reason }, usedBackup: gate.usedBackup, userId: user.id })
  } else {
    await payload.update({ ...common, data: { _status: 'published', reviewStatus: 'approved', gate: { result: 'published', reason: '', at: now } } as any })
    await logActivity(payload, { task: 'publish', page: id, accepted: true, usedBackup: gate.usedBackup, userId: user.id })
  }
  const seconds = Math.max(1, Math.round((Date.now() - new Date(page.createdAt).getTime()) / 1000))
  const scheduled = gate.decision === 'publish' && startsAt && new Date(startsAt) > new Date()
  return NextResponse.json({
    result: gate.decision === 'publish' ? (scheduled ? 'scheduled' : 'published') : gate.decision,
    findings: gate.findings, reason: gate.reason, secondsSinceCreated: seconds,
    liveUrl: dealer ? `https://${dealer.domain}/${page.slug}` : null,
    path: dealer ? `/${dealer.slug}/${page.slug}` : `/page/${id}`,
  })
}
