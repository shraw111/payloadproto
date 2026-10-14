export type FlatField = { pageId: string | number; pageTitle: string; path: string; text: string }

const SKIP = new Set(['id', 'blockType', 'blockName', 'image', 'claims', 'layout_type'])
const TOP_LEVEL = ['metaDescription', 'disclaimer']

/** Every editable text field of a page, with a dotted path like layout.3.offerText. */
export function flattenPage(page: any): FlatField[] {
  const out: FlatField[] = []
  const walk = (value: unknown, path: string, key: string) => {
    if (SKIP.has(key)) return
    if (typeof value === 'string') {
      if (key === 'ctaLink' || key === 'buttonLink' || key === 'layout') return
      if (value.trim()) out.push({ pageId: page.id, pageTitle: page.title, path, text: value })
    } else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}.${i}`, key))
    else if (value && typeof value === 'object')
      Object.entries(value).forEach(([k, v]) => walk(v, `${path}.${k}`, k))
  }
  for (const k of TOP_LEVEL) walk(page[k], k, k)
  walk(page.layout ?? [], 'layout', 'layout_root')
  return out
}

export function getAtPath(obj: any, path: string): unknown {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)
}

export function setAtPath(obj: any, path: string, value: unknown) {
  const keys = path.split('.')
  const last = keys.pop()!
  const parent = keys.reduce((o, k) => (o == null ? o : o[k]), obj)
  if (parent == null) throw new Error(`bad path ${path}`)
  parent[last] = value
}
