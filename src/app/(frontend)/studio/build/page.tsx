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
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <p style={{ color: 'var(--teal)', fontWeight: 600 }}>PROTOTYPE · DEMO DESIGN</p>
      <h1 style={{ fontFamily: 'var(--serif)', marginTop: 0 }}>Generated files</h1>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {files.map((f, i) => (
          <button key={f.name} onClick={() => setOpen(i)} style={{ padding: '6px 14px', borderRadius: 999, border: '1px solid var(--teal)', cursor: 'pointer', background: i === open ? 'var(--teal)' : 'transparent', color: i === open ? '#fff' : 'var(--teal)' }}>{f.name}</button>
        ))}
      </div>
      {files[open] && <DiffViewer oldValue="" newValue={files[open].code} splitView={false} hideLineNumbers={false} />}
      <button onClick={apply} disabled={applying} style={{ marginTop: 24, padding: '12px 28px', background: 'var(--teal)', color: '#fff', border: 0, borderRadius: 999, cursor: 'pointer' }}>
        {applying ? 'Applying…' : 'Apply'}
      </button>
    </main>
  )
}
