import Link from 'next/link'
import type { Metadata } from 'next'
import { site } from '@/content/site'

export const metadata: Metadata = { title: 'Contact' }

export default function Contact() {
  return (
    <main className="page">
      <Link href="/" className="backlink">
        ← Back to the office
      </Link>
      <p className="eyebrow">The door</p>
      <h1>Say hello</h1>
      <p className="lede">
        Email is the fastest way to reach me. No form, no third-party script, nothing to load.
      </p>
      <p>
        <a className="block-button" href={`mailto:${site.email}`}>
          {site.email}
        </a>
      </p>
      <ul>
        {site.socials.map((social) => (
          <li key={social.label}>
            <a href={social.href}>{social.label}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
