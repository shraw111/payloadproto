import { z } from 'zod'

import { MONEY_RE } from './offlineAi'
import { endOfDay, parseDayMonth, thisSunday } from './dates'
import { templates } from './templates'

export const Suggest = z.object({
  extracted: z.object({
    amount: z.number().nullish(),
    endsAt: z.string().nullish(),
    models: z.string().nullish(),
    extra: z.string().nullish(),
  }),
  ranking: z.array(z.object({ templateId: z.string(), reason: z.string() })),
})
export type SuggestResult = z.infer<typeof Suggest>

const MODELS = ['Ariya', 'Qashqai', 'Juke', 'Leaf', 'X-Trail']

/**
 * Rule-based stand-in for the "find me a template" AI step. It reads only what the dealer wrote:
 * it never invents an amount or a date, and it keeps the dealer's own sentences verbatim.
 */
export function offlineSuggest(text: string, now = new Date()): SuggestResult {
  const lower = text.toLowerCase()
  const money = text.match(MONEY_RE)?.[0]
  const amount = money ? Number(money.replace(/[^\d.]/g, '')) : undefined
  const model = MODELS.find((m) => lower.includes(m.toLowerCase()))

  let endsAt: string | undefined
  if (/this weekend|by sunday|until sunday|till sunday|sunday/.test(lower)) endsAt = thisSunday(now).toISOString()
  else if (/today|tonight/.test(lower)) endsAt = endOfDay(now).toISOString()
  else endsAt = parseDayMonth(text, now)?.toISOString()

  // The dealer's own sentences that are not the offer itself.
  const productName = model ? `Nissan ${model}` : 'Nissan'
  const extra = text.split(/(?<=[.!?])\s+/).map((s) => s.trim())
    .filter((s) => s && !MONEY_RE.test(s) && !/\b(offer|discount|weekend|until|sale)\b/i.test(s))
    .map((s) => s.replace(/^(it|the car|this car)\b/i, productName))
    .join(' ') || undefined

  const timeBound = /weekend|today|tonight|sale|limited|ends|until|only/.test(lower)
  const spotlight = !!model || /new|launch|test drive/.test(lower)
  const score: Record<string, number> = {
    'weekend-sale': (timeBound ? 3 : 1) + (amount ? 1 : 0),
    'model-spotlight': (spotlight ? 3 : 0) + (model ? 1 : 0),
    'simple-offer': text.length < 60 ? 3 : 1,
  }
  const reasons: Record<string, string> = {
    'weekend-sale': timeBound ? 'Your offer has a deadline, so a countdown helps.' : 'Good when an offer is short and time-limited.',
    'model-spotlight': model ? `Your offer is about the ${model}, so the page leads with the car.` : 'Good when the offer is tied to a model.',
    'simple-offer': 'The quickest page: the offer, one button and a form.',
  }
  const ranking = templates
    .map((t) => ({ templateId: t.id, reason: reasons[t.id], s: score[t.id] ?? 0 }))
    .sort((a, b) => b.s - a.s)
    .map(({ templateId, reason }) => ({ templateId, reason }))
  return { extracted: { amount, endsAt, models: model ? productName : undefined, extra }, ranking }
}
