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
  credenza: { color: P.bark, k: 1 },
  futon: { color: P.night, k: 0 },
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
await write('desk', (st, t) => {
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

/** The office chair: a seat, a back, a post and a star base. */
await write('chair', (st, t) => {
  const { w, d } = t.tiles
  st.box({ u: w / 2 - 0.18, v: d / 2 - 0.18, w: 0.36, d: 0.36, h: 14, color: P.slate, k: 2 })
  st.box({ u: 0.1, v: 0.1, w: w - 0.2, d: d - 0.2, z: 14, h: 5, color: P.shadow, k: 0 })
  // the back, standing at the far edge
  st.box({ u: 0.1, v: 0.1, w: 0.25, d: d - 0.2, z: 19, h: t.height - 19, color: P.shadow, k: 1 })
})

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
  // Wehinger's score: rows of coloured marks on white
  const cols = [P.brick, P.leafDark, P.gold, P.plum, P.skyDark]
  for (let r = 0; r < 5; r++) {
    for (let i = 0; i < 7; i++) {
      const s0 = 0.1 + (i * (a - 0.2)) / 7
      st.panel(s0, s0 + 0.05 + (i % 3) * 0.02, 6 + r * 5, 9 + r * 5, cols[(r + i) % cols.length])
    }
  }
  st.outline(0, a, 0, st.H)
})

await writeWall('schiele', (st) => {
  const a = st.along
  st.panel(0, a, 0, st.H, P.ink)
  st.panel(0.05, a - 0.05, 2, st.H - 2, P.barkDark)         // the dark ground
  st.panel(a * 0.3, a * 0.72, st.H - 16, st.H - 5, P.cream) // the pale collar
  st.panel(a * 0.38, a * 0.62, st.H - 14, st.H - 8, P.clay) // the face
  st.panel(a * 0.36, a * 0.64, 4, st.H - 16, P.shadow)      // the waistcoat
  st.outline(0, a, 0, st.H)
})

await writeWall('corkboard', (st) => {
  const a = st.along
  st.panel(0, a, 0, st.H, P.slate)                          // aluminium frame
  st.panel(0.08, a - 0.08, 3, st.H - 3, P.tanDark)          // cork
  st.panel(a * 0.55, a * 0.8, st.H * 0.45, st.H * 0.8, P.paper)  // the one pinned card
  st.outline(0, a, 0, st.H)
})

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
