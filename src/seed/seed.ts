import config from '@payload-config'
import { getPayload } from 'payload'

import { brandRules, claims, dealers, pages, standardTerms } from './data'
import { templates } from '../lib/templates'

/**
 * Seeds the "after" copy: HQ and dealer logins, three dealerships, the claims library and brand rules,
 * Northgate's published pages, and a few cases for the HQ exceptions view. Safe to re-run.
 */
async function seed() {
  const payload = await getPayload({ config })

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
      maxDealerDiscount: brandRules.maxDealerDiscount, standardTerms: brandRules.standardTerms,
      bannedWords: brandRules.bannedWords.map((word) => ({ word })),
      rules: brandRules.rules.map((rule) => ({ rule })),
    } as any,
  })

  const dealerId: Record<string, string | number> = {}
  for (const d of dealers) {
    const found = await payload.find({ collection: 'dealers', where: { slug: { equals: d.slug } }, limit: 1 })
    dealerId[d.slug] = (found.docs[0] ?? (await payload.create({ collection: 'dealers', data: d }))).id
  }

  const users = await payload.find({ collection: 'users', limit: 1 })
  if (!users.totalDocs) {
    await payload.create({ collection: 'users', data: { email: 'demo@studio.test', password: 'demo1234', name: 'HQ brand team', role: 'hq' } as any })
    await payload.create({ collection: 'users', data: { email: 'dealer@studio.test', password: 'demo1234', name: 'Sam, Northgate Nissan', role: 'dealer', dealer: dealerId.northgate } as any })
  }

  const exists = async (slug: string, dealer: string | number) =>
    (await payload.find({ collection: 'pages', where: { and: [{ slug: { equals: slug } }, { dealer: { equals: dealer } }] }, limit: 1, draft: true })).totalDocs > 0
  const terms = standardTerms
  const claimDocs = claims.map(([claimId, text, disclaimer]) => ({ claimId, text, disclaimer }))
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString()
  const ahead = '2026-12-31T23:59:00.000Z'

  // Northgate: three published pages, so "change the offer on all my pages" has something to change.
  for (const p of pages) {
    if (await exists(p.slug, dealerId.northgate)) continue
    const layout = p.layout.map((b: any) => {
      if (!b.claimIds) return b
      const { claimIds, ...rest } = b
      return { ...rest, claims: claimIds.map((c: string) => idByClaim.get(c)) }
    })
    await payload.create({ collection: 'pages', data: { ...p, layout, dealer: dealerId.northgate, reviewStatus: 'approved', gate: { result: 'published', at: ago(3) }, _status: 'published' } as any })
  }

  // Other dealerships: what the HQ "exceptions" view looks like in a working network.
  const weekend = templates.find((t) => t.id === 'weekend-sale')!
  const simple = templates.find((t) => t.id === 'simple-offer')!
  const mk = async (dealer: string, name: string, tpl: typeof weekend, f: any, extra: any) => {
    const built = tpl.build({ dealerName: name, models: 'Nissan Ariya', ...f }, claimDocs, terms)
    if (await exists(built.slug, dealerId[dealer])) return
    await payload.create({
      collection: 'pages',
      data: { title: built.title, slug: built.slug, dealer: dealerId[dealer], metaDescription: built.metaDescription, disclaimer: built.disclaimer, layout: built.layout, offer: { amount: f.amount, endsAt: f.endsAt, models: 'Nissan Ariya' }, ...extra } as any,
    })
  }
  await mk('riverside', 'Riverside Nissan', weekend, { amount: 1000, endsAt: ahead }, { reviewStatus: 'approved', gate: { result: 'published', at: ago(2) }, _status: 'published' })
  await mk('riverside', 'Riverside Nissan', simple, { amount: 3000, endsAt: ahead }, { reviewStatus: 'needs-hq', gate: { result: 'sent-to-hq', reason: 'A discount of £3,000 is above the £2,000 limit for dealers. HQ will review it.', at: ago(0) }, _status: 'draft' })
  await mk('hillcrest', 'Hillcrest Nissan', weekend, { amount: 750, endsAt: ago(4) }, { reviewStatus: 'approved', gate: { result: 'published', at: ago(9) }, _status: 'published' })
  await mk('hillcrest', 'Hillcrest Nissan', weekend, { amount: 500, endsAt: ahead, extra: 'Nissan Ariya from just £199 a month with 0% finance.' }, { reviewStatus: 'needs-hq', gate: { result: 'sent-to-hq', reason: 'Finance wording (“a month”) needs HQ review. Dealers cannot publish finance offers alone.', at: ago(0) }, _status: 'draft' })
  await mk('hillcrest', 'Hillcrest Nissan', simple, { amount: 500, endsAt: ahead }, { reviewStatus: 'draft', gate: { result: 'blocked', reason: '"Best price in town" is not an approved claim. Comparisons and price superlatives are not allowed.', at: ago(0) }, _status: 'draft' })

  const northgateLeads = await payload.count({ collection: 'leads', where: { dealer: { equals: dealerId.northgate } } })
  if (!northgateLeads.totalDocs) {
    const first = (await payload.find({ collection: 'pages', where: { dealer: { equals: dealerId.northgate } }, limit: 1 })).docs[0]
    for (const [name, phone] of [['Priya Shah', '07700 900101'], ['Tom Becker', '07700 900202']])
      await payload.create({ collection: 'leads', data: { name, phone, consent: true, dealer: dealerId.northgate, page: first?.id, source: 'ariya' } as any })
  }
  payload.logger.info('Seeded demo content')
  process.exit(0)
}
await seed()
