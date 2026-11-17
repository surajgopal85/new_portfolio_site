'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { hotspots, site } from '@/content/site'
import { drawOrder, place, type Thing } from './room'
import { SURAJ } from '@/lib/characters'
import { teardown, unlock } from '@/lib/piano'
import styles from './scene.module.css'

const IDLE_HINT = 'Click something in the room.'

/**
 * What's on the monitor. It's the brightest thing in a night room, so it's
 * where the eye lands first — and it's the Projects link, so the default is
 * the overworld you'd land on: the navigation explains itself without a
 * label. The other two are there because a screen that never changes reads as
 * a painting of a screen.
 */
const SCREENS = ['map', 'code', 'cat'] as const
type Screen = (typeof SCREENS)[number]

export function Scene({ onLeave }: { onLeave: () => void }) {
  const [deskUp, setDeskUp] = useState(false)
  const [status, setStatus] = useState(IDLE_HINT)
  const [sound, setSound] = useState(false)
  const [screen, setScreen] = useState<Screen>('map')

  // The desk changes height on its own, the way a real standing desk does over
  // a workday — just faster.
  useEffect(() => {
    let timer: number
    const schedule = () => {
      timer = window.setTimeout(() => {
        setDeskUp((up) => !up)
        schedule()
      }, 12_000 + Math.random() * 18_000)
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [])

  // The screen changes on its own, mostly sitting on the map.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setScreen((current) => {
        if (current !== 'map') return 'map'
        return SCREENS[1 + Math.floor(Math.random() * (SCREENS.length - 1))]
      })
    }, 9000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (sound) unlock()
    else teardown()
    return () => teardown()
  }, [sound])

  const hint = (text: string) => ({
    onMouseEnter: () => setStatus(text),
    onMouseLeave: () => setStatus(IDLE_HINT),
    onFocus: () => setStatus(text),
    onBlur: () => setStatus(IDLE_HINT),
  })

  return (
    <>
      <div className={`${styles.frame} ${deskUp ? styles.deskUp : styles.deskDown}`}>
        <div className={styles.backWall} />
        <div className={styles.floor} />

        {/* Back to front. A thing's base sits on the floor, so draw order and
            vertical position agree, and characters can walk behind the desk. */}
        {drawOrder.map((thing, i) => {
          const spot = thing.hotspot ? hotspots.find((h) => h.id === thing.hotspot) : undefined
          const style = { ...place(thing), zIndex: 10 + i }
          const className = `${styles.thing} ${thing.rises ? styles.rises : ''}`

          if (spot) {
            return (
              <Link
                key={thing.id}
                href={spot.href}
                className={`${className} ${styles.hotspot}`}
                style={style}
                {...hint(spot.hint)}
              >
                <Placeholder thing={thing} screen={screen} />
                <span className={styles.hotspotLabel} aria-hidden="true">
                  {spot.label}
                </span>
                <span className="sr-only">{`${spot.label} — ${spot.object}`}</span>
              </Link>
            )
          }

          if (thing.id === 'desk-top') {
            // The desk isn't navigation; it's a toy.
            return (
              <button
                key={thing.id}
                type="button"
                className={`${className} ${styles.hotspot}`}
                style={style}
                aria-pressed={deskUp}
                onClick={() => setDeskUp((up) => !up)}
                {...hint(deskUp ? 'Sit back down?' : 'Raise the desk.')}
              >
                <Placeholder thing={thing} />
                <span className="sr-only">
                  {deskUp ? 'Lower the standing desk' : 'Raise the standing desk'}
                </span>
              </button>
            )
          }

          return (
            <div key={thing.id} className={className} style={style}>
              <Placeholder thing={thing} />
            </div>
          )
        })}

        {/* Suraj, at the desk, always. Drawn after the chair he's sitting in
            and before anything nearer the camera, so a visitor crossing the
            rug passes in front of him. */}
        <div
          className={`${styles.thing} ${styles.typing}`}
          style={{ ...place(SURAJ), zIndex: 10 + drawOrder.findIndex((t) => t.id === 'chair') }}
        >
          <span className={`${styles.ph} ${styles.ph_suraj}`} />
        </div>

        {/* Visitors mount here — one at a time. See lib/characters.ts, which
            is yours to write; until step() does something, nobody comes in. */}
      </div>

      <div className={styles.statusRow}>
        <p className={styles.status} role="status">
          {status}
        </p>
        <div className={styles.controls}>
          <button type="button" className="block-button" aria-pressed={sound} onClick={() => setSound((s) => !s)}>
            {sound ? 'Sound: on' : 'Sound: off'}
          </button>
          <button type="button" className="block-button" onClick={onLeave}>
            Plain version
          </button>
        </div>
      </div>

      {/* The room is decoration for a screen reader; the real list of links
          lives in the fallback, which is what the exported HTML ships. */}
      <nav aria-label="Pages" className="sr-only">
        {hotspots.map((spot) => (
          <Link key={spot.id} href={spot.href}>
            {spot.label}
          </Link>
        ))}
        <a href={`mailto:${site.email}`}>Email</a>
      </nav>
    </>
  )
}

/**
 * Stand-in art, in the same projection the real sprites will use: a lit top
 * face, a darker front face, a hard outline. Each branch dies when its thing
 * gets a real `src` in room.ts.
 */
function Placeholder({ thing, screen }: { thing: Thing; screen?: Screen }) {
  if (thing.src) return <img src={thing.src} alt="" />
  const cls = `${styles.ph} ${styles[`ph_${thing.id.replaceAll('-', '_')}`] ?? ''}`
  if (thing.id === 'monitor') {
    return (
      <span className={cls}>
        <span className={`${styles.screen} ${styles[`screen_${screen ?? 'map'}`]}`} />
      </span>
    )
  }
  return <span className={cls} />
}
