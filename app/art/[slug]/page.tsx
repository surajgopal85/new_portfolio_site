import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { artPieces } from '@/content/art'
import styles from './art.module.css'

export function generateStaticParams() {
  return artPieces.map((piece) => ({ slug: piece.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const piece = artPieces.find((p) => p.slug === slug)
  return piece ? { title: piece.title, description: `${piece.artist}, ${piece.year}` } : {}
}

export default async function ArtPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const index = artPieces.findIndex((p) => p.slug === slug)
  const piece = artPieces[index]
  if (!piece) notFound()

  const others = artPieces.filter((p) => p.slug !== slug)

  return (
    <main className="page">
      <Link href="/" className="backlink">
        ← Back to the office
      </Link>

      <div className={styles.head}>
        {/* The piece exactly as it hangs in the room, scaled up. Nothing else
            on this site shows a sprite at full size, which is the point. */}
        <img className={styles.sprite} src={piece.sprite} alt="" />
        <div>
          <p className="eyebrow">On the wall</p>
          <h1 className={styles.title}>{piece.title}</h1>
          <p className={styles.credit}>
            {piece.artist} · {piece.year}
          </p>
        </div>
      </div>

      <h2 className={styles.heading}>What it is</h2>
      <p className={styles.body}>{piece.what}</p>

      <h2 className={styles.heading}>Why it&apos;s on my wall</h2>
      {piece.why ? (
        <p className={styles.body}>{piece.why}</p>
      ) : (
        <p className={styles.pending}>
          {/* TODO(suraj): the reason you hung it. A paragraph in your own
              voice beats any amount of art-history summary. */}
          Not written yet.
        </p>
      )}

      {piece.links && piece.links.length > 0 && (
        <p className={styles.actions}>
          {piece.links.map((link) => (
            <a key={link.href} href={link.href} className="block-button">
              {link.label}
            </a>
          ))}
        </p>
      )}

      <nav className={styles.others} aria-label="The other pieces">
        {others.map((other) => (
          <Link key={other.slug} href={`/art/${other.slug}/`} className={styles.other}>
            <img src={other.sprite} alt="" />
            <span>{other.title}</span>
          </Link>
        ))}
      </nav>
    </main>
  )
}
