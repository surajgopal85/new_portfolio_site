/**
 * The writing. One Markdown file per post in content/posts, read at build
 * time — the site is a static export, so there is no server and no database
 * to put posts in. Git is the CMS: write a file, commit it, deploy, it's live.
 *
 * To publish:
 *   1. Add content/posts/<slug>.md. The filename is the URL.
 *   2. Give it the front matter below. A missing field fails the build rather
 *      than shipping a half-rendered card.
 *   3. `npm run dev` to read it, then commit and `npm run deploy`.
 *
 *   ---
 *   title: When not to put an LLM in the loop
 *   date: 2026-11-27
 *   summary: One sentence, shown on the index and used as the meta description.
 *   tags: [architecture, llm]
 *   draft: true
 *   ---
 *
 * `draft: true` keeps a post out of the build entirely: no page, no listing,
 * no sitemap entry. Files whose names start with `_` are ignored the same way,
 * which is what makes _example.md safe to keep around.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { readingMinutes, renderMarkdown } from './markdown'

export type Post = {
  slug: string
  title: string
  /** ISO date, YYYY-MM-DD. Posts are listed newest first. */
  date: string
  summary: string
  tags: readonly string[]
  draft: boolean
  /** Rendered body. Front matter stripped. */
  html: string
  minutes: number
}

const POSTS_DIR = join(process.cwd(), 'content', 'posts')

/**
 * The front matter block: `---`, `key: value` lines, `---`. Values are plain
 * strings, `[a, b]` lists, or true/false. That's the whole grammar — it's a
 * handful of fields written by one person, not a config format.
 */
function parseFrontMatter(source: string, file: string): { meta: Record<string, unknown>; body: string } {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) throw new Error(`${file}: no front matter. See the block at the top of lib/posts.ts.`)

  const meta: Record<string, unknown> = {}
  for (const line of match[1].split('\n')) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue
    const colon = line.indexOf(':')
    if (colon === -1) throw new Error(`${file}: front matter line is not "key: value": ${line}`)

    const key = line.slice(0, colon).trim()
    const raw = line.slice(colon + 1).trim().replace(/^['"]|['"]$/g, '')

    if (raw.startsWith('[') && raw.endsWith(']')) {
      meta[key] = raw
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    } else if (raw === 'true' || raw === 'false') {
      meta[key] = raw === 'true'
    } else {
      meta[key] = raw
    }
  }

  return { meta, body: match[2] }
}

function requireString(meta: Record<string, unknown>, key: string, file: string): string {
  const value = meta[key]
  if (typeof value !== 'string' || value === '') throw new Error(`${file}: front matter needs a ${key}.`)
  return value
}

function readPost(file: string): Post {
  const source = readFileSync(join(POSTS_DIR, file), 'utf8')
  const { meta, body } = parseFrontMatter(source, file)

  const date = requireString(meta, 'date', file)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${file}: date must be YYYY-MM-DD, got "${date}".`)

  return {
    slug: file.replace(/\.md$/, ''),
    title: requireString(meta, 'title', file),
    date,
    summary: requireString(meta, 'summary', file),
    tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
    draft: meta.draft === true,
    html: renderMarkdown(body),
    minutes: readingMinutes(body),
  }
}

/** Every post on disk, drafts included. Newest first. */
export const allPosts: readonly Post[] = readdirSync(POSTS_DIR)
  .filter((file) => file.endsWith('.md') && !file.startsWith('_'))
  .map(readPost)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)))

/** What the site actually builds. Drafts exist only on your machine. */
export const posts: readonly Post[] = allPosts.filter((post) => !post.draft)

/** "27 November 2026". Fixed to UTC so the date never shifts by timezone. */
export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
