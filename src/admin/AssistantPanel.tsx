'use client'
import React, { useRef, useState } from 'react'

import EditEverywhere from './EditEverywhere'
import { card, eyebrow } from './ui'

/** HQ tools: build a page from a campaign brief, or change something across every dealership. */
export default function AssistantPanel() {
  const [busy, setBusy] = useState<string | null>(null)
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 32 }}>
      <div style={card}>
        <div style={eyebrow}>Create</div>
        <h3 style={{ margin: '8px 0' }}>Start from a campaign brief</h3>
        <p style={{ margin: '0 0 16px' }}>Upload a brief. You get a draft page built only from approved page sections.</p>
        <input ref={fileRef} type="file" accept=".docx" onChange={fromBrief} disabled={!!busy} hidden />
        <button type="button" className="btn btn--style-primary btn--size-medium" onClick={() => fileRef.current?.click()} disabled={!!busy}>Upload brief (.docx)</button>
        {busy && <p aria-live="polite">{busy}</p>}
      </div>
      <EditEverywhere defaultInstruction="Change the offer to £2,000 charging credit on every page" scope="every dealership's pages" />
    </div>
  )
}
