import Link from 'next/link'
import type { Metadata } from 'next'
import { pins, sinceLabel } from '@/content/studying'
import styles from './now.module.css'

export const metadata: Metadata = {
  title: 'Studying',
  description: "What I'm learning right now.",
}

export default function Now() {
  return (
    <main className="page" style={{ maxWidth: '60rem' }}>
      <Link href="/" className="backlink">
        ← Back to the office
      </Link>
      <p className="eyebrow">The cork board</p>
      <h1>What I&apos;m studying</h1>
      <p className="lede">
        The board above my desk, more or less as it actually looks. Things come off it when I stop.
      </p>

      {pins.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>Board&apos;s empty at the moment.</p>
      ) : (
        <ul className={styles.board}>
          {pins.map((pin, i) => (
            <li key={pin.title} className={styles.card} style={{ ['--tilt' as string]: `${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg` }}>
              <span className={styles.pin} aria-hidden="true" />
              <h2 className={styles.cardTitle}>{pin.title}</h2>
              <p className={styles.note}>{pin.note}</p>
              <p className={styles.since}>{sinceLabel(pin.since)}</p>
              {pin.link && <a href={pin.link.href}>{pin.link.label}</a>}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
