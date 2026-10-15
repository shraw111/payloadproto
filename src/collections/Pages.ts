import type { CollectionConfig } from 'payload'

import { allBlocks } from '../blocks'
import { dealerIdOf, dealerScoped } from '../lib/access'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'dealer', 'reviewStatus', '_status'],
    livePreview: {
      url: ({ data }) => `${process.env.NEXT_PUBLIC_SELF_URL || 'http://localhost:3001'}/page/${data?.id ?? 0}?draft=1`,
    },
  },
  versions: { drafts: true, maxPerDoc: 25 },
  access: {
    read: dealerScoped,
    create: ({ req: { user } }: any) => !!user,
    update: dealerScoped,
    delete: dealerScoped,
  },
  hooks: {
    // A dealer can only ever create pages for their own dealership.
    beforeChange: [
      ({ data, req }: any) => {
        if (req.user?.role === 'dealer') data.dealer = dealerIdOf(req.user)
        return data
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, index: true },
    { name: 'dealer', type: 'relationship', relationTo: 'dealers', admin: { position: 'sidebar', readOnly: false } },
    { name: 'metaDescription', type: 'textarea' },
    { name: 'disclaimer', type: 'textarea' },
    {
      name: 'offer',
      type: 'group',
      admin: { description: 'Every offer page needs an amount and an end date. The page switches itself off after it.' },
      fields: [
        { name: 'amount', type: 'number', admin: { description: 'Discount in £' } },
        { name: 'startsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'endsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'models', type: 'text' },
      ],
    },
    { name: 'layout', type: 'blocks', blocks: allBlocks },
    {
      name: 'reviewStatus',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Needs HQ review', value: 'needs-hq' },
        { label: 'Approved', value: 'approved' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'gate',
      type: 'group',
      admin: { hidden: true },
      fields: [
        { name: 'result', type: 'select', defaultValue: 'none', options: ['none', 'published', 'blocked', 'sent-to-hq', 'expired'] },
        { name: 'reason', type: 'textarea' },
        { name: 'at', type: 'date' },
      ],
    },
    {
      name: 'publish',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '/admin/PublishPanel' } },
    },
  ],
}
