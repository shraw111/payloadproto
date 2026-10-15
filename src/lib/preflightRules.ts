import type { Claim } from './context'
import { flattenPage, type FlatField } from './flatten'

export type Finding = {
  type: 'unapproved_claim' | 'missing_disclaimer' | 'banned_word' | 'meta_length' | 'voice' | 'offer' | 'finance' | 'terms'
  /** critical = blocks publishing; review = needs HQ (goes to HQ, not blocked for good); warning = advice only */
  severity: 'critical' | 'review' | 'warning'
  path: string
  quote: string
  message: string
  fix: { replacement: string; claimId?: string } | null
  source: 'rule' | 'ai'
}

/** Phrases that are always critical. The planted brief claim ("goes further than any other electric SUV") lives here so it is caught even if the AI wobbles. */
const RISKY: { re: RegExp; label: string; lead: string; noFix?: boolean }[] = [
  { re: /goes\s+(?:further|farther) than [^,.;]+/i, label: 'further than', lead: 'offers ' },
  { re: /(?:has|offers) the (?:longest|best) range[^,.;]*/i, label: 'longest range', lead: 'offers ' },
  { re: /(?:is |are )?(?:faster|quicker|cheaper|safer) than [^,.;]+/i, label: 'comparison', lead: 'offers ' },
  { re: /best[- ]in[- ]class/i, label: 'best in class', lead: '', noFix: true },
  { re: /\b(?:best|lowest|cheapest|unbeatable) prices?\b[^,.;]*/i, label: 'best price', lead: '', noFix: true },
  { re: /\bguaranteed?\b[^,.;]*/i, label: 'guaranteed', lead: '', noFix: true },
]

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1).replace(/\.$/, '')
const sentences = (s: string) => s.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean)

export function runFixedRules(
  page: any,
  claims: Claim[],
  bannedWords: string[],
): Finding[] {
  const findings: Finding[] = []
  const fields = flattenPage(page)
  const meta = (page.metaDescription ?? '') as string
  if (meta.length < 50 || meta.length > 160)
    findings.push({
      type: 'meta_length', severity: 'warning', path: 'metaDescription', quote: meta,
      message: `Meta description is ${meta.length} characters; keep it between 50 and 160.`,
      fix: null, source: 'rule',
    })

  const c02 = claims.find((c) => c.claimId === 'C-02')
  for (const f of fields) {
    for (const r of RISKY) {
      const m = f.text.match(r.re)
      if (!m) continue
      findings.push({
        type: 'unapproved_claim', severity: 'critical', path: f.path, quote: m[0],
        message: `"${m[0]}" is not an approved claim. Comparisons and price superlatives are not allowed.`,
        fix: c02 && !r.noFix ? { replacement: r.lead + lower(c02.text), claimId: c02.claimId } : null,
        source: 'rule',
      })
    }
    for (const w of bannedWords) {
      const m = f.text.match(new RegExp(`\\b${w}\\b`, 'i'))
      if (m)
        findings.push({
          type: 'banned_word', severity: 'warning', path: f.path, quote: m[0],
          message: `"${m[0]}" is on the banned word list.`, fix: null, source: 'rule',
        })
    }
  }

  // Every approved claim used on the page needs its disclaimer in the page disclaimer.
  const body = fields.filter((f) => f.path !== 'disclaimer').map((f) => f.text.toLowerCase()).join(' \n ')
  const disc = ((page.disclaimer ?? '') as string).toLowerCase()
  for (const c of claims) {
    if (!c.disclaimer || c.disclaimer === 'None') continue
    if (!body.includes(c.text.toLowerCase().replace(/\.$/, ''))) continue
    const missing = sentences(c.disclaimer).filter((s) => !disc.includes(s.toLowerCase().replace(/\.$/, '')))
    if (missing.length)
      findings.push({
        type: 'missing_disclaimer', severity: 'critical', path: 'disclaimer', quote: '',
        message: `Claim ${c.claimId} is used but its disclaimer is missing: "${missing.join(' ')}"`,
        fix: { replacement: missing.join(' '), claimId: c.claimId }, source: 'rule',
      })
  }
  return findings
}

export function dedupe(findings: Finding[]): Finding[] {
  const seen = new Set<string>()
  return findings.filter((f) => {
    const key = `${f.path}|${f.quote.toLowerCase()}`
    if (f.quote && seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export type { FlatField }


const FINANCE = /\b(?:apr|pcp|hire purchase|deposit contribution|deposit|monthly payments?|per month|a month|\/month|0%\s*finance|finance (?:offer|deal|available))\b/i
const fmt = (n: number) => `£${n.toLocaleString('en-GB')}`

/**
 * Rules for dealer pages, by content type (offer, service special, event).
 * critical blocks the publish; review sends the page to HQ.
 */
export function runOfferRules(page: any, ctx: { maxDiscount: number; standardTerms: string; now?: Date }): Finding[] {
  const out: Finding[] = []
  const now = ctx.now ?? new Date()
  const offer = page.offer ?? {}
  const kind: string = offer.kind ?? 'offer'
  const hasOffer = !!offer.amount || !!offer.kind || !!offer.endsAt || (page.layout ?? []).some((b: any) => b.blockType === 'offerBanner')
  if (!hasOffer) return out
  const add = (f: Omit<Finding, 'source' | 'quote' | 'fix'> & Partial<Finding>) => out.push({ quote: '', fix: null, source: 'rule', ...f } as Finding)

  if (!offer.endsAt) add({ type: 'offer', severity: 'critical', path: 'offer.endsAt', message: 'Add an end date. Every page needs one.' })
  else if (new Date(offer.endsAt) < now) add({ type: 'offer', severity: 'critical', path: 'offer.endsAt', message: 'The end date has already passed. Choose a future date.' })

  if (kind === 'offer') {
    if (offer.amount && offer.amount > ctx.maxDiscount)
      add({ type: 'offer', severity: 'review', path: 'offer.amount', quote: fmt(offer.amount), message: `A discount of ${fmt(offer.amount)} is above the ${fmt(ctx.maxDiscount)} limit for dealers. HQ will review it.` })
    if (!offer.models) add({ type: 'offer', severity: 'warning', path: 'offer.models', message: 'Say which models the offer applies to.' })
  }
  if (kind === 'service-special') {
    if (!offer.title) add({ type: 'offer', severity: 'critical', path: 'offer.title', message: 'Name the service.' })
    if (offer.amount === undefined || offer.amount === null) add({ type: 'offer', severity: 'critical', path: 'offer.amount', message: 'Show the price. Free is fine, but say so.' })
  }
  if (kind === 'event') {
    if (!offer.title) add({ type: 'offer', severity: 'critical', path: 'offer.title', message: 'Name the event.' })
    if (!offer.eventAt) add({ type: 'offer', severity: 'critical', path: 'offer.eventAt', message: 'Add the event date and time.' })
    else if (new Date(offer.eventAt) < now) add({ type: 'offer', severity: 'critical', path: 'offer.eventAt', message: 'The event date has already passed.' })
    if (!offer.location) add({ type: 'offer', severity: 'critical', path: 'offer.location', message: 'Add where the event is.' })
  }

  for (const f of flattenPage(page)) {
    const m = f.text.match(FINANCE)
    if (m && f.path !== 'disclaimer')
      add({ type: 'finance', severity: 'review', path: f.path, quote: m[0], message: `Finance wording (“${m[0]}”) needs HQ review. Dealers cannot publish finance offers alone.` })
  }

  const disc = ((page.disclaimer ?? '') as string).toLowerCase()
  if (!disc.includes(ctx.standardTerms.toLowerCase().replace(/\.$/, '')))
    add({ type: 'terms', severity: 'critical', path: 'disclaimer', message: `Pages need the standard terms: “${ctx.standardTerms}”`, fix: { replacement: ctx.standardTerms } })
  return out
}
