import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { publicProjects } from '@/content/projects'
import styles from './study.module.css'

export function generateStaticParams() {
  return publicProjects.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = publicProjects.find((p) => p.slug === slug)
  return project ? { title: project.title, description: project.pitch } : {}
}

/** The four beats, always in this order. See docs — it's the quality bar. */
const BEATS = [
  { key: 'problem', heading: 'The problem' },
  { key: 'decision', heading: 'The key decision' },
  { key: 'result', heading: 'The result' },
  { key: 'nextTime', heading: "What I'd change" },
] as const

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const index = publicProjects.findIndex((p) => p.slug === slug)
  const project = publicProjects[index]
  if (!project) notFound()

  const previous = publicProjects[index - 1]
  const next = publicProjects[index + 1]

  return (
    <main className="page">
      <Link href="/projects/" className="backlink">
        ← Back to the map
      </Link>

      <ul className={styles.meta}>
        <li className={`${styles.chip} ${styles.chipYear}`}>{project.year}</li>
        {project.stack.map((tech) => (
          <li key={tech} className={styles.chip}>
            {tech}
          </li>
        ))}
      </ul>

      <h1 className={styles.title}>{project.title}</h1>
      <p className={styles.pitch}>{project.pitch}</p>

      {project.links && project.links.length > 0 && (
        <p className={styles.actions}>
          {project.links.map((link) => (
            <a key={link.href} href={link.href} className="block-button">
              {link.label}
            </a>
          ))}
        </p>
      )}

      {project.study ? (
        <div className={styles.sections}>
          {BEATS.map((beat, i) => (
            <section key={beat.key} className={styles.section}>
              <span className={styles.step} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h2 className={styles.sectionHeading}>{beat.heading}</h2>
                <p className={styles.sectionBody}>{project.study![beat.key]}</p>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className={styles.pending}>
          Case study in progress — the problem, the key decision, the result, and what I&apos;d
          change. Until all four exist, this page says so rather than pretending.
        </p>
      )}

      <nav className={styles.next} aria-label="Other projects">
        {previous ? (
          <Link href={`/projects/${previous.slug}/`} className="block-button">
            ← {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/projects/${next.slug}/`} className="block-button">
            {next.title} →
          </Link>
        )}
      </nav>
    </main>
  )
}
