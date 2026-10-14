import React from 'react'

/* First-draft renderers. The designer polishes these until the page matches the .fig frame. */
const wrap: React.CSSProperties = { maxWidth: 1040, margin: '0 auto', padding: '56px 24px' }
const btn: React.CSSProperties = { display: 'inline-block', background: 'var(--teal)', color: '#fff', padding: '12px 24px', borderRadius: 999, textDecoration: 'none', fontWeight: 600 }

export const blockComponents: Record<string, (p: any) => React.ReactElement> = {
  hero: (b) => (
    <section style={{ background: 'var(--teal-tint)' }}>
      <div style={{ ...wrap, padding: '96px 24px' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 56, margin: 0, maxWidth: 640 }}>{b.headline}</h1>
        {b.subheadline && <p style={{ fontSize: 22, maxWidth: 560 }}>{b.subheadline}</p>}
        {b.ctaLabel && <a style={btn} href={b.ctaLink || '#'}>{b.ctaLabel}</a>}
      </div>
    </section>
  ),
  productHighlight: (b) => (
    <section style={wrap}>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 36 }}>{b.productName}</h2>
      <p style={{ fontSize: 20, maxWidth: 640 }}>{b.body}</p>
    </section>
  ),
  featureGrid: (b) => (
    <section style={wrap}>
      {b.heading && <h2 style={{ fontFamily: 'var(--serif)', fontSize: 32 }}>{b.heading}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
        {(b.items ?? []).map((it: any, i: number) => (
          <div key={i} style={{ background: 'var(--saffron-tint)', borderRadius: 16, padding: 24 }}>
            {it.title && <h3 style={{ marginTop: 0 }}>{it.title}</h3>}
            <p style={{ margin: 0 }}>{it.text ?? it.title}</p>
          </div>
        ))}
      </div>
    </section>
  ),
  offerBanner: (b) => (
    <section style={{ background: 'var(--saffron)' }}>
      <div style={{ ...wrap, padding: '40px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 40, margin: 0 }}>{b.offerText}</h2>
        {b.terms && <p>{b.terms}</p>}
        {b.ctaLabel && <a style={btn} href={b.ctaLink || '#'}>{b.ctaLabel}</a>}
      </div>
    </section>
  ),
  testimonial: (b) => (
    <section style={wrap}>
      <blockquote style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: b.layout === 'quote' ? 32 : 24, ...(b.layout === 'card' ? { background: '#fff', borderRadius: 16, padding: 32 } : {}) }}>
        “{b.quote}”
        <footer style={{ fontFamily: 'var(--sans)', fontSize: 16, marginTop: 12 }}>{[b.name, b.role].filter(Boolean).join(', ')}</footer>
      </blockquote>
    </section>
  ),
  faq: (b) => (
    <section style={wrap}>
      {b.heading && <h2 style={{ fontFamily: 'var(--serif)', fontSize: 32 }}>{b.heading}</h2>}
      {(b.items ?? []).map((it: any, i: number) => (
        <details key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--teal-tint)' }}>
          <summary style={{ fontWeight: 600, cursor: 'pointer' }}>{it.question}</summary>
          <p>{it.answer}</p>
        </details>
      ))}
    </section>
  ),
  cta: (b) => (
    <section style={{ background: 'var(--teal)', color: '#fff' }}>
      <div style={{ ...wrap, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 40, margin: '0 0 16px' }}>{b.heading}</h2>
        {b.buttonLabel && <a style={{ ...btn, background: 'var(--saffron)', color: 'var(--ink)' }} href={b.buttonLink || '#'}>{b.buttonLabel}</a>}
      </div>
    </section>
  ),
}
