import React from 'react'

export const dynamic = 'force-dynamic'

const links = [
  { href: '/admin', title: 'Open the CMS', note: 'Log in as HQ or as a dealer' },
  { href: '/northgate/home', title: 'Northgate Nissan', note: 'Example dealer page' },
  { href: '/riverside/winter-health-check-free', title: 'Riverside Nissan', note: 'Service special' },
  { href: '/hillcrest/open-day-saturday-5-december', title: 'Hillcrest Nissan', note: 'Event page' },
]

export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: '12vh auto', padding: '0 24px', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontFamily: 'Archivo, sans-serif', fontSize: 40, margin: 0 }}>Dealer page studio</h1>
      <p style={{ color: '#555' }}>Prototype. Dealers publish pages in one click, HQ only sees the exceptions. Content is illustrative.</p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href} style={{ display: 'block', padding: 16, border: '1px solid #ddd', borderRadius: 8, textDecoration: 'none', color: '#111' }}>
              <strong style={{ color: '#C3002F' }}>{l.title}</strong>
              <div style={{ color: '#666', fontSize: 14 }}>{l.note}</div>
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
