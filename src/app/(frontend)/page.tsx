import React from 'react'

import { loadContext } from '@/lib/context'

import GateTicket from './GateTicket'
import './home.css'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dealer page studio', description: 'Dealers publish in one click. HQ only sees the exceptions.' }

async function counts() {
  try {
    const { payload } = await loadContext()
    const pages = (await payload.find({ collection: 'pages', limit: 500, depth: 0, draft: true, pagination: false })).docs as any[]
    const now = Date.now()
    const live = (p: any) => p._status === 'published' && (!p.offer?.endsAt || new Date(p.offer.endsAt).getTime() > now)
    return {
      live: pages.filter(live).length,
      hq: pages.filter((p) => p.gate?.result === 'sent-to-hq').length,
      blocked: pages.filter((p) => p.gate?.result === 'blocked').length,
      expired: pages.filter((p) => p.gate?.result === 'expired' || (p._status === 'published' && !live(p))).length,
    }
  } catch {
    return null
  }
}

const pages = [
  { kind: 'Offer', href: '/northgate/home', title: 'Northgate Nissan', note: 'A weekend sale on the Ariya, with a countdown to the end date.' },
  { kind: 'Service special', href: '/riverside/winter-health-check-free', title: 'Riverside Nissan', note: 'A free winter health check. Price up front, one form to book.' },
  { kind: 'Event', href: '/hillcrest/open-day-saturday-5-december', title: 'Hillcrest Nissan', note: 'An open day with date, place and sign-up.' },
]

export default async function Home() {
  const c = await counts()
  return (
    <div className="fd">
      <div className="fd-wrap">
        <header className="fd-bar">
          <a className="fd-mark" href="/"><i />Dealer page studio</a>
          <a className="fd-login" href="/admin">Log in</a>
        </header>

        <section className="fd-hero">
          <div>
            <h1>One click to publish. HQ sees <em>only what’s wrong.</em></h1>
            <p className="fd-lede">A dealer says what they want to publish. The page is built, checked against the brand rules, and goes live. Only exceptions reach HQ.</p>
            <a className="fd-cta" href="/admin">Open the CMS</a>
          </div>
          <GateTicket />
        </section>

        {c && (
          <section className="fd-states" aria-label="Pages right now">
            <div className="fd-state" data-k="live"><b>{c.live}</b><span>Live</span><small>Published, nobody needed</small></div>
            <div className="fd-state" data-k="hq"><b>{c.hq}</b><span>With HQ</span><small>Waiting for a decision</small></div>
            <div className="fd-state" data-k="blocked"><b>{c.blocked}</b><span>Blocked</span><small>Dealer fixes and retries</small></div>
            <div className="fd-state"><b>{c.expired}</b><span>Expired</span><small>Taken down on the end date</small></div>
          </section>
        )}

        <section className="fd-sec">
          <h2>Three pages, already live</h2>
          <p className="fd-sub">Each was made from one sentence. Content is illustrative.</p>
          <div className="fd-pages">
            {pages.map((p) => (
              <a key={p.href} className="fd-page" href={p.href}>
                <small>{p.kind}</small>
                <strong>{p.title}</strong>
                <span>{p.note}</span>
              </a>
            ))}
          </div>
        </section>

        <footer className="fd-foot">Prototype. Dealers, offers and claims are made up; claims are adapted from Nissan UK published figures.</footer>
      </div>
    </div>
  )
}
