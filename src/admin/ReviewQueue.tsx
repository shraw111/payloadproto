import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import HqSummary from './HqSummary'
import ReviewItem from './ReviewItem'

/** HQ exceptions. Pages that pass the gate publish by themselves and never appear here. */
export default async function ReviewQueue({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult
  const pages = await req.payload.find({
    collection: 'pages', where: { 'gate.result': { in: ['sent-to-hq', 'blocked'] } }, draft: true, limit: 100, depth: 1, sort: '-updatedAt',
  })
  const docs = pages.docs as any[]
  const waiting = docs.filter((p) => p.gate?.result === 'sent-to-hq')
  const blocked = docs.filter((p) => p.gate?.result === 'blocked')
  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <h1>Exceptions</h1>
        <p>Pages that pass pre-flight go live on their own. Only these need a person.</p>
        <HqSummary />
        {waiting.length === 0 && blocked.length === 0 && <p>Nothing needs attention.</p>}
        {[...waiting, ...blocked].map((p) => (
          <ReviewItem key={p.id} id={p.id} title={p.title} dealer={p.dealer?.name ?? 'HQ'} result={p.gate.result} reason={p.gate.reason ?? ''} />
        ))}
      </Gutter>
    </DefaultTemplate>
  )
}
