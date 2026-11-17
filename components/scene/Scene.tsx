'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { hotspots, site } from '@/content/site'
import { hotspotBoxes, layers, type Layer } from './layers'
import { teardown, unlock } from '@/lib/piano'
import styles from './scene.module.css'

const IDLE_HINT = 'Click something in the room.'

export function Scene({ onLeave }: { onLeave: () => void }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [deskUp, setDeskUp] = useState(false)
  const [status, setStatus] = useState(IDLE_HINT)
  const [sound, setSound] = useState(false)

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

  useEffect(() => {
    if (sound) unlock()
    else teardown()
    return () => teardown()
  }, [sound])

  // Parallax is written straight to a CSS variable so pointer movement never
  // triggers a React render.
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = frameRef.current
    if (!el) return
    const box = el.getBoundingClientRect()
    const mx = (e.clientX - box.left) / box.width - 0.5
    const my = (e.clientY - box.top) / box.height - 0.5
    el.style.setProperty('--mx', mx.toFixed(3))
    el.style.setProperty('--my', my.toFixed(3))
  }, [])

  return (
    <>
      <div
        ref={frameRef}
        className={`${styles.frame} ${deskUp ? styles.deskUp : styles.deskDown}`}
        onPointerMove={onPointerMove}
        onPointerLeave={() => {
          frameRef.current?.style.setProperty('--mx', '0')
          frameRef.current?.style.setProperty('--my', '0')
        }}
      >
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`${styles.layer} ${layer.rises ? styles.rises : ''}`}
            style={{
              zIndex: layer.z,
              transform: layer.parallax
                ? `translate3d(calc(var(--mx, 0) * ${layer.parallax * 24}px), calc(var(--my, 0) * ${layer.parallax * 12}px), 0)`
                : undefined,
            }}
          >
            {layer.src ? <img src={layer.src} alt="" /> : <Placeholder layer={layer} />}
          </div>
        ))}

        {/* Nav. One button per object in the room, sitting above every layer. */}
        <div className={styles.layer} style={{ zIndex: 20, pointerEvents: 'auto' }}>
          {hotspots.map((spot) => {
            const box = hotspotBoxes[spot.id]
            return (
              <Link
                key={spot.id}
                href={spot.href}
                className={styles.hotspot}
                style={{ left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }}
                onMouseEnter={() => setStatus(spot.hint)}
                onMouseLeave={() => setStatus(IDLE_HINT)}
                onFocus={() => setStatus(spot.hint)}
                onBlur={() => setStatus(IDLE_HINT)}
              >
                <span className={styles.hotspotLabel} aria-hidden="true">
                  {spot.label}
                </span>
                <span className="sr-only">{`${spot.label} — ${spot.object}`}</span>
              </Link>
            )
          })}

          {/* The desk itself isn't navigation; it's a toy. */}
          <button
            type="button"
            className={styles.hotspot}
            style={{ left: '34%', top: '50%', width: '34%', height: '6%' }}
            aria-pressed={deskUp}
            onClick={() => setDeskUp((up) => !up)}
            onMouseEnter={() => setStatus(deskUp ? 'Sit back down?' : 'Raise the desk.')}
            onMouseLeave={() => setStatus(IDLE_HINT)}
            onFocus={() => setStatus(deskUp ? 'Sit back down?' : 'Raise the desk.')}
            onBlur={() => setStatus(IDLE_HINT)}
          >
            <span className="sr-only">{deskUp ? 'Lower the standing desk' : 'Raise the standing desk'}</span>
          </button>
        </div>
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
 * Stand-in art. Every branch here dies the moment the matching layer in
 * layers.ts gets a real `src`.
 */
function Placeholder({ layer }: { layer: Layer }) {
  switch (layer.id) {
    case 'wall':
      return (
        <>
          <div className={`${styles.ph} ${styles.phWall}`} />
          <div className={`${styles.ph} ${styles.phWallLower}`} />
        </>
      )
    case 'window':
      return (
        <div className={`${styles.ph} ${styles.phWindow}`}>
          <div className={styles.phHill} />
          <div className={styles.phWindowBar} />
        </div>
      )
    case 'shelf':
      return (
        <div className={`${styles.ph} ${styles.phShelf}`}>
          {[
            { left: '6%', background: 'var(--brick)' },
            { left: '16%', background: 'var(--leaf-dark)' },
            { left: '26%', background: 'var(--gold)' },
            { left: '36%', background: 'var(--plum)' },
          ].map((book) => (
            <div key={book.left} className={styles.phBook} style={book} />
          ))}
        </div>
      )
    case 'door':
      return (
        <div className={`${styles.ph} ${styles.phDoor}`}>
          <div className={styles.phKnob} />
        </div>
      )
    case 'floor':
      return (
        <>
          <div className={`${styles.ph} ${styles.phFloor}`} />
          <div className={`${styles.ph} ${styles.phRug}`} />
        </>
      )
    case 'piano':
      return (
        <div className={`${styles.ph} ${styles.phPiano}`}>
          <div className={styles.phKeys}>
            {Array.from({ length: 11 }, (_, i) => (
              <div key={i} className={styles.phKeyLine} style={{ left: `${((i + 1) / 12) * 100}%` }} />
            ))}
          </div>
        </div>
      )
    case 'desk-frame':
      return (
        <>
          <div className={`${styles.ph} ${styles.phDeskLeg}`} style={{ left: '36%' }} />
          <div className={`${styles.ph} ${styles.phDeskLeg}`} style={{ left: '63%' }} />
        </>
      )
    case 'desk-top':
      return (
        <>
          <div className={`${styles.ph} ${styles.phDeskTop}`} />
          <div className={`${styles.ph} ${styles.phMug}`} />
        </>
      )
    case 'monitor':
      return (
        <div className={`${styles.ph} ${styles.phMonitor}`}>
          <div className={styles.phScreen} />
          <div className={styles.phStand} />
        </div>
      )
    case 'keyboard':
      return <div className={`${styles.ph} ${styles.phKbd}`} />
    default:
      return null
  }
}
