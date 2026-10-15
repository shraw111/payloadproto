import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import PageView from '@/components/PageView'
import { liveState } from '@/lib/live'

export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ dealer: string; slug: string }>; searchParams: Promise<{ draft?: string }> }

/** The public offer page, shown at the dealer's own address: /{dealer}/{page}. */
export default async function OfferPage({ params, searchParams }: Args) {
  const { dealer: dealerSlug, slug } = await params
  const { draft } = await searchParams
  if (process.env.DEMO_STAGE !== 'after') notFound()
  const payload = await getPayload({ config })
  const dealer: any = (await payload.find({ collection: 'dealers', where: { slug: { equals: dealerSlug } }, limit: 1 })).docs[0]
  if (!dealer) notFound()
  const page: any = (await payload.find({
    collection: 'pages', where: { and: [{ slug: { equals: slug } }, { dealer: { equals: dealer.id } }] }, draft: !!draft, limit: 1, depth: 1,
  })).docs[0]
  if (!page) notFound()
  const state = draft ? 'live' : liveState(page)
  if (state === 'ended')
    return (
      <>
        <div className="dealerbar"><div className="wrap"><b>{dealer.name}</b><span>{[dealer.address, dealer.phone].filter(Boolean).join(' · ')}</span></div></div>
        <main className="ended"><div className="wrap"><h1 className="display">This offer has ended</h1><p>Call {dealer.phone ?? 'the dealership'} to hear about current offers.</p></div></main>
      </>
    )
  if (state !== 'live') notFound()
  return <PageView page={page} dealer={dealer} />
}
