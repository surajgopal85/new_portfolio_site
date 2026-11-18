#!/usr/bin/env node
/**
 * Kibou, in ten frames.
 *
 *   npm run kibou                  # write public/art/characters/kibou-*.png
 *   npm run kibou -- --sheet x.png # and a contact sheet to look at
 *
 * Hand-plotted rather than built from boxes: at eleven pixels tall a cat is
 * all silhouette, and the box primitive that draws the furniture would give
 * a ginger brick. Each frame is a string grid, one character per pixel.
 *
 * This is a first pass and it knows it. What makes Kibou *Kibou* — the
 * plume tail, the orange cap breaking over a white blaze, the ear tufts —
 * is exactly what gets lost at this size by anyone writing code and found
 * by someone drawing. Repaint these in Aseprite and drop them back in; the
 * scene reads the PNGs and nothing else needs to change.
 *
 * Reference: photos/raw/kibou/.
 */
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const C = {
  '.': null,                       // transparent
  K: [26, 20, 32],                 // outline
  O: [207, 138, 78],               // ginger
  D: [122, 78, 46],                // ginger in shadow
  W: [246, 236, 216],              // white fur
  S: [205, 176, 138],              // white fur, shaded
  P: [217, 140, 160],              // nose
  Y: [79, 158, 74],                // eye
}

const FRAME_W = 20
const FRAME_H = 16

/**
 * Body and head, down-right: walking toward the camera, face visible.
 *
 * He's an orange-AND-white cat, and that split is what makes him himself at
 * this size. Orange is a cap over the head and ears and a saddle over the
 * back; white is the blaze up the muzzle, the bib, the belly, the socks and
 * the tail tip. A sprite that's ginger all over is just a ginger cat.
 *
 * The head sits a clear five rows above the back so there's a neck notch —
 * without it a cat this small reads as a dachshund.
 */
const BODY_DOWN = [
  '.KKK................',
  '.KWWK...............',
  '.KWOK........KK.KK..',
  '.KOOK.......KOOKOOK.',
  '.KOOK......KOOOOOOK.',
  '.KOOK.....KOWWWWWOK.',
  '..KOOKKKKKOWWPWYWOK.',
  '..KOOOOOOOOOWWWWWK..',
  '..KOOOOOOOOOOOOOK...',
  '..KWWWWWWWWWWWWK....',
]

/** Body and head, up-right: walking away, so it's back, ears and plume. */
const BODY_UP = [
  '.KKK................',
  '.KWWK...............',
  '.KWOK........KK.KK..',
  '.KOOK.......KODKDOK.',
  '.KOOK......KOOOOOOK.',
  '.KOOK.....KOOOOOOOK.',
  '..KOOKKKKKOOODDOOOK.',
  '..KOOOOOOOOOOOOOOK..',
  '..KOOOOOOOOOOOOOK...',
  '..KWOOOOOOOOOOWK....',
]

/**
 * Two leg positions, alternating. Two pixels wide with a white sock and a
 * paw a pixel wider than the leg — a cat at this size is a shape with feet,
 * not a loaf on pins.
 */
const LEGS = [
  ['..KKK........KKK....', '..KOOK.......KOOK...', '..KWWK.......KWWK...'],
  ['...KKK......KKK.....', '...KOOK.....KOOK....', '...KWWK.....KWWK....'],
  ['..KKK.........KKK...', '..KOOK........KOOK..', '..KWWK........KWWK..'],
  ['...KKK......KKK.....', '...KOOK.....KOOK....', '...KWWK.....KWWK....'],
]

/** Sitting, facing down-right. The settled pose, with the tail curled round. */
const SIT = [
  [
    '........KK.KK.......',
    '.......KOOKOOK......',
    '.......KOOOOOOK.....',
    '......KOWWWWWWOK....',
    '......KOWYWPWYWK....',
    '.......KWWWWWWK.....',
    '......KOWWWWWOK.....',
    '.....KOWWWWWWOK.....',
    '.....KOWWWWWWOK.....',
    '....KKOWWWWWWOK.....',
    '...KWWKWWWWWWKK.....',
    '...KWOKKWWWWWK......',
    '....KKK.KWWKK.......',
  ],
  [
    '....................',
    '........KK.KK.......',
    '.......KOOKOOK......',
    '.......KOOOOOOK.....',
    '......KOWWWWWWOK....',
    '......KOWYWPWYWK....',
    '.......KWWWWWWK.....',
    '......KOWWWWWOK.....',
    '.....KOWWWWWWOK.....',
    '.....KOWWWWWWOK.....',
    '....KKOWWWWWWOK.....',
    '...KWWKWWWWWWKK.....',
    '...KWOKKWWWWWK......',
    '....KKK.KWWKK.......',
  ],
]

function drawRows(data, rows, offsetX, offsetY, stripW) {
  rows.forEach((row, y) => {
    ;[...row].forEach((ch, x) => {
      const col = C[ch]
      if (!col) return
      const px = offsetX + x
      const py = offsetY + y
      const i = (py * stripW + px) * 4
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = 255
    })
  })
}

/** One horizontal strip, frames evenly spaced, transparent between them. */
async function strip(name, frames) {
  const w = FRAME_W * frames.length
  const data = new Uint8ClampedArray(w * FRAME_H * 4)
  frames.forEach((rows, i) => {
    // Sit upright on the frame's bottom edge, whatever the pose's height.
    drawRows(data, rows, i * FRAME_W, FRAME_H - rows.length, w)
  })
  const out = `public/art/characters/${name}.png`
  await sharp(Buffer.from(data.buffer), { raw: { width: w, height: FRAME_H, channels: 4 } })
    .png()
    .toFile(out)
  console.log(`${out}  ${w}x${FRAME_H}  ${frames.length} frames`)
  return { name, out, w }
}

await mkdir('public/art/characters', { recursive: true })

// A one-pixel bob on the off-beats, which is what sells a walk.
const walk = (body) =>
  LEGS.map((legs, i) => {
    const bob = i % 2 === 1 ? [''] : []
    return [...bob, ...body, ...legs]
  })

const written = [
  await strip('kibou-down-right', walk(BODY_DOWN)),
  await strip('kibou-up-right', walk(BODY_UP)),
  await strip('kibou-sit', SIT),
]

if (process.argv.includes('--sheet')) {
  const path = process.argv[process.argv.indexOf('--sheet') + 1]
  const Z = 8
  const comps = []
  for (const [i, s] of written.entries()) {
    comps.push({
      input: await sharp(s.out).resize({ width: s.w * Z, kernel: 'nearest' }).toBuffer(),
      left: 8,
      top: 8 + i * (FRAME_H * Z + 8),
    })
  }
  await sharp({
    create: {
      width: Math.max(...written.map((s) => s.w)) * Z + 16,
      height: written.length * (FRAME_H * Z + 8) + 8,
      channels: 4,
      background: '#6b5340',
    },
  })
    .composite(comps)
    .png()
    .toFile(path)
  console.log(`${path}`)
}
