'use client'
import React, { useState } from 'react'

import { BRAND, card, eyebrow, post } from './ui'

type Summary = { bullets: string[]; activity: { id: string | number; label: string; who: string; createdAt: string }[] }

/** One exception. Pages the gate sent to HQ can be approved or sent back; blocked pages are with the dealer. */
export default function ReviewItem({ id, title, dealer, result, reason }: { id: string | number; title: string; dealer: string; result: 'sent-to-hq' | 'blocked'; reason: string }) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  async function open() { setBusy(true); setSummary(await post('/api/ai/change-summary', { id })); setBusy(false) }
  async function decide(action: 'approve' | 'send-back') {
    setBusy(true)
    await post('/api/ai/approve', { id, action, note: action === 'send-back' ? 'Please bring the discount within the dealer limit, or ask HQ for an exception.' : undefined })
    setDone(action === 'approve' ? 'Approved and published.' : 'Sent back to the dealer.')
    setBusy(false)
  }

  return (
    <div style={{ ...card, marginBottom: 12, borderTop: `2px solid ${result === 'blocked' ? BRAND : 'var(--theme-text)'}` }}>
      <div style={eyebrow}>{result === 'blocked' ? 'Blocked · with the dealer' : 'Waiting for HQ'}</div>
      <h3 style={{ margin: '6px 0 2px' }}>{title} <small style={{ opacity: 0.6 }}>· {dealer}</small></h3>
      <p style={{ margin: '0 0 10px' }}>{reason}</p>
      {done ? <p style={{ color: '#1a7f37' }}>✓ {done}</p> : result === 'sent-to-hq' && (
        <>
          {!summary && <button type="button" className="btn btn--style-secondary btn--size-small" onClick={open} disabled={busy}>{busy ? 'Summarising…' : 'See what changed'}</button>}
          {summary && (
            <div style={{ marginBottom: 10 }}>
              <ul>{summary.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
              <div style={{ opacity: 0.7, fontSize: 13 }}>{summary.activity.map((a) => `${a.label} · ${a.who}`).join(' → ')}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn--style-primary btn--size-small" onClick={() => decide('approve')} disabled={busy}>Approve and publish</button>
            <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => decide('send-back')} disabled={busy}>Send back</button>
          </div>
        </>
      )}
    </div>
  )
}
