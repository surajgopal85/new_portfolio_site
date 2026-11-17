#!/usr/bin/env node
/**
 * Render the isometric room as flat shapes, straight from iso.ts.
 *
 *   npm run iso -- out.png
 *
 * A check on the geometry, not a preview of the art: floor grid, the two
 * visible walls, and every thing's footprint in painter's order.
 */
import sharp from 'sharp'
const M = await import('../components/scene/iso.ts')
const { TILE_W, TILE_H, ROOM, WALL_H, SCENE_W, SCENE_H, toScreen, depthOf, isoThings, CORNERS } = M

const p = (c) => `${c.x},${c.y}`
const parts = []

// Floor diamond
parts.push(
  `<polygon points="${p(CORNERS.back)} ${p(CORNERS.east)} ${p(CORNERS.front)} ${p(CORNERS.west)}" fill="#a67c55" stroke="#1a1420"/>`,
)
// Floor grid
for (let i = 1; i < ROOM; i++) {
  parts.push(`<line x1="${toScreen({ gx: i, gy: 0 }).x}" y1="${toScreen({ gx: i, gy: 0 }).y}" x2="${toScreen({ gx: i, gy: ROOM }).x}" y2="${toScreen({ gx: i, gy: ROOM }).y}" stroke="#4a2f1d" stroke-opacity=".3"/>`)
  parts.push(`<line x1="${toScreen({ gx: 0, gy: i }).x}" y1="${toScreen({ gx: 0, gy: i }).y}" x2="${toScreen({ gx: ROOM, gy: i }).x}" y2="${toScreen({ gx: ROOM, gy: i }).y}" stroke="#4a2f1d" stroke-opacity=".3"/>`)
}
// The two walls you can see: north (back-right) and west (back-left)
const up = (c) => ({ x: c.x, y: c.y - WALL_H })
parts.push(`<polygon points="${p(CORNERS.back)} ${p(CORNERS.east)} ${p(up(CORNERS.east))} ${p(up(CORNERS.back))}" fill="#cdb08a" stroke="#1a1420"/>`)
parts.push(`<polygon points="${p(CORNERS.back)} ${p(CORNERS.west)} ${p(up(CORNERS.west))} ${p(up(CORNERS.back))}" fill="#b89a74" stroke="#1a1420"/>`)

const fill = {
  rug: '#b5452f', piano: '#f6ecd8', amp: '#1a1420', futon: '#27304a', desk: '#c2924f',
  monitor: '#1a1420', laptop: '#6d7a8c', chair: '#3b2b40', shelf: '#7a4e2e',
  credenza: '#7a4e2e', midi: '#1a1420', 'side-table': '#7a4e2e',
  'window-left': '#6fa8e8', 'window-right': '#6fa8e8', corkboard: '#c2924f',
  door: '#f6ecd8', ligeti: '#fffdf6', schiele: '#4a2f1d',
}

const problems = []
for (const t of [...isoThings].sort((a, b) => depthOf(a) - depthOf(b))) {
  if (t.tiles) {
    // A flat thing is a diamond on the grid, not a rectangle.
    const a = toScreen({ gx: t.gx, gy: t.gy })
    const b = toScreen({ gx: t.gx + t.tiles.w, gy: t.gy })
    const c = toScreen({ gx: t.gx + t.tiles.w, gy: t.gy + t.tiles.h })
    const d = toScreen({ gx: t.gx, gy: t.gy + t.tiles.h })
    parts.push(`<polygon points="${p(a)} ${p(b)} ${p(c)} ${p(d)}" fill="${fill[t.id] ?? '#6d7a8c'}" stroke="#1a1420"/>`)
    for (const corner of [a, b, c, d]) {
      if (corner.x < 0 || corner.x > SCENE_W || corner.y < 0 || corner.y > SCENE_H) {
        problems.push(`${t.id}: corner ${Math.round(corner.x)},${Math.round(corner.y)} outside the frame`)
      }
    }
    continue
  }
  const base = toScreen({ gx: t.gx, gy: t.gy, z: t.z ?? 0 })
  const x = base.x - t.w / 2
  const y = base.y - t.h
  if (x < 0 || x + t.w > SCENE_W) problems.push(`${t.id}: x ${Math.round(x)}..${Math.round(x + t.w)} outside 0..${SCENE_W}`)
  if (y < 0) problems.push(`${t.id}: top ${Math.round(y)} above the frame`)
  if (base.y > SCENE_H) problems.push(`${t.id}: base ${Math.round(base.y)} below the frame`)
  parts.push(`<rect x="${x}" y="${y}" width="${t.w}" height="${t.h}" fill="${fill[t.id] ?? '#6d7a8c'}" fill-opacity=".92" stroke="#1a1420"/>`)
  parts.push(`<text x="${base.x}" y="${y - 2}" font-family="monospace" font-size="7" fill="#1a1420" text-anchor="middle">${t.id}</text>`)
  if (t.hotspot) parts.push(`<rect x="${x}" y="${y}" width="${t.w}" height="${t.h}" fill="none" stroke="#f2c14e" stroke-width="2"/>`)
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SCENE_W}" height="${SCENE_H}">${parts.join('')}</svg>`
await sharp(Buffer.from(svg)).resize({ width: SCENE_W * 3, kernel: 'nearest' }).png().toFile(process.argv[2] ?? 'iso.png')
console.log(problems.length ? 'PROBLEMS:\n  ' + problems.join('\n  ') : `${isoThings.length} things, all inside the frame`)
