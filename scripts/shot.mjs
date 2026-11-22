#!/usr/bin/env node
/**
 * Screenshot the running site, so changes can be checked by looking at them
 * rather than inferred from the markup.
 *
 *   npm run shot                          # the landing page, scene mode
 *   npm run shot -- --path /projects/     # another route
 *   npm run shot -- --mode static         # force the plain version
 *   npm run shot -- --el .scene_frame     # just the scene, at native scale
 *   npm run shot -- --w 420               # phone width
 *
 * Needs a server running: `npm run dev` (live) or `npm run preview` (built).
 */
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import puppeteer from 'puppeteer'

const argv = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}

const base = flag('base', 'http://localhost:3000')
const path = flag('path', '/')
const mode = flag('mode', 'scene') // 'scene' | 'static' | 'auto'
const width = Number(flag('w', 1280))
const height = Number(flag('h', 800))
const out = flag('out', 'shots/shot.png')
const el = flag('el', null)
const settle = Number(flag('settle', 900))
const allow = Number(flag('allow', 0)) // a status that isn't an error here
const reduced = argv.includes('--reduced')

await mkdir(dirname(out), { recursive: true })

const browser = await puppeteer.launch({ headless: true })
try {
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 1 })

  /**
   * Headless Chrome reports `prefers-reduced-motion: reduce` by default,
   * which froze every CSS animation in every screenshot taken before this
   * was noticed — the desk transition, the fan shadow, the label fades.
   * Say what we mean instead of inheriting it.
   */
  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' },
  ])

  // The landing page decides which version to show from localStorage before
  // first paint, so set the override before any script runs.
  if (mode !== 'auto') {
    await page.evaluateOnNewDocument((m) => {
      try {
        localStorage.setItem('office:mode', m)
      } catch {}
    }, mode)
  }

  const url = new URL(path, base).href
  const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 20_000 })
  const status = response?.status() ?? 0
  if (!response?.ok() && status !== allow) throw new Error(`${url} returned ${status}`)

  // Let the CSS animations reach a representative frame.
  await new Promise((r) => setTimeout(r, settle))

  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))

  const target = el ? await page.$(el) : page
  if (!target) throw new Error(`no element matched ${el}`)
  await target.screenshot({ path: out })

  const title = await page.title()
  console.log(`${out}  ${width}x${height}  ${url}  ${status}  mode=${mode}  "${title}"`)
  if (errors.length) console.log('page errors:\n  ' + errors.join('\n  '))
} finally {
  await browser.close()
}
