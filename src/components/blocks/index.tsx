import React from 'react'

/* Renderers for the demo design. Class names live in app/(frontend)/site.css. */
const HOURS = [0, 6, 12, 18, 24]

export const blockComponents: Record<string, (p: any) => React.ReactElement> = {
  hero: (b) => (
    <section className="hero">
      <div className="wrap hero__inner">
        <span className="hero__24 display" aria-hidden="true">24</span>
        <h1 className="display">{b.headline}</h1>
        {b.subheadline && <p>{b.subheadline}</p>}
        {b.ctaLabel && <a className="btn" href={b.ctaLink || '#'}>{b.ctaLabel}</a>}
        <div className="hero__strip" aria-hidden="true">
          <div className="strip">
            <div className="strip__band" />
            <div className="strip__ticks">{Array.from({ length: 25 }, (_, i) => <i key={i} />)}</div>
          </div>
          <div className="strip__labels">{HOURS.map((h) => <span key={h}>{String(h).padStart(2, '0')}:00</span>)}</div>
        </div>
      </div>
    </section>
  ),
  productHighlight: (b) => (
    <section className="section product">
      <div className="wrap">
        <div className="eyebrow">Product</div>
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
        {b.ctaLabel && <a className="btn" href={b.ctaLink || '#'}>{b.ctaLabel}</a>}
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
        {b.buttonLabel && <a className="btn btn--saffron" href={b.buttonLink || '#'}>{b.buttonLabel}</a>}
      </div>
    </section>
  ),
}
