import type { Hotspot } from '@/content/site'

/**
 * The scene is a stack of layers, back to front. Each one is a PNG exported
 * from Aseprite at the scene's native resolution (SCENE_W x SCENE_H art px)
 * with a transparent background.
 *
 * While `src` is null the layer draws itself as a flat CSS placeholder, so the
 * layering, the hotspots and the desk animation are all testable before a
 * single pixel is drawn. Replace `src` one layer at a time — nothing else has
 * to change.
 *
 * `rises` marks the layers bolted to the standing desk's top: they move
 * together when the desk goes up or down.
 */
export const SCENE_W = 384
export const SCENE_H = 216

export type Layer = {
  id: string
  src: string | null
  /** Draw order, back to front. */
  z: number
  /** Moves with the standing desk top. */
  rises?: boolean
  /** Fraction of pointer movement this layer tracks, for a little depth. */
  parallax?: number
}

export const layers: readonly Layer[] = [
  { id: 'wall', src: null, z: 0, parallax: 0.2 },
  { id: 'window', src: null, z: 1, parallax: 0.35 },
  { id: 'shelf', src: null, z: 2, parallax: 0.1 },
  { id: 'door', src: null, z: 3 },
  { id: 'floor', src: null, z: 4 },
  { id: 'piano', src: null, z: 5 },
  { id: 'desk-frame', src: null, z: 6 },
  { id: 'desk-top', src: null, z: 7, rises: true },
  { id: 'monitor', src: null, z: 8, rises: true },
  { id: 'keyboard', src: null, z: 9, rises: true },
  { id: 'foreground', src: null, z: 10, parallax: -0.25 },
]

/** Hotspot boxes, in percent of the scene, matched to the placeholder art. */
export const hotspotBoxes: Record<Hotspot['id'], { left: number; top: number; width: number; height: number }> = {
  monitor: { left: 38, top: 30, width: 26, height: 20 },
  piano: { left: 9, top: 62, width: 20, height: 12 },
  door: { left: 76, top: 34, width: 15, height: 44 },
}
