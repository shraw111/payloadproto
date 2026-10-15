import type { CollectionConfig } from 'payload'

import { hiddenFromDealers } from '../lib/access'

const after = process.env.DEMO_STAGE === 'after'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email', hidden: hiddenFromDealers },
  auth: true,
  fields: [
    { name: 'name', type: 'text' },
    // Roles exist only in the "after" copy, where the dealers collection exists.
    ...(after
      ? ([
          { name: 'role', type: 'select', required: true, defaultValue: 'hq', options: [{ label: 'HQ', value: 'hq' }, { label: 'Dealer', value: 'dealer' }] },
          { name: 'dealer', type: 'relationship', relationTo: 'dealers', admin: { condition: (d: any) => d?.role === 'dealer' } },
        ] as any[])
      : []),
  ],
}
