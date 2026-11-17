#!/usr/bin/env node
/**
 * Draw the isometric room in code.
 *
 *   npm run iso-sprites                  # write public/art/iso/*.png
 *   npm run iso-sprites -- --sheet x.png # and a contact sheet to look at
 *
 * In 2:1 isometric almost every prop is a box with three visible faces: a
 * lit top, a mid-tone face toward the camera's right, a dark face toward its
 * left. One primitive therefore draws the desk, the credenza, the futon, the
 * amp and the side table, and the light always falls the same way — which is
 * most of what makes a room look like one room.
 *
 * Sizes come from the footprints in iso.ts, never from numbers typed here.
 */
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'
const M = await import('../components/scene/iso.ts')
const { TILE_W, TILE_H, ROOM, WALL_H, SCENE_W, SCENE_H, toScreen, CORNERS, isoThings, spriteSize } = M

const P = {
  ink: [26, 20, 32], shadow: [59, 43, 64], brick: [181, 69, 47], brickLight: [224, 113, 74],
  tan: [232, 196, 138], tanDark: [194, 146, 79], sky: [111, 168, 232], skyDark: [60, 111, 176],
  leaf: [79, 158, 74], leafDark: [47, 107, 53], cream: [246, 236, 216], paper: [255, 253, 246],
  gold: [242, 193, 78], plum: [107, 74, 122], rose: [217, 140, 160], slate: [109, 122, 140],
  barkDark: [74, 47, 29], bark: [122, 78, 46], ginger: [207, 138, 78], sand: [205, 176, 138],
  clay: [166, 124, 85], night: [39, 48, 74],
}

/** Three tones of one material: top face, right face, left face. */
const shade = (c, k = 1) => [
  c,
  c.map((v) => Math.round(v * (0.78 - 0.04 * k))),
  c.map((v) => Math.round(v * (0.58 - 0.04 * k))),
]

function canvas(w, h) {
  const data = new Uint8ClampedArray(w * h * 4)
  const api = {
    w, h, data,
    /**
     * Write a pixel, blending when it isn't opaque. Storing a translucent
     * value instead of compositing it is how texture lines meant to be a
     * faint dark came out white — the alpha was kept rather than applied.
     */
    px(x, y, c, a = 255) {
      x = Math.round(x); y = Math.round(y)
      if (x < 0 || y < 0 || x >= w || y >= h) return api
      const i = (y * w + x) * 4
      if (a >= 255) {
        data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255
        return api
      }
      const t = a / 255
      const under = data[i + 3] ? [data[i], data[i + 1], data[i + 2]] : c
      data[i] = Math.round(c[0] * t + under[0] * (1 - t))
      data[i + 1] = Math.round(c[1] * t + under[1] * (1 - t))
      data[i + 2] = Math.round(c[2] * t + under[2] * (1 - t))
      data[i + 3] = Math.max(data[i + 3], Math.round(255 * t))
      return api
    },
    rect(x, y, rw, rh, c, a) {
      for (let yy = 0; yy < rh; yy++) for (let xx = 0; xx < rw; xx++) api.px(x + xx, y + yy, c, a)
      return api
    },
    /** Scanline fill. Integer-only, so edges land where the maths says. */
    poly(points, c, a = 255) {
      const ys = points.map((p) => p[1])
      const y0 = Math.floor(Math.min(...ys))
      const y1 = Math.ceil(Math.max(...ys))
      for (let y = y0; y <= y1; y++) {
        const xs = []
        for (let i = 0; i < points.length; i++) {
          const [ax, ay] = points[i]
          const [bx, by] = points[(i + 1) % points.length]
          if (ay === by) continue
          if (y >= Math.min(ay, by) && y < Math.max(ay, by)) {
            xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax))
          }
        }
        xs.sort((p, q) => p - q)
        for (let i = 0; i + 1 < xs.length; i += 2) {
          for (let x = Math.round(xs[i]); x <= Math.round(xs[i + 1]); x++) api.px(x, y, c, a)
        }
      }
      return api
    },
    /** A 2:1 line, which is the only diagonal this projection ever needs. */
    iso(x, y, len, dir, c) {
      for (let i = 0; i < len; i++) api.px(x + i * 2 * dir, y + i, c).px(x + i * 2 * dir + dir, y + i, c)
      return api
    },
    toPng() {
      return sharp(Buffer.from(data.buffer), { raw: { width: w, height: h, channels: 4 } }).png()
    },
  }
  return api
}

/**
 * A box standing on the floor, drawn into a sprite canvas whose size came
 * from the footprint. `w` and `d` are in tiles, `height` in pixels.
 */
function isoBox(c, { w, d, height, color, k = 1, outline = P.ink }) {
  const [top, right, left] = shade(color, k)
  const X = (u, v) => (u - v + d) * (TILE_W / 2)
  const Y = (u, v, z = 0) => (u + v) * (TILE_H / 2) + height - z

  // top face
  c.poly(
    [
      [X(0, 0), Y(0, 0, height)],
      [X(w, 0), Y(w, 0, height)],
      [X(w, d), Y(w, d, height)],
      [X(0, d), Y(0, d, height)],
    ],
    top,
  )
  // face toward the camera's right
  c.poly(
    [
      [X(w, 0), Y(w, 0, height)],
      [X(w, d), Y(w, d, height)],
      [X(w, d), Y(w, d)],
      [X(w, 0), Y(w, 0)],
    ],
    right,
  )
  // face toward the camera's left
  c.poly(
    [
      [X(0, d), Y(0, d, height)],
      [X(w, d), Y(w, d, height)],
      [X(w, d), Y(w, d)],
      [X(0, d), Y(0, d)],
    ],
    left,
  )
  // the three silhouette edges that read as an outline at this size
  const edge = (a, b) => {
    const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))
    for (let i = 0; i <= steps; i++) {
      c.px(a[0] + ((b[0] - a[0]) * i) / steps, a[1] + ((b[1] - a[1]) * i) / steps, outline)
    }
  }
  edge([X(0, 0), Y(0, 0, height)], [X(w, 0), Y(w, 0, height)])
  edge([X(w, 0), Y(w, 0, height)], [X(w, d), Y(w, d, height)])
  edge([X(w, d), Y(w, d, height)], [X(0, d), Y(0, d, height)])
  edge([X(0, d), Y(0, d, height)], [X(0, 0), Y(0, 0, height)])
  edge([X(w, 0), Y(w, 0, height)], [X(w, 0), Y(w, 0)])
  edge([X(w, d), Y(w, d, height)], [X(w, d), Y(w, d)])
  edge([X(0, d), Y(0, d, height)], [X(0, d), Y(0, d)])
  edge([X(w, 0), Y(w, 0)], [X(w, d), Y(w, d)])
  edge([X(w, d), Y(w, d)], [X(0, d), Y(0, d)])
  return { X, Y }
}

/**
 * The room itself: the floor diamond and the two walls facing the doorway.
 * One sprite rather than tiles, because the floor is a fixed shape here and
 * tiling it in CSS would fight the diagonal.
 */
async function roomBackground() {
  const c = canvas(SCENE_W, SCENE_H)
  const S = (gx, gy, z = 0) => {
    const p = toScreen({ gx, gy, z })
    return [p.x, p.y]
  }
  const up = ([x, y]) => [x, y - WALL_H]

  // Walls first: the floor is drawn over their bottom edge.
  c.poly([S(0, 0), S(ROOM, 0), up(S(ROOM, 0)), up(S(0, 0))], P.sand)       // north
  c.poly([S(0, 0), S(0, ROOM), up(S(0, ROOM)), up(S(0, 0))], shade(P.sand, 1)[1]) // west, turned away

  // Wall texture: a faint vertical every half tile keeps a big flat area
  // from reading as a void, the way Stardew's walls do.
  for (let i = 0.5; i < ROOM; i += 0.5) {
    const n = S(i, 0)
    const w = S(0, i)
    for (let k = 0; k < WALL_H; k++) {
      c.px(n[0], n[1] - k, P.clay, 26)
      c.px(w[0], w[1] - k, P.clay, 26)
    }
  }

  // Floor
  c.poly([S(0, 0), S(ROOM, 0), S(ROOM, ROOM), S(0, ROOM)], P.clay)

  // Floorboards run along one axis, as real boards do.
  for (let v = 0.5; v < ROOM; v += 0.5) {
    const a = S(0, v)
    const b = S(ROOM, v)
    const steps = Math.round(b[0] - a[0])
    for (let i = 0; i <= steps; i++) {
      c.px(a[0] + i, a[1] + i / 2, P.barkDark, v % 1 === 0 ? 70 : 38)
    }
  }
  // Board ends, so the floor doesn't read as endless strips.
  for (let u = 1; u < ROOM; u += 1) {
    for (let v = (u % 2) * 0.5; v < ROOM; v += 2) {
      const a = S(u, v)
      for (let i = 0; i < TILE_W / 2; i++) c.px(a[0] - i, a[1] + i / 2, P.barkDark, 40)
    }
  }

  // Baseboards where wall meets floor.
  for (let i = 0; i <= ROOM * (TILE_W / 2); i++) {
    const nx = S(0, 0)[0] + i
    const ny = S(0, 0)[1] + i / 2
    const wx = S(0, 0)[0] - i
    const wy = S(0, 0)[1] + i / 2
    for (let k = 0; k < 4; k++) {
      c.px(nx, ny - k, P.cream)
      c.px(wx, wy - k, shade(P.cream, 1)[1])
    }
  }

  // The outer silhouette: the two wall tops and the two near floor edges.
  const edge = (a, b, col) => {
    const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))
    for (let i = 0; i <= steps; i++) {
      c.px(a[0] + ((b[0] - a[0]) * i) / steps, a[1] + ((b[1] - a[1]) * i) / steps, col)
    }
  }
  edge(up(S(0, 0)), up(S(ROOM, 0)), P.ink)
  edge(up(S(0, 0)), up(S(0, ROOM)), P.ink)
  edge(up(S(0, 0)), S(0, 0), P.ink)
  edge(up(S(ROOM, 0)), S(ROOM, 0), P.ink)
  edge(up(S(0, ROOM)), S(0, ROOM), P.ink)
  edge(S(ROOM, 0), S(ROOM, ROOM), P.ink)
  edge(S(0, ROOM), S(ROOM, ROOM), P.ink)

  await c.toPng().toFile('public/art/iso/room-bg.png')
  console.log(`public/art/iso/room-bg.png  ${SCENE_W}x${SCENE_H}`)
}

const thingById = Object.fromEntries(isoThings.map((t) => [t.id, t]))
const sized = (id) => {
  const t = thingById[id]
  if (!t) throw new Error(`no thing "${id}" in iso.ts`)
  const { w, h } = spriteSize(t)
  return { t, c: canvas(w, h) }
}

/** Props that are honestly just a box, with their material. */
const BOXES = {
  desk: { color: P.tanDark, k: 0 },
  credenza: { color: P.bark, k: 1 },
  'side-table': { color: P.bark, k: 1 },
  futon: { color: P.night, k: 0 },
  amp: { color: P.ink, k: 0 },
  shelf: { color: P.bark, k: 1 },
  midi: { color: P.ink, k: 0 },
  laptop: { color: P.slate, k: 0 },
}

await mkdir('public/art/iso', { recursive: true })
await roomBackground()
const written = []

for (const [id, opts] of Object.entries(BOXES)) {
  const { t, c } = sized(id)
  isoBox(c, { w: t.tiles.w, d: t.tiles.d, height: t.height, ...opts })
  const out = `public/art/iso/${id}.png`
  await c.toPng().toFile(out)
  written.push({ id, out, w: c.w, h: c.h })
  console.log(`${out}  ${c.w}x${c.h}`)
}

if (process.argv.includes('--sheet')) {
  const path = process.argv[process.argv.indexOf('--sheet') + 1]
  const Z = 4
  const pad = 10
  const cw = Math.max(...written.map((s) => s.w)) * Z + pad * 2
  const ch = Math.max(...written.map((s) => s.h)) * Z + pad * 2
  const cols = 4
  const comps = []
  for (const [i, s] of written.entries()) {
    comps.push({
      input: await sharp(s.out).resize({ width: s.w * Z, kernel: 'nearest' }).toBuffer(),
      left: (i % cols) * cw + pad,
      top: Math.floor(i / cols) * ch + pad,
    })
  }
  await sharp({
    create: { width: cols * cw, height: Math.ceil(written.length / cols) * ch, channels: 4, background: '#8a6a4a' },
  }).composite(comps).png().toFile(path)
  console.log(`${path}  ${written.length} sprites`)
}
