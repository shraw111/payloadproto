'use client'
import React, { useEffect, useState } from 'react'

import EditEverywhere from './EditEverywhere'
import { BRAND, card, eyebrow, input, post } from './ui'

type Sugg = { templateId: string; name: string; bestFor: string; reason: string }
type Extracted = { amount?: number | null; endsAt?: string | null; models?: string | null; extra?: string | null; title?: string | null; location?: string | null; eventAt?: string | null }
type Kit = { id: string; name: string; summary: string }
type TypeInfo = { id: string; name: string; description: string }
type Res = { type: string; confidence: string; types: TypeInfo[]; suggestions: Sugg[]; extracted: Extracted; dealerAddress?: string | null }

const toLocal = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')
const EXAMPLES = [
  'Weekend offer: £1,000 off the Ariya until Sunday.',
  'Free winter health check for the next two weeks.',
  'Open day this Saturday, 10 to 4, at our showroom.',
]

/** A live, scaled-down render of the template. It is the real page, so what the dealer picks is what publishes. */
function Preview({ src }: { src: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.27)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1280))
    ro.observe(el); setScale(el.clientWidth / 1280)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ width: '100%', height: 300, overflow: 'hidden', border: '1px solid var(--theme-elevation-150)', borderRadius: 6, background: '#fff' }}>
      <iframe src={src} title="Template preview" style={{ width: 1280, height: 300 / scale, border: 0, transform: `scale(${scale})`, transformOrigin: '0 0', pointerEvents: 'none' }} />
    </div>
  )
}

export default function DealerStart() {
  const [dealer, setDealer] = useState<{ name: string; slug: string; domain?: string } | null>(null)
  const [kits, setKits] = useState<Kit[]>([])
  const [stats, setStats] = useState<{ live: number; leads: number; drafts: number } | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [res, setRes] = useState<Res | null>(null)
  const [chosen, setChosen] = useState<Sugg | null>(null)
  const [f, setF] = useState({ amount: '', ends: '', models: '', extra: '', title: '', location: '', eventAt: '' })

  useEffect(() => {
    fetch('/api/dealer/suggest').then((r) => r.json()).then((j) => { setDealer(j.dealer); setKits(j.kits ?? []) })
    fetch('/api/dealer/stats').then((r) => r.json()).then(setStats).catch(() => {})
  }, [])

  async function find(type?: string) {
    setBusy(type ? 'Finding designs for that type…' : 'Working out what you want to publish…')
    const j = await post('/api/dealer/suggest', { text, type })
    setRes(j); setChosen(null)
    const e: Extracted = j.extracted ?? {}
    setF({ amount: e.amount === 0 ? '0' : e.amount ? String(e.amount) : '', ends: toLocal(e.endsAt), models: e.models ?? '', extra: e.extra ?? '', title: e.title ?? '', location: e.location ?? j.dealerAddress ?? '', eventAt: toLocal(e.eventAt) })
    setBusy(null)
  }
  async function create(body: object) {
    setBusy('Creating your page…')
    const j = await post('/api/dealer/create', body)
    if (j.id) window.location.href = `/admin/collections/pages/${j.id}`
    else { setBusy(null); alert(j.error ?? 'Could not create the page.') }
  }

  const type = res?.type ?? 'offer'
  const e = res?.extracted ?? {}
  const qs = new URLSearchParams({
    dealer: dealer?.slug ?? '',
    ...(e.amount !== undefined && e.amount !== null ? { amount: String(e.amount) } : {}),
    ...(e.endsAt ? { ends: e.endsAt } : {}), ...(e.eventAt ? { event: e.eventAt } : {}), ...(e.models ? { models: e.models } : {}),
    ...(e.extra ? { extra: e.extra } : {}), ...(e.title ? { title: e.title } : {}), ...(e.location ? { location: e.location } : {}),
  }).toString()
  const need = (v: string) => (v !== '' ? undefined : '2px solid #F2B84B')
  const ready = type === 'offer' ? f.amount !== '' && f.ends : type === 'service-special' ? f.title && f.amount !== '' && f.ends : f.title && f.eventAt && f.ends
  const understood = [
    e.title && `“${e.title}”`, e.amount === 0 ? 'free' : e.amount ? `£${e.amount.toLocaleString('en-GB')}` : null, e.models,
    e.eventAt && `starts ${new Date(e.eventAt).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`,
    e.endsAt && `ends ${new Date(e.endsAt).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`,
  ].filter(Boolean).join(' · ')

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={eyebrow}>{dealer?.name ?? 'Your dealership'}</div>
        <h2 style={{ margin: '8px 0 4px', fontSize: 28 }}>What do you want to publish?</h2>
        <p style={{ margin: '0 0 12px' }}>Say it in your own words. We’ll work out what it is and suggest page designs you can publish in a few minutes.</p>
        <textarea style={{ ...input, minHeight: 84 }} value={text} onChange={(ev) => setText(ev.target.value)} aria-label="Describe what you want to publish"
          placeholder="An offer, a service special, an event… just tell us." />
        <div style={{ margin: '10px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EXAMPLES.map((x) => <button key={x} type="button" className="btn btn--style-secondary btn--size-small" onClick={() => setText(x)}>{x}</button>)}
        </div>
        <button type="button" className="btn btn--style-primary btn--size-medium" onClick={() => find()} disabled={!!busy || !text.trim()}>Find page designs</button>
        {stats && <p style={{ margin: '16px 0 0', opacity: 0.75 }}>{stats.live} pages live · {stats.leads} enquiries · {stats.drafts} drafts</p>}
      </div>

      {busy && <p aria-live="polite">{busy}</p>}

      {res && (
        <div style={{ ...card, marginBottom: 16, padding: 16 }}>
          <div style={eyebrow}>Here’s what we understood</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0' }} role="group" aria-label="Content type">
            {res.types.map((t) => (
              <button key={t.id} type="button" title={t.description}
                className={`btn btn--size-small ${t.id === res.type ? 'btn--style-primary' : 'btn--style-secondary'}`}
                onClick={() => t.id !== res.type && find(t.id)} disabled={!!busy}>{t.name}</button>
            ))}
          </div>
          {res.type === 'other'
            ? <p style={{ margin: 0 }}>We couldn’t tell what this is. Choose a type above, or ask HQ if it isn’t something dealers can publish yet.</p>
            : <p style={{ margin: 0 }}>{res.types.find((t) => t.id === res.type)?.description}.{understood && <> We found: <strong>{understood}</strong>.</>} Not right? Pick another type above.</p>}
        </div>
      )}

      {res && res.suggestions.length > 0 && !chosen && (
        <div style={{ marginBottom: 16 }}>
          <div style={eyebrow}>Pick a design</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginTop: 10 }}>
            {res.suggestions.map((s, i) => (
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
            {type === 'offer' && <>
              <label>Discount (£)<input style={{ ...input, outline: need(f.amount) }} type="number" value={f.amount} onChange={(ev) => setF({ ...f, amount: ev.target.value })} /></label>
              <label>Offer ends<input style={{ ...input, outline: need(f.ends) }} type="datetime-local" value={f.ends} onChange={(ev) => setF({ ...f, ends: ev.target.value })} /></label>
              <label>Model<input style={{ ...input, outline: need(f.models) }} value={f.models} onChange={(ev) => setF({ ...f, models: ev.target.value })} placeholder="Nissan Ariya" /></label>
            </>}
            {type === 'service-special' && <>
              <label>Service<input style={{ ...input, outline: need(f.title) }} value={f.title} onChange={(ev) => setF({ ...f, title: ev.target.value })} /></label>
              <label>Price (£, 0 if free)<input style={{ ...input, outline: need(f.amount) }} type="number" value={f.amount} onChange={(ev) => setF({ ...f, amount: ev.target.value })} /></label>
              <label>Offer ends<input style={{ ...input, outline: need(f.ends) }} type="datetime-local" value={f.ends} onChange={(ev) => setF({ ...f, ends: ev.target.value })} /></label>
            </>}
            {type === 'event' && <>
              <label>Event<input style={{ ...input, outline: need(f.title) }} value={f.title} onChange={(ev) => setF({ ...f, title: ev.target.value })} /></label>
              <label>Starts<input style={{ ...input, outline: need(f.eventAt) }} type="datetime-local" value={f.eventAt} onChange={(ev) => setF({ ...f, eventAt: ev.target.value })} /></label>
              <label>Ends<input style={{ ...input, outline: need(f.ends) }} type="datetime-local" value={f.ends} onChange={(ev) => setF({ ...f, ends: ev.target.value })} /></label>
              <label>Where<input style={input} value={f.location} onChange={(ev) => setF({ ...f, location: ev.target.value })} /></label>
            </>}
          </div>
          <label style={{ display: 'block', marginTop: 12 }}>Anything else you want to say
            <textarea style={{ ...input, minHeight: 60 }} value={f.extra} onChange={(ev) => setF({ ...f, extra: ev.target.value })} />
          </label>
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn--style-primary btn--size-medium" disabled={!!busy || !ready}
              onClick={() => create({ templateId: chosen.templateId, fields: {
                kind: type, amount: f.amount, endsAt: f.ends ? new Date(f.ends).toISOString() : undefined, eventAt: f.eventAt ? new Date(f.eventAt).toISOString() : undefined,
                models: f.models, extra: f.extra, title: f.title, location: f.location } })}>Create my page</button>
            <button type="button" className="btn btn--style-secondary btn--size-medium" onClick={() => setChosen(null)}>Back to designs</button>
          </div>
        </div>
      )}

      {!res && kits.length > 0 && (
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
