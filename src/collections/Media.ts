import type { CollectionConfig } from 'payload'

import { hiddenFromDealers } from '../lib/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { hidden: hiddenFromDealers },
  access: { read: () => true },
  upload: { staticDir: 'media' },
  fields: [{ name: 'alt', type: 'text' }],
}
