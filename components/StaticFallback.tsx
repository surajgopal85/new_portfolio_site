import Link from 'next/link'
import { hotspots, site } from '@/content/site'
import { publicProjects } from '@/content/projects'

/**
 * The plain version. Not a consolation prize: this is what the exported HTML
 * contains, what a screen reader reads, what a crawler indexes, and what a
 * slow phone on a train gets. It has to stand on its own.
 */
export function StaticFallback({ onEnter }: { onEnter?: () => void }) {
  return (
    <main className="page">
      <p className="eyebrow">{site.role}</p>
      <h1>{site.name}</h1>
      <p className="lede">{site.pitch}</p>

      {onEnter && (
        <p>
          <button type="button" className="block-button" onClick={onEnter}>
            Visit the office
          </button>
        </p>
      )}

      <h2>Pages</h2>
      <ul>
        {hotspots.map((spot) => (
          <li key={spot.id}>
            <Link href={spot.href}>{spot.label}</Link> — {spot.hint}
          </li>
        ))}
      </ul>

      <h2>Projects</h2>
      <ul>
        {publicProjects.map((project) => (
          <li key={project.slug}>
            <Link href={`/projects/${project.slug}/`}>{project.title}</Link> — {project.pitch}
          </li>
        ))}
      </ul>

      <h2>Elsewhere</h2>
      <ul>
        <li>
          <a href={`mailto:${site.email}`}>{site.email}</a>
        </li>
        {site.socials.map((social) => (
          <li key={social.label}>
            <a href={social.href}>{social.label}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
