#!/usr/bin/env node
/**
 * Accessibility and performance checks that don't need a human.
 *
 *   npm run audit            # against the dev server
 *   npm run audit -- --base http://localhost:3000
 *
 * Reports rather than asserts: it's a thing to read, not a gate.
 */
import puppeteer from 'puppeteer'

const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://localhost:3000'
const routes = ['/', '/projects/', '/writing/', '/now/', '/about/', '/contact/']
const browser = await puppeteer.launch({ headless: true })
const problems = []
const note = (s) => problems.push(s)

async function open(path, { mode = 'scene', width = 1280, reduceMotion = false } = {}) {
  const page = await browser.newPage()
  await page.setViewport({ width, height: 900 })
  if (reduceMotion) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.evaluateOnNewDocument((m) => { try { localStorage.setItem('office:mode', m) } catch {} }, mode)
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('response', (r) => { if (!r.ok() && r.status() !== 304) errors.push(`${r.status()} ${r.url()}`) })
  await page.goto(new URL(path, base).href, { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 300))
  return { page, errors }
}

console.log('=== keyboard path through the scene ===')
{
  const { page, errors } = await open('/')
  const stops = []
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab')
    const stop = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      // Next's dev overlay is focusable and is not part of the site.
      if (el.tagName.toLowerCase().startsWith('nextjs-')) return { skip: true }
      const style = getComputedStyle(el)
      // Prefer the accessible name: the scene's hotspots carry a visible
      // label marked aria-hidden plus an sr-only one, and textContent shows
      // both.
      const srOnly = el.querySelector('.sr-only')?.textContent?.trim()
      const name = el.getAttribute('aria-label') || srOnly || el.textContent?.trim().slice(0, 40) || el.tagName
      const box = el.getBoundingClientRect()
      return {
        name,
        tag: el.tagName.toLowerCase(),
        outline: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0,
        visible: box.width > 0 && box.height > 0,
      }
    })
    if (!stop) break
    if (stop.skip) continue
    stops.push(stop)
  }
  for (const s of stops) {
    console.log(`  ${s.tag.padEnd(7)} ${s.visible ? ' ' : '!'} ${s.outline ? 'focus-ring' : 'NO-RING   '}  ${s.name}`)
    if (!s.outline) note(`focus ring missing on <${s.tag}> "${s.name}"`)
    if (!s.visible) note(`focusable but zero-size: <${s.tag}> "${s.name}"`)
  }
  if (!stops.length) note('nothing is reachable by keyboard on the landing page')
  if (errors.length) note(`console errors on /: ${errors.join('; ')}`)
  await page.close()
}

console.log('\n=== reduced motion falls back to the plain version ===')
{
  const { page } = await open('/', { mode: 'auto', reduceMotion: true })
  const mode = await page.evaluate(() => document.documentElement.dataset.mode)
  console.log(`  data-mode = ${mode}`)
  if (mode !== 'static') note(`reduced motion gave mode="${mode}", expected "static"`)
  await page.close()
}

console.log('\n=== phone width (420px) ===')
// A post is the one page with a <pre> on it, which is where a narrow viewport
// overflows if the block isn't allowed to scroll on its own.
for (const [path, mode] of [['/', 'static'], ['/', 'scene'], ['/projects/', 'static'], ['/projects/talktor/', 'static'], ['/writing/', 'static'], ['/writing/when-not-to-use-an-llm/', 'static'], ['/now/', 'static']]) {
  const { page } = await open(path, { mode, width: 420 })
  const overflow = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    win: window.innerWidth,
    widest: [...document.querySelectorAll('body *')]
      .map((el) => ({ w: Math.round(el.getBoundingClientRect().right), t: el.tagName, c: el.className?.toString().slice(0, 30) }))
      .filter((e) => e.w > window.innerWidth + 1)
      .slice(0, 3),
  }))
  const ok = overflow.doc <= overflow.win + 1
  console.log(`  ${path} (${mode}): ${ok ? 'no overflow' : `OVERFLOW ${overflow.doc}px > ${overflow.win}px`}`)
  if (!ok) {
    note(`horizontal overflow at 420px on ${path} (${mode}): ${overflow.doc}px`)
    for (const w of overflow.widest) console.log(`      ${w.t} .${w.c} ends at ${w.w}px`)
  }
  await page.close()
}

console.log('\n=== headings, images, landmarks ===')
for (const path of routes) {
  const { page, errors } = await open(path, { mode: 'static' })
  const info = await page.evaluate(() => {
    const visible = (el) => el.getClientRects().length > 0
    const hs = [...document.querySelectorAll('h1,h2,h3,h4')].filter(visible).map((h) => +h.tagName[1])
    const imgs = [...document.querySelectorAll('img')].filter(visible)
    return {
      h1: hs.filter((n) => n === 1).length,
      skips: hs.some((n, i) => i > 0 && n - hs[i - 1] > 1),
      imgsNoAlt: imgs.filter((i) => i.getAttribute('alt') === null).length,
      main: document.querySelectorAll('main').length,
      title: document.title,
    }
  })
  console.log(`  ${path.padEnd(12)} h1=${info.h1} main=${info.main} imgs-without-alt=${info.imgsNoAlt}${info.skips ? ' HEADING-SKIP' : ''}  "${info.title}"`)
  if (info.h1 !== 1) note(`${path} has ${info.h1} visible <h1>`)
  if (info.main !== 1) note(`${path} has ${info.main} <main>`)
  if (info.imgsNoAlt) note(`${path} has ${info.imgsNoAlt} <img> with no alt attribute`)
  if (info.skips) note(`${path} skips a heading level`)
  if (errors.length) note(`console errors on ${path}: ${errors.join('; ')}`)
  await page.close()
}

console.log('\n=== weight of the landing page ===')
{
  const page = await browser.newPage()
  const seen = new Map()
  page.on('response', async (r) => {
    try {
      const len = Number(r.headers()['content-length'] ?? 0) || (await r.buffer()).length
      seen.set(r.url(), len)
    } catch {}
  })
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('office:mode', 'scene') } catch {} })
  await page.goto(new URL('/', base).href, { waitUntil: 'networkidle0' })
  const total = [...seen.values()].reduce((a, b) => a + b, 0)
  console.log(`  ${seen.size} requests, ${(total / 1024).toFixed(0)} KB total (dev server — production is smaller)`)
  await page.close()
}

console.log(problems.length ? `\n=== ${problems.length} PROBLEMS ===\n  ` + problems.join('\n  ') : '\n=== no problems found ===')
await browser.close()
