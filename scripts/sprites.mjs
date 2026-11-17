#!/usr/bin/env node
/**
 * Draw the room's props as pixel sprites, in code.
 *
 *   npm run sprites              # write public/art/room/*.png
 *   npm run sprites -- --sheet out.png   # also write a contact sheet to look at
 *
 * Every sprite follows the rules in docs/art-direction.md: flat fills, one
 * shadow step per surface, a hard outline in --ink, nothing anti-aliased and
 * nothing off the pixel grid. Sizes come from room.ts, so a sprite always
 * matches the box it replaces.
 *
 * Code rather than Aseprite because these are boxes — a desk, an amp, a
 * window. The characters are not boxes, and they are not drawn here.
 */
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const P = {
  ink: [26, 20, 32], shadow: [59, 43, 64], brick: [181, 69, 47], brickLight: [224, 113, 74],
  tan: [232, 196, 138], tanDark: [194, 146, 79], sky: [111, 168, 232], skyDark: [60, 111, 176],
  leaf: [79, 158, 74], leafDark: [47, 107, 53], cream: [246, 236, 216], paper: [255, 253, 246],
  gold: [242, 193, 78], plum: [107, 74, 122], rose: [217, 140, 160], slate: [109, 122, 140],
  barkDark: [74, 47, 29], bark: [122, 78, 46], ginger: [207, 138, 78], sand: [205, 176, 138],
  clay: [166, 124, 85], night: [39, 48, 74],
}

/** A tiny pixel canvas. Everything is integers; nothing is anti-aliased. */
function canvas(w, h) {
  const data = new Uint8ClampedArray(w * h * 4)
  const api = {
    w, h, data,
    px(x, y, c, a = 255) {
      x = Math.round(x); y = Math.round(y)
      if (x < 0 || y < 0 || x >= w || y >= h) return api
      const i = (y * w + x) * 4
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = a
      return api
    },
    rect(x, y, rw, rh, c, a) {
      for (let yy = 0; yy < rh; yy++) for (let xx = 0; xx < rw; xx++) api.px(x + xx, y + yy, c, a)
      return api
    },
    /** Hard 1px outline around a box. */
    frame(x, y, rw, rh, c) {
      for (let xx = 0; xx < rw; xx++) { api.px(x + xx, y, c); api.px(x + xx, y + rh - 1, c) }
      for (let yy = 0; yy < rh; yy++) { api.px(x, y + yy, c); api.px(x + rw - 1, y + yy, c) }
      return api
    },
    /** Filled box with an outline: the shape every prop here is made of. */
    box(x, y, rw, rh, fill, line = P.ink) {
      api.rect(x, y, rw, rh, fill)
      api.frame(x, y, rw, rh, line)
      return api
    },
    toPng() {
      return sharp(Buffer.from(data.buffer), { raw: { width: w, height: h, channels: 4 } }).png()
    },
  }
  return api
}

/**
 * One entry per prop. Sizes mirror room.ts — if you change one, change both,
 * and `npm run layout` will show the mismatch.
 */
const sprites = {
  'piano': [72, 22, (c) => {
    c.box(0, 0, 72, 7, P.slate)                     // control panel
    c.rect(1, 1, 70, 2, P.sand)                     // lit top edge
    for (let x = 4; x < 68; x += 7) c.rect(x, 3, 3, 2, P.ink)   // knobs and sliders
    c.box(0, 6, 72, 11, P.cream)                    // white keys
    for (let x = 3; x < 72; x += 4) c.rect(x, 7, 1, 9, P.ink)   // key gaps
    for (let x = 5; x < 69; x += 8) c.rect(x, 7, 3, 5, P.ink)   // black keys
    c.box(0, 16, 72, 6, P.shadow)                   // front face, in shadow
  }],
  'amp': [24, 18, (c) => {
    c.box(0, 0, 24, 18, P.ink)
    c.rect(1, 1, 22, 2, P.shadow)
    c.box(3, 4, 18, 11, P.shadow)                   // speaker grille
    for (let y = 5; y < 14; y += 2) c.rect(4, y, 16, 1, P.ink)
    c.rect(4, 2, 5, 1, P.slate)                     // badge
  }],
  'door': [32, 44, (c) => {
    c.box(0, 0, 32, 44, P.tanDark)                  // frame
    c.box(2, 2, 28, 42, P.cream)                    // the door itself
    c.frame(5, 5, 22, 15, P.tanDark)                // upper panel
    c.frame(5, 23, 22, 17, P.tanDark)               // lower panel
    c.rect(26, 24, 2, 3, P.ink)                     // handle
    c.rect(25, 24, 1, 3, P.gold)
  }],
  'window': [32, 28, (c) => {
    c.box(0, 0, 32, 28, P.paper)                    // frame
    c.box(2, 2, 28, 24, P.night)                    // night glass
    c.rect(15, 2, 2, 24, P.paper)                   // mullion
    c.rect(2, 13, 28, 2, P.paper)
    c.rect(22, 6, 2, 2, P.gold)                     // the streetlight, outside
    c.rect(21, 5, 4, 4, P.gold, 70)
    c.rect(4, 18, 9, 6, P.leafDark)                 // the tree in the driveway
    c.rect(5, 16, 7, 3, P.leafDark)
  }],
  'futon': [36, 18, (c) => {
    c.box(0, 0, 36, 18, P.night)
    c.rect(1, 1, 34, 3, P.skyDark)                  // lit top
    c.rect(1, 9, 34, 1, P.ink)                      // the fold
    c.rect(1, 14, 34, 3, P.ink)                     // shadow under it
  }],
  'side-table': [30, 22, (c) => {
    c.box(0, 0, 30, 10, P.clay)                     // top surface, catching light
    c.box(0, 9, 30, 13, P.barkDark)                 // front face
    c.rect(2, 12, 26, 1, P.bark)
    c.rect(2, 18, 3, 4, P.ink)                      // legs
    c.rect(25, 18, 3, 4, P.ink)
  }],
  'shelf': [16, 20, (c) => {
    c.box(0, 0, 16, 20, P.bark)
    c.rect(1, 1, 14, 2, P.clay)                     // lit top
    c.box(2, 4, 12, 7, P.barkDark)                  // upper cubby
    c.box(2, 11, 12, 7, P.barkDark)                 // lower cubby
    c.rect(3, 5, 3, 5, P.brick)                     // books in the top one
    c.rect(7, 5, 2, 5, P.leafDark)
    c.rect(10, 6, 3, 4, P.gold)
  }],
  // The desktop is a surface seen from above: a lit top face and a front
  // edge in shadow. The legs are a separate sprite hanging below it, so the
  // top can rise and lower without the legs moving.
  'desk-top': [52, 12, (c) => {
    c.box(0, 0, 52, 12, P.tanDark)
    c.rect(1, 1, 50, 7, P.tan)                      // the lit surface
    c.rect(1, 8, 50, 3, P.barkDark)                 // the front edge, in shadow
  }],
  'desk-frame': [48, 18, (c) => {
    c.rect(3, 0, 5, 18, P.slate); c.frame(3, 0, 5, 18, P.ink)   // left leg
    c.rect(40, 0, 5, 18, P.slate); c.frame(40, 0, 5, 18, P.ink) // right leg
    c.rect(8, 1, 32, 3, P.shadow)                   // crossbar under the top
    c.rect(3, 16, 5, 2, P.ink)                      // feet
    c.rect(40, 16, 5, 2, P.ink)
  }],
  'credenza': [48, 86, (c) => {
    c.box(0, 0, 48, 86, P.bark)                     // the desk return, running toward you
    c.rect(1, 1, 46, 4, P.clay)                     // lit top edge
    c.rect(2, 30, 44, 1, P.barkDark)                // drawer lines
    c.rect(2, 58, 44, 1, P.barkDark)
    c.rect(20, 33, 8, 2, P.slate)                   // handles
    c.rect(20, 61, 8, 2, P.slate)
  }],
}

await mkdir('public/art/room', { recursive: true })
const written = []
for (const [name, [w, h, draw]] of Object.entries(sprites)) {
  const c = canvas(w, h)
  draw(c)
  const out = `public/art/room/${name}.png`
  await c.toPng().toFile(out)
  written.push({ name, w, h, out })
  console.log(`${out}  ${w}x${h}`)
}

const sheetPath = process.argv.includes('--sheet') ? process.argv[process.argv.indexOf('--sheet') + 1] : null
if (sheetPath) {
  const Z = 6, PAD = 8
  const cols = 3
  const cellW = Math.max(...written.map((s) => s.w)) * Z + PAD * 2
  const cellH = Math.max(...written.map((s) => s.h)) * Z + PAD * 2
  const rows = Math.ceil(written.length / cols)
  const comps = []
  for (const [i, s] of written.entries()) {
    const buf = await sharp(s.out).resize({ width: s.w * Z, kernel: 'nearest' }).toBuffer()
    comps.push({
      input: buf,
      left: (i % cols) * cellW + PAD,
      top: Math.floor(i / cols) * cellH + PAD,
    })
  }
  await sharp({ create: { width: cols * cellW, height: rows * cellH, channels: 4, background: '#5a4433' } })
    .composite(comps).png().toFile(sheetPath)
  console.log(`${sheetPath}  contact sheet, ${written.length} sprites`)
}
