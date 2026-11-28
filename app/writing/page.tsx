import Link from 'next/link'
import type { Metadata } from 'next'
import { formatDate, posts } from '@/lib/posts'
import styles from './writing.module.css'

export const metadata: Metadata = {
  title: 'Writing',
  description: 'Notes on what I am building and what it taught me.',
}

export default function Writing() {
  return (
    <main className="page" style={{ maxWidth: '64rem' }}>
      <Link href="/" className="backlink">
        ← Back to the office
      </Link>
      <p className="eyebrow">The laptop</p>
      <h1>Writing</h1>
      <p className="lede">
        Notes from whatever I&apos;m building — usually a decision I had to argue myself into, and
        what it cost. Shorter than a case study, and more honest about the parts still open.
      </p>

      {posts.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>Nothing published yet.</p>
      ) : (
        <ol className={styles.list}>
          {posts.map((post) => (
            <li key={post.slug} className={styles.item}>
              <Link href={`/writing/${post.slug}/`} className={styles.card}>
                <p className={styles.date}>
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span aria-hidden="true"> · </span>
                  {post.minutes} min
                </p>
                <h2 className={styles.title}>{post.title}</h2>
                <p className={styles.summary}>{post.summary}</p>
                {post.tags.length > 0 && (
                  <p className={styles.tags} aria-label="Tags">
                    {post.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
