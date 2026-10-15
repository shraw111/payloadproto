import { NextResponse } from 'next/server'

import { loadContext } from '@/lib/context'
import { actingDealer, requireUser } from '@/lib/dealer'
import { logActivity } from '@/lib/activity'
import { campaignKits, templates, type OfferFields } from '@/lib/templates'

/** Creates a draft from a template or an HQ campaign kit. Nothing is published here. */
export async function POST(req: Request) {
  const { templateId, kitId, fields = {}, dealerId } = await req.json()
  const { payload, claims } = await loadContext()
  const user = await requireUser(payload, req)
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  const dealer: any = await actingDealer(payload, user, dealerId)
  if (!dealer) return NextResponse.json({ error: 'No dealership for this user' }, { status: 400 })

  const rules: any = await payload.findGlobal({ slug: 'brand-rules' })
  const terms = String(rules.standardTerms ?? 'Subject to availability. Terms apply.')
  const f: OfferFields = { dealerName: dealer.name, amount: fields.amount ? Number(fields.amount) : undefined, endsAt: fields.endsAt || undefined, models: fields.models || undefined, extra: fields.extra || undefined }

  const kit = kitId ? campaignKits.find((k) => k.id === kitId) : null
  const tpl = !kit ? templates.find((t) => t.id === templateId) : null
  if (!kit && !tpl) return NextResponse.json({ error: 'Unknown template' }, { status: 400 })
  const built = (kit ?? tpl)!.build(f, claims, terms)
  const defaults = kit?.defaults

  // Keep slugs unique within a dealership.
  let slug = built.slug, n = 1
  while ((await payload.find({ collection: 'pages', where: { and: [{ slug: { equals: slug } }, { dealer: { equals: dealer.id } }] }, limit: 1, draft: true })).totalDocs) slug = `${built.slug}-${++n}`

  const idByClaim = new Map(claims.map((c: any) => [c.claimId, c.id]))
  const page = await payload.create({
    collection: 'pages', draft: true,
    data: {
      title: built.title, slug, dealer: dealer.id, metaDescription: built.metaDescription, disclaimer: built.disclaimer,
      layout: built.layout, reviewStatus: 'draft', gate: { result: 'none' },
      offer: { amount: f.amount ?? defaults?.amount, endsAt: f.endsAt ?? defaults?.endsAt, models: f.models ?? defaults?.models },
    } as any,
  })
  void idByClaim
  await logActivity(payload, { task: kit ? 'dealer-create-kit' : 'dealer-create', page: page.id, inputSummary: (kit ?? tpl)!.name, output: { template: (kit ?? tpl)!.id }, accepted: true, userId: user.id })
  return NextResponse.json({ id: page.id, slug, dealerSlug: dealer.slug })
}
