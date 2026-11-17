'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { hotspots } from '@/content/site'
import { drawOrder, place, type Thing } from './room'
import { SURAJ } from '@/lib/characters'
import { KEYS, playNote, teardown, unlock } from '@/lib/piano'
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

  /** A prop: painted, never focusable. */
  const prop = (thing: Thing, i: number) => (
    <div
      key={thing.id}
      className={`${styles.thing} ${thing.rises ? styles.rises : ''}`}
      style={{ ...place(thing), zIndex: zOf(thing, i) }}
    >
      <Placeholder thing={thing} screen={screen} />
    </div>
  )

  return (
    <>
      <div className={`${styles.frame} ${deskUp ? styles.deskUp : styles.deskDown}`}>
        <div className={styles.backWall} />
        <div className={styles.floor} />

        {/* Back to front: a thing's base sits on the floor, so paint order
            and vertical position agree and a visitor can walk behind the
            desk.

            Paint order and DOM order are deliberately separate. z-index is
            explicit, which lets the interactive things mount afterwards in
            navigation order — otherwise Tab walks the room by depth, which
            means nothing to someone who can't see it. */}
        {drawOrder.map((thing, i) =>
          thing.hotspot || thing.id === 'desk-top' ? null : prop(thing, i),
        )}

        {/* The navigation, in the order the nav lists it. */}
        {hotspots.map((spot) => {
          const thing = drawOrder.find((t) => t.hotspot === spot.id)
          if (!thing) return null
          return (
            <Link
              key={thing.id}
              href={spot.href}
              className={`${styles.thing} ${thing.rises ? styles.rises : ''} ${styles.hotspot}`}
              style={{ ...place(thing), zIndex: zOf(thing, drawOrder.indexOf(thing)) }}
              {...hint(spot.hint)}
            >
              <Placeholder thing={thing} screen={screen} />

              {/* The piano plays when a pointer sweeps across it, which is
                  why the notes are pentatonic — there's no wrong order.
                  Clicking still opens the page; the keys only make sound, so
                  the two never fight over one gesture. */}
              {thing.id === 'piano' &&
                sound &&
                KEYS.map((semitone, i) => (
                  <span
                    key={semitone}
                    className={styles.key}
                    aria-hidden="true"
                    style={{ left: `${(i / KEYS.length) * 100}%`, width: `${100 / KEYS.length}%` }}
                    onPointerEnter={() => playNote(semitone)}
                  />
                ))}

              <span className={styles.hotspotLabel} aria-hidden="true">
                {spot.label}
              </span>
              <span className="sr-only">{`${spot.label} — ${spot.object}`}</span>
            </Link>
          )
        })}

        {/* The desk comes last. It isn't navigation, it's a toy. */}
        {(() => {
          const desk = drawOrder.find((t) => t.id === 'desk-top')
          if (!desk) return null
          return (
            <button
              type="button"
              className={`${styles.thing} ${styles.rises} ${styles.hotspot}`}
              style={{ ...place(desk), zIndex: zOf(desk, drawOrder.indexOf(desk)) }}
              aria-pressed={deskUp}
              onClick={() => setDeskUp((up) => !up)}
              {...hint(deskUp ? 'Sit back down?' : 'Raise the desk.')}
            >
              <Placeholder thing={desk} />
              <span className="sr-only">
                {deskUp ? 'Lower the standing desk' : 'Raise the standing desk'}
              </span>
            </button>
          )
        })()}

        {/* Suraj, at the desk, always. Drawn with the chair he's sitting in,
            so a visitor crossing the rug passes in front of him. */}
        <div
          className={`${styles.thing} ${styles.typing}`}
          style={{ ...place(SURAJ), zIndex: 10 + drawOrder.findIndex((t) => t.id === 'chair') }}
        >
          <span className={`${styles.ph} ${styles.ph_suraj}`} />
        </div>

        {/* Visitors mount here — one at a time. See lib/characters.ts, which
            is yours to write; until step() does something, nobody comes in. */}

        {/* Night. Everything above is painted in daylight colors; this is the
            light falling on it. */}
        <div className={styles.light} />
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

      {/* No duplicate sr-only nav: the hotspots above are real links, mounted
          in navigation order, each carrying its own accessible name. */}
    </>
  )
}

/** The monitor glows, so it sits above the night wash. */
function zOf(thing: Thing, i: number): number {
  return thing.id === 'monitor' ? 70 : 10 + i
}

function Placeholder({ thing, screen }: { thing: Thing; screen?: Screen }) {
  // The monitor's bezel is a sprite with a transparent screen; what's on
  // screen renders behind it, so the art and the live content stay separate.
  if (thing.id === 'monitor') {
    return (
      <span className={styles.monitor}>
        <span className={`${styles.screen} ${styles[`screen_${screen ?? 'map'}`]}`} />
        {thing.src && <img src={thing.src} alt="" />}
      </span>
    )
  }
  if (thing.src) return <img src={thing.src} alt="" />
  return <span className={`${styles.ph} ${styles[`ph_${thing.id.replaceAll('-', '_')}`] ?? ''}`} />
}
