'use client'
import React, { useState } from 'react'

type Outcome = 'cleared' | 'held' | 'blocked'
const cases: { tab: string; text: string; outcome: Outcome; headline: string; checks: { ok: boolean; line: string }[]; fix?: string }[] = [
  {
    tab: 'Weekend sale',
    text: 'Weekend sale: £1,500 off every Ariya. Ends Sunday 6pm.',
    outcome: 'cleared',
    headline: 'Published without review.',
    checks: [
      { ok: true, line: 'Only approved claims used' },
      { ok: true, line: '£1,500 is under the £2,000 dealer limit' },
      { ok: true, line: 'End date set' },
      { ok: true, line: 'Standard terms added' },
    ],
  },
  {
    tab: 'Finance deal',
    text: '£2,500 off plus 0% finance on every Ariya this month.',
    outcome: 'held',
    headline: 'Sent to HQ for a decision.',
    checks: [
      { ok: false, line: '£2,500 is over the £2,000 dealer limit' },
      { ok: false, line: 'Finance wording needs HQ review' },
      { ok: true, line: 'End date set' },
      { ok: true, line: 'Standard terms added' },
    ],
  },
  {
    tab: 'Big claim',
    text: 'The Ariya goes further than any other electric SUV.',
    outcome: 'blocked',
    headline: 'Stopped before it went live.',
    checks: [
      { ok: false, line: 'Comparisons are not approved claims' },
      { ok: true, line: 'No banned words' },
    ],
    fix: 'Swap in: “up to 329 miles of range (WLTP, 87kWh Advance)”',
  },
]
const stamp: Record<Outcome, string> = { cleared: 'Cleared', held: 'Held for HQ', blocked: 'Blocked' }

export default function GateTicket() {
  const [i, setI] = useState(0)
  const c = cases[i]
  return (
    <div className="fd-ticket" data-outcome={c.outcome}>
      <div role="tablist" aria-label="Example pages" className="fd-tabs">
        {cases.map((x, n) => (
          <button key={x.tab} role="tab" aria-selected={n === i} onClick={() => setI(n)} className="fd-tab">{x.tab}</button>
        ))}
      </div>
      <div className="fd-ticket__body" key={i}>
        <div className="fd-ticket__label">Submitted by dealer</div>
        <p className="fd-ticket__text">{c.text}</p>
        <div className="fd-ticket__label">Pre-flight checks</div>
        <ul className="fd-checks">
          {c.checks.map((k) => (
            <li key={k.line} data-ok={k.ok}><span aria-hidden>{k.ok ? '✓' : '✕'}</span>{k.line}</li>
          ))}
        </ul>
        {c.fix && <p className="fd-fix">{c.fix}</p>}
        <div className="fd-verdict" aria-live="polite"><i aria-hidden /><b>{stamp[c.outcome]}</b><span>{c.headline}</span></div>
      </div>
      <p className="fd-ticket__note">Example pages. The real gate runs these rules on every publish.</p>
    </div>
  )
}
