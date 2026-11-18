/**
 * The three pieces on the office walls. Each one is clickable in the scene
 * and has a page of its own — which is a better "about me" than a paragraph
 * claiming to be interesting.
 *
 * `id` matches the thing's id in components/scene/iso.ts, so the scene and
 * these pages can't drift apart.
 */
export type ArtPiece = {
  id: 'ligeti' | 'schiele' | 'twin-peaks'
  slug: string
  title: string
  artist: string
  year: string
  /** The sprite as it hangs in the room. */
  sprite: string
  /** One line, shown in the scene's status bar on hover. */
  hint: string
  /** What it is. Factual. */
  what: string
  /** TODO(suraj): why it's on your wall. This is the part worth reading. */
  why: string
  links?: readonly { label: string; href: string }[]
}

export const artPieces: readonly ArtPiece[] = [
  {
    id: 'ligeti',
    slug: 'artikulation',
    title: 'Artikulation',
    artist: 'György Ligeti, score by Rainer Wehinger',
    year: '1958, score 1970',
    sprite: '/art/iso/ligeti.png',
    hint: 'A score for music that has no notes.',
    what:
      'Ligeti built Artikulation out of tape and electronics in 1958, so there was no score — nothing to write notes on. Twelve years later Rainer Wehinger made one anyway: a listening score, a page of coloured marks that follows the sound without telling anyone how to play it.',
    // TODO(suraj): yours. Why does this hang over your desk?
    why: '',
    links: [{ label: 'Listen with the score', href: 'https://www.youtube.com/watch?v=71hNl_skTZQ' }],
  },
  {
    id: 'schiele',
    slug: 'schiele',
    title: 'Self-Portrait with Peacock Waistcoat',
    artist: 'Egon Schiele',
    year: '1911',
    sprite: '/art/iso/schiele.png',
    hint: 'Schiele, aged twenty-one, looking straight at you.',
    what:
      'Schiele painted it at twenty-one, standing in a waistcoat he owned, against nothing at all. He died at twenty-eight. The background is empty because he kept the whole picture in the figure.',
    // TODO(suraj): yours.
    why: '',
  },
  {
    id: 'twin-peaks',
    slug: 'twin-peaks',
    title: 'The Red Room',
    artist: 'After Twin Peaks',
    year: '1990',
    sprite: '/art/iso/twin-peaks.png',
    hint: 'Chevrons, and a figure with its arms up.',
    what:
      'The zigzag floor of the Black Lodge, which the show never explains and never needs to. Lynch said the room arrived more or less whole.',
    // TODO(suraj): yours.
    why: '',
  },
]

export const artById = Object.fromEntries(artPieces.map((p) => [p.id, p])) as Record<
  ArtPiece['id'],
  ArtPiece
>
