import React from 'react'

import Countdown from './Countdown'
import LeadForm from './LeadForm'

/* Renderers for the demo design. Class names live in app/(frontend)/site.css. */
const BRAND_WORD = 'ARIYA' // vehicle name set in the hero; part of the demo design
const LEVELS = ['0%', '25%', '50%', '75%', '100%'] // charge gauge, decorative: no range or time is claimed

/** ctx carries the page the block sits on, for blocks that need its id or offer dates. */
export const blockComponents: Record<string, (p: any, ctx?: { page?: any }) => React.ReactElement> = {
  hero: (b, ctx) => {
    // The outlined model name and charge gauge belong to car offers only; services and events get a plain hero.
    const kind = ctx?.page?.offer?.kind ?? 'offer'
    const word = kind === 'offer' ? String(ctx?.page?.offer?.models ?? 'Nissan Ariya').split(' ').pop()!.toUpperCase() : null
    return (
      <section className="hero">
        <div className="wrap hero__inner">
          {word && <span className="hero__24 display" aria-hidden="true">{word}</span>}
          <h1 className="display">{b.headline}</h1>
          {b.subheadline && <p>{b.subheadline}</p>}
          {b.ctaLabel && <a className="btn" href={b.ctaLink || '#'}>{b.ctaLabel}</a>}
          {word ? (
            <div className="hero__strip" aria-hidden="true">
              <div className="strip">
                <div className="strip__band" />
                <div className="strip__ticks">{Array.from({ length: 21 }, (_, i) => <i key={i} />)}</div>
              </div>
              <div className="strip__labels">{LEVELS.map((h) => <span key={h}>{h}</span>)}</div>
            </div>
          ) : <div style={{ height: 72 }} />}
        </div>
      </section>
    )
  },
  productHighlight: (b) => (
    <section className="section product">
      <div className="wrap">
        <div className="eyebrow">Details</div>
        <h2 className="display" style={{ marginTop: 12 }}>{b.productName}</h2>
        <p>{b.body}</p>
      </div>
    </section>
  ),
  featureGrid: (b) => (
    <section className="section">
      <div className="wrap">
        {b.heading && <h2 className="display">{b.heading}</h2>}
        <div className="features">
          {(b.items ?? []).map((it: any, i: number) => (
            <div key={i}>{it.title && <h3>{it.title}</h3>}{it.text ?? it.title}</div>
          ))}
        </div>
      </div>
    </section>
  ),
  offerBanner: (b) => (
    <section className="offer">
      <div className="wrap">
        <h2 className="display">{b.offerText}</h2>
        {b.terms && <p>{b.terms}</p>}
        {b.ctaLabel && <a className="btn btn--light" href={b.ctaLink || '#'}>{b.ctaLabel}</a>}
      </div>
    </section>
  ),
  testimonial: (b) => (
    <section className={`section quote ${b.layout === 'card' ? 'quote--card' : ''}`}>
      <div className="wrap">
        <blockquote>“{b.quote}”<footer>{[b.name, b.role].filter(Boolean).join(' · ')}</footer></blockquote>
      </div>
    </section>
  ),
  faq: (b) => (
    <section className="section faq">
      <div className="wrap">
        {b.heading && <h2 className="display">{b.heading}</h2>}
        {(b.items ?? []).map((it: any, i: number) => (
          <details key={i}><summary>{it.question}</summary><p>{it.answer}</p></details>
        ))}
      </div>
    </section>
  ),
  cta: (b) => (
    <section className="cta">
      <div className="wrap">
        <h2 className="display">{b.heading}</h2>
        {b.buttonLabel && <a className="btn" href={b.buttonLink || '#'}>{b.buttonLabel}</a>}
      </div>
    </section>
  ),
  countdown: (b, ctx) => <Countdown endsAt={b.target === 'event' ? ctx?.page?.offer?.eventAt : ctx?.page?.offer?.endsAt} label={b.label} />,
  leadForm: (b, ctx) => <LeadForm pageId={ctx?.page?.id} heading={b.heading} buttonLabel={b.buttonLabel} />,
}
