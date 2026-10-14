'use client'
import { useRouter } from 'next/navigation'
import React, { useRef, useState } from 'react'

const EXAMPLE = 'A website for a family-run physiotherapy clinic: services, our team, two clinic locations, patient stories, a blog, and a book-an-appointment button on every page.'

/**
 * Screen 1. One prompt box; attach a .fig, screenshots or both. The source decides which stored result loads.
 * Nothing is parsed or generated here: the demo design maps to stored output.
 */
export default function Studio() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [reading, setReading] = useState(false)
  const [frames, setFrames] = useState<string[] | null>(null)

  const source = files.some((f) => f.name.endsWith('.fig')) ? 'fig' : files.some((f) => f.type.startsWith('image/')) ? 'image' : 'prompt'
  const stored = { fig: 'model.json', image: 'image-result.json', prompt: 'prompt-result.json' }[source]
  const canSend = !reading && (text.trim().length > 0 || files.length > 0)

  async function send() {
    setReading(true)
    await new Promise((r) => setTimeout(r, 2200))
    const model = await fetch(`/api/studio/stored?name=${stored}`).then((r) => r.json())
    sessionStorage.setItem('studio-model', JSON.stringify(model))
    sessionStorage.setItem('studio-source', source)
    setReading(false)
    if (source === 'fig') setFrames(['home', 'product', 'campaign'])
    else router.push('/studio/review')
  }

  return (
    <div className="studio">
      <header className="studio__bar"><b>AI Content Studio</b><span className="studio__tag">Prototype · demo design</span></header>
      <main className="studio__body studio__start">
        {!frames ? (
          <>
            <h1>What are we building?</h1>
            <p>Describe the site, or attach a Figma file or screenshots of the design. You review the content model before anything is built.</p>
            <div className="prompt">
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} disabled={reading} aria-label="Describe the site"
                placeholder="Describe the site, or attach a design…"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && canSend) { e.preventDefault(); send() } }} />
              {files.length > 0 && (
                <ul className="prompt__files">
                  {files.map((f) => (
                    <li key={f.name}>
                      <span>{f.name.endsWith('.fig') ? 'FIG' : 'IMG'}</span>{f.name}
                      <button aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((x) => x !== f))}>×</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="prompt__row">
                <input ref={fileRef} type="file" multiple hidden accept=".fig,image/*" onChange={(e) => { setFiles([...files, ...Array.from(e.target.files ?? [])]); e.target.value = '' }} />
                <button className="prompt__attach" onClick={() => fileRef.current?.click()} disabled={reading}>＋ Attach .fig or images</button>
                <button className="mbtn" onClick={send} disabled={!canSend}>{reading ? 'Reading…' : 'Propose content model'}</button>
              </div>
            </div>
            {!files.length && !text && (
              <button className="prompt__hint" onClick={() => setText(EXAMPLE)}>Try: {EXAMPLE.slice(0, 64)}…</button>
            )}
          </>
        ) : (
          <>
            <p className="eyebrow">3 frames found in the Figma file</p>
            <div className="frames">
              {frames.map((f) => (
                <figure key={f}>
                  <img src={`/api/studio/stored?name=thumbnails/${f}.svg`} alt={`${f} frame`} width={220} />
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
