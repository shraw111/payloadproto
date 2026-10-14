'use client'
import { useDocumentInfo } from '@payloadcms/ui'
import React, { useEffect, useRef, useState } from 'react'

type Finding = { type: string; severity: 'critical' | 'warning'; path: string; quote: string; message: string; fix: { replacement: string; claimId?: string } | null }
type Result = { findings: Finding[]; critical: number; submitted: boolean }

const post = (body: object) =>
  fetch('/api/ai/preflight', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json())

const KEY = 'preflight-resume'

/**
 * Applying a fix or submitting rewrites the draft on the server, so the page reloads to show it
 * and the panel picks the result back up from sessionStorage: one click, no manual reload.
 */
export default function PreflightPanel() {
  const { id } = useDocumentInfo()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const resumed = useRef(false)

  useEffect(() => {
    if (!id || resumed.current) return
    resumed.current = true
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null')
      if (saved && String(saved.id) === String(id)) {
        sessionStorage.removeItem(KEY)
        setResult(saved.result)
        setNote(saved.note)
      }
    } catch {}
  }, [id])

  if (!id) return <p>Save the draft first, then run the pre-flight check.</p>

  function reloadWith(r: Result, n: string | null) {
    try { sessionStorage.setItem(KEY, JSON.stringify({ id, result: r, note: n })) } catch {}
    window.location.reload()
  }

  async function submit() {
    setBusy(true); setNote(null)
    const r: Result = await post({ id, action: 'submit' })
    if (r.submitted) reloadWith(r, 'Clean. Submitted for review.')
    else { setResult(r); setBusy(false) }
  }
  async function fix(finding: Finding) {
    setBusy(true)
    await post({ id, action: 'apply', finding })
    const r: Result = await post({ id, action: 'check' })
    reloadWith(r, 'Fix applied. Check again, or submit for review.')
  }

  return (
    <div style={{ border: '1px solid var(--theme-elevation-150)', borderTop: '3px solid #0F6B5C', borderRadius: 6, padding: 14 }}>
      <div style={{ font: '500 11px/1 ui-monospace, monospace', letterSpacing: '.1em', textTransform: 'uppercase', color: '#0F6B5C' }}>Pre-flight</div>
      <p style={{ margin: '8px 0 12px' }}>Checks this draft against approved claims and brand rules. Save your edits first.</p>
      <button type="button" className="btn btn--style-primary btn--size-small" onClick={submit} disabled={busy}>
        {busy ? 'Checking…' : 'Check and submit for review'}
      </button>
      {note && <p style={{ color: '#0F6B5C', marginTop: 12 }}>✓ {note}</p>}
      {result && (
        <div style={{ marginTop: 12 }}>
          {result.findings.length === 0 && <p>No findings.</p>}
          {result.findings.map((f, i) => (
            <div key={i} style={{ borderLeft: `4px solid ${f.severity === 'critical' ? '#c0392b' : '#F2B84B'}`, padding: '4px 10px', margin: '0 0 10px' }}>
              <div><strong>{f.severity === 'critical' ? 'Must fix' : 'Suggestion'}</strong>: {f.message}</div>
              {f.quote && <div style={{ fontStyle: 'italic', opacity: 0.8 }}>“{f.quote}”</div>}
              {f.fix && (
                <button type="button" className="btn btn--style-secondary btn--size-small" style={{ marginTop: 6 }} onClick={() => fix(f)} disabled={busy}>
                  Use approved wording{f.fix.claimId ? ` (${f.fix.claimId})` : ''}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
