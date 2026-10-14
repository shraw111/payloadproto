'use client'
import React, { useRef, useState } from 'react'

type Change = { pageId: string | number; pageTitle: string; path: string; before: string; after: string }

const card: React.CSSProperties = { background: 'var(--theme-bg)', border: '1px solid var(--theme-elevation-150)', borderTop: '3px solid #C3002F', borderRadius: 6, padding: 20 }
const eyebrow: React.CSSProperties = { font: '500 11px/1 ui-monospace, monospace', letterSpacing: '.1em', textTransform: 'uppercase', color: '#C3002F' }

export default function AssistantPanel() {
  const [busy, setBusy] = useState<string | null>(null)
  const [instruction, setInstruction] = useState('Change the offer to £2,500 charging credit on every page')
  const [changes, setChanges] = useState<(Change & { on: boolean })[] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function fromBrief(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy('Reading the brief and drafting the page…')
    const fd = new FormData()
    fd.append('brief', file)
    const json = await (await fetch('/api/ai/brief-to-draft', { method: 'POST', body: fd })).json()
    if (json.id) window.location.href = `/admin/collections/pages/${json.id}`
    else setBusy(null)
  }

  async function propose() {
    setBusy('Finding every place this applies…')
    const json = await (await fetch('/api/ai/edit-everywhere', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ instruction }) })).json()
    setChanges((json.changes as Change[]).map((c) => ({ ...c, on: true })))
    setBusy(null)
  }

  async function apply() {
    setBusy('Saving as drafts…')
    await fetch('/api/ai/edit-everywhere', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'apply', instruction, changes: changes!.filter((c) => c.on) }),
    })
    window.location.href = '/admin/collections/pages'
  }

  const pages = changes ? [...new Set(changes.map((c) => c.pageTitle))] : []

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        <div style={card}>
          <div style={eyebrow}>Create</div>
          <h3 style={{ margin: '8px 0' }}>Start from a brief</h3>
          <p style={{ margin: '0 0 16px' }}>Upload a campaign brief. You get a draft page built only from approved page sections.</p>
          <input ref={fileRef} type="file" accept=".docx" onChange={fromBrief} disabled={!!busy} hidden />
          <button type="button" className="btn btn--style-primary btn--size-medium" onClick={() => fileRef.current?.click()} disabled={!!busy}>Upload brief (.docx)</button>
        </div>
        <div style={card}>
          <div style={eyebrow}>Edit</div>
          <h3 style={{ margin: '8px 0' }}>Update content everywhere</h3>
          <input style={{ width: '100%', padding: '8px 10px', marginBottom: 12 }} value={instruction} onChange={(e) => setInstruction(e.target.value)} aria-label="Instruction" />
          <button type="button" className="btn btn--style-primary btn--size-medium" onClick={propose} disabled={!!busy}>Show changes</button>
        </div>
      </div>
      {busy && <p aria-live="polite" style={{ marginTop: 16 }}>{busy}</p>}
      {changes && (
        <div style={{ ...card, marginTop: 16 }}>
          <div style={eyebrow}>Review</div>
          <h3 style={{ margin: '8px 0 16px' }}>{changes.length ? `${changes.length} changes across ${pages.length} pages` : 'Nothing to change'}</h3>
          {changes.map((c, i) => (
            <label key={i} style={{ display: 'block', marginBottom: 12 }}>
              <input type="checkbox" checked={c.on} onChange={() => setChanges(changes.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))} />{' '}
              <strong>{c.pageTitle}</strong> <code>{c.path}</code>
              <div style={{ background: '#fde8e8', padding: '2px 8px', marginTop: 4 }}>− {c.before}</div>
              <div style={{ background: '#e3f6e8', padding: '2px 8px' }}>+ {c.after}</div>
            </label>
          ))}
          {changes.length > 0 && <button type="button" className="btn btn--style-primary btn--size-medium" onClick={apply} disabled={!!busy}>Accept selected as drafts</button>}
        </div>
      )}
    </div>
  )
}
