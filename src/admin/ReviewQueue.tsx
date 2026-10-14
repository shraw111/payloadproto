import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import ReviewItem from './ReviewItem'

export default async function ReviewQueue({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult
  const pages = await req.payload.find({
    collection: 'pages', where: { reviewStatus: { equals: 'in-review' } }, draft: true, limit: 50, depth: 0,
  })
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
        <h1>Review queue</h1>
        {pages.docs.length === 0 && <p>Nothing waiting for review.</p>}
        {pages.docs.map((p: any) => (
          <ReviewItem key={p.id} id={p.id} title={p.title} slug={p.slug} />
        ))}
      </Gutter>
    </DefaultTemplate>
  )
}
