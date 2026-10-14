import { NextResponse } from 'next/server'

import { currentUser, loadContext } from '@/lib/context'
import { logActivity } from '@/lib/activity'

/** A person approves. This is the only place a page is published. */
export async function POST(req: Request) {
  const { id } = await req.json()
  const { payload } = await loadContext()
  const user = await currentUser(payload, req)
  await payload.update({ collection: 'pages', id, data: { _status: 'published', reviewStatus: 'approved' } as any })
  await logActivity(payload, { task: 'approve', page: id, accepted: true, userId: user?.id })
  return NextResponse.json({ ok: true })
}
