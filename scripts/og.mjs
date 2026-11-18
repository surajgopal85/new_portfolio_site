#!/usr/bin/env node
/**
 * The social preview image, rendered from the real scene rather than drawn
 * separately — so it can never show a room that no longer exists.
 *
 *   npm run og          # needs a server running (npm run dev)
 *
 * Writes public/og.png at 1200x630, which is what every platform crops to.
 */
import { readFile } from 'node:fs/promises'
import puppeteer from 'puppeteer'
import sharp from 'sharp'

const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://localhost:3000'
const OUT = 'public/og.png'
const W = 1200
const H = 630

const site = await readFile('content/site.ts', 'utf8')
const name = site.match(/name: '([^']+)'/)?.[1] ?? 'Suraj Gopal'
const role = site.match(/role: '([^']+)'/)?.[1] ?? 'Software engineer'

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 1360, height: 900, deviceScaleFactor: 1 })
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem('office:mode', 'scene') } catch {}
})
await page.goto(new URL('/', base).href, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 800))

const frame = await page.$('[class*="frame"]')
if (!frame) throw new Error('no scene frame found — is the server running?')
const shot = await frame.screenshot()
await browser.close()

// The scene is 16:9 and the card is 1.9:1, so the room is widened to the card
// rather than letterboxed: a bar of background would read as a broken image.
const room = await sharp(shot).resize({ width: W, height: H, fit: 'cover', position: 'top' }).toBuffer()

const plate = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <style>
    .n { font: 700 54px ui-monospace, "SF Mono", Menlo, monospace; fill: #f6ecd8 }
    .r { font: 400 26px ui-monospace, "SF Mono", Menlo, monospace; fill: #cdb08a; letter-spacing: 3px }
  </style>
  <rect x="0" y="${H - 150}" width="${W}" height="150" fill="#1a1420" fill-opacity="0.82"/>
  <rect x="0" y="${H - 153}" width="${W}" height="3" fill="#f2c14e"/>
  <text class="n" x="56" y="${H - 84}">${name}</text>
  <text class="r" x="58" y="${H - 44}">${role.toUpperCase()}</text>
</svg>`)

// Palette PNG: the scene is flat pixel art plus a lighting gradient, so 128
// colours is indistinguishable here and roughly a third of the bytes.
await sharp(room)
  .composite([{ input: plate, top: 0, left: 0 }])
  .png({ compressionLevel: 9, palette: true, colours: 128, dither: 0.4 })
  .toFile(OUT)

const { size } = await sharp(OUT).metadata().then(async (m) => ({ ...m, size: (await readFile(OUT)).length }))
console.log(`${OUT}  ${W}x${H}  ${(size / 1024).toFixed(0)} KB`)
