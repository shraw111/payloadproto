'use client'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

type Block = { slug: string; label: string; frame: string; region: { x: number; y: number; w: number; h: number }; confidence: string; note: string; fields: { name: string; type: string; required?: boolean }[] }
type Model = { blocks: Block[]; collections: { slug: string }[]; pages: { title: string; layout: string[] }[] }

/** Screen 2. Cards beside the design; clicking a card highlights its region; the fix box calls the AI live. */
export default function Review() {
  const router = useRouter()
  const [model, setModel] = useState<Model | null>(null)
  const [active, setActive] = useState<Block | null>(null)
  const [instruction, setInstruction] = useState('Merge the two testimonial blocks into one with a layout option.')
  const [source, setSource] = useState('fig')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const src = sessionStorage.getItem('studio-source') ?? 'fig'
    setSource(src)
    if (src === 'prompt') setInstruction('Add a blog section.')
    const saved = sessionStorage.getItem('studio-model')
    if (saved) setModel(JSON.parse(saved))
    else fetch('/api/studio/stored?name=model.json').then((r) => r.json()).then(setModel)
  }, [])

  async function fix() {
    setBusy(true)
    const res = await fetch('/api/ai/model-fix', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model, instruction }) })
    const json = await res.json()
    setModel(json.model)
    sessionStorage.setItem('studio-model', JSON.stringify(json.model))
    setActive(null)
    setBusy(false)
  }

  if (!model) return <main style={{ padding: 48 }}>Loading…</main>
  const frame = active?.frame ?? 'home'
  const flagged = model.blocks.filter((b) => b.confidence !== 'high')

  return (
    <div className="studio">
      <header className="studio__bar"><b>AI Content Studio</b><span className="studio__tag">Prototype · demo design</span></header>
      <main className="studio__body split">
        <div>
          {source === 'prompt' ? (
            <div style={{ background: 'var(--teal-tint)', borderRadius: 8, padding: 24, minHeight: 200 }}>
              <p className="eyebrow">Your description</p>
              <p style={{ margin: 0 }}>Generated from your description, with no design attached. Page sections are proposed from the words alone.</p>
            </div>
          ) : (
          <div style={{ position: 'relative' }}>
            <img src={`/api/studio/stored?name=thumbnails/${frame}.svg`} alt={`${frame} frame`} width={360} style={{ display: 'block', border: '1px solid var(--line)', borderRadius: 8 }} />
            {active && (
              <div style={{ position: 'absolute', left: `${active.region.x}%`, top: `${active.region.y}%`, width: `${active.region.w}%`, height: `${active.region.h}%`, border: '3px solid var(--saffron)', background: '#F2B84B33', borderRadius: 4 }} />
            )}
          </div>
          )}
        </div>
        <div>
          <h1>Proposed content model</h1>
          <p>A first draft. Select a page section to see where it sits in the design, then change anything that looks wrong.</p>
          <div className="mcards">
            {model.blocks.map((b) => (
              <button key={b.slug} className={`mcard ${b.confidence !== 'high' ? 'mcard--flag' : ''}`} aria-pressed={active?.slug === b.slug} onClick={() => setActive(b)}>
                <strong>{b.label}</strong>
                <small>{b.fields.map((f) => f.name).join(', ')}</small>
                {b.confidence !== 'high' && <small>Needs a decision: {b.note}</small>}
              </button>
            ))}
            {model.collections.map((c) => (
              <div key={c.slug} className="mcard"><strong>{c.slug}</strong><small>content type</small></div>
            ))}
          </div>
          {flagged.length > 0 && <p className="eyebrow" style={{ marginTop: 20 }}>{flagged.length} items need a decision</p>}
          <div className="fixbar">
            <input value={instruction} onChange={(e) => setInstruction(e.target.value)} aria-label="Change instruction" />
            <button className="mbtn mbtn--ghost" onClick={fix} disabled={busy}>{busy ? 'Changing…' : 'Apply change'}</button>
          </div>
          <button className="mbtn" onClick={() => router.push('/studio/build')}>Approve and build</button>
        </div>
      </main>
    </div>
  )
}
