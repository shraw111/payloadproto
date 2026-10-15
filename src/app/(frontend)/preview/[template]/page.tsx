import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import PageView from '@/components/PageView'
import { loadContext } from '@/lib/context'
import { campaignKits, templates } from '@/lib/templates'

export const dynamic = 'force-dynamic'

/** Renders a template filled with the dealer's words, for the picker. Nothing is saved. */
export default async function TemplatePreview({ params, searchParams }: { params: Promise<{ template: string }>; searchParams: Promise<Record<string, string>> }) {
  const { template } = await params
  const q = await searchParams
  if (process.env.DEMO_STAGE !== 'after') notFound()
  const t = templates.find((x) => x.id === template) ?? campaignKits.find((x) => x.id === template)
  if (!t) notFound()
  const payload = await getPayload({ config })
  const { claims } = await loadContext()
  const rules: any = await payload.findGlobal({ slug: 'brand-rules' })
  const dealer: any = q.dealer ? (await payload.find({ collection: 'dealers', where: { slug: { equals: q.dealer } }, limit: 1 })).docs[0] : null
  const built = t.build(
    { dealerName: dealer?.name ?? 'Your dealership', amount: q.amount ? Number(q.amount) : undefined, endsAt: q.ends || undefined, models: q.models || undefined, extra: q.extra || undefined },
    claims, String(rules.standardTerms ?? 'Subject to availability. Terms apply.'),
  )
  const endsAt = q.ends || ('defaults' in t ? t.defaults.endsAt : undefined)
  return <PageView page={{ ...built, id: 0, offer: { endsAt } }} dealer={dealer} />
}
