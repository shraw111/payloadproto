'use client'
import React, { useEffect, useState } from 'react'

/** Live countdown to the offer's end date. Renders nothing until mounted so server and browser never disagree. */
export default function Countdown({ endsAt, label }: { endsAt?: string; label?: string }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!endsAt) return null
  const left = now === null ? null : Math.max(0, new Date(endsAt).getTime() - now)
  const parts = left === null ? null : [
    ['days', Math.floor(left / 86400000)], ['hours', Math.floor(left / 3600000) % 24], ['minutes', Math.floor(left / 60000) % 60], ['seconds', Math.floor(left / 1000) % 60],
  ] as const
  return (
    <section className="countdown" aria-live="off">
      <div className="wrap">
        <div className="eyebrow">{label ?? 'Offer ends in'}</div>
        <div className="countdown__row">
          {(parts ?? [['days', '–'], ['hours', '–'], ['minutes', '–'], ['seconds', '–']] as const).map(([k, v]) => (
            <div key={k}><b>{String(v).padStart(2, '0')}</b><span>{k}</span></div>
          ))}
        </div>
      </div>
    </section>
  )
}
