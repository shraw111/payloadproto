'use client'
import { useDocumentInfo } from '@payloadcms/ui'
import React, { useEffect, useRef, useState } from 'react'

import { BRAND, eyebrow, input, mmss, post } from './ui'

type Finding = { type: string; severity: 'critical' | 'review' | 'warning'; path: string; quote: string; message: string; fix: { replacement: string; claimId?: string } | null }
type Outcome = { result: 'published' | 'scheduled' | 'blocked' | 'sent-to-hq'; findings: Finding[]; reason?: string; liveUrl?: string | null; path?: string; secondsSinceCreated?: number }

const KEY = 'publish-resume'
const colour = { critical: BRAND, review: '#d98f00', warning: '#F2B84B' }

/**
 * One-click publish. The AI never publishes: the dealer clicks, and the pre-flight gate decides whether the click works.
 * Fixing a finding rewrites the draft on the server, so the page reloads and this panel picks up where it left off.
 */
export default function PublishPanel() {
  const { id } = useDocumentInfo()
  const [busy, setBusy] = useState(false)
  const [out, setOut] = useState<Outcome | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [when, setWhen] = useState<'now' | 'later'>('now')
  const [startsAt, setStartsAt] = useState('')
  const resumed = useRef(false)

  useEffect(() => {
    if (!id || resumed.current) return
    resumed.current = true
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null')
      if (saved && String(saved.id) === String(id)) { sessionStorage.removeItem(KEY); setOut(saved.out); setNote(saved.note) }
    } catch {}
  }, [id])

  if (!id) return <p>Save the draft first, then publish.</p>

  async function publish() {
    setBusy(true); setNote(null)
    const r: Outcome = await post('/api/dealer/publish', { id, startsAt: when === 'later' && startsAt ? new Date(startsAt).toISOString() : undefined })
    setOut(r); setBusy(false)
  }
  async function fix(f: Finding) {
    setBusy(true)
    await post('/api/ai/preflight', { id, action: 'apply', finding: f })
    const chk = await post('/api/ai/preflight', { id, action: 'check' })
    try { sessionStorage.setItem(KEY, JSON.stringify({ id, out: { result: 'blocked', findings: chk.findings }, note: 'Fix applied. Publish again when you are ready.' })) } catch {}
    window.location.reload()
  }
  async function undo() {
    setBusy(true)
    await post('/api/dealer/unpublish', { id })
    window.location.reload()
  }

  const done = out?.result === 'published' || out?.result === 'scheduled'
  return (
    <div style={{ border: '1px solid var(--theme-elevation-150)', borderTop: `3px solid ${BRAND}`, borderRadius: 6, padding: 14 }}>
      <div style={eyebrow}>Publish</div>
      {!done && (
        <>
          <p style={{ margin: '8px 0 10px' }}>Pre-flight runs automatically. Clean pages go live. Save your edits first.</p>
          <div style={{ display: 'flex', gap: 8, margin: '0 0 10px', alignItems: 'center' }}>
            <select value={when} onChange={(e) => setWhen(e.target.value as 'now' | 'later')} style={{ ...input, width: 'auto' }} aria-label="When">
              <option value="now">Go live now</option>
              <option value="later">Schedule</option>
            </select>
            {when === 'later' && <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={{ ...input, width: 'auto' }} />}
          </div>
          <button type="button" className="btn btn--style-primary btn--size-medium" onClick={publish} disabled={busy}>{busy ? 'Checking…' : when === 'later' ? 'Schedule' : 'Publish'}</button>
        </>
      )}

      {note && <p style={{ color: BRAND, marginTop: 12 }}>✓ {note}</p>}

      {done && out && (
        <div style={{ marginTop: 10 }}>
          <p style={{ margin: 0, color: '#1a7f37', fontWeight: 600 }}>✓ {out.result === 'scheduled' ? 'Scheduled' : 'Published'}</p>
          {out.secondsSinceCreated != null && <p style={{ margin: '4px 0' }}>{mmss(out.secondsSinceCreated)} from creating this page to live.</p>}
          {out.path && <p style={{ margin: '4px 0' }}>Live at <a href={out.path} target="_blank" rel="noreferrer">{out.liveUrl ?? out.path}</a></p>}
          <button type="button" className="btn btn--style-secondary btn--size-small" onClick={undo} disabled={busy}>Undo (take offline)</button>
        </div>
      )}

      {out?.result === 'sent-to-hq' && (
        <div style={{ borderLeft: `4px solid ${colour.review}`, padding: '4px 10px', marginTop: 12 }}>
          <strong>Sent to HQ for review.</strong>
          <div>{out.reason}</div>
          <div style={{ opacity: 0.7, fontSize: 13 }}>You’ll see it go live once HQ approves.</div>
        </div>
      )}

      {out && !done && out.result !== 'sent-to-hq' && out.findings.length === 0 && <p style={{ marginTop: 12 }}>No findings.</p>}
      {out && !done && out.findings.filter((f) => f.severity !== 'warning' || out.result === 'blocked').map((f, i) => (
        <div key={i} style={{ borderLeft: `4px solid ${colour[f.severity]}`, padding: '4px 10px', margin: '12px 0 0' }}>
          <div><strong>{f.severity === 'critical' ? 'Must fix' : f.severity === 'review' ? 'HQ will review' : 'Suggestion'}</strong>: {f.message}</div>
          {f.quote && <div style={{ fontStyle: 'italic', opacity: 0.8 }}>“{f.quote}”</div>}
          {f.fix && (
            <button type="button" className="btn btn--style-secondary btn--size-small" style={{ marginTop: 6 }} onClick={() => fix(f)} disabled={busy}>
              {f.fix.claimId ? `Use approved wording (${f.fix.claimId})` : 'Add it'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
