import Link from 'next/link'
import { hotspots } from '@/content/site'

/**
 * The 404 uses the room's own door sprite — a wrong door is the one joke
 * this site is already set up to make, and it costs 1KB.
 */
export default function NotFound() {
  return (
    <main className="page" style={{ textAlign: 'center' }}>
      <img
        src="/art/room/door.png"
        alt=""
        width={128}
        height={176}
        style={{ imageRendering: 'pixelated', margin: '0 auto 1.5rem', display: 'block' }}
      />
      <p className="eyebrow">Error 404</p>
      <h1>Wrong door</h1>
      <p className="lede" style={{ maxWidth: '34ch', margin: '0 auto 2rem' }}>
        Nothing lives at this address. The rooms that do exist are below.
      </p>

      <nav
        aria-label="Pages"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}
      >
        <Link href="/" className="block-button">
          The office
        </Link>
        {hotspots.map((spot) => (
          <Link key={spot.id} href={spot.href} className="block-button">
            {spot.label}
          </Link>
        ))}
      </nav>
    </main>
  )
}
