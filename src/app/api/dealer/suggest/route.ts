import { NextResponse } from 'next/server'

import { askJSON, backupPath } from '@/lib/claude'
import { loadContext } from '@/lib/context'
import { actingDealer, requireUser } from '@/lib/dealer'
import { logActivity } from '@/lib/activity'
import { offlineSuggest, Suggest } from '@/lib/dealerSuggest'
import { campaignKits, contentTypes, templates, type ContentType } from '@/lib/templates'

const SYSTEM = `You help a car dealer turn a sentence about their offer into a web page. You only choose from the approved templates you are given and you only use what the dealer actually wrote. You reply with one JSON object and nothing else.`

export async function POST(req: Request) {
  const { text, dealerId, type: forced } = await req.json()
  const { payload } = await loadContext()
  const user = await requireUser(payload, req)
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  const dealer = await actingDealer(payload, user, dealerId)

  const { data, usedBackup } = await askJSON({
    system: SYSTEM,
    user: `Content types HQ allows dealers to publish:
${contentTypes.map((c) => `- ${c.id}: ${c.name}. ${c.description}. Needs: ${c.required.join(', ')}`).join('\n')}

Approved templates (each belongs to one content type):
${templates.map((t) => `- ${t.id} (${t.type}): ${t.name}. Best for: ${t.bestFor}`).join('\n')}

Today is ${new Date().toISOString().slice(0, 10)}.

The dealer wrote:
"""${text}"""

1. Decide what kind of content this is: one of the allowed types, or "other" if none fits. Give your confidence.${forced ? ` The dealer has said it is: ${forced}.` : ''}
2. Extract only what the dealer said: amount (pounds; 0 if it is free), endsAt (ISO date and time the offer or event ends), eventAt (ISO start of an event), title (the service or event name), location, models (e.g. "Nissan Ariya"), and extra (the dealer's own sentences that are not the details, copied verbatim).
3. Leave a field out if the dealer did not say it. Never guess an amount, a date or a place.
4. Rank the templates that belong to that content type, best first, each with a one-line reason a dealer would understand.

Return:
{ "type": "", "confidence": "high", "extracted": { "amount": 0, "endsAt": "", "eventAt": "", "title": "", "location": "", "models": "", "extra": "" },
  "ranking": [{ "templateId": "", "reason": "" }] }`,
    schema: Suggest,
    backup: backupPath('suggest.json'),
    offline: () => offlineSuggest(text, new Date(), forced as ContentType | undefined),
  })

  const ex = data.extracted
  const req_ = contentTypes.find((c) => c.id === data.type)?.required ?? []
  const missing = req_.filter((k) => (k === 'amount' ? ex.amount === undefined || ex.amount === null : !(ex as any)[k]))
  const byId = Object.fromEntries(templates.map((t) => [t.id, t]))
  const suggestions = data.ranking.filter((r) => byId[r.templateId]?.type === data.type).slice(0, 3).map((r) => ({
    templateId: r.templateId, name: byId[r.templateId].name, bestFor: byId[r.templateId].bestFor, reason: r.reason,
  }))
  await logActivity(payload, { task: 'suggest-templates', inputSummary: String(text).slice(0, 200), output: { type: data.type, picked: suggestions.map((s) => s.templateId), extracted: ex }, usedBackup, userId: user.id })
  return NextResponse.json({
    type: data.type, confidence: data.confidence, types: contentTypes.map(({ id, name, description }) => ({ id, name, description })),
    suggestions, extracted: ex, missing, usedBackup,
    dealerAddress: (dealer as any)?.address ?? null,
    dealer: dealer && { id: dealer.id, name: dealer.name, slug: dealer.slug },
    kits: campaignKits.map((k) => ({ id: k.id, name: k.name, summary: k.summary })),
  })
}

export async function GET(req: Request) {
  const { payload } = await loadContext()
  const user = await requireUser(payload, req)
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  const dealer = await actingDealer(payload, user)
  return NextResponse.json({ dealer: dealer && { id: dealer.id, name: dealer.name, slug: dealer.slug, domain: dealer.domain }, kits: campaignKits.map((k) => ({ id: k.id, name: k.name, summary: k.summary })) })
}
