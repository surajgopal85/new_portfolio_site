#!/usr/bin/env node
/**
 * Render the room's geometry straight from room.ts, as flat boxes.
 *
 * Not a preview of the art — a check on the model. It catches things that
 * fall outside the frame, wall art hanging past the wall band, and objects
 * that collide, without needing a browser.
 *
 *   node --experimental-strip-types scripts/layout-preview.mjs out.png
 */
import sharp from 'sharp'
const { drawOrder, SCENE_W, SCENE_H, FLOOR_TOP, FLOOR_H, WALL_H, TILE } =
  await import('../components/scene/room.ts')
const { SURAJ, visits } = await import('../lib/characters.ts')

const fill = {
  rug: '#b5452f', shelf: '#7a4e2e', 'desk-frame': '#6d7a8c', 'desk-top': '#c2924f',
  monitor: '#1a1420', laptop: '#6d7a8c', chair: '#3b2b40', 'window-left': '#27304a',
  'window-right': '#27304a', futon: '#27304a', door: '#b5452f', 'desk-return': '#7a4e2e',
  piano: '#f6ecd8', amp: '#1a1420', ligeti: '#fffdf6', schiele: '#4a2f1d', print: '#d98ca0',
  corkboard: '#c2924f', midi: '#1a1420', bottle: '#3c6fb0', 'keyboard-white': '#fffdf6',
  notebook: '#f6ecd8', mug: '#6fa8e8', 'gold-frame': '#f2c14e', plush: '#f2c14e',
  bone: '#f6ecd8', powerstrip: '#fffdf6', 'fan-shadow': 'rgba(26,20,32,.18)',
}

const parts = [
  `<rect width="${SCENE_W}" height="${WALL_H}" fill="#f6ecd8"/>`,
  `<rect y="${FLOOR_TOP}" width="${SCENE_W}" height="${FLOOR_H}" fill="#a67c55"/>`,
]
for (let x = TILE; x < SCENE_W; x += TILE) {
  parts.push(`<rect x="${x}" y="${FLOOR_TOP}" width="1" height="${FLOOR_H}" fill="#4a2f1d" opacity=".28"/>`)
}

const problems = []
function box(t, color, extra = '') {
  const baseY = FLOOR_TOP + t.depth * FLOOR_H
  const top = t.wall ? (t.y ?? 0) : t.flat ? baseY - t.h / 2 : baseY - t.h
  if (t.x < 0 || t.x + t.w > SCENE_W) problems.push(`${t.id}: x ${t.x}..${t.x + t.w} outside 0..${SCENE_W}`)
  if (top < 0) problems.push(`${t.id}: top above the frame`)
  if (!t.wall && baseY > SCENE_H) problems.push(`${t.id}: base below the frame`)
  if (t.wall && top + t.h > WALL_H + 1) problems.push(`${t.id}: hangs ${(top + t.h - WALL_H).toFixed(0)}px past the wall band`)
  parts.push(
    `<rect x="${t.x}" y="${top.toFixed(1)}" width="${t.w}" height="${t.h}" fill="${color ?? fill[t.id] ?? '#6d7a8c'}" stroke="#1a1420" stroke-width="1" ${t.flat ? 'rx="4"' : ''} ${extra}/>`,
  )
  if (t.hotspot) {
    parts.push(`<rect x="${t.x}" y="${top.toFixed(1)}" width="${t.w}" height="${t.h}" fill="none" stroke="#f2c14e" stroke-width="1.5"/>`)
  }
}

for (const t of drawOrder) box(t)
box({ ...SURAJ, id: 'suraj' }, '#4a2f1d')
for (const v of visits) {
  const tall = v.id === 'caitlin'
  box({ id: v.id, x: v.spot.x, depth: v.spot.depth, w: tall ? 12 : 18, h: tall ? 26 : 12 }, '#cf8a4e', 'opacity=".85"')
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SCENE_W}" height="${SCENE_H}">${parts.join('')}</svg>`
await sharp(Buffer.from(svg)).resize({ width: SCENE_W * 3, kernel: 'nearest' }).png().toFile(process.argv[2] ?? 'layout.png')
console.log(
  problems.length
    ? 'PROBLEMS:\n  ' + problems.join('\n  ')
    : `${drawOrder.length} things + Suraj + ${visits.length} visitor spots, all inside the frame`,
)
