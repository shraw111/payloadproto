import React from 'react'

import { blockComponents } from './blocks'

type Dealer = { name?: string; address?: string; phone?: string; hours?: string }

/** Renders a page the same way for the live site, the editor's live preview and the template picker. */
export default function PageView({ page, dealer }: { page: any; dealer?: Dealer | null }) {
  return (
    <>
      {dealer?.name && (
        <div className="dealerbar">
          <div className="wrap">
            <b>{dealer.name}</b>
            <span>{[dealer.address, dealer.phone, dealer.hours].filter(Boolean).join(' · ')}</span>
          </div>
        </div>
      )}
      <main>
        {(page.layout ?? []).map((b: any, i: number) => {
          const C = blockComponents[b.blockType]
          return C ? <React.Fragment key={b.id ?? i}>{C(b, { page })}</React.Fragment> : null
        })}
        <footer className="fineprint">
          {page.disclaimer && <p>{page.disclaimer}</p>}
          <p>Prototype demo. Illustrative content, not official Nissan information.</p>
        </footer>
      </main>
    </>
  )
}
