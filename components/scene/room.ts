import type { Hotspot } from '@/content/site'

/**
 * The room, drawn the way Stardew Valley draws an interior: looking down at
 * the floor, with everything on it rendered front-facing with a little of its
 * top visible. Not isometric, not a flat elevation — somewhere between, and
 * strictly orthographic. No vanishing point, no scaling with depth, because
 * perspective scaling puts sprites on fractional pixels.
 *
 *     0                        384 art px = 24 tiles
 *   0 ┌──────────────────────────────────────────────────┐
 *     │   BACK WALL — 3 tiles. Windows, art, the door.    │
 *  48 ├──────────────────────────────────────────────────┤
 *     │                                                  │  depth 0
 *     │   FLOOR — 10.5 tiles. Everything stands here.     │
 * 216 └──────────────────────────────────────────────────┘  depth 1
 *
 * Scale is set by the character, not the furniture: a person is 26-30 px
 * tall, which makes a tile roughly two feet and the room about 24 feet of
 * wall — wider than the real office, which is the usual trick for fitting a
 * room's worth of furniture into one readable frame.
 */
export const TILE = 16
export const SCENE_W = 24 * TILE // 384
export const SCENE_H = 13.5 * TILE // 216
export const WALL_H = 3 * TILE // 48
export const FLOOR_TOP = WALL_H
export const FLOOR_H = SCENE_H - WALL_H

export type Thing = {
  id: string
  /** Left edge in art px. Tile-aligned wherever it can be. */
  x: number
  /** 0 = against the back wall, 1 = nearest the camera. */
  depth: number
  w: number
  h: number
  /** Exported PNG; null draws the CSS placeholder instead. */
  src: string | null
  /** Bolted to the standing desk's top — moves when the desk rises. */
  rises?: boolean
  /** Makes this thing navigation. */
  hotspot?: Hotspot['id']
  /** Lies flat on the floor (a rug, a shadow) rather than standing up. */
  flat?: boolean
  /** Hangs on the back wall. `y` is art px from the top of the frame. */
  wall?: boolean
  y?: number
  /** Always drawn immediately after this thing, whatever the depths say. */
  over?: string
}

export const things: readonly Thing[] = [
  // --- back wall ----------------------------------------------------------
  { id: 'window-left', x: 16, y: 8, depth: 0, w: 32, h: 28, src: null, wall: true },
  { id: 'window-right', x: 56, y: 8, depth: 0, w: 32, h: 28, src: null, wall: true },
  /** Ligeti, Artikulation — Wehinger's listening score. Dashes on white. */
  { id: 'ligeti', x: 100, y: 10, depth: 0, w: 26, h: 20, src: null, wall: true },
  /** The small red-and-white print above the desk. */
  { id: 'print', x: 176, y: 8, depth: 0, w: 14, h: 18, src: null, wall: true },
  /** Schiele, Self-Portrait with Peacock Waistcoat. */
  { id: 'schiele', x: 232, y: 6, depth: 0, w: 14, h: 26, src: null, wall: true },
  { id: 'corkboard', x: 262, y: 8, depth: 0, w: 40, h: 28, src: null, wall: true, hotspot: 'corkboard' },
  /** Reaches the floor line — this is where everyone comes in. */
  { id: 'door', x: 320, y: 4, depth: 0, w: 32, h: 44, src: null, wall: true, hotspot: 'door' },

  // --- the desk, against the back wall ------------------------------------
  { id: 'shelf', x: 104, depth: 0.05, w: 16, h: 20, src: null },
  { id: 'desk-frame', x: 128, depth: 0.06, w: 48, h: 26, src: null },
  { id: 'desk-top', x: 126, depth: 0.06, w: 52, h: 6, src: null, rises: true },
  { id: 'monitor', x: 140, depth: 0.06, w: 20, h: 16, src: null, rises: true, hotspot: 'monitor' },
  { id: 'gold-frame', x: 170, depth: 0.06, w: 5, h: 7, src: null, rises: true },
  { id: 'bottle', x: 130, depth: 0.07, w: 3, h: 8, src: null, rises: true },
  { id: 'laptop', x: 160, depth: 0.08, w: 12, h: 8, src: null, rises: true },
  { id: 'mug', x: 174, depth: 0.09, w: 3, h: 4, src: null, rises: true },
  { id: 'keyboard-white', x: 136, depth: 0.11, w: 14, h: 3, src: null, rises: true },
  { id: 'notebook', x: 152, depth: 0.12, w: 10, h: 3, src: null, rises: true },
  { id: 'chair', x: 144, depth: 0.2, w: 14, h: 16, src: null },

  // --- the rest of the room -----------------------------------------------
  { id: 'futon', x: 16, depth: 0.3, w: 36, h: 18, src: null },
  { id: 'powerstrip', x: 196, depth: 0.3, w: 14, h: 4, src: null },
  { id: 'rug', x: 96, depth: 0.62, w: 144, h: 56, src: null, flat: true },
  /** The fan is above the camera; its shadow turns across the rug. */
  { id: 'fan-shadow', x: 128, depth: 0.54, w: 72, h: 30, src: null, flat: true, over: 'rug' },
  { id: 'bone', x: 150, depth: 0.72, w: 9, h: 4, src: null, over: 'rug' },
  { id: 'plush', x: 92, depth: 0.88, w: 10, h: 9, src: null },

  /** The desk is an L: this is the return, running along the right wall. */
  { id: 'desk-return', x: 304, depth: 0.75, w: 48, h: 86, src: null },
  { id: 'midi', x: 308, depth: 0.6, w: 40, h: 10, src: null, over: 'desk-return' },

  // --- the music corner, front left ---------------------------------------
  { id: 'piano', x: 24, depth: 0.82, w: 72, h: 22, src: null, hotspot: 'piano' },
  { id: 'amp', x: 36, depth: 0.95, w: 24, h: 18, src: null },
]

/** Where a thing's sprite sits on screen, as percentages of the scene. */
export function place(thing: Pick<Thing, 'x' | 'y' | 'w' | 'h' | 'depth' | 'flat' | 'wall'>) {
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
    if (from === -1) continue
    sorted.splice(from, 1)
    const onto = sorted.findIndex((t) => t.id === thing.over)
    if (onto === -1) sorted.push(thing)
    else sorted.splice(onto + 1, 0, thing)
  }
  return sorted
})()
