import type { CollectionConfig } from 'payload'

import { hiddenFromDealers } from '../lib/access'

/** One row per AI request: who asked, what it did, whether the result was accepted. */
export const AiActivity: CollectionConfig = {
  slug: 'ai-activity',
  labels: { singular: 'AI activity', plural: 'AI activity' },
  admin: { useAsTitle: 'task', hidden: hiddenFromDealers, defaultColumns: ['task', 'page', 'inputSummary', 'accepted', 'createdAt'] },
  fields: [
    { name: 'task', type: 'text', required: true },
    { name: 'page', type: 'relationship', relationTo: 'pages' },
    { name: 'inputSummary', type: 'text' },
    { name: 'output', type: 'json' },
    { name: 'accepted', type: 'checkbox', defaultValue: false },
    { name: 'usedBackup', type: 'checkbox', defaultValue: false },
    { name: 'requestedBy', type: 'relationship', relationTo: 'users' },
  ],
}
