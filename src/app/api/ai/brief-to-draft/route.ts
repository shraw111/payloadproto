import mammoth from 'mammoth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { allBlocks } from '@/blocks'
import { askJSON, backupPath } from '@/lib/claude'
import { currentUser, loadContext } from '@/lib/context'
import { logActivity } from '@/lib/activity'
import { offlineBriefToDraft } from '@/lib/offlineAi'
import { schemaSummary } from '@/lib/schemaSummary'

const SYSTEM = `You draft web pages for Halden Health inside Payload CMS. You only use the blocks and fields you are given. You reply with one JSON object and nothing else.`
const known = new Set(allBlocks.map((b) => b.slug))

const Draft = z.object({
  title: z.string(),
  slug: z.string(),
  metaDescription: z.string().default(''),
  disclaimer: z.string().default(''),
  layout: z.array(z.object({ blockType: z.string() }).passthrough()).refine((l) => l.every((b) => known.has(b.blockType)), 'unknown block type'),
  claimsUsed: z.array(z.string()).default([]),
  sources: z.array(z.any()).default([]),
})

export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('brief') as File | null
  if (!file) return NextResponse.json({ error: 'No brief uploaded' }, { status: 400 })
  const briefText = (await mammoth.extractRawText({ buffer: Buffer.from(await file.arrayBuffer()) })).value

  const { payload, claims, brandRules, claimsList } = await loadContext()
  const user = await currentUser(payload, req)

  const { data, usedBackup } = await askJSON({
    system: SYSTEM,
    user: `Blocks available:
${JSON.stringify(schemaSummary())}

Approved claims (id: claim | required disclaimer):
${claimsList}

Brand voice: ${brandRules}

Campaign brief:
${briefText}

Draft one landing page for this campaign.
- Use the sections the brief asks for, in its order, each as one of the blocks above.
- Use the brief's own wording wherever it gives copy.
- Where a sentence means the same as an approved claim, use the approved wording exactly and list its id in claimsUsed.
- Do not add product facts, prices, dates or claims that are in neither the brief nor the approved claims.
- Leave upload fields out. Put the disclaimers of every claim used in the page disclaimer, separated by spaces.
- metaDescription: 120 to 155 characters.

Return:
{
  "title": "", "slug": "", "metaDescription": "", "disclaimer": "",
  "layout": [{ "blockType": "", "...fields": "" }],
  "claimsUsed": ["C-01"],
  "sources": [{ "block": 0, "briefQuote": "" }]
}`,
    schema: Draft,
    backup: backupPath('brief-draft.json'),
    offline: () => offlineBriefToDraft(briefText, claims),
  })

  // Resolve claim ids to relationship ids on productHighlight blocks.
  const idByClaim = new Map(claims.map((c: any) => [c.claimId, c.id]))
  const layout = data.layout.map((b: any) =>
    b.blockType === 'productHighlight'
      ? { ...b, claims: (b.claims ?? data.claimsUsed).map((c: string) => idByClaim.get(c)).filter(Boolean) }
      : b,
  )

  const slug = data.slug.replace(/^\//, '')
  const existing = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, draft: true })
  const body = { title: data.title, slug, metaDescription: data.metaDescription, disclaimer: data.disclaimer, layout, reviewStatus: 'draft' as const }
  const page = existing.docs[0]
    ? await payload.update({ collection: 'pages', id: existing.docs[0].id, data: body as any, draft: true })
    : await payload.create({ collection: 'pages', data: body as any, draft: true })

  await logActivity(payload, {
    task: 'brief-to-draft', page: page.id, inputSummary: file.name,
    output: { blocks: layout.length, claimsUsed: data.claimsUsed }, accepted: true, usedBackup, userId: user?.id,
  })
  return NextResponse.json({ id: page.id, slug, usedBackup })
}
