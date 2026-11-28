import Link from 'next/link'
import type { Metadata } from 'next'
import { publicProjects } from '@/content/projects'
import styles from './overworld.module.css'

export const metadata: Metadata = { title: 'Projects' }

/**
 * The overworld. Each project is a level tile on a grid; the dotted path runs
 * between consecutive tiles in list order, so reordering `projects` reorders
 * the route through the map.
 */
const COLS = 5
const ROWS = 3

export default function Projects() {
  const nodes = publicProjects.map((project) => ({
    ...project,
    cx: ((project.node.x + 0.5) / COLS) * 100,
    cy: ((project.node.y + 0.5) / ROWS) * 100,
  }))

  return (
    <main className="page" style={{ maxWidth: '68rem' }}>
      <Link href="/" className="backlink">
        ← Back to the office
      </Link>
      <p className="eyebrow">Projects</p>
      <h1>Pick a level</h1>

      <div className={styles.map}>
        <svg className={styles.paths} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {nodes.slice(1).map((node, i) => (
            <line key={node.slug} x1={nodes[i].cx} y1={nodes[i].cy} x2={node.cx} y2={node.cy} className={styles.path} />
          ))}
        </svg>

        {nodes.map((node, i) => (
          <Link
            key={node.slug}
            href={`/projects/${node.slug}/`}
            className={styles.node}
            style={{ left: `${node.cx}%`, top: `${node.cy}%` }}
          >
            <span className={styles.tile} aria-hidden="true">
              {i + 1}
            </span>
            <span className={styles.label}>{node.title}</span>
          </Link>
        ))}
      </div>

      {/* The pitches live under the map. Prose on grass is unreadable, and a
          screen reader shouldn't have to walk a map to find out what these
          projects are. */}
      <ol className={styles.legend}>
        {nodes.map((node, i) => (
          <li key={node.slug} className={styles.legendItem}>
            <span className={styles.legendNum}>{String(i + 1).padStart(2, '0')}</span>
            <span>
              <Link href={`/projects/${node.slug}/`} className={styles.legendTitle}>
                {node.title}
              </Link>
              {/* Visible before the click, so nobody opens a case study
                  expecting a finished one. */}
              {node.status === 'building' && <span className={styles.legendFlag}>In progress</span>}
              <p className={styles.legendPitch}>{node.pitch}</p>
            </span>
          </li>
        ))}
      </ol>
    </main>
  )
}
