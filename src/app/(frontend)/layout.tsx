import React from 'react'

export const metadata = { title: 'Halden Health', description: 'Everyday allergy relief, without the fuss.' }

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;700&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
        <style>{`
          :root { --teal:#0F6B5C; --teal-tint:#DCEEEA; --saffron:#F2B84B; --saffron-tint:#FBEFD3; --ink:#1E2A28; --bg:#F7F5F0;
                  --serif:'Fraunces',serif; --sans:'Inter',system-ui,sans-serif; }
          body { margin:0; background:var(--bg); color:var(--ink); font-family:var(--sans); line-height:1.5; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
