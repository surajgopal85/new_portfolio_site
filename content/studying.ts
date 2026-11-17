/**
 * The cork board. Whatever's pinned to it is what I'm working through right
 * now — not a finished list, which is the point. Stale entries are worse than
 * an empty board, so pull things off when you stop.
 */
export type Pin = {
  title: string
  /** One line: what it is and why you're on it. */
  note: string
  /** Month you pinned it, e.g. '2026-11'. Shown as "since November". */
  since: string
  link?: { label: string; href: string }
}

// TODO(suraj): replace with what's actually on the board.
export const pins: readonly Pin[] = [
  {
    title: 'AWS: S3, CloudFront, Route 53',
    note: 'Standing this site up on real infrastructure instead of a deploy button.',
    since: '2026-11',
  },
]

export function sinceLabel(since: string): string {
  const [year, month] = since.split('-').map(Number)
  if (!year || !month) return since
  const name = new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    timeZone: 'UTC',
  })
  return `since ${name} ${year}`
}
