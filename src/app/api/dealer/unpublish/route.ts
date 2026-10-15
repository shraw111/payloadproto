import { NextResponse } from 'next/server'

import { loadContext } from '@/lib/context'
import { canTouch, requireUser } from '@/lib/dealer'
import { logActivity } from '@/lib/activity'

/** Undo: takes a published page offline. The draft stays, so nothing is lost. */
export async function POST(req: Request) {
  const { id } = await req.json()
  const { payload } = await loadContext()
  const user = await requireUser(payload, req)
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  const page: any = await payload.findByID({ collection: 'pages', id, draft: true })
  if (!canTouch(user, page)) return NextResponse.json({ error: 'Not your page' }, { status: 403 })
  await payload.update({ collection: 'pages', id, data: { _status: 'draft', reviewStatus: 'draft', gate: { result: 'none', reason: '', at: new Date().toISOString() } } as any })
  await logActivity(payload, { task: 'unpublish', page: id, accepted: true, userId: user.id })
  return NextResponse.json({ ok: true })
}
