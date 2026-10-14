import * as jsondiffpatch from 'jsondiffpatch'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { askJSON, backupPath } from '@/lib/claude'
import { currentUser, loadContext } from '@/lib/context'
import { logActivity } from '@/lib/activity'
import { offlineSummary } from '@/lib/offlineAi'
import { runFixedRules } from '@/lib/preflightRules'

const SYSTEM = `You write short change summaries for a compliance approver. You describe only what the diff shows. You reply with one JSON object and nothing else.`
const LABELS: Record<string, string> = {
  'brief-to-draft': 'AI drafted the page from the brief',
  'edit-everywhere': 'Content edits accepted',
  'preflight-fix': 'Pre-flight fix accepted',
  'preflight (submit)': 'Passed pre-flight and submitted for review',
  'change-summary': 'AI wrote this change summary',
}
const Summary = z.object({ bullets: z.array(z.string()) })

const strip = (v: any): any =>
  Array.isArray(v) ? v.map(strip)
  : v && typeof v === 'object'
    ? Object.fromEntries(Object.entries(v).filter(([k]) => !['id', 'updatedAt', 'createdAt', '_status', 'reviewStatus'].includes(k)).map(([k, x]) => [k, strip(x)]))
    : v

export async function POST(req: Request) {
  const { id } = await req.json()
  const { payload, claims, bannedWords } = await loadContext()
  const user = await currentUser(payload, req)
  const page: any = await payload.findByID({ collection: 'pages', id, draft: true })

  const published = await payload.findVersions({
    collection: 'pages', where: { parent: { equals: id }, 'version._status': { equals: 'published' } },
    sort: '-updatedAt', limit: 1,
  })
  const base = published.docs[0]?.version as any
  const keep = (p: any) => strip({ title: p.title, slug: p.slug, metaDescription: p.metaDescription, disclaimer: p.disclaimer, layout: p.layout })
  const diff = base ? jsondiffpatch.diff(keep(base), keep(page)) : null
  const preflight = runFixedRules(page, claims, bannedWords)
  const claimIds = claims.filter((c) => JSON.stringify(page).toLowerCase().includes(c.text.toLowerCase().replace(/\.$/, ''))).map((c) => c.claimId)

  const recent = await payload.find({ collection: 'ai-activity', where: { page: { equals: id } }, sort: '-createdAt', limit: 30, depth: 1 })
  const fixRows = recent.docs.filter((a: any) => a.task === 'preflight-fix')
  const appliedFixes = fixRows.map((a: any) => a.inputSummary)

  const { data, usedBackup } = await askJSON({
    system: SYSTEM,
    user: `Page: ${page.title}
Changes since the last approved version:
${diff ? JSON.stringify(diff) : `new page, with sections: ${(page.layout ?? []).map((b: any) => b.blockType).join(', ')}`}

Approved claims used on the page: ${claimIds.join(', ') || 'none'}
Pre-flight fixes applied: ${appliedFixes.join('; ') || 'none'}

Write 3 to 5 bullets for the approver. Name the page section for each change. Say which approved claims appear, by id. Mention any pre-flight fix. Plain words, no more than 20 words per bullet.

Return:
{ "bullets": [""] }`,
    schema: Summary,
    backup: backupPath('summary.json'),
    offline: () => offlineSummary({
      title: page.title, layout: page.layout ?? [], diff, claimIds,
      fixes: fixRows.map((a: any) => ({ quote: a.inputSummary, claimId: a.output?.claimId })),
    }),
  })
  await logActivity(payload, { task: 'change-summary', page: id, output: data, usedBackup, userId: user?.id })
  return NextResponse.json({
    bullets: data.bullets, usedBackup,
    preflight: { critical: preflight.filter((f) => f.severity === 'critical').length, warnings: preflight.filter((f) => f.severity === 'warning').length },
    activity: recent.docs
      .filter((a: any) => LABELS[a.task] && (a.accepted || a.task === 'change-summary'))
      .reverse()
      .map((a: any) => ({ id: a.id, label: LABELS[a.task], who: a.requestedBy?.name || a.requestedBy?.email || 'Demo user', createdAt: a.createdAt })),
  })
}
