import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import PageView from '@/components/PageView'

export const dynamic = 'force-dynamic'

/** Live Preview target for the editor: renders the latest draft of any page by id. */
export default async function PreviewById({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (process.env.DEMO_STAGE !== 'after') notFound()
  const payload = await getPayload({ config })
  const page: any = await payload.findByID({ collection: 'pages', id, draft: true, depth: 1 }).catch(() => null)
  if (!page) notFound()
  return <PageView page={page} dealer={typeof page.dealer === 'object' ? page.dealer : null} />
}
