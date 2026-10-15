import { NextResponse } from 'next/server'

import { askJSON, backupPath } from '@/lib/claude'
import { loadContext } from '@/lib/context'
import { actingDealer, requireUser } from '@/lib/dealer'
import { logActivity } from '@/lib/activity'
import { offlineSuggest, Suggest } from '@/lib/dealerSuggest'
import { campaignKits, templates } from '@/lib/templates'

const SYSTEM = `You help a car dealer turn a sentence about their offer into a web page. You only choose from the approved templates you are given and you only use what the dealer actually wrote. You reply with one JSON object and nothing else.`

export async function POST(req: Request) {
  const { text, dealerId } = await req.json()
  const { payload } = await loadContext()
  const user = await requireUser(payload, req)
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  const dealer = await actingDealer(payload, user, dealerId)

  const { data, usedBackup } = await askJSON({
    system: SYSTEM,
    user: `Approved templates:
${templates.map((t) => `- ${t.id}: ${t.name}. Best for: ${t.bestFor}`).join('\n')}

Today is ${new Date().toISOString().slice(0, 10)}.

The dealer wrote:
"""${text}"""

1. Extract only what the dealer said: amount (number of pounds), endsAt (ISO date and time, only if a date or a phrase like "this weekend" is given), models (e.g. "Nissan Ariya"), and extra (the dealer's own sentences that are not the offer terms, copied verbatim).
2. Leave a field out if the dealer did not say it. Never guess an amount or a date.
3. Rank ALL templates for this offer, best first, each with a one-line reason a dealer would understand.

Return:
{ "extracted": { "amount": 0, "endsAt": "", "models": "", "extra": "" },
  "ranking": [{ "templateId": "", "reason": "" }] }`,
    schema: Suggest,
    backup: backupPath('suggest.json'),
    offline: () => offlineSuggest(text),
  })

  const ex = data.extracted
  const missing = [!ex.amount && 'amount', !ex.endsAt && 'endsAt', !ex.models && 'models'].filter(Boolean)
  const byId = Object.fromEntries(templates.map((t) => [t.id, t]))
  const suggestions = data.ranking.filter((r) => byId[r.templateId]).slice(0, 3).map((r) => ({
    templateId: r.templateId, name: byId[r.templateId].name, bestFor: byId[r.templateId].bestFor, reason: r.reason,
  }))
  await logActivity(payload, { task: 'suggest-templates', inputSummary: String(text).slice(0, 200), output: { picked: suggestions.map((s) => s.templateId), extracted: ex }, usedBackup, userId: user.id })
  return NextResponse.json({
    suggestions, extracted: ex, missing, usedBackup,
    dealer: dealer && { id: dealer.id, name: dealer.name, slug: dealer.slug },
    kits: campaignKits.map((k) => ({ id: k.id, name: k.name, summary: k.summary })),
  })
}
