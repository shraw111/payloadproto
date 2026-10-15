import type { CollectionConfig } from 'payload'

import { hiddenFromDealers } from '../lib/access'

export const Dealers: CollectionConfig = {
  slug: 'dealers',
  admin: { useAsTitle: 'name', hidden: hiddenFromDealers, defaultColumns: ['name', 'slug', 'domain'] },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'domain', type: 'text', admin: { description: 'Where offer pages are shown, e.g. offers.northgate-nissan.example' } },
    { name: 'address', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'hours', type: 'text' },
  ],
}
