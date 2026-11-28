/**
 * Everything a visitor reads that isn't a project. Edit the copy here, not in
 * the components.
 */
export const site = {
  name: 'Suraj Gopal',
  role: 'Software engineer',
  // TODO(suraj): Prep item 1 — "what a visitor should feel in the first 5
  // seconds, and what they should do in the first 30", in three sentences.
  // Whatever you write here is the <meta description> and the fallback hero.
  pitch:
    'Software engineer. This is my office, drawn one pixel at a time — look around, or read the case studies.',
  email: 'surajcancode@gmail.com',
  // Canonical URLs, the sitemap and the social preview image are all built
  // from this. It's a build-time value, so a host that sets
  // NEXT_PUBLIC_SITE_URL gets correct absolute URLs without a code change —
  // that's the Vercel path. The literal is what the S3/CloudFront deploy uses,
  // and it's wrong until the domain is registered in Route 53.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com',
  socials: [
    { label: 'GitHub', href: 'https://github.com/surajgopal85/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/suraj-s-gopal/' },
  ],
} as const

/**
 * The objects in the office ARE the navigation. One entry per interactive
 * hotspot: the scene renders these, and the static fallback renders the same
 * list as a plain menu, so the two can never drift apart.
 */
export type Hotspot = {
  id: 'monitor' | 'piano' | 'door' | 'corkboard' | 'laptop'
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
    id: 'laptop',
    object: 'Laptop',
    href: '/writing/',
    label: 'Writing',
    hint: "Notes on whatever I'm building.",
  },
  {
    id: 'piano',
    object: 'Piano',
    href: '/about/',
    label: 'Fun & about',
    hint: 'Play it, or read the non-work half.',
  },
  {
    id: 'corkboard',
    object: 'Cork board',
    href: '/now/',
    label: 'Studying',
    hint: "Whatever I'm learning right now, pinned.",
  },
  {
    id: 'door',
    object: 'Door',
    href: '/contact/',
    label: 'Contact',
    hint: 'Knock. I answer.',
  },
]
