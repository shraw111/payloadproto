'use client'
import React, { useState } from 'react'

type Summary = {
  bullets: string[]
  preflight: { critical: number; warnings: number }
  activity: { id: string | number; label: string; who: string; createdAt: string }[]
}

export default function ReviewItem({ id, title, slug }: { id: string | number; title: string; slug: string }) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function load() {
    setBusy(true)
    const res = await fetch('/api/ai/change-summary', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) })
    setSummary(await res.json())
    setBusy(false)
  }
  async function approve() {
    setBusy(true)
    await fetch('/api/ai/approve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) })
    setDone(true)
    setBusy(false)
    window.open(`/${slug}`, '_blank')
  }

  return (
    <div style={{ border: '1px solid var(--theme-elevation-150)', borderTop: '3px solid #0F6B5C', borderRadius: 6, padding: 20, marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>{title} <small>/{slug}</small></h3>
      {!summary && <button className="btn btn--style-primary btn--size-medium" onClick={load} disabled={busy}>{busy ? 'Summarising…' : 'Open for review'}</button>}
      {summary && (
        <>
          <h4>What changed</h4>
          <ul>{summary.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
          <h4>Pre-flight</h4>
          <p>{summary.preflight.critical === 0 ? '✓ Clean. No unapproved claims.' : `${summary.preflight.critical} issues need fixing.`}{summary.preflight.warnings ? ` ${summary.preflight.warnings} suggestions.` : ''}</p>
          <h4>Audit trail</h4>
          <ul>{summary.activity.map((a) => <li key={a.id}>{a.label} · {a.who} · {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</li>)}</ul>
          {done ? <p>✓ Approved and published.</p> : <button className="btn btn--style-primary btn--size-medium" onClick={approve} disabled={busy || summary.preflight.critical > 0}>Approve and publish</button>}
        </>
      )}
    </div>
  )
}
