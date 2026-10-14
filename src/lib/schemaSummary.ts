import type { Block, Field } from 'payload'

import { allBlocks } from '../blocks'

type Summary = { name: string; type: string; required?: boolean; options?: string[]; fields?: Summary[] }

const summariseField = (f: Field): Summary | null => {
  if (!('name' in f) || !f.name) return null
  const out: Summary = { name: f.name, type: f.type, required: 'required' in f ? !!f.required : false }
  if (f.type === 'select') out.options = f.options.map((o) => (typeof o === 'string' ? o : o.value))
  if (f.type === 'array') out.fields = f.fields.map(summariseField).filter(Boolean) as Summary[]
  return out
}

/** Block schemas as the AI sees them, so it can only use blocks that exist. */
export const schemaSummary = (blocks: Block[] = allBlocks) =>
  blocks.map((b) => ({
    blockType: b.slug,
    fields: b.fields.map(summariseField).filter(Boolean),
  }))
