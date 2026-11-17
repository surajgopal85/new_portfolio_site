import Link from 'next/link'
import { hotspots, site } from '@/content/site'
import { publicProjects } from '@/content/projects'
import styles from './fallback.module.css'

/**
 * The plain version. See fallback.module.css for why it gets a design rather
 * than a bare list.
 */
export function StaticFallback({ onEnter }: { onEnter?: () => void }) {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className="eyebrow">{site.role}</p>
        <h1 className={styles.name}>{site.name}</h1>
        <p className={styles.lede}>{site.pitch}</p>

        {onEnter && (
          <p className={styles.enter}>
            <button type="button" className="block-button" onClick={onEnter}>
              Visit the office →
            </button>
          </p>
        )}
      </header>

      <section className={styles.section}>
        <h2 className={styles.heading}>Pages</h2>
        <ul className={styles.blocks}>
          {hotspots.map((spot) => (
            <li key={spot.id}>
              <Link href={spot.href} className={styles.block}>
                <span className={styles.blockLabel}>{spot.label}</span>
                <span className={styles.blockHint}>{spot.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Projects</h2>
        <ol className={styles.projects}>
          {publicProjects.map((project, i) => (
            <li key={project.slug} className={styles.project}>
              <span className={styles.projectNum}>{String(i + 1).padStart(2, '0')}</span>
              <span>
                <Link href={`/projects/${project.slug}/`} className={styles.projectLink}>
                  {project.title}
                </Link>
                <p className={styles.projectPitch}>{project.pitch}</p>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Elsewhere</h2>
        <ul className={styles.links}>
          <li>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </li>
          {site.socials.map((social) => (
            <li key={social.label}>
              <a href={social.href}>{social.label}</a>
            </li>
          ))}
        </ul>
      </section>

      <p className={styles.foot}>
        This is the plain version — no images, no scripts needed. The office is
        a pixel-art room you can look around in.
      </p>
    </div>
  )
}
