import { NextResponse } from 'next/server'

import { loadContext } from '@/lib/context'
import { logActivity } from '@/lib/activity'

/**
 * Takes offers offline once their end date has passed. Run it on a schedule (e.g. every 5 minutes).
 * The public page also checks the date on every request, so an offer never shows late even between runs.
 */
export async function POST() {
  const { payload } = await loadContext()
  const now = new Date().toISOString()
  const live = await payload.find({
    collection: 'pages', limit: 200, depth: 0, draft: false,
    where: { and: [{ _status: { equals: 'published' } }, { 'offer.endsAt': { less_than: now } }] },
  })
  for (const p of live.docs as any[]) {
    await payload.update({ collection: 'pages', id: p.id, data: { _status: 'draft', gate: { result: 'expired', reason: 'The offer ended.', at: now } } as any })
    await logActivity(payload, { task: 'expire', page: p.id, accepted: true })
  }
  return NextResponse.json({ expired: live.docs.length })
}
export const GET = POST
