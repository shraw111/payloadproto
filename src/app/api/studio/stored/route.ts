import fs from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

import { STORED_DIR } from '@/lib/claude'

/** Serves files from demo/stored (thumbnails, model.json, image/prompt results). */
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get('name') ?? ''
  const full = path.resolve(STORED_DIR, name)
  if (!full.startsWith(STORED_DIR + path.sep) || full.includes(`${path.sep}backups${path.sep}`))
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  try {
    const body = await fs.readFile(full)
    return new NextResponse(body, { headers: { 'content-type': full.endsWith('.svg') ? 'image/svg+xml' : 'application/json' } })
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
}
