import { NextResponse } from 'next/server'

import { loadContext } from '@/lib/context'

/** Public enquiry endpoint. Requires consent; stores the lead against the dealer who owns the page. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}))
  if (!b.name || !(b.phone || b.email)) return NextResponse.json({ error: 'Add your name and a phone number or email.' }, { status: 400 })
  if (!b.consent) return NextResponse.json({ error: 'Please tick the box so the dealer can contact you.' }, { status: 400 })
  const { payload } = await loadContext()
  const page: any = await payload.findByID({ collection: 'pages', id: b.pageId, depth: 0 }).catch(() => null)
  if (!page?.dealer) return NextResponse.json({ error: 'This page cannot take enquiries.' }, { status: 400 })
  await payload.create({
    collection: 'leads',
    data: { name: String(b.name).slice(0, 120), phone: b.phone ? String(b.phone).slice(0, 40) : undefined, email: b.email || undefined, consent: true, dealer: page.dealer, page: page.id, source: String(page.slug) } as any,
  })
  return NextResponse.json({ ok: true })
}
