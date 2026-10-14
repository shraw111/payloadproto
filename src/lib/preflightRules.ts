import type { Claim } from './context'
import { flattenPage, type FlatField } from './flatten'

export type Finding = {
  type: 'unapproved_claim' | 'missing_disclaimer' | 'banned_word' | 'meta_length' | 'voice'
  severity: 'critical' | 'warning'
  path: string
  quote: string
  message: string
  fix: { replacement: string; claimId?: string } | null
  source: 'rule' | 'ai'
}

/** Phrases that are always critical. The planted brief claim lives here so it is caught even if the AI wobbles. */
const RISKY: { re: RegExp; label: string }[] = [
  { re: /works\s+twice as fast as [a-z ]+/i, label: 'twice as fast' },
  { re: /(?:is |are )?faster than [^,.;]+/i, label: 'faster than' },
  { re: /\bcures?\b[^,.;]*/i, label: 'cure' },
  { re: /\bguaranteed?\b[^,.;]*/i, label: 'guaranteed' },
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
        message: `"${m[0]}" is not an approved claim. Comparisons with other products are not allowed.`,
        fix: c02 ? { replacement: lower(c02.text), claimId: c02.claimId } : null,
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
