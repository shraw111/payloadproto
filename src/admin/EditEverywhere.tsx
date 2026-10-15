'use client'
import React, { useState } from 'react'

import { card, eyebrow, input, post } from './ui'

type Change = { pageId: string | number; pageTitle: string; path: string; before: string; after: string }

/** "Change X on every page" as a diff. After accepting, the pages can be published in one go (each still goes through the gate). */
export default function EditEverywhere({ defaultInstruction, scope }: { defaultInstruction: string; scope: string }) {
  const [instruction, setInstruction] = useState(defaultInstruction)
  const [busy, setBusy] = useState<string | null>(null)
  const [changes, setChanges] = useState<(Change & { on: boolean })[] | null>(null)
  const [saved, setSaved] = useState<{ ids: (string | number)[]; titles: Record<string, string> } | null>(null)
  const [published, setPublished] = useState<{ title: string; result: string }[] | null>(null)

  async function propose() {
    setBusy('Finding every place this applies…'); setSaved(null); setPublished(null)
    const json = await post('/api/ai/edit-everywhere', { instruction })
    setChanges((json.changes as Change[]).map((c) => ({ ...c, on: true })))
    setBusy(null)
  }
  async function apply() {
    setBusy('Saving as drafts…')
    const accepted = changes!.filter((c) => c.on)
    const json = await post('/api/ai/edit-everywhere', { action: 'apply', instruction, changes: accepted })
    setSaved({ ids: json.ids, titles: Object.fromEntries(accepted.map((c) => [String(c.pageId), c.pageTitle])) })
    setChanges(null); setBusy(null)
  }
  async function publishAll() {
    setBusy('Checking and publishing…')
    const out: { title: string; result: string }[] = []
    for (const id of saved!.ids) {
      const r = await post('/api/dealer/publish', { id })
      out.push({ title: saved!.titles[String(id)] ?? `Page ${id}`, result: r.result })
    }
    setPublished(out); setBusy(null)
  }

  const pages = changes ? [...new Set(changes.map((c) => c.pageTitle))] : []
  const label: Record<string, string> = { published: '✓ Published', scheduled: '✓ Scheduled', blocked: '✕ Blocked: open the page to fix', 'sent-to-hq': '… Sent to HQ for review' }

  return (
    <div style={card}>
      <div style={eyebrow}>Edit</div>
      <h3 style={{ margin: '8px 0' }}>Change something on {scope}</h3>
      <input style={{ ...input, marginBottom: 12 }} value={instruction} onChange={(e) => setInstruction(e.target.value)} aria-label="Instruction" />
      <button type="button" className="btn btn--style-primary btn--size-medium" onClick={propose} disabled={!!busy}>Show changes</button>
      {busy && <p aria-live="polite">{busy}</p>}
      {changes && (
        <div style={{ marginTop: 16 }}>
          <strong>{changes.length ? `${changes.length} changes across ${pages.length} pages` : 'Nothing to change'}</strong>
          {changes.map((c, i) => (
            <label key={i} style={{ display: 'block', margin: '12px 0' }}>
              <input type="checkbox" checked={c.on} onChange={() => setChanges(changes.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))} />{' '}
              <strong>{c.pageTitle}</strong> <code>{c.path}</code>
              <div style={{ background: '#fde8e8', padding: '2px 8px', marginTop: 4 }}>− {c.before}</div>
              <div style={{ background: '#e3f6e8', padding: '2px 8px' }}>+ {c.after}</div>
            </label>
          ))}
          {changes.length > 0 && <button type="button" className="btn btn--style-primary btn--size-medium" onClick={apply} disabled={!!busy}>Accept selected as drafts</button>}
        </div>
      )}
      {saved && !published && (
        <div style={{ marginTop: 16 }}>
          <p>✓ Saved {saved.ids.length} pages as drafts. Nothing has changed on the live pages yet.</p>
          <button type="button" className="btn btn--style-primary btn--size-medium" onClick={publishAll} disabled={!!busy}>Publish these {saved.ids.length} pages</button>
        </div>
      )}
      {published && (
        <ul style={{ marginTop: 16, paddingLeft: 18 }}>
          {published.map((p, i) => <li key={i}><strong>{p.title}</strong>: {label[p.result] ?? p.result}</li>)}
        </ul>
      )}
    </div>
  )
}
