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
  /** Footprint origin in tiles. */
  gx: number
  gy: number
  /** Height off the floor, in px — a thing on the desk has z ≈ 26. */
  z?: number
  /** Sprite size in px. Anchored bottom-centre on the tile. */
  w: number
  h: number
  src: string | null
  hotspot?: 'monitor' | 'piano' | 'door' | 'corkboard'
  /** Mounted on a wall rather than standing on the floor. */
  wall?: 'north' | 'west'
  rises?: boolean
  /**
   * Lies flat on the floor — a rug. Measured in TILES, not pixels, because
   * a flat thing is a diamond in this projection rather than a rectangle,
   * and its shape follows the grid exactly.
   */
  tiles?: { w: number; h: number }
}

export const isoThings: readonly IsoThing[] = [
  // --- north wall: the windows you look at while working -----------------
  { id: 'window-left', gx: 2.5, gy: 0, z: 22, w: 46, h: 40, src: null, wall: 'north' },
  { id: 'window-right', gx: 5.5, gy: 0, z: 22, w: 46, h: 40, src: null, wall: 'north' },
  { id: 'corkboard', gx: 8.2, gy: 0, z: 26, w: 44, h: 32, src: null, wall: 'north', hotspot: 'corkboard' },

  // --- west wall: the way in, and the music ------------------------------
  { id: 'door', gx: 0, gy: 7.5, z: 0, w: 40, h: 64, src: null, wall: 'west', hotspot: 'door' },
  { id: 'ligeti', gx: 0, gy: 3.4, z: 30, w: 40, h: 30, src: null, wall: 'west' },
  { id: 'schiele', gx: 0, gy: 5.6, z: 32, w: 22, h: 34, src: null, wall: 'west' },

  // --- the floor, far side -----------------------------------------------
  { id: 'futon', gx: 3.4, gy: 0.9, w: 54, h: 30, src: null },
  { id: 'piano', gx: 0.9, gy: 4.2, w: 76, h: 38, src: null, hotspot: 'piano' },
  { id: 'amp', gx: 0.9, gy: 5.4, w: 30, h: 26, src: null },
  { id: 'side-table', gx: 0.9, gy: 6.8, w: 44, h: 28, src: null },

  // --- the desk, along the east side -------------------------------------
  { id: 'desk', gx: 8.4, gy: 1.6, w: 88, h: 44, src: null },
  { id: 'monitor', gx: 8.6, gy: 2.0, z: 26, w: 40, h: 32, src: null, hotspot: 'monitor' },
  { id: 'laptop', gx: 8.6, gy: 3.0, z: 24, w: 26, h: 18, src: null },
  { id: 'chair', gx: 7.0, gy: 2.6, w: 34, h: 44, src: null },
  { id: 'shelf', gx: 8.6, gy: 0.8, w: 30, h: 30, src: null },
  { id: 'credenza', gx: 8.4, gy: 5.2, w: 76, h: 48, src: null },
  { id: 'midi', gx: 8.4, gy: 5.2, z: 24, w: 56, h: 20, src: null },

  // --- the middle of the floor -------------------------------------------
  { id: 'rug', gx: 2.4, gy: 1.6, w: 0, h: 0, src: null, tiles: { w: 5.6, h: 6.2 } },
]
