import Anthropic from '@anthropic-ai/sdk'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { ZodSchema } from 'zod'

export const LIVE_MODEL = 'claude-sonnet-5-5'
export const BUILD_MODEL = 'claude-opus-5-5'

export const STORED_DIR = path.resolve(process.cwd(), 'demo/stored')
export const backupPath = (name: string) => path.join(STORED_DIR, 'backups', name)

export async function readStored<T = unknown>(rel: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(STORED_DIR, rel), 'utf8')) as T
}

/**
 * Ask Claude for one JSON object, validate it, and fall back to a stored backup
 * on any failure or after 20 s. `usedBackup` lets routes log which path ran.
 */
export async function askJSON<T>(opts: {
  system: string
  user: string
  schema: ZodSchema<T>
  backup: string
  model?: string
  images?: { mediaType: 'image/png' | 'image/jpeg'; base64: string }[]
}): Promise<{ data: T; usedBackup: boolean }> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('no api key')
    const client = new Anthropic()
    const content = [
      ...(opts.images ?? []).map((i) => ({
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: i.mediaType, data: i.base64 },
      })),
      { type: 'text' as const, text: opts.user },
    ]
    const res = await Promise.race([
      client.messages.create({
        model: opts.model ?? LIVE_MODEL,
        max_tokens: 4000,
        system: opts.system,
        messages: [{ role: 'user', content }],
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000)),
    ])
    const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
    return { data: opts.schema.parse(json), usedBackup: false }
  } catch (err) {
    console.warn(`[ai] falling back to ${opts.backup}:`, (err as Error).message)
    const raw = JSON.parse(await fs.readFile(opts.backup, 'utf8'))
    return { data: opts.schema.parse(raw), usedBackup: true }
  }
}
