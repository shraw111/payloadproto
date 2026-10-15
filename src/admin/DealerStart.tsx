'use client'
import React, { useEffect, useState } from 'react'

import EditEverywhere from './EditEverywhere'
import { BRAND, card, eyebrow, input, post } from './ui'

type Sugg = { templateId: string; name: string; bestFor: string; reason: string }
type Extracted = { amount?: number | null; endsAt?: string | null; models?: string | null; extra?: string | null }
type Kit = { id: string; name: string; summary: string }

const toLocal = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')

/** A live, scaled-down render of the template. It is the real page, so what the dealer picks is what publishes. */
function Preview({ src }: { src: string }) {
  return (
    <div style={{ width: '100%', height: 300, overflow: 'hidden', border: '1px solid var(--theme-elevation-150)', borderRadius: 6, background: '#fff' }}>
      <iframe src={src} title="Template preview" style={{ width: 1280, height: 1130, border: 0, transform: 'scale(0.27)', transformOrigin: '0 0', pointerEvents: 'none' }} />
    </div>
  )
}

export default function DealerStart() {
  const [dealer, setDealer] = useState<{ name: string; slug: string; domain?: string } | null>(null)
  const [kits, setKits] = useState<Kit[]>([])
  const [stats, setStats] = useState<{ live: number; leads: number; drafts: number } | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [sugg, setSugg] = useState<Sugg[] | null>(null)
  const [ex, setEx] = useState<Extracted>({})
  const [chosen, setChosen] = useState<Sugg | null>(null)
  const [f, setF] = useState({ amount: '', ends: '', models: '', extra: '' })

  useEffect(() => {
    fetch('/api/dealer/suggest').then((r) => r.json()).then((j) => { setDealer(j.dealer); setKits(j.kits ?? []) })
    fetch('/api/dealer/stats').then((r) => r.json()).then(setStats).catch(() => {})
  }, [])

  async function find() {
    setBusy('Finding the best page designs for your offer…')
    const j = await post('/api/dealer/suggest', { text })
    setSugg(j.suggestions); setEx(j.extracted ?? {}); setChosen(null)
    setF({ amount: j.extracted?.amount ? String(j.extracted.amount) : '', ends: toLocal(j.extracted?.endsAt), models: j.extracted?.models ?? '', extra: j.extracted?.extra ?? '' })
    setBusy(null)
  }
  async function create(body: object) {
    setBusy('Creating your page…')
    const j = await post('/api/dealer/create', body)
    if (j.id) window.location.href = `/admin/collections/pages/${j.id}`
    else { setBusy(null); alert(j.error ?? 'Could not create the page.') }
  }
  const qs = new URLSearchParams({ dealer: dealer?.slug ?? '', ...(ex.amount ? { amount: String(ex.amount) } : {}), ...(ex.endsAt ? { ends: ex.endsAt } : {}), ...(ex.models ? { models: ex.models } : {}), ...(ex.extra ? { extra: ex.extra } : {}) }).toString()
  const need = (v: string) => (v ? undefined : '2px solid #F2B84B')

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={eyebrow}>{dealer?.name ?? 'Your dealership'}</div>
        <h2 style={{ margin: '8px 0 4px', fontSize: 28 }}>What’s your offer?</h2>
        <p style={{ margin: '0 0 12px' }}>Say it in your own words. We’ll suggest page designs you can publish in a few minutes.</p>
        <textarea style={{ ...input, minHeight: 84 }} value={text} onChange={(e) => setText(e.target.value)} aria-label="Describe your offer"
          placeholder="For example: I have a weekend offer: £1,000 off the Ariya until Sunday." />
        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn btn--style-primary btn--size-medium" onClick={find} disabled={!!busy || !text.trim()}>Find page designs</button>
        </div>
        {stats && <p style={{ margin: '16px 0 0', opacity: 0.75 }}>{stats.live} offer pages live · {stats.leads} enquiries · {stats.drafts} drafts</p>}
      </div>

      {busy && <p aria-live="polite">{busy}</p>}

      {sugg && !chosen && (
        <div style={{ marginBottom: 16 }}>
          <div style={eyebrow}>Pick a design</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginTop: 10 }}>
            {sugg.map((s, i) => (
              <div key={s.templateId} style={{ ...card, borderTop: i === 0 ? `3px solid ${BRAND}` : undefined, padding: 14 }}>
                <Preview src={`/preview/${s.templateId}?${qs}`} />
                <h3 style={{ margin: '12px 0 2px' }}>{s.name}{i === 0 && <span style={{ ...eyebrow, marginLeft: 8 }}>Best fit</span>}</h3>
                <p style={{ margin: '0 0 4px', opacity: 0.8 }}>{s.reason}</p>
                <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.6 }}>Best for: {s.bestFor}</p>
                <button type="button" className="btn btn--style-primary btn--size-small" onClick={() => setChosen(s)}>Use this design</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {chosen && (
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={eyebrow}>{chosen.name}</div>
          <h3 style={{ margin: '8px 0 4px' }}>Fill the gaps</h3>
          <p style={{ margin: '0 0 12px' }}>We only used what you wrote. Amber means we need it from you.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <label>Discount (£)<input style={{ ...input, outline: need(f.amount) }} type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></label>
            <label>Offer ends<input style={{ ...input, outline: need(f.ends) }} type="datetime-local" value={f.ends} onChange={(e) => setF({ ...f, ends: e.target.value })} /></label>
            <label>Model<input style={{ ...input, outline: need(f.models) }} value={f.models} onChange={(e) => setF({ ...f, models: e.target.value })} placeholder="Nissan Ariya" /></label>
          </div>
          <label style={{ display: 'block', marginTop: 12 }}>Anything else you want to say
            <textarea style={{ ...input, minHeight: 60 }} value={f.extra} onChange={(e) => setF({ ...f, extra: e.target.value })} />
          </label>
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn--style-primary btn--size-medium" disabled={!!busy || !f.amount || !f.ends}
              onClick={() => create({ templateId: chosen.templateId, fields: { amount: Number(f.amount), endsAt: new Date(f.ends).toISOString(), models: f.models, extra: f.extra } })}>Create my page</button>
            <button type="button" className="btn btn--style-secondary btn--size-medium" onClick={() => setChosen(null)}>Back to designs</button>
          </div>
        </div>
      )}

      {!sugg && kits.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={eyebrow}>Or start from an HQ campaign</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 10 }}>
            {kits.map((k) => (
              <div key={k.id} style={{ ...card, padding: 14 }}>
                <Preview src={`/preview/${k.id}?dealer=${dealer?.slug ?? ''}`} />
                <h3 style={{ margin: '12px 0 2px' }}>{k.name}</h3>
                <p style={{ margin: '0 0 12px', opacity: 0.8 }}>{k.summary} Already approved: you only add your details.</p>
                <button type="button" className="btn btn--style-primary btn--size-small" disabled={!!busy} onClick={() => create({ kitId: k.id })}>Use this campaign</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <EditEverywhere defaultInstruction="Change the offer to £2,000 charging credit on all my pages" scope="all my pages" />
    </div>
  )
}
