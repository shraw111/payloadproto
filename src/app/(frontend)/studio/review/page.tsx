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
  const [busy, setBusy] = useState(false)

  useEffect(() => {
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
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '360px 1fr', gap: 32 }}>
      <div>
        <p style={{ color: 'var(--teal)', fontWeight: 600 }}>PROTOTYPE · DEMO DESIGN</p>
        <div style={{ position: 'relative' }}>
          <img src={`/api/studio/stored?name=thumbnails/${frame}.svg`} alt={frame} width={360} style={{ display: 'block', border: '1px solid var(--teal-tint)' }} />
          {active && (
            <div style={{ position: 'absolute', left: `${active.region.x}%`, top: `${active.region.y}%`, width: `${active.region.w}%`, height: `${active.region.h}%`, border: '3px solid var(--saffron)', background: '#F2B84B33' }} />
          )}
        </div>
      </div>
      <div>
        <h1 style={{ fontFamily: 'var(--serif)', marginTop: 0 }}>Proposed content model</h1>
        <p>A first draft. Review it, change it, then build.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
          {model.blocks.map((b) => (
            <button key={b.slug} onClick={() => setActive(b)} style={{ textAlign: 'left', cursor: 'pointer', padding: 14, borderRadius: 12, background: '#fff',
              border: `2px solid ${b.confidence !== 'high' ? 'var(--saffron)' : active?.slug === b.slug ? 'var(--teal)' : 'var(--teal-tint)'}` }}>
              <strong>{b.label}</strong>
              <div style={{ fontSize: 13, opacity: 0.8 }}>{b.fields.map((f) => f.name).join(', ')}</div>
              {b.confidence !== 'high' && <div style={{ fontSize: 13, color: '#8a5a00', marginTop: 6 }}>⚑ {b.note}</div>}
            </button>
          ))}
          {model.collections.map((c) => (
            <div key={c.slug} style={{ padding: 14, borderRadius: 12, background: 'var(--saffron-tint)' }}><strong>{c.slug}</strong><div style={{ fontSize: 13 }}>content type</div></div>
          ))}
        </div>
        {flagged.length > 0 && <p style={{ marginTop: 16 }}>{flagged.length} items need a decision.</p>}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <input value={instruction} onChange={(e) => setInstruction(e.target.value)} style={{ flex: 1, padding: 10, fontSize: 16 }} />
          <button onClick={fix} disabled={busy} style={{ padding: '10px 20px' }}>{busy ? 'Changing…' : 'Apply change'}</button>
        </div>
        <button onClick={() => router.push('/studio/build')} style={{ marginTop: 24, padding: '12px 28px', background: 'var(--teal)', color: '#fff', border: 0, borderRadius: 999, cursor: 'pointer' }}>
          Approve and build
        </button>
      </div>
    </main>
  )
}
