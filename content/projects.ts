/**
 * The project list. Quality bar: every project gets a case study with the
 * problem, the key decision, the result, and what you'd change.
 *
 * `visibility: 'private'` keeps a project off the site entirely — use it for
 * anything built for an employer or client that you haven't cleared yet.
 */
export type Project = {
  slug: string
  title: string
  /** One-line pitch. Shown on the overworld node. */
  pitch: string
  year: number
  stack: readonly string[]
  visibility: 'public' | 'private'
  links?: { readonly label: string; readonly href: string }[]
  /** The case study. Four sections, in this order, always. */
  study?: {
    problem: string
    decision: string
    result: string
    nextTime: string
  }
  /** Position on the overworld map, in grid cells. See app/projects/page.tsx. */
  node: { x: number; y: number }
}

// TODO(suraj): Prep item 2 — 3 to 5 new projects, each with a one-line pitch
// and a visibility call. Replace these two placeholders; the map and the case
// study routes are generated from this array.
export const projects: readonly Project[] = [
  {
    slug: 'placeholder-one',
    title: 'Project One',
    pitch: 'A one-line pitch that makes someone want the whole story.',
    year: 2026,
    stack: ['TypeScript', 'Next.js'],
    visibility: 'public',
    node: { x: 1, y: 2 },
  },
  {
    slug: 'placeholder-two',
    title: 'Project Two',
    pitch: 'The second level on the map.',
    year: 2026,
    stack: ['AWS'],
    visibility: 'public',
    node: { x: 3, y: 1 },
  },
]

export const publicProjects = projects.filter((p) => p.visibility === 'public')
