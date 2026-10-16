'use client'
import React, { useState } from 'react'

type Outcome = 'cleared' | 'held' | 'blocked'
const cases: { tab: string; text: string; outcome: Outcome; headline: string; checks: { ok: boolean; line: string }[]; fix?: string }[] = [
  {
    tab: 'Weekend sale',
    text: 'Weekend sale: £1,500 off every Ariya. Ends Sunday 6pm.',
    outcome: 'cleared',
    headline: 'Published. Nobody had to look.',
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
    headline: 'Sent to HQ. The dealer keeps working.',
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
    headline: 'Blocked before it went live.',
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
        <div className="fd-ticket__label">Dealer wrote</div>
        <p className="fd-ticket__text">{c.text}</p>
        <div className="fd-ticket__label">Pre-flight</div>
        <ul className="fd-checks">
          {c.checks.map((k) => (
            <li key={k.line} data-ok={k.ok}><span aria-hidden>{k.ok ? '✓' : '✕'}</span>{k.line}</li>
          ))}
        </ul>
        {c.fix && <p className="fd-fix">{c.fix}</p>}
        <div className="fd-stamp" aria-live="polite"><span>{stamp[c.outcome]}</span></div>
        <p className="fd-ticket__headline">{c.headline}</p>
      </div>
      <p className="fd-ticket__note">Example pages. The real gate runs these rules on every publish.</p>
    </div>
  )
}
