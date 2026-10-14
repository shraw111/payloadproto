import type { CollectionConfig } from 'payload'

export const Claims: CollectionConfig = {
  slug: 'claims',
  admin: { useAsTitle: 'claimId', defaultColumns: ['claimId', 'text', 'disclaimer'] },
  access: { read: () => true },
  fields: [
    { name: 'claimId', type: 'text', required: true, unique: true },
    { name: 'text', type: 'textarea', required: true },
    { name: 'disclaimer', type: 'textarea', admin: { description: 'Required disclaimer, if any.' } },
  ],
}
