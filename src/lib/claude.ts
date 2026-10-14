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
  /** Rule-based answer built from the real input; used in stored mode before the backup file. */
  offline?: () => T
  model?: string
  images?: { mediaType: 'image/png' | 'image/jpeg'; base64: string }[]
}): Promise<{ data: T; usedBackup: boolean }> {
  const stored = async () => {
    if (opts.offline) {
      try { return { data: opts.schema.parse(opts.offline()), usedBackup: true } } catch (e) { console.warn('[ai] offline engine failed:', (e as Error).message) }
    }
    return { data: opts.schema.parse(JSON.parse(await fs.readFile(opts.backup, 'utf8'))), usedBackup: true }
  }
  // DEMO_AI=stored forces stored output; "live" (default when a key exists) calls Claude and falls back on failure.
  if (process.env.DEMO_AI === 'stored' || !process.env.ANTHROPIC_API_KEY) return stored()
  try {
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
    console.warn('[ai] live call failed, using stored output:', (err as Error).message)
    return stored()
  }
}
