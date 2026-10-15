'use client'
import React, { useEffect, useState } from 'react'

import { BRAND, card, eyebrow } from './ui'

type S = { published: number; blocked: number; waiting: number; expired: number }

/** HQ at a glance. Most pages publish on their own; only the exceptions need a person. */
export default function HqSummary({ showLink = true }: { showLink?: boolean }) {
  const [s, setS] = useState<S | null>(null)
  useEffect(() => { fetch('/api/hq/summary').then((r) => r.json()).then(setS).catch(() => {}) }, [])
  const tile = (n: number | string, label: string, hot = false) => (
    <div key={label} style={{ flex: 1, minWidth: 120 }}>
      <div style={{ font: '800 40px/1 var(--font-body, system-ui)', color: hot && Number(n) > 0 ? BRAND : 'inherit' }}>{n}</div>
      <div style={{ opacity: 0.75 }}>{label}</div>
    </div>
  )
  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <div style={eyebrow}>Network</div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', margin: '12px 0' }}>
        {tile(s?.published ?? '–', 'live offer pages')}
        {tile(s?.waiting ?? '–', 'waiting for HQ', true)}
        {tile(s?.blocked ?? '–', 'blocked, dealer fixing', true)}
        {tile(s?.expired ?? '–', 'ended')}
      </div>
      {showLink && <a href="/admin/review">Open exceptions →</a>}
    </div>
  )
}
