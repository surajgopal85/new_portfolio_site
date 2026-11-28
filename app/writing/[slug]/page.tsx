import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { formatDate, posts } from '@/lib/posts'
import styles from './post.module.css'

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = posts.find((p) => p.slug === slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.summary,
    openGraph: { title: post.title, description: post.summary, type: 'article' },
  }
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const index = posts.findIndex((p) => p.slug === slug)
  const post = posts[index]
  if (!post) notFound()

  // `posts` is newest first, so the next post in the array is the older one.
  const newer = posts[index - 1]
  const older = posts[index + 1]

  return (
    <main className="page">
      <Link href="/writing/" className="backlink">
        ← All writing
      </Link>

      <p className={styles.date}>
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span aria-hidden="true"> · </span>
        {post.minutes} min read
      </p>

      <h1 className={styles.title}>{post.title}</h1>
      <p className={styles.summary}>{post.summary}</p>

      {post.tags.length > 0 && (
        <ul className={styles.tags}>
          {post.tags.map((tag) => (
            <li key={tag} className={styles.tag}>
              {tag}
            </li>
          ))}
        </ul>
      )}

      {/* The HTML comes from renderMarkdown over a file in this repo. Raw HTML
          in a post is escaped, not passed through — see lib/markdown.ts. */}
      <article className={styles.prose} dangerouslySetInnerHTML={{ __html: post.html }} />

      <nav className={styles.next} aria-label="Other posts">
        {older ? (
          <Link href={`/writing/${older.slug}/`} className="block-button">
            ← {older.title}
          </Link>
        ) : (
          <span />
        )}
        {newer && (
          <Link href={`/writing/${newer.slug}/`} className="block-button">
            {newer.title} →
          </Link>
        )}
      </nav>
    </main>
  )
}
