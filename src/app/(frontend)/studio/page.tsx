'use client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

const TABS = [
  { id: 'fig', label: '.fig file', hint: 'Drop a Figma file', result: 'model.json', accept: '.fig' },
  { id: 'image', label: 'Images', hint: 'Drop screenshots of the design', result: 'image-result.json', accept: 'image/*' },
  { id: 'prompt', label: 'Prompt', hint: 'Describe the site', result: 'prompt-result.json', accept: '' },
] as const

/** Screen 1. Every tab loads stored output after a short "Reading" state. */
export default function Studio() {
  const router = useRouter()
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0])
  const [reading, setReading] = useState(false)
  const [frames, setFrames] = useState<string[] | null>(null)
  const [prompt, setPrompt] = useState('')

  async function load() {
    setReading(true)
    await new Promise((r) => setTimeout(r, 2000))
    const model = await fetch(`/api/studio/stored?name=${tab.result}`).then((r) => r.json())
    sessionStorage.setItem('studio-model', JSON.stringify(model))
    sessionStorage.setItem('studio-source', tab.id)
    setReading(false)
    if (tab.id === 'fig') setFrames(['home', 'product', 'campaign'])
    else router.push('/studio/review')
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>
      <p style={{ color: 'var(--teal)', fontWeight: 600 }}>PROTOTYPE · DEMO DESIGN</p>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 44, margin: '0 0 24px' }}>AI Content Studio</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t); setFrames(null) }}
            style={{ padding: '10px 20px', borderRadius: 999, border: '1px solid var(--teal)', cursor: 'pointer',
              background: t.id === tab.id ? 'var(--teal)' : 'transparent', color: t.id === tab.id ? '#fff' : 'var(--teal)' }}>
            {t.label}
          </button>
        ))}
      </div>
      {!frames && (
        <div style={{ background: 'var(--teal-tint)', borderRadius: 16, padding: 48, textAlign: 'center' }}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (tab.id !== 'prompt') load() }}>
          {tab.id === 'prompt' ? (
            <>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} style={{ width: '100%', padding: 12, fontSize: 16 }}
                placeholder="A website for a family-run physiotherapy clinic: services, our team, two clinic locations, patient stories, a blog, and a book-an-appointment button on every page." />
              <button onClick={load} disabled={reading} style={{ marginTop: 12, padding: '10px 24px' }}>Generate content model</button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 20, margin: 0 }}>{reading ? 'Reading file…' : tab.hint}</p>
              {!reading && <input type="file" accept={tab.accept} onChange={load} style={{ marginTop: 16 }} />}
            </>
          )}
          {reading && <p>Reading file…</p>}
        </div>
      )}
      {frames && (
        <>
          <h2>Frames found</h2>
          <div style={{ display: 'flex', gap: 16 }}>
            {frames.map((f) => (
              <figure key={f} style={{ margin: 0 }}>
                <img src={`/api/studio/stored?name=thumbnails/${f}.svg`} alt={f} width={200} style={{ borderRadius: 8, border: '1px solid var(--teal-tint)' }} />
                <figcaption style={{ textTransform: 'capitalize' }}>{f}</figcaption>
              </figure>
            ))}
          </div>
          <button onClick={() => router.push('/studio/review')} style={{ marginTop: 24, padding: '12px 28px', background: 'var(--teal)', color: '#fff', border: 0, borderRadius: 999, cursor: 'pointer' }}>
            Propose content model
          </button>
        </>
      )}
    </main>
  )
}
