import type { Hotspot } from '@/content/site'

/**
 * The room, seen from a shallow top-down three-quarter angle — the Cult of the
 * Lamb camera. You look down at the floor plane; everything standing on it is
 * drawn upright, facing you.
 *
 * The projection is deliberately orthographic rather than perspective: no
 * vanishing point, no scaling with depth. Depth is expressed only by where a
 * thing's base sits on the floor and by draw order. Perspective scaling would
 * put sprites on fractional pixels, which is exactly what makes pixel art look
 * muddy.
 *
 *     0                                                            384
 *   0 ┌──────────────────────────────────────────────────────────────┐
 *     │                        BACK WALL (72px)                      │
 *  72 ├──┬────────────────────────────────────────────────────────┬──┤
 *     │L │                                                        │ R│  depth 0
 *     │E │                      FLOOR (144px)                     │ I│
 *     │F │                                                        │ G│
 * 216 └──┴────────────────────────────────────────────────────────┴──┘  depth 1
 *
 * A thing at depth 0 stands against the back wall; at depth 1 it's closest to
 * the camera. Screen y = FLOOR_TOP + depth * FLOOR_H, and a sprite hangs
 * upward from there, so its feet are always on the floor.
 */
export const SCENE_W = 384
export const SCENE_H = 216
export const WALL_H = 72
export const FLOOR_TOP = WALL_H
export const FLOOR_H = SCENE_H - WALL_H
/** Width of the left and right wall strips, in art px. */
export const SIDE_W = 26

/**
 * The real office has the desk on one wall, the windows opposite the door, and
 * the piano on a third. Faithful to the room's contents; rearranged so all
 * three navigation objects are visible at once, which is the whole reason for
 * this camera.
 *
 * - back wall  → standing desk, monitor, laptop   (Projects)
 * - left wall  → the two windows, futon beneath   (night, driveway, trees)
 * - right wall → the door                         (Contact)
 * - floor, front-left → piano and amp             (Fun & about)
 */
export type Thing = {
  id: string
  /** Left edge in art px. */
  x: number
  /** 0 = against the back wall, 1 = nearest the camera. */
  depth: number
  /** Sprite size in art px. */
  w: number
  h: number
  /** Exported PNG; null draws the CSS placeholder instead. */
  src: string | null
  /** Bolted to the standing desk's top — moves when the desk rises. */
  rises?: boolean
  /** Makes this thing navigation. */
  hotspot?: Hotspot['id']
  /** Flat on the floor (a rug), so it's drawn as a squashed shape, not upright. */
  flat?: boolean
  /**
   * Hangs on the back wall instead of standing on the floor. `y` is art px
   * from the top of the frame; `depth` is ignored for placement but still
   * sorts it behind everything on the floor.
   */
  wall?: boolean
  y?: number
  /**
   * Always drawn immediately after the thing with this id, whatever the
   * depths say. For something resting ON another thing: the controller lies
   * on the desk return and sits visually further back than the return's near
   * edge, so depth alone would bury it.
   */
  over?: string
}

export const things: readonly Thing[] = [
  // --- hung on the back wall ----------------------------------------------
  // Real fixtures, at their real proportions. Sizes are provisional until the
  // room's actual dimensions set the art-px-per-inch scale.
  /** Ligeti, Artikulation — Wehinger's listening score. Colored dashes on white. */
  { id: 'ligeti', x: 30, y: 16, depth: 0, w: 36, h: 27, src: null, wall: true },
  /** Schiele, Self-Portrait with Peacock Waistcoat. Dark panel, pale face. */
  { id: 'schiele', x: 86, y: 12, depth: 0, w: 17, h: 38, src: null, wall: true },
  /** The small red-and-white print above the desk. */
  { id: 'print', x: 262, y: 14, depth: 0, w: 18, h: 24, src: null, wall: true },
  /** Cork board, aluminium frame — hangs over the desk return, on the right wall. */
  { id: 'corkboard', x: 312, y: 8, depth: 0, w: 52, h: 38, src: null, wall: true, hotspot: 'corkboard' },

  // --- against the back wall ---------------------------------------------
  { id: 'rug', x: 112, depth: 0.6, w: 176, h: 74, src: null, flat: true },
  { id: 'shelf', x: 104, depth: 0.06, w: 26, h: 34, src: null },
  { id: 'desk-frame', x: 140, depth: 0.08, w: 108, h: 40, src: null },
  { id: 'desk-top', x: 138, depth: 0.08, w: 112, h: 8, src: null, rises: true },
  { id: 'monitor', x: 160, depth: 0.08, w: 44, h: 34, src: null, rises: true, hotspot: 'monitor' },
  { id: 'laptop', x: 206, depth: 0.1, w: 24, h: 15, src: null, rises: true },
  // On the desk, left to right as they actually sit there. ~1.8 art px per
  // real inch, which is what the monitor's 24" width works out to.
  { id: 'bottle', x: 142, depth: 0.1, w: 5, h: 14, src: null, rises: true },
  { id: 'keyboard-white', x: 150, depth: 0.13, w: 28, h: 5, src: null, rises: true },
  { id: 'notebook', x: 182, depth: 0.14, w: 22, h: 6, src: null, rises: true },
  { id: 'mug', x: 232, depth: 0.12, w: 5, h: 6, src: null, rises: true },
  { id: 'gold-frame', x: 240, depth: 0.09, w: 8, h: 11, src: null, rises: true },
  { id: 'chair', x: 170, depth: 0.26, w: 28, h: 30, src: null },

  // --- left wall: windows and the futon ----------------------------------
  { id: 'window-back', x: 2, depth: 0.1, w: 24, h: 44, src: null },
  { id: 'window-front', x: 2, depth: 0.4, w: 24, h: 44, src: null },
  { id: 'futon', x: 26, depth: 0.46, w: 42, h: 24, src: null },

  // --- right wall: the door ----------------------------------------------
  { id: 'door', x: 356, depth: 0.22, w: 26, h: 54, src: null, hotspot: 'door' },
  /**
   * The desk is an L: this is the return, running along the right wall from
   * the corner toward the camera. One sprite covering that whole run, rather
   * than a box — depth is in the drawing, not in the model.
   */
  { id: 'desk-return', x: 300, depth: 0.78, w: 58, h: 96, src: null },
  /** The M-Audio controller, lying on the return. */
  { id: 'midi', x: 306, depth: 0.62, w: 46, h: 13, src: null, over: 'desk-return' },

  // --- floor, front-left: the piano --------------------------------------
  { id: 'piano', x: 44, depth: 0.82, w: 86, h: 30, src: null, hotspot: 'piano' },
  { id: 'amp', x: 60, depth: 0.95, w: 30, h: 24, src: null },
]

/** Where a thing's sprite sits on screen, as percentages of the scene. */
export function place(thing: Thing) {
  const baseY = FLOOR_TOP + thing.depth * FLOOR_H
  const top = thing.wall ? (thing.y ?? 0) : thing.flat ? baseY - thing.h / 2 : baseY - thing.h
  return {
    left: `${(thing.x / SCENE_W) * 100}%`,
    top: `${(top / SCENE_H) * 100}%`,
    width: `${(thing.w / SCENE_W) * 100}%`,
    height: `${(thing.h / SCENE_H) * 100}%`,
  }
}

/**
 * Back to front. Equal depths keep their declared order, then anything with
 * `over` is lifted to sit directly on top of its support.
 */
export const drawOrder = (() => {
  const sorted = [...things].sort((a, b) => a.depth - b.depth)
  for (const thing of things) {
    if (!thing.over) continue
    const from = sorted.indexOf(thing)
    const onto = sorted.findIndex((t) => t.id === thing.over)
    if (from === -1 || onto === -1) continue
    sorted.splice(from, 1)
    sorted.splice(sorted.findIndex((t) => t.id === thing.over) + 1, 0, thing)
  }
  return sorted
})()
