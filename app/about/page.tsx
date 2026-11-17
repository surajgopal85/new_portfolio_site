import Link from 'next/link'
import type { Metadata } from 'next'
import { site } from '@/content/site'

export const metadata: Metadata = { title: 'Fun & about' }

export default function About() {
  return (
    <main className="page">
      <Link href="/" className="backlink">
        ← Back to the office
      </Link>
      <p className="eyebrow">The piano corner</p>
      <h1>Fun &amp; about</h1>
      {/* TODO(suraj): the non-work half — the piano, the cat, the dog, Caitlin,
          and why the office is drawn in pixels. Keep it short; the scene is
          already doing most of the talking. */}
      <p className="lede">{site.pitch}</p>
    </main>
  )
}
