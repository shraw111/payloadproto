import type { CollectionConfig } from 'payload'

import { allBlocks } from '../blocks'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'reviewStatus', '_status'],
    livePreview: {
      url: ({ data }) => `${process.env.NEXT_PUBLIC_SELF_URL || 'http://localhost:3001'}/${data?.slug ?? ''}?draft=1`,
    },
  },
  versions: { drafts: true, maxPerDoc: 25 },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'metaDescription', type: 'textarea' },
    { name: 'disclaimer', type: 'textarea' },
    { name: 'layout', type: 'blocks', blocks: allBlocks },
    {
      name: 'reviewStatus',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'In review', value: 'in-review' },
        { label: 'Approved', value: 'approved' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'preflight',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '/admin/PreflightPanel' } },
    },
  ],
}
