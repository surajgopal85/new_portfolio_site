import type { MetadataRoute } from 'next'
import { site } from '@/content/site'
import { publicProjects } from '@/content/projects'
import { posts } from '@/lib/posts'

/**
 * Generated from the routes, so a new project or post appears here by existing
 * rather than by being remembered.
 *
 * The URLs are only right once `site.url` is the real domain.
 */
export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const pages = ['', 'projects/', 'writing/', 'now/', 'about/', 'contact/']
  const studies = publicProjects.map((p) => `projects/${p.slug}/`)
  const writing = posts.map((p) => `writing/${p.slug}/`)

  return [...pages, ...studies, ...writing].map((path) => ({
    url: new URL(path, site.url).href,
    lastModified: now,
    changeFrequency: path === '' ? 'monthly' : 'yearly',
    priority: path === '' ? 1 : path.startsWith('projects/') ? 0.8 : 0.5,
  }))
}
