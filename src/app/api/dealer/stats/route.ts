import { NextResponse } from 'next/server'

import { dealerIdOf } from '@/lib/access'
import { loadContext } from '@/lib/context'
import { requireUser } from '@/lib/dealer'

/** The dealer's own numbers: pages live, enquiries received. */
export async function GET(req: Request) {
  const { payload } = await loadContext()
  const user: any = await requireUser(payload, req)
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  const dealer = user.role === 'dealer' ? { equals: dealerIdOf(user) } : undefined
  const pages = (await payload.find({ collection: 'pages', limit: 500, depth: 0, draft: true, pagination: false, where: dealer ? { dealer } : undefined })).docs as any[]
  const leads = await payload.count({ collection: 'leads', where: dealer ? { dealer } : undefined })
  const now = Date.now()
  const live = pages.filter((p) => p._status === 'published' && (!p.offer?.endsAt || new Date(p.offer.endsAt).getTime() > now)).length
  return NextResponse.json({ live, leads: leads.totalDocs, drafts: pages.filter((p) => p._status !== 'published').length })
}
