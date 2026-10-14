'use client'
import React, { useState } from 'react'

type Change = { pageId: string | number; pageTitle: string; path: string; before: string; after: string }

const box: React.CSSProperties = { border: '1px solid var(--theme-elevation-150)', borderRadius: 8, padding: 16, marginBottom: 16 }

export default function AssistantPanel() {
  const [busy, setBusy] = useState<string | null>(null)
  const [instruction, setInstruction] = useState('Change the offer to 20% off your first order on every page')
  const [changes, setChanges] = useState<(Change & { on: boolean })[] | null>(null)

  async function fromBrief(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy('Reading the brief and drafting the page…')
    const fd = new FormData()
    fd.append('brief', file)
    const res = await fetch('/api/ai/brief-to-draft', { method: 'POST', body: fd })
    const json = await res.json()
    setBusy(null)
    if (json.id) window.location.href = `/admin/collections/pages/${json.id}`
  }

  async function propose() {
    setBusy('Finding every place this applies…')
    const res = await fetch('/api/ai/edit-everywhere', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ instruction }) })
    const json = await res.json()
    setChanges((json.changes as Change[]).map((c) => ({ ...c, on: true })))
    setBusy(null)
  }

  async function apply() {
    setBusy('Saving as drafts…')
    await fetch('/api/ai/edit-everywhere', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'apply', instruction, changes: changes!.filter((c) => c.on) }),
    })
    setChanges(null)
    setBusy(null)
    window.location.href = '/admin/collections/pages'
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Create from brief</h3>
        <p>Upload a campaign brief (.docx). You get a draft page made only from approved page sections.</p>
        <input type="file" accept=".docx" onChange={fromBrief} disabled={!!busy} />
      </div>
      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Update content</h3>
        <input style={{ width: '100%', padding: 8 }} value={instruction} onChange={(e) => setInstruction(e.target.value)} />
        <button className="btn btn--style-primary btn--size-medium" style={{ marginTop: 8 }} onClick={propose} disabled={!!busy}>Show changes</button>
        {changes && (
          <div style={{ marginTop: 16 }}>
            {changes.length === 0 && <p>Nothing to change.</p>}
            {changes.map((c, i) => (
              <label key={i} style={{ display: 'block', marginBottom: 12 }}>
                <input type="checkbox" checked={c.on} onChange={() => setChanges(changes.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))} />{' '}
                <strong>{c.pageTitle}</strong> <code>{c.path}</code>
                <div style={{ background: '#fde8e8', padding: '2px 8px', marginTop: 4 }}>− {c.before}</div>
                <div style={{ background: '#e3f6e8', padding: '2px 8px' }}>+ {c.after}</div>
              </label>
            ))}
            {changes.length > 0 && <button className="btn btn--style-primary btn--size-medium" onClick={apply} disabled={!!busy}>Accept selected as drafts</button>}
          </div>
        )}
      </div>
      {busy && <p aria-live="polite">{busy}</p>}
    </div>
  )
}
