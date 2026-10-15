'use client'
import React, { useState } from 'react'

/** Enquiry form. Needs consent; saves to the dealer who owns the page. */
export default function LeadForm({ pageId, heading, buttonLabel }: { pageId?: string | number; heading?: string; buttonLabel?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState('')
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setState('sending'); setError('')
    const res = await fetch('/api/lead', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pageId, name: f.get('name'), phone: f.get('phone'), email: f.get('email'), consent: f.get('consent') === 'on' }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Something went wrong.'); setState('idle') } else setState('done')
  }
  return (
    <section className="leadform" id="book">
      <div className="wrap leadform__inner">
        <h2 className="display">{heading ?? 'Book a test drive'}</h2>
        {state === 'done' ? (
          <p className="leadform__thanks">Thanks. The dealership will contact you shortly.</p>
        ) : (
          <form onSubmit={submit} noValidate>
            <label>Name<input name="name" autoComplete="name" /></label>
            <label>Phone<input name="phone" type="tel" autoComplete="tel" /></label>
            <label>Email<input name="email" type="email" autoComplete="email" /></label>
            <label className="leadform__consent"><input name="consent" type="checkbox" /> I agree to be contacted about this.</label>
            {error && <p className="leadform__error" role="alert">{error}</p>}
            <button className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : buttonLabel ?? 'Request a call back'}</button>
          </form>
        )}
      </div>
    </section>
  )
}
