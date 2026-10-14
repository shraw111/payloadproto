'use client'
import dynamic from 'next/dynamic'
import React, { useEffect, useState } from 'react'

const DiffViewer = dynamic(() => import('react-diff-viewer-continued').then((m) => m.default), { ssr: false })

const AFTER_URL = process.env.NEXT_PUBLIC_AFTER_URL || 'http://localhost:3001'

/** Screen 3. Generated files as a diff against an empty project; Apply hands over to the after copy. */
export default function Build() {
  const [files, setFiles] = useState<{ name: string; code: string }[]>([])
  const [open, setOpen] = useState(0)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    fetch('/api/studio/stored?name=generated.json').then((r) => r.json()).then((j) => setFiles(j.files)).catch(() => {})
  }, [])

  function apply() {
    setApplying(true)
    setTimeout(() => { window.location.href = `${AFTER_URL}/admin` }, 2000)
  }

  return (
    <div className="studio">
      <header className="studio__bar"><b>AI Content Studio</b><span className="studio__tag">Prototype · demo design</span></header>
      <main className="studio__body">
        <h1>Generated files</h1>
        <p>Everything below is new. Review it, then apply to build the admin.</p>
        <div className="tabs" role="tablist">
          {files.map((f, i) => (
            <button key={f.name} role="tab" aria-selected={i === open} className="tab" style={{ fontFamily: 'var(--mono)', fontSize: 13 }} onClick={() => setOpen(i)}>{f.name}</button>
          ))}
        </div>
        {files[open] && <DiffViewer oldValue="" newValue={files[open].code} splitView={false} hideLineNumbers={false} />}
        <button className="mbtn" style={{ marginTop: 24 }} onClick={apply} disabled={applying}>{applying ? 'Applying…' : 'Apply'}</button>
      </main>
    </div>
  )
}
