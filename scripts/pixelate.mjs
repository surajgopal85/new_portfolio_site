#!/usr/bin/env node
/**
 * photo -> downscale -> limited palette.
 *
 * This gets you to a base layer fast; the polish is hand work in Aseprite or
 * Piskel afterwards. Expect to redraw edges — a quantized photo always reads as
 * a quantized photo until a human fixes the silhouettes.
 *
 *   npm run pixelate -- photos/raw/office.jpg --width 384 --dither --preview 4
 *
 * Options
 *   --width <n>     target width in art pixels (default 384, the scene width)
 *   --crop a,b,c,d  crop before downscaling, as fractions of the photo:
 *                   left,top,right,bottom. Use it to cut one character out of
 *                   a photo — a sprite quantized from a full frame wastes most
 *                   of its pixels on the room behind it.
 *   --group <name>  quantize against one group from the palette file ("fur",
 *                   "room", "outside") instead of all 20 colors. A cat matched
 *                   against the whole palette picks up sky blue in its
 *                   shadows.
 *   --out <path>    output PNG (default public/art/<name>.png)
 *   --palette <p>   palette JSON (default scripts/palette.json)
 *   --dither        Floyd-Steinberg error diffusion; better for photos with
 *                   gradients, worse for anything you plan to hand-edit
 *   --preview <n>   also write <out>.preview.png upscaled n times, for eyeballing
 *   --no-quantize   downscale only, keep full color (useful for tracing over)
 */
import { basename, dirname, extname, join } from 'node:path'
import { mkdir, readFile } from 'node:fs/promises'
import sharp from 'sharp'

const argv = process.argv.slice(2)
const input = argv.find((a) => !a.startsWith('-'))
if (!input) {
  console.error('usage: npm run pixelate -- <photo> [--width 384] [--dither] [--preview 4]')
  process.exit(1)
}

const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}
const has = (name) => argv.includes(`--${name}`)

const width = Number(flag('width', 384))
const quantize = !has('no-quantize')
const dither = has('dither')
const preview = Number(flag('preview', 0))
const out = flag('out', join('public/art', `${basename(input, extname(input))}.png`))

const paletteFile = JSON.parse(await readFile(flag('palette', 'scripts/palette.json'), 'utf8'))
const group = flag('group', null)
if (group && !paletteFile.groups?.[group]) {
  console.error(`unknown palette group "${group}" — try ${Object.keys(paletteFile.groups ?? {}).join(', ')}`)
  process.exit(1)
}
const palette = quantize ? (group ? paletteFile.groups[group] : paletteFile.colors).map(hexToRgb) : []

// Apply the EXIF orientation first and bake it in. Phone photos are almost
// always stored sideways with an orientation flag, and every later step here
// works on raw pixels, where that flag no longer exists.
const upright = await sharp(input).rotate().toBuffer()
const source = sharp(upright)

const crop = flag('crop', null)
if (crop) {
  const [x0, y0, x1, y1] = crop.split(',').map(Number)
  const meta = await sharp(upright).metadata()
  source.extract({
    left: Math.round(x0 * meta.width),
    top: Math.round(y0 * meta.height),
    width: Math.round((x1 - x0) * meta.width),
    height: Math.round((y1 - y0) * meta.height),
  })
}

// Nearest neighbour on the way down: anything smoother invents colors that
// aren't in the palette and blurs the edges you're about to hand-clean.
const { data, info } = await source
  .resize({ width, kernel: 'nearest' })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

if (quantize) {
  if (dither) ditherToPalette(data, info.width, info.height, palette)
  else mapToPalette(data, palette)
}

await mkdir(dirname(out), { recursive: true })
const png = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png({
  compressionLevel: 9,
  palette: true,
})
await png.toFile(out)
console.log(
  `${out}  ${info.width}x${info.height}` +
    (quantize ? `  ${palette.length} colors${group ? ` (${group})` : ''}${dither ? ' dithered' : ''}` : '  full color'),
)

if (preview > 1) {
  const previewPath = out.replace(/\.png$/, `.preview.png`)
  await sharp(out)
    .resize({ width: info.width * preview, kernel: 'nearest' })
    .toFile(previewPath)
  console.log(`${previewPath}  ${info.width * preview}x${info.height * preview}`)
}

function mapToPalette(buf, colors) {
  for (let i = 0; i < buf.length; i += 4) {
    if (buf[i + 3] < 128) {
      buf[i + 3] = 0
      continue
    }
    const [r, g, b] = nearest(buf[i], buf[i + 1], buf[i + 2], colors)
    buf[i] = r
    buf[i + 1] = g
    buf[i + 2] = b
    buf[i + 3] = 255
  }
}

function ditherToPalette(buf, w, h, colors) {
  // Work in floats so the quantization error can be pushed into neighbours
  // without clipping at every step.
  const err = Float32Array.from(buf)
  const spread = [
    [1, 0, 7 / 16],
    [-1, 1, 3 / 16],
    [0, 1, 5 / 16],
    [1, 1, 1 / 16],
  ]

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (buf[i + 3] < 128) {
        buf[i + 3] = 0
        continue
      }
      const old = [err[i], err[i + 1], err[i + 2]]
      const pick = nearest(old[0], old[1], old[2], colors)
      buf[i] = pick[0]
      buf[i + 1] = pick[1]
      buf[i + 2] = pick[2]
      buf[i + 3] = 255

      for (const [dx, dy, weight] of spread) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || nx >= w || ny >= h) continue
        const j = (ny * w + nx) * 4
        for (let c = 0; c < 3; c++) err[j + c] += (old[c] - pick[c]) * weight
      }
    }
  }
}

/** Luma-weighted distance. Cheap, and close enough for 16 colors. */
function nearest(r, g, b, colors) {
  let best = colors[0]
  let bestDist = Infinity
  for (const c of colors) {
    const dr = r - c[0]
    const dg = g - c[1]
    const db = b - c[2]
    const dist = 0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db
    if (dist < bestDist) {
      bestDist = dist
      best = c
    }
  }
  return best
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
