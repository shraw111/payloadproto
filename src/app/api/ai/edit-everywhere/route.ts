import { NextResponse } from 'next/server'
import { z } from 'zod'

import { askJSON, backupPath } from '@/lib/claude'
import { currentUser, loadContext } from '@/lib/context'
import { logActivity } from '@/lib/activity'
import { dealerIdOf } from '@/lib/access'
import { offlineEdits } from '@/lib/offlineAi'
import { flattenPage, getAtPath, setAtPath, type FlatField } from '@/lib/flatten'

const SYSTEM = `You make precise edits to existing web pages in a CMS. You change only what the instruction asks and keep all other wording identical. You reply with one JSON object and nothing else.`

const Changes = z.object({
  changes: z.array(z.object({
    pageId: z.union([z.string(), z.number()]).optional(),
    pageTitle: z.string(),
    path: z.string(),
    before: z.string(),
    after: z.string(),
  })),
})

async function allPages(payload: any, user: any) {
  const where = user?.role === 'dealer' ? { dealer: { equals: dealerIdOf(user) } } : undefined
  return (await payload.find({ collection: 'pages', limit: 100, draft: true, pagination: false, where })).docs as any[]
}

/** Step 1: propose changes (nothing is saved). Step 2 (action: "apply"): save the accepted ones as drafts. */
export async function POST(req: Request) {
  const body = await req.json()
  const { payload } = await loadContext()
  const user = await currentUser(payload, req)
  const pages = await allPages(payload, user)

  if (body.action === 'apply') {
    const accepted = body.changes as z.infer<typeof Changes>['changes']
    const byPage = new Map<string, typeof accepted>()
    for (const c of accepted) {
      const page = pages.find((p) => String(p.id) === String(c.pageId) || p.title === c.pageTitle)
      if (!page) continue
      byPage.set(String(page.id), [...(byPage.get(String(page.id)) ?? []), c])
    }
    for (const [id, changes] of byPage) {
      const page = pages.find((p) => String(p.id) === id)!
      const data: any = { layout: page.layout, metaDescription: page.metaDescription, disclaimer: page.disclaimer, offer: page.offer }
      for (const c of changes) setAtPath(data, c.path, c.after)
      // Keep the structured offer amount in step with the offer text; the discount cap reads it.
      const offerChange = changes.find((c) => c.path.endsWith('offerText'))
      const amount = offerChange?.after.match(/[£$€]\s?(\d[\d,]*)/)?.[1]
      if (amount && data.offer) data.offer = { ...data.offer, amount: Number(amount.replace(/,/g, '')) }
      await payload.update({ collection: 'pages', id, data, draft: true })
      await logActivity(payload, { task: 'edit-everywhere', page: id, inputSummary: body.instruction, output: changes, accepted: true, userId: user?.id })
    }
    return NextResponse.json({ updated: byPage.size, ids: [...byPage.keys()] })
  }

  const flat: FlatField[] = pages.flatMap(flattenPage)
  const { data, usedBackup } = await askJSON({
    system: SYSTEM,
    user: `Instruction: ${body.instruction}

Pages, as every text field with its path:
${flat.map((f) => JSON.stringify(f)).join('\n')}

Find every field the instruction applies to, on every page.
- Return the field's full new text in "after".
- "before" must be the field's current text, copied exactly.
- Change only the words the instruction is about; keep the rest of the sentence as it is.
- Also update related text that would become wrong, such as terms that name the old offer.
- Return an empty list if nothing applies.

Return:
{ "changes": [{ "pageId": "", "pageTitle": "", "path": "", "before": "", "after": "" }] }`,
    schema: Changes,
    backup: backupPath('edit-changes.json'),
    offline: () => offlineEdits(body.instruction, flat) as z.infer<typeof Changes>,
  })

  // Keep only changes whose `before` matches the stored text exactly; fix up page ids by title.
  const changes = data.changes.flatMap((c) => {
    const page = pages.find((p) => String(p.id) === String(c.pageId)) ?? pages.find((p) => p.title === c.pageTitle)
    if (!page) return []
    const cur = getAtPath(page, c.path)
    return cur === c.before && c.after !== c.before ? [{ ...c, pageId: page.id, pageTitle: page.title }] : []
  })
  await logActivity(payload, { task: 'edit-everywhere-proposed', inputSummary: body.instruction, output: { count: changes.length }, usedBackup, userId: user?.id })
  return NextResponse.json({ changes, usedBackup })
}
