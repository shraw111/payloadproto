'use client'
import { useDocumentInfo } from '@payloadcms/ui'
import React, { useState } from 'react'

type Finding = { type: string; severity: 'critical' | 'warning'; path: string; quote: string; message: string; fix: { replacement: string; claimId?: string } | null }

const post = (body: object) =>
  fetch('/api/ai/preflight', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json())

export default function PreflightPanel() {
  const { id } = useDocumentInfo()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ findings: Finding[]; critical: number; submitted: boolean } | null>(null)

  if (!id) return <p>Save the draft first, then run the pre-flight check.</p>

  async function run(action: 'check' | 'submit') {
    setBusy(true)
    setResult(await post({ id, action }))
    setBusy(false)
  }
  async function fix(finding: Finding) {
    setBusy(true)
    await post({ id, action: 'apply', finding })
    await run('check')
  }

  return (
    <div style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: 8, padding: 12 }}>
      <strong>Pre-flight check</strong>
      <p style={{ margin: '4px 0 8px' }}>Save your draft, then check it against approved claims and brand rules.</p>
      <button type="button" className="btn btn--style-primary btn--size-small" onClick={() => run('submit')} disabled={busy}>
        {busy ? 'Checking…' : 'Check and submit for review'}
      </button>
      {result && (
        <div style={{ marginTop: 12 }}>
          {result.submitted && <p style={{ color: '#0F6B5C' }}>✓ Clean. Submitted for review. Reload to see the new status.</p>}
          {result.findings.length === 0 && <p>No findings.</p>}
          {result.findings.map((f, i) => (
            <div key={i} style={{ borderLeft: `4px solid ${f.severity === 'critical' ? '#c0392b' : '#F2B84B'}`, padding: '4px 8px', marginBottom: 8 }}>
              <div><strong>{f.severity === 'critical' ? 'Must fix' : 'Suggestion'}</strong> · {f.message}</div>
              {f.quote && <div><em>“{f.quote}”</em></div>}
              {f.fix && (
                <button type="button" className="btn btn--style-secondary btn--size-small" style={{ marginTop: 4 }} onClick={() => fix(f)} disabled={busy}>
                  Use approved wording{f.fix.claimId ? ` (${f.fix.claimId})` : ''}
                </button>
              )}
            </div>
          ))}
          {!result.submitted && result.findings.length > 0 && <p style={{ fontSize: 12 }}>After fixing, reload the page, then run the check again.</p>}
        </div>
      )}
    </div>
  )
}
