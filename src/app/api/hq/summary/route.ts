import { NextResponse } from 'next/server'

import { loadContext } from '@/lib/context'

export async function GET() {
  const { payload } = await loadContext()
  const pages = (await payload.find({ collection: 'pages', limit: 500, depth: 0, draft: true, pagination: false })).docs as any[]
  const now = Date.now()
  const live = (p: any) => p._status === 'published' && (!p.offer?.endsAt || new Date(p.offer.endsAt).getTime() > now)
  return NextResponse.json({
    published: pages.filter(live).length,
    blocked: pages.filter((p) => p.gate?.result === 'blocked').length,
    waiting: pages.filter((p) => p.gate?.result === 'sent-to-hq').length,
    expired: pages.filter((p) => p.gate?.result === 'expired' || (p._status === 'published' && !live(p))).length,
  })
}
