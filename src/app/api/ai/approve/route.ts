import { NextResponse } from 'next/server'

import { currentUser, loadContext } from '@/lib/context'
import { logActivity } from '@/lib/activity'

/** HQ decides on a page the gate sent to them: approve and publish, or send it back to the dealer. */
export async function POST(req: Request) {
  const { id, action = 'approve', note } = await req.json()
  const { payload } = await loadContext()
  const user: any = await currentUser(payload, req)
  if (user?.role !== 'hq') return NextResponse.json({ error: 'HQ only' }, { status: 403 })
  const now = new Date().toISOString()
  if (action === 'send-back') {
    await payload.update({ collection: 'pages', id, data: { reviewStatus: 'draft', gate: { result: 'blocked', reason: `HQ sent this back${note ? `: ${note}` : '.'}`, at: now } } as any, draft: true })
    await logActivity(payload, { task: 'hq-send-back', page: id, inputSummary: note, accepted: true, userId: user.id })
  } else {
    await payload.update({ collection: 'pages', id, data: { _status: 'published', reviewStatus: 'approved', gate: { result: 'published', reason: '', at: now } } as any })
    await logActivity(payload, { task: 'hq-approve', page: id, accepted: true, userId: user.id })
  }
  return NextResponse.json({ ok: true })
}
