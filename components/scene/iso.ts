/**
 * The room, in isometric.
 *
 * You stand in the doorway and look down across the room on the diagonal —
 * windows ahead, desk to the right, piano corner to the left. That's
 * IMG_0730 in photos/raw/office, which is the photograph this projection is
 * built to match.
 *
 * Projection: 2:1 dimetric, the standard for hand-drawn pixel art. A floor
 * tile is a 32x16 diamond, so every edge moves 2 across for 1 down and every
 * line lands on whole pixels. True 30-degree isometric does not: its edges
 * land on irrational slopes and every diagonal comes out furry.
 *
 *   screen.x = ORIGIN_X + (gx - gy) * TILE_W / 2
 *   screen.y = ORIGIN_Y + (gx + gy) * TILE_H / 2 - z
 *
 * `gx` runs away from the camera to the right, `gy` away to the left, `z` is
 * height above the floor in pixels. The back corner of the room is (0, 0);
 * the camera stands past (ROOM, ROOM).
 *
 *            (0,0) back corner
 *              /\
 *    west wall/  \east wall
 *            /    \
 *     (0,R) <      > (R,0)
 *            \    /
 *             \  /
 *              \/
 *          (R,R) the doorway, where you're standing
 */

export const TILE_W = 32
export const TILE_H = 16
/** Floor is ROOM x ROOM tiles. Ten tiles reads as a room this size. */
export const ROOM = 10
/** Wall height above the floor, in pixels — four tiles. */
export const WALL_H = 64

export const SCENE_W = 384
export const SCENE_H = 240
export const ORIGIN_X = SCENE_W / 2
export const ORIGIN_Y = WALL_H + 16

export type Cell = { gx: number; gy: number; z?: number }

export function toScreen({ gx, gy, z = 0 }: Cell): { x: number; y: number } {
  return {
    x: ORIGIN_X + ((gx - gy) * TILE_W) / 2,
    y: ORIGIN_Y + ((gx + gy) * TILE_H) / 2 - z,
  }
}

/**
 * Painter's order: everything further from the camera first. In 2:1 iso that
 * is simply the sum of the grid coordinates — a thing at (2,3) is behind a
 * thing at (4,4) no matter how tall either one is.
 */
export function depthOf({ gx, gy }: Cell): number {
  return gx + gy
}

/** The four floor corners, for drawing the floor diamond. */
export const CORNERS = {
  back: toScreen({ gx: 0, gy: 0 }),
  east: toScreen({ gx: ROOM, gy: 0 }),
  west: toScreen({ gx: 0, gy: ROOM }),
  front: toScreen({ gx: ROOM, gy: ROOM }),
}

/**
 * Where everything sits, in tiles, taken off IMG_0730 and IMG_0729.
 *
 * The two walls you can see are the ones facing the doorway: north (the
 * windows) and west (the door you came through, the piano, the posters). The
 * desk stands against the east side, which has no drawn wall — you're looking
 * along it — so its things sit on the floor at high `gx`.
 */
export type IsoThing = {
  id: string
  /** Back corner of the footprint, in tiles. */
  gx: number
  gy: number
  /**
   * Footprint in tiles and height in pixels. A thing declares the space it
   * occupies, not the size of its picture — the sprite is derived from this,
   * so art and grid can't drift apart.
   */
  tiles: { w: number; d: number }
  height: number
  /** Height of the footprint off the floor — a thing on the desk sits at 26. */
  z?: number
  src: string | null
  hotspot?: 'monitor' | 'piano' | 'door' | 'corkboard'
  /** Mounted flat on a wall rather than standing on the floor. */
  wall?: 'north' | 'west'
  /** Lies flat on the floor: drawn as a diamond, no height. */
  flat?: boolean
  rises?: boolean
}

/**
 * The pixel size of a thing's sprite, derived from its footprint. A box
 * occupying w x d tiles and h pixels tall is exactly this wide and this tall
 * on screen, every time.
 */
export function spriteSize(t: IsoThing): { w: number; h: number } {
  const w = ((t.tiles.w + t.tiles.d) * TILE_W) / 2
  const h = ((t.tiles.w + t.tiles.d) * TILE_H) / 2 + (t.flat ? 0 : t.height)
  return { w: Math.round(w), h: Math.round(h) }
}

/**
 * Where a thing's sprite goes: its top-left corner in screen pixels. The
 * anchor is the footprint's west corner, which is the leftmost point of the
 * diamond, so a sprite never needs its own offset baked in.
 */
export function placeThing(t: IsoThing): { left: number; top: number; w: number; h: number } {
  const { w, h } = spriteSize(t)
  const west = toScreen({ gx: t.gx, gy: t.gy + t.tiles.d, z: t.z ?? 0 })
  const back = toScreen({ gx: t.gx, gy: t.gy, z: t.z ?? 0 })
  return { left: Math.round(west.x), top: Math.round(back.y - (t.flat ? 0 : t.height)), w, h }
}

/** Painter's order: the far corner of the footprint decides. */
export function sortKey(t: IsoThing): number {
  return t.gx + t.gy + (t.tiles.w + t.tiles.d) / 2 + (t.z ?? 0) / 1000
}

export const isoThings: readonly IsoThing[] = [
  // --- north wall: the windows you look at while working -----------------
  { id: 'window-left', gx: 2.6, gy: 0, z: 24, tiles: { w: 2, d: 0 }, height: 40, src: '/art/iso/window-left.png', wall: 'north' },
  { id: 'window-right', gx: 5.4, gy: 0, z: 24, tiles: { w: 2, d: 0 }, height: 40, src: '/art/iso/window-right.png', wall: 'north' },
  { id: 'corkboard', gx: 8.2, gy: 0, z: 28, tiles: { w: 1.8, d: 0 }, height: 30, src: '/art/iso/corkboard.png', wall: 'north', hotspot: 'corkboard' },

  // --- west wall: the way in, and the music ------------------------------
  { id: 'ligeti', gx: 0, gy: 2.6, z: 32, tiles: { w: 0, d: 1.8 }, height: 30, src: '/art/iso/ligeti.png', wall: 'west' },
  { id: 'schiele', gx: 0, gy: 4.9, z: 34, tiles: { w: 0, d: 1 }, height: 34, src: '/art/iso/schiele.png', wall: 'west' },
  { id: 'door', gx: 0, gy: 7.2, z: 0, tiles: { w: 0, d: 1.7 }, height: 62, src: '/art/iso/door.png', wall: 'west', hotspot: 'door' },

  // --- the rug, which owns the middle of the floor -----------------------
  { id: 'rug', gx: 1.3, gy: 1.3, tiles: { w: 6.5, d: 6.5 }, height: 0, src: '/art/iso/rug.png', flat: true },

  // --- the floor, far side -----------------------------------------------
  { id: 'futon', gx: 2.4, gy: 0.35, tiles: { w: 1.6, d: 1.3 }, height: 18, src: '/art/iso/futon.png' },
  { id: 'piano', gx: 0.5, gy: 3.4, tiles: { w: 0.8, d: 3.2 }, height: 26, src: '/art/iso/piano.png', hotspot: 'piano' },
  { id: 'amp', gx: 0.6, gy: 4.9, tiles: { w: 0.9, d: 0.9 }, height: 18, src: '/art/iso/amp.png' },
  { id: 'side-table', gx: 0.5, gy: 6.3, tiles: { w: 0.9, d: 1.8 }, height: 20, src: '/art/iso/side-table.png' },

  // --- the desk, along the east side, with walking room beside the rug ---
  { id: 'shelf', gx: 8.1, gy: 0.7, tiles: { w: 0.9, d: 0.9 }, height: 22, src: '/art/iso/shelf.png' },
  { id: 'desk', gx: 8.1, gy: 1.9, tiles: { w: 1.1, d: 2.4 }, height: 26, src: '/art/iso/desk.png' },
  { id: 'monitor', gx: 8.35, gy: 2.2, z: 26, tiles: { w: 0.45, d: 1.3 }, height: 24, src: '/art/iso/monitor.png', hotspot: 'monitor' },
  { id: 'laptop', gx: 8.35, gy: 3.3, z: 26, tiles: { w: 0.45, d: 0.8 }, height: 10, src: '/art/iso/laptop.png' },
  { id: 'chair', gx: 6.9, gy: 2.6, tiles: { w: 1, d: 1 }, height: 32, src: '/art/iso/chair.png' },
  { id: 'credenza', gx: 8.1, gy: 5.0, tiles: { w: 1.1, d: 2.1 }, height: 28, src: '/art/iso/credenza.png' },
  { id: 'midi', gx: 8.2, gy: 5.2, z: 28, tiles: { w: 0.6, d: 1.7 }, height: 8, src: '/art/iso/midi.png' },
]
