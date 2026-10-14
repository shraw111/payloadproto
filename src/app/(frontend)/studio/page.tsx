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
    <div className="studio">
      <header className="studio__bar"><b>AI Content Studio</b><span className="studio__tag">Prototype · demo design</span></header>
      <main className="studio__body">
        <h1>Start from what you have</h1>
        <p>Choose how the design comes in. The studio proposes a content model for you to review.</p>
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={t.id === tab.id} className="tab" onClick={() => { setTab(t); setFrames(null) }}>
              {t.label}
            </button>
          ))}
        </div>
        {!frames && (
          <div className="drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (tab.id !== 'prompt') load() }}>
            {tab.id === 'prompt' ? (
              <>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} style={{ width: '100%', maxWidth: 640, padding: 12, fontSize: 16, borderRadius: 8, border: '1px solid var(--line)' }}
                  placeholder="A website for a family-run physiotherapy clinic: services, our team, two clinic locations, patient stories, a blog, and a book-an-appointment button on every page." />
                <div><button className="mbtn" style={{ marginTop: 16 }} onClick={load} disabled={reading}>{reading ? 'Reading…' : 'Propose content model'}</button></div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 20, margin: '0 0 16px' }}>{reading ? 'Reading file…' : tab.hint}</p>
                {!reading && <input type="file" accept={tab.accept} onChange={load} />}
              </>
            )}
          </div>
        )}
        {frames && (
          <>
            <p className="eyebrow">{frames.length} frames found</p>
            <div className="frames">
              {frames.map((f) => (
                <figure key={f}>
                  <img src={`/api/studio/stored?name=thumbnails/${f}.svg`} alt={`${f} frame`} width={200} />
                  <figcaption>{f}</figcaption>
                </figure>
              ))}
            </div>
            <button className="mbtn" style={{ marginTop: 28 }} onClick={() => router.push('/studio/review')}>Propose content model</button>
          </>
        )}
      </main>
    </div>
  )
}
