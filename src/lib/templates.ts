import { dateLabel, money } from './dates'

export type TemplateClaim = { claimId: string; text: string; disclaimer?: string | null }
export type OfferFields = { dealerName: string; amount?: number; endsAt?: string; models?: string; extra?: string }
export type BuiltPage = {
  title: string; slug: string; metaDescription: string; disclaimer: string
  layout: any[]; claimIds: string[]
}

const kebab = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const modelName = (m?: string) => (m && !/selected/i.test(m) ? (/^nissan/i.test(m) ? m : `Nissan ${m}`) : 'Nissan')

/** Required disclaimers of the claims used on a page, de-duplicated, plus the standard terms. */
export function buildDisclaimer(claims: TemplateClaim[], ids: string[], terms: string): string {
  const sentences = ids.flatMap((id) => {
    const d = claims.find((c) => c.claimId === id)?.disclaimer
    return d && d !== 'None' ? d.split(/(?<=[.!?])\s+/) : []
  })
  return [...new Set([...sentences, terms])].join(' ')
}

const claimText = (claims: TemplateClaim[], id: string) => claims.find((c) => c.claimId === id)?.text ?? ''

function common(f: OfferFields, terms: string) {
  const model = modelName(f.models)
  const amount = f.amount ? money(f.amount) : '£__'
  const ends = f.endsAt ? dateLabel(f.endsAt) : 'the end date'
  return {
    model, amount, ends,
    offerText: `${amount} off the ${model}`,
    offerTerms: `${f.dealerName}. Offer ends ${ends}. ${terms}`,
    slug: kebab(`${f.models ?? 'offer'} ${f.amount ?? ''} off`),
    meta: `${amount} off the ${model} at ${f.dealerName}. Offer ends ${ends}. Book a test drive today.`,
  }
}

const lead = { blockType: 'leadForm', heading: 'Book a test drive', buttonLabel: 'Request a call back' }

export type Template = {
  id: string; name: string; bestFor: string
  build: (f: OfferFields, claims: TemplateClaim[], terms: string) => BuiltPage
}

export const templates: Template[] = [
  {
    id: 'weekend-sale', name: 'Weekend sale', bestFor: 'Short offers with a deadline',
    build(f, claims, terms) {
      const c = common(f, terms)
      const ids: string[] = []
      const layout: any[] = [
        { blockType: 'hero', headline: `${c.amount} off this weekend`, subheadline: `${c.model} at ${f.dealerName}`, ctaLabel: 'Book a test drive', ctaLink: '#book' },
        { blockType: 'countdown', label: 'Offer ends in' },
        { blockType: 'offerBanner', offerText: c.offerText, terms: c.offerTerms, ctaLabel: 'Book a test drive', ctaLink: '#book' },
      ]
      if (f.extra) layout.push({ blockType: 'productHighlight', productName: c.model, body: f.extra, claims: [] })
      layout.push(lead)
      return { title: `${f.dealerName}: ${c.offerText}`, slug: c.slug, metaDescription: c.meta, layout, claimIds: ids, disclaimer: buildDisclaimer(claims, ids, terms) }
    },
  },
  {
    id: 'model-spotlight', name: 'Model spotlight', bestFor: 'Offers that feature one model',
    build(f, claims, terms) {
      const c = common(f, terms)
      const ids = ['C-01', 'C-03', 'C-12', 'C-09']
      const layout: any[] = [
        { blockType: 'hero', headline: c.model, subheadline: claimText(claims, 'C-01'), ctaLabel: 'Book a test drive', ctaLink: '#book' },
        { blockType: 'productHighlight', productName: c.model, body: f.extra ?? `${claimText(claims, 'C-05')} ${claimText(claims, 'C-06')}`, claims: [] },
        { blockType: 'featureGrid', heading: `Why drivers choose ${c.model.replace('Nissan ', '')}`, items: [claimText(claims, 'C-03'), claimText(claims, 'C-12'), claimText(claims, 'C-09')].map((text) => ({ text })) },
        { blockType: 'offerBanner', offerText: c.offerText, terms: c.offerTerms, ctaLabel: 'Book a test drive', ctaLink: '#book' },
        lead,
      ]
      return { title: `${f.dealerName}: ${c.model}`, slug: kebab(`${c.model} spotlight`), metaDescription: c.meta, layout, claimIds: ids, disclaimer: buildDisclaimer(claims, ids, terms) }
    },
  },
  {
    id: 'simple-offer', name: 'Simple offer', bestFor: 'A quick offer with no extras',
    build(f, claims, terms) {
      const c = common(f, terms)
      const layout: any[] = [
        { blockType: 'offerBanner', offerText: c.offerText, terms: c.offerTerms, ctaLabel: 'Book a test drive', ctaLink: '#book' },
        { blockType: 'cta', heading: `${f.dealerName}: ${c.model}`, buttonLabel: 'Book a test drive', buttonLink: '#book' },
        lead,
      ]
      return { title: `${f.dealerName}: ${c.offerText}`, slug: `${c.slug}-simple`, metaDescription: c.meta, layout, claimIds: [], disclaimer: buildDisclaimer(claims, [], terms) }
    },
  },
]

export type CampaignKit = { id: string; name: string; summary: string; build: Template['build']; defaults: { amount: number; endsAt: string; models: string } }

/** HQ campaign kits: pre-approved copy that dealers only need to localise. */
export const campaignKits: CampaignKit[] = [
  {
    id: 'winter-electric', name: 'Winter electric push', summary: 'HQ campaign: Ariya with a charging credit.',
    defaults: { amount: 2000, endsAt: '2027-01-31T23:59:00.000Z', models: 'Nissan Ariya' },
    build(f, claims, terms) {
      const c = common({ ...f, amount: f.amount ?? 2000, endsAt: f.endsAt ?? '2027-01-31T23:59:00.000Z', models: f.models ?? 'Nissan Ariya' }, terms)
      const ids = ['C-01', 'C-03', 'C-12', 'C-09']
      const layout: any[] = [
        { blockType: 'hero', headline: 'Make every journey count', subheadline: claimText(claims, 'C-01'), ctaLabel: 'Book a test drive', ctaLink: '#book' },
        { blockType: 'productHighlight', productName: 'Nissan Ariya', body: `${claimText(claims, 'C-05')} ${claimText(claims, 'C-06')}`, claims: [] },
        { blockType: 'featureGrid', heading: 'Three reasons', items: [claimText(claims, 'C-03'), claimText(claims, 'C-12'), claimText(claims, 'C-09')].map((text) => ({ text })) },
        { blockType: 'offerBanner', offerText: `${money(f.amount ?? 2000)} charging credit with every new Ariya`, terms: c.offerTerms, ctaLabel: 'Book a test drive', ctaLink: '#book' },
        lead,
        { blockType: 'cta', heading: 'Your electric winter', buttonLabel: 'Find your Ariya', buttonLink: '#book' },
      ]
      return { title: `${f.dealerName}: Winter electric push`, slug: 'winter-electric-push', metaDescription: `Make every journey count with the Nissan Ariya. ${money(f.amount ?? 2000)} charging credit at ${f.dealerName}.`, layout, claimIds: ids, disclaimer: buildDisclaimer(claims, ids, terms) }
    },
  },
]
