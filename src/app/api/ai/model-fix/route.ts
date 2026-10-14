import { NextResponse } from 'next/server'
import { z } from 'zod'

import { askJSON, backupPath } from '@/lib/claude'

const Model = z.object({ blocks: z.array(z.any()), collections: z.array(z.any()).default([]), pages: z.array(z.any()).default([]) }).passthrough()

const SYSTEM = `You are a senior content architect for Payload CMS 3. You change an existing content model exactly as asked and change nothing else. You reply with one JSON object and nothing else.`

export async function POST(req: Request) {
  const { model, instruction } = await req.json()
  const { data, usedBackup } = await askJSON({
    system: SYSTEM,
    user: `Current model:
${JSON.stringify(model)}

Change request: ${instruction}

Rules:
- Apply only this change. Keep every other block, field, name, region and page layout exactly as it is.
- When you merge blocks, keep the union of their fields and add a select field for anything that differed, such as layout.
- Update page layouts that used the old blocks to use the new one.
- Set confidence to "high" and clear the note on anything this change resolves.

Return the full model with the same structure as the current model.`,
    schema: Model,
    backup: backupPath('model-fixed.json'),
  })
  return NextResponse.json({ model: data, usedBackup })
}
