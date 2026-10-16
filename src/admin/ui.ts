import type React from 'react'

/** Shared look for the custom admin panels. Brand red, mono eyebrows, light cards. */
export const BRAND = '#C3002F'
export const card: React.CSSProperties = { background: 'var(--theme-bg)', border: '1px solid var(--theme-elevation-150)', borderTop: '2px solid var(--theme-text)', borderRadius: 2, padding: 20 }
export const eyebrow: React.CSSProperties = { font: '500 11px/1 ui-monospace, monospace', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--theme-elevation-500)' }
export const input: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid var(--theme-elevation-200)', borderRadius: 2, font: 'inherit', background: 'var(--theme-input-bg, #fff)' }

export const post = (url: string, body: object) =>
  fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json())

export const mmss = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`)
