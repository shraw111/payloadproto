import config from '@payload-config'
import { getPayload } from 'payload'

export type Claim = { claimId: string; text: string; disclaimer?: string | null }

export async function loadContext() {
  const payload = await getPayload({ config })
  const claims = (await payload.find({ collection: 'claims', limit: 100, sort: 'claimId', pagination: false }))
    .docs as unknown as Claim[]
  const rules = (await payload.findGlobal({ slug: 'brand-rules' })) as any
  const bannedWords: string[] = (rules.bannedWords ?? []).map((w: any) => w.word)
  const brandRules = [
    `Tone: ${rules.tone}`,
    `Reading age: ${rules.readingAge}`,
    `Banned words: ${bannedWords.join(', ')}`,
    ...(rules.rules ?? []).map((r: any) => `- ${r.rule}`),
  ].join('\n')
  const claimsList = claims
    .map((c) => `${c.claimId}: ${c.text} | ${c.disclaimer && c.disclaimer !== 'None' ? c.disclaimer : 'none'}`)
    .join('\n')
  return { payload, claims, bannedWords, brandRules, claimsList }
}

export async function currentUser(payload: Awaited<ReturnType<typeof getPayload>>, req: Request) {
  try {
    const { user } = await payload.auth({ headers: req.headers })
    return user ?? null
  } catch {
    return null
  }
}
