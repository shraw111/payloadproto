import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { blockComponents } from '@/components/blocks'

export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ slug: string }>; searchParams: Promise<{ draft?: string }> }

export default async function Page({ params, searchParams }: Args) {
  const { slug } = await params
  const { draft } = await searchParams
  if (process.env.DEMO_STAGE !== 'after') notFound()
  const payload = await getPayload({ config })
  const res = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, draft: !!draft, limit: 1, depth: 1 })
  const page: any = res.docs[0]
  if (!page || (!draft && page._status !== 'published')) notFound()

  return (
    <main>
      {(page.layout ?? []).map((b: any, i: number) => {
        const C = blockComponents[b.blockType]
        return C ? <React.Fragment key={b.id ?? i}>{C(b)}</React.Fragment> : null
      })}
      <footer className="fineprint">
        {page.disclaimer && <p>{page.disclaimer}</p>}
        <p>Prototype demo. Illustrative content, not official Nissan information.</p>
      </footer>
    </main>
  )
}
