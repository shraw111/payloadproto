import type { GlobalConfig } from 'payload'

export const BrandRules: GlobalConfig = {
  slug: 'brand-rules',
  access: { read: () => true },
  fields: [
    { name: 'tone', type: 'textarea' },
    { name: 'readingAge', type: 'text' },
    { name: 'bannedWords', type: 'array', fields: [{ name: 'word', type: 'text', required: true }] },
    { name: 'rules', type: 'array', fields: [{ name: 'rule', type: 'text', required: true }] },
  ],
}
