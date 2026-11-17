/**
 * Everything a visitor reads that isn't a project. Edit the copy here, not in
 * the components.
 */
export const site = {
  name: 'Suraj Gopalakrishnan',
  role: 'Software engineer',
  // TODO(suraj): Prep item 1 — "what a visitor should feel in the first 5
  // seconds, and what they should do in the first 30", in three sentences.
  // Whatever you write here is the <meta description> and the fallback hero.
  pitch:
    'Software engineer. This is my office, drawn one pixel at a time — look around, or read the case studies.',
  email: 'surajcancode@gmail.com',
  // Set once the domain is registered in Route 53; used for canonical URLs and
  // the social preview image.
  url: 'https://example.com',
  socials: [
    { label: 'GitHub', href: 'https://github.com/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  ],
} as const

/**
 * The objects in the office ARE the navigation. One entry per interactive
 * hotspot: the scene renders these, and the static fallback renders the same
 * list as a plain menu, so the two can never drift apart.
 */
export type Hotspot = {
  id: 'monitor' | 'piano' | 'door'
  /** The thing in the room. */
  object: string
  /** Where it goes. */
  href: string
  /** Nav label, and the accessible name of the hotspot button. */
  label: string
  /** One line shown on hover/focus, in the scene's status bar. */
  hint: string
}

export const hotspots: readonly Hotspot[] = [
  {
    id: 'monitor',
    object: 'Monitor',
    href: '/projects/',
    label: 'Projects',
    hint: 'Three monitors, one overworld map.',
  },
  {
    id: 'piano',
    object: 'Piano',
    href: '/about/',
    label: 'Fun & about',
    hint: 'Play it, or read the non-work half.',
  },
  {
    id: 'door',
    object: 'Door',
    href: '/contact/',
    label: 'Contact',
    hint: 'Knock. I answer.',
  },
]
