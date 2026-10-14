import config from '@payload-config'
import { getPayload } from 'payload'

import { brandRules, claims, pages } from './data'

/** Seeds the "after" copy: demo user, claims, brand rules and three published pages. Safe to re-run. */
async function seed() {
  const payload = await getPayload({ config })

  const users = await payload.find({ collection: 'users', limit: 1 })
  if (!users.totalDocs) await payload.create({ collection: 'users', data: { email: 'demo@studio.test', password: 'demo1234', name: 'Demo' } })

  const idByClaim = new Map<string, string | number>()
  for (const [claimId, text, disclaimer] of claims) {
    const found = await payload.find({ collection: 'claims', where: { claimId: { equals: claimId } }, limit: 1 })
    const doc = found.docs[0] ?? (await payload.create({ collection: 'claims', data: { claimId, text, disclaimer } }))
    idByClaim.set(claimId, doc.id)
  }

  await payload.updateGlobal({
    slug: 'brand-rules',
    data: {
      tone: brandRules.tone, readingAge: brandRules.readingAge,
      bannedWords: brandRules.bannedWords.map((word) => ({ word })),
      rules: brandRules.rules.map((rule) => ({ rule })),
    },
  })

  for (const p of pages) {
    const existing = await payload.find({ collection: 'pages', where: { slug: { equals: p.slug } }, limit: 1, draft: true })
    if (existing.totalDocs) continue
    const layout = p.layout.map((b: any) => {
      if (!b.claimIds) return b
      const { claimIds, ...rest } = b
      return { ...rest, claims: claimIds.map((c: string) => idByClaim.get(c)) }
    })
    await payload.create({ collection: 'pages', data: { ...p, layout, reviewStatus: 'approved', _status: 'published' } as any })
  }
  payload.logger.info('Seeded demo content')
  process.exit(0)
}
await seed()
