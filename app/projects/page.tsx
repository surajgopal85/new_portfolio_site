import Link from 'next/link'
import type { Metadata } from 'next'
import { publicProjects } from '@/content/projects'
import styles from './overworld.module.css'

export const metadata: Metadata = { title: 'Projects' }

/**
 * The overworld. Each project is a node on a grid; the dotted path is drawn
 * between consecutive nodes in list order, so reordering `projects` reorders
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
    <main className="page" style={{ maxWidth: '72rem' }}>
      <Link href="/" className="backlink">
        ← Back to the office
      </Link>
      <p className="eyebrow">Projects</p>
      <h1>Pick a level</h1>

      <div className={styles.map}>
        <svg className={styles.paths} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {nodes.slice(1).map((node, i) => (
            <line
              key={node.slug}
              x1={nodes[i].cx}
              y1={nodes[i].cy}
              x2={node.cx}
              y2={node.cy}
              className={styles.path}
            />
          ))}
        </svg>

        {nodes.map((node, i) => (
          <Link
            key={node.slug}
            href={`/projects/${node.slug}/`}
            className={styles.node}
            style={{ left: `${node.cx}%`, top: `${node.cy}%` }}
          >
            <span className={styles.nodeNumber} aria-hidden="true">
              {i + 1}
            </span>
            <span className={styles.nodeTitle}>{node.title}</span>
            <span className={styles.nodePitch}>{node.pitch}</span>
          </Link>
        ))}
      </div>
    </main>
  )
}
