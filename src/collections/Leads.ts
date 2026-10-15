import type { CollectionConfig } from 'payload'

import { dealerScoped } from '../lib/access'

/** Enquiries from offer pages. Created by /api/lead with the visitor's consent. */
export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'phone', 'email', 'page', 'createdAt'] },
  access: { read: dealerScoped, create: () => false, update: () => false, delete: ({ req: { user } }: any) => user?.role === 'hq' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'consent', type: 'checkbox', required: true },
    { name: 'dealer', type: 'relationship', relationTo: 'dealers', required: true },
    { name: 'page', type: 'relationship', relationTo: 'pages' },
    { name: 'source', type: 'text' },
  ],
}
