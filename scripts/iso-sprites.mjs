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
 * A stage: a sprite canvas that knows the footprint it represents, so
 * anything drawn into it can be placed in tile coordinates rather than
 * pixels. `u` runs away to the right, `v` away to the left, `z` is height.
 *
 * Composite props are built from several boxes on one stage — a desk is a
 * slab plus legs, not a solid block.
 */
function stage(t) {
  const { w: SW, h: SH } = spriteSize(t)
  const c = canvas(SW, SH)
  const D = t.tiles.d
  const H = t.flat ? 0 : t.height

  const X = (u, v) => (u - v + D) * (TILE_W / 2)
  const Y = (u, v, z = 0) => (u + v) * (TILE_H / 2) + H - z

  const edge = (a, b, col) => {
    const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))
    for (let i = 0; i <= steps; i++) {
      c.px(a[0] + ((b[0] - a[0]) * i) / steps, a[1] + ((b[1] - a[1]) * i) / steps, col)
    }
  }

  /** One box, in tile coordinates, with three shaded faces and an outline. */
  function box({ u = 0, v = 0, z = 0, w, d, h, color, k = 1, outline = P.ink, faces = true }) {
    const [top, right, left] = shade(color, k)
    const u1 = u + w
    const v1 = v + d
    const T = (uu, vv) => [X(uu, vv), Y(uu, vv, z + h)]
    const B = (uu, vv) => [X(uu, vv), Y(uu, vv, z)]

    c.poly([T(u, v), T(u1, v), T(u1, v1), T(u, v1)], top)
    if (faces) {
      c.poly([T(u1, v), T(u1, v1), B(u1, v1), B(u1, v)], right)
      c.poly([T(u, v1), T(u1, v1), B(u1, v1), B(u, v1)], left)
    }
    if (outline) {
      edge(T(u, v), T(u1, v), outline)
      edge(T(u1, v), T(u1, v1), outline)
      edge(T(u1, v1), T(u, v1), outline)
      edge(T(u, v1), T(u, v), outline)
      if (faces) {
        edge(T(u1, v), B(u1, v), outline)
        edge(T(u1, v1), B(u1, v1), outline)
        edge(T(u, v1), B(u, v1), outline)
        edge(B(u1, v), B(u1, v1), outline)
        edge(B(u1, v1), B(u, v1), outline)
      }
    }
    return { T, B }
  }

  /** A flat diamond on the floor — a rug, a mat, a pool of light. */
  function diamond({ u = 0, v = 0, w, d, color, z = 0, a = 255 }) {
    c.poly(
      [
        [X(u, v), Y(u, v, z)],
        [X(u + w, v), Y(u + w, v, z)],
        [X(u + w, v + d), Y(u + w, v + d, z)],
        [X(u, v + d), Y(u, v + d, z)],
      ],
      color,
      a,
    )
  }

  return { c, X, Y, box, diamond, edge, w: SW, h: SH, D, H }
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

  c.poly([S(0, 0), S(ROOM, 0), up(S(ROOM, 0)), up(S(0, 0))], P.sand)
  c.poly([S(0, 0), S(0, ROOM), up(S(0, ROOM)), up(S(0, 0))], shade(P.sand, 1)[1])

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

  c.poly([S(0, 0), S(ROOM, 0), S(ROOM, ROOM), S(0, ROOM)], P.clay)

  // Floorboards run along one axis, as real boards do.
  for (let v = 0.5; v < ROOM; v += 0.5) {
    const a = S(0, v)
    const b = S(ROOM, v)
    const steps = Math.round(b[0] - a[0])
    for (let i = 0; i <= steps; i++) c.px(a[0] + i, a[1] + i / 2, P.barkDark, v % 1 === 0 ? 70 : 38)
  }
  for (let u = 1; u < ROOM; u += 1) {
    for (let v = (u % 2) * 0.5; v < ROOM; v += 2) {
      const a = S(u, v)
      for (let i = 0; i < TILE_W / 2; i++) c.px(a[0] - i, a[1] + i / 2, P.barkDark, 40)
    }
  }

  // Baseboards where wall meets floor.
  for (let i = 0; i <= ROOM * (TILE_W / 2); i++) {
    const n = S(0, 0)
    for (let k = 0; k < 4; k++) {
      c.px(n[0] + i, n[1] + i / 2 - k, P.cream)
      c.px(n[0] - i, n[1] + i / 2 - k, shade(P.cream, 1)[1])
    }
  }

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
/** Props that are honestly just a box, with their material. */
const BOXES = {
  amp: { color: P.ink, k: 0 },
  shelf: { color: P.bark, k: 1 },
  midi: { color: P.ink, k: 0 },
  laptop: { color: P.slate, k: 0 },
}

await mkdir('public/art/iso', { recursive: true })
await roomBackground()
const written = []

async function write(id, draw) {
  const t = thingById[id]
  if (!t) throw new Error(`no thing "${id}" in iso.ts`)
  const st = stage(t)
  draw(st, t)
  const out = `public/art/iso/${id}.png`
  await st.c.toPng().toFile(out)
  written.push({ id, out, w: st.w, h: st.h })
  console.log(`${out}  ${st.w}x${st.h}`)
}

for (const [id, opts] of Object.entries(BOXES)) {
  await write(id, (st, t) => st.box({ w: t.tiles.w, d: t.tiles.d, h: t.height, ...opts }))
}

/**
 * Anything hanging on a wall is a parallelogram, not a rectangle: the north
 * wall shears down-right, the west wall down-left. Drawn pre-sheared here
 * rather than transformed at runtime, because a CSS transform would resample
 * the pixels and turn a crisp 2:1 edge into mush.
 *
 * Inside `draw`, `s` runs along the wall in tiles and `t` runs up it in
 * pixels, so a poster can be laid out as if the wall were flat.
 */
function wallStage(t) {
  const { w: SW, h: SH } = spriteSize(t)
  const c = canvas(SW, SH)
  const along = t.wall === 'north' ? t.tiles.w : t.tiles.d
  const H = t.height

  const X = (s) => (t.wall === 'north' ? s * (TILE_W / 2) : (along - s) * (TILE_W / 2))
  const Y = (s, up) => s * (TILE_H / 2) + (H - up)

  /** A filled quad spanning s0..s1 along the wall and up0..up1 up it. */
  const panel = (s0, s1, up0, up1, color, a) =>
    c.poly(
      [
        [X(s0), Y(s0, up1)],
        [X(s1), Y(s1, up1)],
        [X(s1), Y(s1, up0)],
        [X(s0), Y(s0, up0)],
      ],
      color,
      a,
    )

  /** The sheared outline of a region — the edge that keeps art crisp. */
  const outline = (s0, s1, up0, up1, color = P.ink) => {
    const steps = Math.round((s1 - s0) * (TILE_W / 2))
    for (let i = 0; i <= steps; i++) {
      const s = s0 + ((s1 - s0) * i) / steps
      c.px(X(s), Y(s, up1), color)
      c.px(X(s), Y(s, up0), color)
    }
    for (let up = up0; up <= up1; up++) {
      c.px(X(s0), Y(s0, up), color)
      c.px(X(s1), Y(s1, up), color)
    }
  }

  return { c, X, Y, panel, outline, along, H, w: SW, h: SH }
}

async function writeWall(id, draw) {
  const t = thingById[id]
  if (!t) throw new Error(`no thing "${id}" in iso.ts`)
  const st = wallStage(t)
  draw(st, t)
  const out = `public/art/iso/${id}.png`
  await st.c.toPng().toFile(out)
  written.push({ id, out, w: st.w, h: st.h })
  console.log(`${out}  ${st.w}x${st.h}`)
}

// --- the props that aren't a single box -----------------------------------

/** A standing desk: a slab on two legs, not a solid block. */
await write('desk-north', (st, t) => {
  const { w, d } = t.tiles
  const legH = t.height - 4
  for (const [u, v] of [[0.1, 0.15], [0.1, d - 0.35], [w - 0.3, 0.15], [w - 0.3, d - 0.35]]) {
    st.box({ u, v, w: 0.2, d: 0.2, h: legH, color: P.slate, k: 2 })
  }
  st.box({ u: 0, v: 0, w, d, z: legH, h: 4, color: P.tanDark, k: 0 })
})

/** The side table: a slab, two legs, and an open shelf under it. */
await write('side-table', (st, t) => {
  const { w, d } = t.tiles
  st.box({ u: 0.05, v: 0.05, w: w - 0.1, d: d - 0.1, h: t.height - 5, color: P.barkDark, k: 2 })
  st.box({ u: 0, v: 0, w, d, z: t.height - 5, h: 5, color: P.bark, k: 0 })
})

// The office chair is no longer a prop: it's drawn into Suraj's seated
// sprites, because two sprites that have to line up pixel-for-pixel never
// quite do, and "he's in the chair" is the whole point of it.

/** The monitor: a panel on a foot, with the screen left for the renderer. */
await write('monitor', (st, t) => {
  const { w, d } = t.tiles
  st.box({ u: w / 2 - 0.1, v: d / 2 - 0.2, w: 0.2, d: 0.4, h: 6, color: P.slate, k: 2 })
  st.box({ u: 0, v: 0, w, d, z: 6, h: t.height - 6, color: P.ink, k: 0 })
  // The screen faces into the room, on the left face of the panel. It's the
  // brightest thing in a night room, which is correct: it's the Projects
  // link, and the eye should land there first.
  const T = (uu, zz) => [st.X(uu, d), st.Y(uu, d, zz)]
  st.c.poly(
    [T(0.08, t.height - 2), T(w - 0.08, t.height - 2), T(w - 0.08, 9), T(0.08, 9)],
    P.skyDark,
  )
  st.c.poly(
    [T(0.16, t.height - 4), T(w - 0.16, t.height - 4), T(w - 0.16, 11), T(0.16, 11)],
    P.leafDark,
  )
})

/** The piano: keys on an X-stand, seen along its length. */
await write('piano', (st, t) => {
  const { w, d } = t.tiles
  st.box({ u: 0.1, v: 0.2, w: 0.1, d: 0.1, h: t.height - 6, color: P.ink, k: 2 })
  st.box({ u: 0.1, v: d - 0.3, w: 0.1, d: 0.1, h: t.height - 6, color: P.ink, k: 2 })
  const body = st.box({ u: 0, v: 0, w, d, z: t.height - 6, h: 6, color: P.slate, k: 0 })
  // white keys along the length, black keys on top of them
  for (let v = 0.12; v < d - 0.1; v += 0.11) {
    st.box({ u: 0.25, v, w: w - 0.35, d: 0.08, z: t.height, h: 1, color: P.cream, k: 0, outline: null })
  }
  for (let v = 0.16; v < d - 0.2; v += 0.22) {
    st.box({ u: 0.3, v, w: (w - 0.35) * 0.55, d: 0.05, z: t.height + 1, h: 1, color: P.ink, k: 0, outline: null })
  }
  return body
})

/** The rug: the gul motif, re-laid on the diagonal. */
await write('rug', (st, t) => {
  const { w, d } = t.tiles
  st.diamond({ w, d, color: [18, 13, 20] })
  // Motifs on the grid. In this projection a medallion is a small diamond,
  // so the weave follows the floor rather than fighting it.
  for (let u = 0.75; u < w - 0.5; u += 0.95) {
    for (let v = 0.75; v < d - 0.5; v += 0.95) {
      st.diamond({ u: u - 0.3, v: v - 0.3, w: 0.6, d: 0.6, color: P.brick })
      st.diamond({ u: u - 0.2, v: v - 0.2, w: 0.4, d: 0.4, color: P.cream })
      st.diamond({ u: u - 0.1, v: v - 0.1, w: 0.2, d: 0.2, color: P.gold })
    }
  }
  // Border bands along all four edges.
  for (const band of [0, 0.18]) {
    const col = band === 0 ? P.barkDark : P.gold
    st.diamond({ u: band, v: band, w: w - band * 2, d: 0.14, color: col })
    st.diamond({ u: band, v: d - band - 0.14, w: w - band * 2, d: 0.14, color: col })
    st.diamond({ u: band, v: band, w: 0.14, d: d - band * 2, color: col })
    st.diamond({ u: w - band - 0.14, v: band, w: 0.14, d: d - band * 2, color: col })
  }
})

/** The folding floor chair: a seat with a back folded up behind it. */
await write('futon', (st, t) => {
  const { w, d } = t.tiles
  st.box({ u: 0, v: 0, w, d: d * 0.62, h: t.height, color: P.night, k: 1 })      // the back
  st.box({ u: 0.06, v: d * 0.58, w: w - 0.12, d: d * 0.42, h: t.height * 0.5, color: P.night, k: 0 }) // the seat
  // a seam across the seat, so it reads as a cushion rather than a block
  st.box({ u: 0.06, v: d * 0.78, w: w - 0.12, d: 0.04, h: t.height * 0.5 + 1, color: P.skyDark, k: 0, outline: null })
})

/** The desk's return: a wooden run toward the camera, with drawers. */
await write('desk-east', (st, t) => {
  const { w, d } = t.tiles
  st.box({ u: 0, v: 0, w, d, h: t.height, color: P.bark, k: 1 })
  // drawer fronts on the face turned toward the room
  for (let i = 0; i < 3; i++) {
    const v0 = 0.1 + (i * (d - 0.2)) / 3
    const v1 = v0 + (d - 0.2) / 3 - 0.08
    st.box({ u: 0.02, v: v0, w: w - 0.04, d: v1 - v0, z: 3, h: t.height - 8, color: P.barkDark, k: 1, outline: null, faces: false })
    st.box({ u: 0.02, v: (v0 + v1) / 2 - 0.06, w: w - 0.04, d: 0.12, z: t.height - 12, h: 2, color: P.slate, k: 0, outline: null, faces: false })
  }
})

/** The mechanical keyboard he types at, with its red accent keys. */
await write('keyboard', (st, t) => {
  const { w, d } = t.tiles
  st.box({ w, d, h: t.height, color: P.paper, k: 0 })
  for (let u = 0.06; u < w - 0.06; u += 0.09) {
    st.box({ u, v: d * 0.2, w: 0.06, d: d * 0.6, z: t.height, h: 1, color: P.slate, k: 0, outline: null })
  }
  st.box({ u: 0.06, v: d * 0.2, w: 0.06, d: d * 0.6, z: t.height, h: 1, color: P.brick, k: 0, outline: null })
})

/** An open notebook at the writing end, with a pen across it. */
await write('notebook', (st, t) => {
  const { w, d } = t.tiles
  st.box({ w, d, h: t.height, color: P.paper, k: 0 })
  st.box({ u: w / 2 - 0.02, v: 0.04, w: 0.04, d: d - 0.08, z: t.height, h: 1, color: P.slate, k: 0, outline: null })
  for (let v = 0.1; v < d - 0.1; v += 0.12) {
    st.box({ u: 0.08, v, w: w * 0.34, d: 0.03, z: t.height, h: 1, color: P.sand, k: 0, outline: null })
  }
  st.box({ u: 0.1, v: d * 0.4, w: w * 0.7, d: 0.05, z: t.height + 1, h: 1, color: P.brick, k: 0, outline: null })
})

// --- the small things ------------------------------------------------------

/** Simple solids: a shape, a colour, and the same light as everything else. */
const SMALL = {
  mug: P.sky,
  papers: P.paper,
  bone: P.cream,
}
for (const [id, color] of Object.entries(SMALL)) {
  await write(id, (st, t) => st.box({ w: t.tiles.w, d: t.tiles.d, h: t.height, color, k: 0 }))
}

await write('bottle', (st, t) => {
  const { w, d } = t.tiles
  st.box({ w, d, h: t.height - 2, color: P.skyDark, k: 0 })
  st.box({ u: w * 0.25, v: d * 0.25, w: w * 0.5, d: d * 0.5, z: t.height - 2, h: 2, color: P.ink, k: 0 })
})

await write('powerstrip', (st, t) => {
  const { w, d } = t.tiles
  st.box({ w, d, h: t.height, color: P.paper, k: 0 })
  for (let u = 0.08; u < w - 0.08; u += 0.12) {
    st.box({ u, v: d * 0.3, w: 0.07, d: d * 0.4, z: t.height, h: 1, color: P.slate, k: 0, outline: null })
  }
})

await write('books', (st, t) => {
  const { w, d } = t.tiles
  const spines = [P.brick, P.leafDark, P.plum, P.gold]
  for (let i = 0; i < spines.length; i++) {
    st.box({
      u: (i * w) / spines.length,
      v: 0,
      w: w / spines.length - 0.02,
      d,
      h: t.height - (i % 2) * 2,
      color: spines[i],
      k: 1,
    })
  }
})

/** The burger-cat plush: a ginger cat wearing a bun. */
await write('plush', (st, t) => {
  const { w, d } = t.tiles
  st.box({ w, d, h: t.height - 4, color: P.ginger, k: 0 })       // the cat
  st.box({ u: 0.04, v: 0.04, w: w - 0.08, d: d - 0.08, z: t.height - 5, h: 2, color: P.leaf, k: 0 })  // lettuce
  st.box({ u: 0.02, v: 0.02, w: w - 0.04, d: d - 0.04, z: t.height - 3, h: 3, color: P.gold, k: 0 })  // the top bun
})

// --- things on the walls --------------------------------------------------

for (const id of ['window-left', 'window-right']) {
  await writeWall(id, (st) => {
    const a = st.along
    st.panel(0, a, 0, st.H, P.paper)                       // frame
    st.panel(0.08, a - 0.08, 4, st.H - 4, P.night)         // glass, after dark
    // what's outside: a streetlight and the tree in the driveway
    st.panel(a * 0.6, a * 0.72, st.H - 16, st.H - 8, P.gold)
    st.panel(0.18, a * 0.45, 6, 18, P.leafDark)
    // mullions
    st.panel(a / 2 - 0.03, a / 2 + 0.03, 4, st.H - 4, P.paper)
    st.panel(0.08, a - 0.08, st.H / 2 - 2, st.H / 2 + 2, P.paper)
    st.outline(0, a, 0, st.H)
  })
}

await writeWall('door', (st) => {
  const a = st.along
  st.panel(0, a, 0, st.H, P.tanDark)
  st.panel(0.08, a - 0.08, 2, st.H - 3, P.cream)
  st.panel(0.2, a - 0.2, st.H * 0.56, st.H - 10, P.tanDark)   // upper panel
  st.panel(0.26, a - 0.26, st.H * 0.59, st.H - 13, P.cream)
  st.panel(0.2, a - 0.2, 8, st.H * 0.48, P.tanDark)           // lower panel
  st.panel(0.26, a - 0.26, 11, st.H * 0.45, P.cream)
  st.panel(a - 0.3, a - 0.18, st.H * 0.5 - 2, st.H * 0.5 + 2, P.gold)  // handle
  st.outline(0, a, 0, st.H)
})

await writeWall('ligeti', (st) => {
  const a = st.along
  st.panel(0, a, 0, st.H, P.ink)                            // frame
  st.panel(0.06, a - 0.06, 3, st.H - 3, P.paper)
  // Wehinger's listening score reads as sweeps and clusters, not a grid of
  // dots: long smears of one colour, dense knots, and empty staves between.
  const cols = [P.brick, P.leafDark, P.gold, P.plum, P.skyDark, P.rose]
  let seed = 9173
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  for (let r = 0; r < 5; r++) {
    const y = 5 + r * 5
    st.panel(0.1, a - 0.1, y - 1, y, [228, 224, 216])        // the staff line
    let x = 0.1 + rnd() * 0.1
    while (x < a - 0.18) {
      const kind = rnd()
      const col = cols[Math.floor(rnd() * cols.length)]
      if (kind < 0.3) {
        const len = 0.1 + rnd() * 0.25                        // a smear
        st.panel(x, Math.min(x + len, a - 0.12), y, y + 2, col)
        x += len + 0.06
      } else if (kind < 0.7) {
        for (let k = 0; k < 3; k++) {                         // a cluster
          st.panel(x + k * 0.035, x + k * 0.035 + 0.025, y + (k % 2), y + 3 + (k % 2), col)
        }
        x += 0.14 + rnd() * 0.1
      } else {
        x += 0.1 + rnd() * 0.2                                // silence
      }
    }
  }
  st.outline(0, a, 0, st.H)
})

await writeWall('schiele', (st) => {
  const a = st.along
  st.panel(0, a, 0, st.H, P.ink)
  st.panel(0.04, a - 0.04, 2, st.H - 2, [22, 18, 16])        // the near-black ground
  // the ruff: a pale fan behind the head, which is the thing you recognise
  st.panel(a * 0.18, a * 0.84, st.H - 15, st.H - 3, P.cream)
  st.panel(a * 0.26, a * 0.76, st.H - 17, st.H - 13, P.rose)
  st.panel(a * 0.3, a * 0.7, st.H - 13, st.H - 5, [34, 26, 22])  // dark hair
  st.panel(a * 0.38, a * 0.62, st.H - 12, st.H - 7, P.clay)      // the face
  st.panel(a * 0.42, a * 0.58, st.H - 11, st.H - 10, P.brick)    // the mouth
  // the waistcoat, with its scatter of pale dots
  st.panel(a * 0.3, a * 0.7, 5, st.H - 15, P.shadow)
  for (let i = 0; i < 7; i++) {
    const x = a * (0.36 + (i % 3) * 0.1)
    st.panel(x, x + 0.03, 8 + i * 3, 10 + i * 3, P.cream)
  }
  st.outline(0, a, 0, st.H)
})

/** The Twin Peaks print: the red room's chevrons, and the figure. */
await writeWall('twin-peaks', (st) => {
  const a = st.along
  st.panel(0, a, 0, st.H, P.ink)
  st.panel(0.05, a - 0.05, 2, st.H - 2, P.brick)
  // zigzag bands top and bottom, the lodge floor
  for (const base of [st.H - 9, 3]) {
    for (let i = 0; i * 0.09 < a - 0.1; i++) {
      const x = 0.05 + i * 0.09
      const upper = i % 2 === 0
      st.panel(x, Math.min(x + 0.09, a - 0.05), base + (upper ? 3 : 0), base + (upper ? 6 : 3), P.cream)
      st.panel(x, Math.min(x + 0.09, a - 0.05), base + (upper ? 0 : 3), base + (upper ? 3 : 6), P.ink)
    }
  }
  // the figure, arms up
  st.panel(a * 0.42, a * 0.58, st.H * 0.4, st.H * 0.62, P.cream)
  st.panel(a * 0.3, a * 0.42, st.H * 0.55, st.H * 0.72, P.cream)
  st.panel(a * 0.58, a * 0.7, st.H * 0.55, st.H * 0.72, P.cream)
  st.outline(0, a, 0, st.H)
})

await writeWall('corkboard', (st) => {
  const a = st.along
  st.panel(0, a, 0, st.H, P.slate)                          // aluminium frame
  st.panel(0.08, a - 0.08, 3, st.H - 3, P.tanDark)          // cork
  st.panel(a * 0.55, a * 0.8, st.H * 0.45, st.H * 0.8, P.paper)  // the one pinned card
  st.outline(0, a, 0, st.H)
})

// Every thing in iso.ts that claims a sprite must have one. A missing file
// renders as a white box in the room and is easy to miss — this is cheaper
// than noticing it in a screenshot.
{
  const { existsSync } = await import('node:fs')
  const missing = isoThings.filter((t) => t.src && !existsSync(`public${t.src}`))
  if (missing.length) {
    console.error(`\nMISSING SPRITES:\n  ${missing.map((t) => `${t.id} -> ${t.src}`).join('\n  ')}`)
    process.exitCode = 1
  } else {
    console.log(`\nall ${isoThings.filter((t) => t.src).length} referenced sprites exist`)
  }
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
