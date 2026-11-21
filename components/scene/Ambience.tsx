'use client'

import { LAYER, LAYER_Z, SCENE_H, SCENE_W, isoThings, placeThing, toScreen } from './iso'
import styles from './iso.module.css'

/**
 * The small movements that make a room look lived in rather than painted.
 *
 * Every one of these is CSS over an existing sprite — no new art, and
 * nothing that has to be kept in sync with a frame counter.
 *
 * The rule they all follow: **slow and small**. A room where six things
 * twitch reads as a screensaver; a room where one thing moves every few
 * seconds reads as alive. The periods below are deliberately coprime-ish so
 * they never fall into step with each other, which is the thing that gives
 * away a loop.
 */

/** Place a box over an existing thing, in percentages of the scene. */
function over(id: string, inset = 0) {
  const thing = isoThings.find((t) => t.id === id)
  if (!thing) return null
  const box = placeThing(thing)
  return {
    left: `${((box.left + inset) / SCENE_W) * 100}%`,
    top: `${((box.top + inset) / SCENE_H) * 100}%`,
    width: `${((box.w - inset * 2) / SCENE_W) * 100}%`,
    height: `${((box.h - inset * 2) / SCENE_H) * 100}%`,
  }
}

export function Ambience() {
  const monitor = over('monitor')
  const amp = over('amp')
  const mug = over('mug')
  const windows = ['window-left', 'window-right'].map((id) => over(id))

  // The ceiling fan is above the camera, so what you see of it is its
  // shadow turning on the floor. It existed in the top-down room, was
  // approved, and then disappeared as collateral when that file was
  // deleted for the isometric rewrite — never a decision, just a loss.
  const fanCentre = toScreen({ gx: 4.6, gy: 4.6 })
  const fanW = 104
  const fanH = 52

  return (
    <>
      <div
        className={styles.fanShadow}
        style={{
          left: `${((fanCentre.x - fanW / 2) / SCENE_W) * 100}%`,
          top: `${((fanCentre.y - fanH / 2) / SCENE_H) * 100}%`,
          width: `${(fanW / SCENE_W) * 100}%`,
          height: `${(fanH / SCENE_H) * 100}%`,
          zIndex: LAYER_Z[LAYER.floor] + 20,
        }}
        aria-hidden="true"
      />

      {/* The monitor breathes. Real screens aren't a constant — but a
          flicker fast enough to notice is a fault, not a detail. */}
      {monitor && (
        <div
          className={styles.monitorGlow}
          style={{ ...monitor, zIndex: LAYER_Z[LAYER.objects] + 80 }}
          aria-hidden="true"
        />
      )}

      {/* Streetlight through the glass, drifting. */}
      {windows.map((box, i) =>
        box ? (
          <div
            key={i}
            className={styles.windowDrift}
            style={{ ...box, zIndex: LAYER_Z[LAYER.wall] + 8, animationDelay: `${i * 3.5}s` }}
            aria-hidden="true"
          />
        ) : null,
      )}

      {/* The amp's standby light. Mostly on, with the occasional dip —
          which is what an LED on an old amp actually does. */}
      {amp && (
        <div
          className={styles.ampLed}
          style={{
            left: `calc(${amp.left} + ${(6 / SCENE_W) * 100}%)`,
            top: `calc(${amp.top} + ${(6 / SCENE_H) * 100}%)`,
            zIndex: LAYER_Z[LAYER.objects] + 80,
          }}
          aria-hidden="true"
        />
      )}

      {/* Steam off the mug, because the room is meant to be warm. */}
      {mug && (
        <div
          className={styles.steam}
          style={{
            left: `calc(${mug.left} + ${(1 / SCENE_W) * 100}%)`,
            top: `calc(${mug.top} - ${(5 / SCENE_H) * 100}%)`,
            zIndex: LAYER_Z[LAYER.objects] + 80,
          }}
          aria-hidden="true"
        >
          <span />
          <span />
        </div>
      )}
    </>
  )
}
