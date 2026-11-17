import type { Metadata } from 'next'
import { site } from '@/content/site'
import { MODE_SCRIPT } from '@/lib/capability'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.role}`, template: `%s — ${site.name}` },
  description: site.pitch,
  openGraph: {
    title: `${site.name} — ${site.role}`,
    description: site.pitch,
    type: 'website',
    // TODO(phase 4): drop a 1200x630 pixel-art still of the office at
    // public/og.png and this starts working.
    images: ['/og.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Must block: it decides which landing version paints. */}
        <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
