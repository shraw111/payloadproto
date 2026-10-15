import { z } from 'zod'

import { MONEY_RE } from './offlineAi'
import { addDays, endOfDay, endOfMonth, nextWeekday, parseDayMonth, thisSunday } from './dates'
import { contentTypes, templates, type ContentType } from './templates'

const TYPE_IDS = contentTypes.map((t) => t.id) as [ContentType, ...ContentType[]]

export const Suggest = z.object({
  type: z.enum([...TYPE_IDS, 'other']).default('offer'),
  confidence: z.enum(['high', 'medium', 'low']).default('medium'),
  extracted: z.object({
    amount: z.number().nullish(),
    endsAt: z.string().nullish(),
    models: z.string().nullish(),
    extra: z.string().nullish(),
    title: z.string().nullish(),
    location: z.string().nullish(),
    eventAt: z.string().nullish(),
  }),
  ranking: z.array(z.object({ templateId: z.string(), reason: z.string() })),
})
export type SuggestResult = z.infer<typeof Suggest>

const MODELS = ['Ariya', 'Qashqai', 'Juke', 'Leaf', 'X-Trail']
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const SERVICE_RE = /\b(service|servicing|mot|health check|check[- ]?up|tyre|tyres|brake|brakes|battery check|winter check|repair|valet)\b/i
const EVENT_RE = /\b(open day|open evening|event|workshop|launch (?:day|evening|event)|showroom day|test drive day|meet the team)\b/i

/** Works out what kind of page the dealer wants. Only the types HQ allows; anything else is "other". */
export function classify(text: string): { type: ContentType | 'other'; confidence: 'high' | 'medium' | 'low' } {
  const t = text.toLowerCase()
  const service = SERVICE_RE.test(t), event = EVENT_RE.test(t) || /\b(saturday|sunday)\b.*\b\d{1,2}\s*(am|pm|to|-)/.test(t)
  const money = MONEY_RE.test(text) || /\b(off|discount|deal|sale|offer)\b/.test(t)
  if (service) return { type: 'service-special', confidence: money || /free/.test(t) ? 'high' : 'medium' }
  if (event) return { type: 'event', confidence: 'high' }
  if (money || MODELS.some((m) => t.includes(m.toLowerCase()))) return { type: 'offer', confidence: money ? 'high' : 'medium' }
  return { type: 'other', confidence: 'low' }
}

function parseHour(h: string, ampm: string | undefined, fallbackPm: boolean) {
  let n = Number(h)
  if (ampm) { const pm = ampm.toLowerCase() === 'pm'; if (pm && n < 12) n += 12; if (!pm && n === 12) n = 0 }
  else if (fallbackPm && n < 12) n += 12
  return n
}

/**
 * Rule-based stand-in for the "work out what this is and find me a template" AI step.
 * It reads only what the dealer wrote: it never invents an amount, a date or a place, and keeps the dealer's own sentences verbatim.
 */
export function offlineSuggest(text: string, now = new Date(), force?: ContentType): SuggestResult {
  const lower = text.toLowerCase()
  const cls = force ? { type: force, confidence: 'high' as const } : classify(text)
  const type = cls.type
  const money = text.match(MONEY_RE)?.[0]
  let amount: number | undefined = money ? Number(money.replace(/[^\d.]/g, '')) : undefined
  if (amount === undefined && /\bfree\b/.test(lower)) amount = 0
  const model = MODELS.find((m) => lower.includes(m.toLowerCase()))
  const productName = model ? `Nissan ${model}` : 'Nissan'

  // End date.
  let endsAt: string | undefined
  const rel = lower.match(/next (\d+|two|three|four) (day|week)s?/)
  const words: Record<string, number> = { two: 2, three: 3, four: 4 }
  if (rel) endsAt = endOfDay(addDays(now, (words[rel[1]] ?? Number(rel[1])) * (rel[2] === 'week' ? 7 : 1))).toISOString()
  else if (/this weekend|by sunday|until sunday|till sunday/.test(lower)) endsAt = thisSunday(now).toISOString()
  else if (/this month/.test(lower)) endsAt = endOfMonth(now).toISOString()
  else if (/today|tonight/.test(lower)) endsAt = endOfDay(now).toISOString()
  else endsAt = parseDayMonth(text, now)?.toISOString()

  // Event: weekday and a time range such as "10 to 4" or "10am-4pm".
  let eventAt: string | undefined, title: string | undefined, location: string | undefined
  if (type === 'event') {
    const day = lower.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)?.[1]
    const tm = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-|–|until)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
    if (day) {
      const d = nextWeekday(day, now)
      if (tm) {
        const startH = parseHour(tm[1], tm[3], false)
        const endH = parseHour(tm[4], tm[6], startH >= 12 ? false : Number(tm[4]) <= Number(tm[1]))
        const start = new Date(d); start.setHours(startH, Number(tm[2] ?? 0), 0, 0)
        const end = new Date(d); end.setHours(endH, Number(tm[5] ?? 0), 0, 0)
        eventAt = start.toISOString(); endsAt = end.toISOString()
      } else {
        const one = lower.match(/(?:at|from)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
        if (one) { const start = new Date(d); start.setHours(parseHour(one[1], one[3], false), Number(one[2] ?? 0), 0, 0); eventAt = start.toISOString() }
      }
    }
    title = cap(text.match(EVENT_RE)?.[0].toLowerCase() ?? 'event')
    location = text.match(/\bat (?:our |the )?([A-Z][A-Za-z' ]{2,40}?)(?=[.,;]|$| on | from )/)?.[1]
  }
  if (type === 'service-special') {
    title = cap(text.match(SERVICE_RE)?.[0].toLowerCase() ?? 'service')
    const adj = text.match(/\b(winter|summer|spring|autumn|full|free|battery|brake|tyre|ev)\b\s+(?=health check|service|check|mot)/i)?.[1]
    if (adj && !/free/i.test(adj) && !title.toLowerCase().includes(adj.toLowerCase())) title = `${cap(adj)} ${title.toLowerCase()}`
  }

  // The dealer's own sentences that are not the details themselves.
  const extra = text.split(/(?<=[.!?])\s+/).map((s) => s.trim())
    .filter((s) => s && !MONEY_RE.test(s) && !/\b(offer|discount|weekend|until|sale|open day|event|free|next \w+ (?:days?|weeks?)|this (?:saturday|sunday|month))\b/i.test(s)
      && !(type !== 'offer' && (/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(s) || (title && s.toLowerCase().includes(title.toLowerCase())))))
    .map((s) => s.replace(/^(it|the car|this car)\b/i, productName))
    .join(' ') || undefined

  // Rank the templates of this type.
  const forType = templates.filter((t) => t.type === type)
  const timeBound = /weekend|today|tonight|sale|limited|ends|until|only/.test(lower)
  const spotlight = !!model || /new|launch|test drive/.test(lower)
  const score: Record<string, number> = {
    'weekend-sale': (timeBound ? 3 : 1) + (amount ? 1 : 0),
    'model-spotlight': (spotlight ? 3 : 0) + (model ? 1 : 0),
    'simple-offer': text.length < 60 ? 3 : 1,
    'service-special': extra ? 3 : 2, 'service-simple': 1,
    'event-page': 3, 'event-simple': 1,
  }
  const reasons: Record<string, string> = {
    'weekend-sale': timeBound ? 'Your offer has a deadline, so a countdown helps.' : 'Good when an offer is short and time-limited.',
    'model-spotlight': model ? `Your offer is about the ${model}, so the page leads with the car.` : 'Good when the offer is tied to a model.',
    'simple-offer': 'The quickest page: the offer, one button and a form.',
    'service-special': 'The service name and price up front, then a booking form.',
    'service-simple': 'Just the price and a booking form.',
    'event-page': 'Date and place up front, with a countdown and a reservation form.',
    'event-simple': 'A short notice with a reservation form.',
  }
  const ranking = forType.map((t) => ({ templateId: t.id, reason: reasons[t.id], s: score[t.id] ?? 0 })).sort((a, b) => b.s - a.s).map(({ templateId, reason }) => ({ templateId, reason }))
  return {
    type: type as SuggestResult['type'], confidence: cls.confidence,
    extracted: { amount, endsAt, models: model ? productName : undefined, extra, title, location, eventAt },
    ranking,
  }
}
