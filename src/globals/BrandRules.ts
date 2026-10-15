import type { GlobalConfig } from 'payload'

import { hiddenFromDealers } from '../lib/access'

export const BrandRules: GlobalConfig = {
  slug: 'brand-rules',
  admin: { hidden: hiddenFromDealers },
  access: { read: () => true },
  fields: [
    { name: 'tone', type: 'textarea' },
    { name: 'readingAge', type: 'text' },
    { name: 'bannedWords', type: 'array', fields: [{ name: 'word', type: 'text', required: true }] },
    { name: 'rules', type: 'array', fields: [{ name: 'rule', type: 'text', required: true }] },
    { name: 'maxDealerDiscount', type: 'number', defaultValue: 2000, admin: { description: 'Largest discount (£) a dealer can publish alone. Above this, the page goes to HQ.' } },
    { name: 'standardTerms', type: 'text', defaultValue: 'Subject to availability. Terms apply.', admin: { description: 'Required on every offer page. Added with one click if missing.' } },
  ],
}
