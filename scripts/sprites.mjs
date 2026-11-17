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
 * One gul — the octagonal medallion the rug repeats. Drawn symmetrically by
 * construction rather than traced, because a woven motif IS symmetrical and
 * the eye catches it immediately when it isn't. 18x11, which is one motif of
 * the real rug squashed into the floor plane.
 */
function gul(c, ox, oy) {
  // Half-width inset per row: an octagon, widest in the middle.
  const inset = [6, 4, 2, 1, 0, 0, 0, 1, 2, 4, 6]
  for (let y = 0; y < inset.length; y++) {
    const i = inset[y]
    const w = 18 - i * 2
    c.rect(ox + i, oy + y, w, 1, P.brick)
    c.px(ox + i, oy + y, P.cream)
    c.px(ox + i + w - 1, oy + y, P.cream)
  }
  c.rect(ox + 5, oy, 8, 1, P.cream)                 // top and bottom edges
  c.rect(ox + 5, oy + 10, 8, 1, P.cream)
  c.rect(ox + 7, oy + 4, 4, 3, P.gold)              // the centre
  c.px(ox + 8, oy + 5, P.brick)
  c.px(ox + 9, oy + 5, P.brick)
  c.rect(ox + 2, oy + 5, 2, 1, P.cream)             // the hooks either side
  c.rect(ox + 14, oy + 5, 2, 1, P.cream)
}

/**
 * One entry per prop. Sizes mirror room.ts — if you change one, change both,
 * and `npm run layout` will show the mismatch.
 */
const sprites = {
  'overworld': [384, 216, (c) => {
    // A deterministic scatter. Deterministic because a map that reshuffles
    // every build is a map nobody can review; scattered because a modulo
    // stride lays everything out on a diagonal.
    let seed = 20261117
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)

    /** A blob: rows whose inset follows a half-ellipse, so it has no corners. */
    const blob = (cx, cy, rx, ry, fill, line) => {
      for (let y = -ry; y <= ry; y++) {
        const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)))
        if (w <= 0) continue
        c.rect(cx - w, cy + y, w * 2, 1, fill)
        if (line) { c.px(cx - w - 1, cy + y, line); c.px(cx + w, cy + y, line) }
      }
      if (line) {
        for (let x = -rx; x <= rx; x++) {
          const h = Math.round(ry * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2)))
          if (h <= 0) continue
          c.px(cx + x, cy - h - 1, line); c.px(cx + x, cy + h, line)
        }
      }
    }

    c.rect(0, 0, 384, 216, P.leafDark)
    for (let y = 0; y < 216; y += 4) {
      for (let x = (((y / 4) % 8) * 4); x < 384; x += 16) c.rect(x, y, 2, 1, P.leaf)
    }
    for (let i = 0; i < 30; i++) {
      blob(Math.round(rnd() * 370) + 7, Math.round(rnd() * 200) + 8, 5 + Math.round(rnd() * 4), 2 + Math.round(rnd() * 2), [41, 92, 46])
    }

    // Hills along the horizon, drawn as humps sitting on the top edge.
    for (const [hx, hr] of [[70, 34], [150, 26], [228, 38], [310, 22]]) {
      for (let x = -hr; x <= hr; x++) {
        const h = Math.round(16 * Math.sqrt(Math.max(0, 1 - (x / hr) ** 2)))
        if (h <= 0) continue
        c.rect(hx + x, 0, 1, h, [41, 92, 46])
        c.px(hx + x, h, P.ink)
        if (h > 5) c.rect(hx + x, Math.max(0, h - 4), 1, 2, P.leaf)
      }
    }

    // The lake, with a shoreline that isn't a rectangle.
    blob(70, 172, 46, 24, P.skyDark, P.ink)
    blob(70, 172, 42, 20, P.sky)
    c.rect(44, 162, 16, 2, P.cream)
    c.rect(66, 180, 11, 2, P.cream)

    // Trees, kept off the lake and the horizon.
    for (const [tx, ty] of [[34, 40], [62, 54], [300, 36], [336, 62], [354, 120], [108, 36], [276, 152], [330, 180], [18, 92], [160, 196]]) {
      c.rect(tx + 3, ty + 10, 3, 6, P.barkDark)
      blob(tx + 4, ty + 5, 6, 6, [41, 92, 46], P.ink)
      c.rect(tx + 1, ty + 2, 6, 3, P.leaf)
    }
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
