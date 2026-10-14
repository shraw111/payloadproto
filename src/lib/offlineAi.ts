/**
 * Deterministic stand-ins for the AI tasks, used when DEMO_AI=stored or no API key is set.
 * They read the real input (instruction, brief, page text, diff), so a changed instruction
 * gives a changed answer. They are rule-based on purpose: the stored scene must never contradict the screen.
 */
import type { Claim } from './context'
import type { FlatField } from './flatten'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const camel = (s: string) => s.trim().split(/\s+/).map((w, i) => (i ? cap(w) : w.toLowerCase())).join('')
const sentence = (s: string) => cap(s.trim()).replace(/[.]*$/, '.')

/* ---------- model fix ---------- */
export function offlineModelFix(model: any, instruction: string): any {
  const next = JSON.parse(JSON.stringify(model))
  const text = instruction.toLowerCase()

  if (/\bmerge\b/.test(text)) {
    // Group blocks by the first camelCase word of the slug (testimonialCard + testimonialQuote -> testimonial).
    const groups = new Map<string, any[]>()
    for (const b of next.blocks) {
      const prefix = b.slug.match(/^[a-z]+/)?.[0] ?? b.slug
      groups.set(prefix, [...(groups.get(prefix) ?? []), b])
    }
    for (const [prefix, blocks] of groups) {
      if (blocks.length < 2 || !text.includes(prefix.toLowerCase())) continue
      const options = blocks.map((b) => (b.slug.slice(prefix.length) || 'default').toLowerCase())
      const fields: any[] = []
      for (const f of blocks.flatMap((b) => b.fields)) if (!fields.some((x) => x.name === f.name)) fields.push(f)
      fields.push({ name: 'layout', type: 'select', required: false, options })
      const merged = { ...blocks[0], slug: prefix, label: cap(prefix), fields, confidence: 'high', note: '' }
      const slugs = new Set(blocks.map((b) => b.slug))
      next.blocks = next.blocks.filter((b: any) => !slugs.has(b.slug))
      next.blocks.splice(Math.min(4, next.blocks.length), 0, merged)
      for (const p of next.pages) p.layout = p.layout.map((s: string) => (slugs.has(s) ? prefix : s))
    }
    return next
  }

  const add = instruction.match(/\badd (?:an? |the )?(.+?) (?:section|block)/i)
  if (add) {
    const label = cap(add[1].trim())
    const slug = camel(add[1])
    if (!next.blocks.some((b: any) => b.slug === slug)) {
      next.blocks.push({
        slug, label, frame: next.blocks[0]?.frame ?? 'home', region: { x: 0, y: 0, w: 100, h: 20 },
        confidence: 'high', note: '',
        fields: [{ name: 'heading', type: 'text', required: false }, { name: 'body', type: 'textarea', required: false }],
      })
      if (next.pages[0]) next.pages[0].layout.splice(Math.max(next.pages[0].layout.length - 1, 0), 0, slug)
    }
  }
  return next
}

/* ---------- brief to draft ---------- */
export function offlineBriefToDraft(brief: string, claims: Claim[]) {
  const line = (re: RegExp) => brief.match(re)?.[1]?.trim()
  const title = line(/Campaign brief:\s*(.+)/i) ?? 'New campaign'
  const slug = (line(/Slug:\s*\/?([\w-]+)/i) ?? title.toLowerCase().replace(/\W+/g, '-')).replace(/^\//, '')
  const pct = line(/(\d+)%\s*off/i)
  const season = line(/(\w+) offer:/i) ?? 'Campaign'
  const ends = line(/Ends\s+(\d+\s+\w+)/i)
  const q = (label: string, from: string) => from.match(new RegExp(`${label}:\\s*["“]([^"”]+)["”]`, 'i'))?.[1]

  const items = brief.split(/\n/).map((l) => l.trim()).filter((l) => /^\d\.\s/.test(l)).map((l) => l.replace(/^\d\.\s*/, ''))
  const layout: any[] = []
  for (const it of items) {
    if (/^hero/i.test(it)) {
      layout.push({ blockType: 'hero', headline: q('Headline', it) ?? title, subheadline: q('Subheadline', it) ?? '', ctaLabel: q('Button', it) ?? 'Shop now', ctaLink: '/allergy-24' })
    } else if (/^product/i.test(it)) {
      const body = it.replace(/^product\.?\s*/i, '')
      layout.push({ blockType: 'productHighlight', productName: body.match(/Halden Allergy 24/)?.[0] ?? 'Halden Allergy 24', body, claims: [] })
    } else if (/^three reasons/i.test(it)) {
      layout.push({ blockType: 'featureGrid', heading: 'Three reasons', items: it.replace(/^three reasons:\s*/i, '').split(';').map((t) => ({ text: sentence(t) })) })
    } else if (/^offer banner/i.test(it)) {
      layout.push({ blockType: 'offerBanner', offerText: `${pct ?? '20'}% off your first order`, terms: `New customers only.${ends ? ` ${season} offer ends ${ends}.` : ''}`, ctaLabel: 'Shop now', ctaLink: '/allergy-24' })
    } else if (/^closing/i.test(it)) {
      layout.push({ blockType: 'cta', heading: q('', it.replace(/Closing call to action:\s*/i, 'x: ')) ?? it.match(/["“]([^"”]+)["”]/)?.[1] ?? 'Shop now', buttonLabel: q('Button', it) ?? 'Find your relief', buttonLink: '/allergy-24' })
    }
  }

  // Approved claims whose wording appears in the draft (word for word), and their disclaimers.
  const all = JSON.stringify(layout).toLowerCase()
  const used = claims.filter((c) => all.includes(c.text.toLowerCase().replace(/\.$/, '')))
  const disclaimers = [...new Set(used.flatMap((c) => (c.disclaimer && c.disclaimer !== 'None' ? c.disclaimer.split(/(?<=[.!?])\s+/) : [])))]
  const headline = layout.find((b) => b.blockType === 'hero')?.headline ?? title
  const meta = `${headline} with Halden Allergy 24. New customers get ${pct ?? '20'}% off their first order.${ends ? ` Ends ${ends}.` : ''}`

  return {
    title, slug, metaDescription: meta.slice(0, 155), disclaimer: disclaimers.join(' '), layout,
    claimsUsed: used.map((c) => c.claimId), sources: [],
  }
}

/* ---------- edit everywhere ---------- */
export function offlineEdits(instruction: string, fields: FlatField[]) {
  const changes: { pageId: string | number; pageTitle: string; path: string; before: string; after: string }[] = []
  const pct = instruction.match(/(\d+)\s*%/)?.[1]
  const swap = instruction.match(/change\s+["“]?(.+?)["”]?\s+to\s+["“]?(.+?)["”]?(?:\s+(?:on|in|across)\b.*)?$/i)
  for (const f of fields) {
    let after = f.text
    if (pct && /\d+%/.test(f.text)) after = f.text.replace(/\d+%/g, `${pct}%`)
    else if (!pct && swap && f.text.includes(swap[1])) after = f.text.split(swap[1]).join(swap[2])
    if (after !== f.text) changes.push({ pageId: f.pageId, pageTitle: f.pageTitle, path: f.path, before: f.text, after })
  }
  return { changes }
}

/* ---------- change summary ---------- */
export function offlineSummary(opts: { title: string; layout: any[]; diff: any; claimIds: string[]; fixes: { quote?: string; claimId?: string }[] }) {
  const label = (t: string) => t.replace(/([A-Z])/g, ' $1').toLowerCase()
  const bullets: string[] = []
  if (!opts.diff) {
    bullets.push(`New page: ${opts.title}, with ${opts.layout.length} sections: ${opts.layout.map((b) => label(b.blockType)).join(', ')}.`)
    const offer = opts.layout.find((b) => b.blockType === 'offerBanner')
    if (offer) bullets.push(`Offer banner says "${offer.offerText}". ${offer.terms ?? ''}`.trim())
  } else {
    const lay = opts.diff.layout ?? {}
    for (const [k, v] of Object.entries<any>(lay)) {
      if (k === '_t' || !/^\d+$/.test(k) || !opts.layout[Number(k)]) continue
      const fields = Object.entries<any>(v).filter(([, d]) => Array.isArray(d) && d.length === 2).map(([name, d]) => `${name} "${String(d[0]).slice(0, 40)}" to "${String(d[1]).slice(0, 40)}"`)
      if (fields.length) bullets.push(`In the ${label(opts.layout[Number(k)].blockType)} section, ${fields.slice(0, 2).join('; ')}.`)
    }
    if (opts.diff.metaDescription) bullets.push('Meta description updated.')
    if (!bullets.length) bullets.push('Small wording changes since the last approved version.')
  }
  for (const f of opts.fixes.slice(0, 2)) bullets.push(`Pre-flight replaced "${(f.quote ?? '').slice(0, 60)}" with approved claim ${f.claimId ?? ''}.`.replace(/ \./, '.'))
  if (opts.claimIds.length) bullets.push(`Approved claims on the page: ${opts.claimIds.join(', ')}. Their disclaimers are included.`)
  return { bullets: bullets.slice(0, 5) }
}
