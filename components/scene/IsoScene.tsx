'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { hotspots } from '@/content/site'
import { KEYS, playNote, teardown, unlock } from '@/lib/piano'
import { SCENE_H, SCENE_W, isoThings, placeThing, sortKey, type IsoThing } from './iso'
import styles from './iso.module.css'

const IDLE_HINT = 'Click something in the room.'

/** Percentages, so the room scales to any width without resampling. */
function style(t: IsoThing, z: number) {
  const box = placeThing(t)
  return {
    left: `${(box.left / SCENE_W) * 100}%`,
    top: `${(box.top / SCENE_H) * 100}%`,
    width: `${(box.w / SCENE_W) * 100}%`,
    height: `${(box.h / SCENE_H) * 100}%`,
    zIndex: z,
  }
}

/** Things that stand on the desk and rise with it. */
const ON_DESK = new Set(['monitor', 'laptop'])

export function IsoScene({ onLeave }: { onLeave: () => void }) {
  const [deskUp, setDeskUp] = useState(false)
  const [status, setStatus] = useState(IDLE_HINT)
  const [sound, setSound] = useState(false)

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

  // Painter's order, then z-index from it. Paint order and DOM order stay
  // separate so the interactive things can be mounted in navigation order.
  const painted = [...isoThings].sort((a, b) => sortKey(a) - sortKey(b))
  const zOf = (t: IsoThing) => 10 + painted.indexOf(t)

  return (
    <>
      <div className={`${styles.frame} ${deskUp ? styles.deskUp : ''}`}>
        {painted.map((t) =>
          t.hotspot || t.id === 'desk' ? null : (
            <div
              key={t.id}
              className={`${styles.thing} ${ON_DESK.has(t.id) ? styles.rises : ''}`}
              style={style(t, zOf(t))}
            >
              {t.src && <img src={t.src} alt="" />}
            </div>
          ),
        )}

        {hotspots.map((spot) => {
          const t = painted.find((x) => x.hotspot === spot.id)
          if (!t) return null
          return (
            <Link
              key={t.id}
              href={spot.href}
              className={`${styles.thing} ${styles.hotspot} ${ON_DESK.has(t.id) ? styles.rises : ''}`}
              style={style(t, zOf(t))}
              {...hint(spot.hint)}
            >
              {t.src && <img src={t.src} alt="" />}

              {/* The piano plays on a pointer sweep; clicking still opens the
                  page, so the two never fight over one gesture. */}
              {t.id === 'piano' &&
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
              <span className="sr-only">{`${spot.label} — ${t.id}`}</span>
            </Link>
          )
        })}

        {/* The desk is last: it isn't navigation, it's a toy. */}
        {(() => {
          const desk = painted.find((t) => t.id === 'desk')
          if (!desk) return null
          return (
            <button
              type="button"
              className={`${styles.thing} ${styles.hotspot} ${styles.rises}`}
              style={style(desk, zOf(desk))}
              aria-pressed={deskUp}
              onClick={() => setDeskUp((up) => !up)}
              {...hint(deskUp ? 'Sit back down?' : 'Raise the desk.')}
            >
              {desk.src && <img src={desk.src} alt="" />}
              <span className="sr-only">
                {deskUp ? 'Lower the standing desk' : 'Raise the standing desk'}
              </span>
            </button>
          )
        })()}

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
    </>
  )
}
