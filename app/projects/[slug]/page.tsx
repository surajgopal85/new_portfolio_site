import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { publicProjects } from '@/content/projects'

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

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = publicProjects.find((p) => p.slug === slug)
  if (!project) notFound()

  // The quality bar from the plan: no project ships without all four sections.
  const sections = project.study
    ? [
        { heading: 'The problem', body: project.study.problem },
        { heading: 'The key decision', body: project.study.decision },
        { heading: 'The result', body: project.study.result },
        { heading: "What I'd change", body: project.study.nextTime },
      ]
    : []

  return (
    <main className="page">
      <Link href="/projects/" className="backlink">
        ← Back to the map
      </Link>
      <p className="eyebrow">
        {project.year} · {project.stack.join(' · ')}
      </p>
      <h1>{project.title}</h1>
      <p className="lede">{project.pitch}</p>

      {project.links && project.links.length > 0 && (
        <p>
          {project.links.map((link) => (
            <a key={link.href} href={link.href} className="block-button" style={{ marginRight: 8 }}>
              {link.label}
            </a>
          ))}
        </p>
      )}

      {sections.length > 0 ? (
        sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))
      ) : (
        <p style={{ color: 'var(--muted)' }}>
          {/* TODO(suraj): case-study copy is yours — problem, key decision, result,
              what you'd change. Fill in `study` in content/projects.ts. */}
          Case study in progress.
        </p>
      )}
    </main>
  )
}
