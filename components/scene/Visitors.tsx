'use client'

import { useEffect, useRef, useState } from 'react'
import {
  startSchedule,
  tickSchedule,
  visits,
  type CharacterId,
  type CharacterState,
  type Schedule,
} from '@/lib/characters'
import { LAYER, LAYER_Z, SCENE_H, SCENE_W, toScreen } from './iso'
import styles from './iso.module.css'

/**
 * Who has sprites. A character configured in characters.ts but not listed
 * here is never scheduled — so the other two can sit in the file, fully
 * described, until someone draws them.
 */
const SPRITES: Partial<
  Record<CharacterId, { down: string; up: string; sit: string; walkFrames: number; sitFrames: number }>
> = {
  kibou: {
    down: '/art/characters/kibou-down-right.png',
    up: '/art/characters/kibou-up-right.png',
    sit: '/art/characters/kibou-sit.png',
    walkFrames: 4,
    sitFrames: 2,
  },
}

/** Frame size in art pixels — see scripts/kibou.mjs. */
const FRAME_W = 20
const FRAME_H = 16

const eligible = visits.filter((v) => SPRITES[v.id])

/**
 * Runs the schedule on an animation frame. One visitor at a time; see
 * lib/characters.ts for why that's a single slot rather than three timers.
 */
function useSchedule(): Schedule {
  const [schedule, setSchedule] = useState<Schedule>(() => startSchedule(2000))
  const raf = useRef(0)
  const last = useRef(0)

  useEffect(() => {
    if (eligible.length === 0) return
    const frame = (now: number) => {
      const elapsed = last.current ? Math.min(now - last.current, 100) : 16
      last.current = now
      setSchedule((s) => tickSchedule(s, eligible, elapsed))
      raf.current = requestAnimationFrame(frame)
    }
    raf.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  return schedule
}

/**
 * One visitor, drawn from a sprite strip.
 *
 * Only two directions are drawn; the other two are these mirrored, which is
 * lossless on a whole-pixel sprite and halves the art. See
 * docs/characters.md.
 */
function Visitor({ state, zIndex }: { state: CharacterState; zIndex: number }) {
  const sprite = SPRITES[state.id]
  if (!sprite) return null

  const sitting = state.phase === 'settled'
  const strip = sitting ? sprite.sit : state.facing.startsWith('up') ? sprite.up : sprite.down
  const count = sitting ? sprite.sitFrames : sprite.walkFrames
  const frame = Math.min(state.frame, count - 1)
  const mirrored = state.facing.endsWith('left')

  const base = toScreen({ gx: state.gx, gy: state.gy, z: state.z })

  // The contact shadow sits on the floor under him, above the rug and below
  // the furniture. It's what stops a character reading as a sticker laid
  // over the room — and it shrinks as he climbs, because the floor is
  // further away. `state.z` already knows how high he is.
  const floor = toScreen({ gx: state.gx, gy: state.gy })
  const lift = state.z / 26
  const shadowW = 11 * (1 - lift * 0.45)
  const shadowH = shadowW / 2

  return (
    <>
      <div
        className={styles.shadow}
        style={{
          left: `${((floor.x - shadowW / 2) / SCENE_W) * 100}%`,
          top: `${((floor.y - shadowH / 2 - 1) / SCENE_H) * 100}%`,
          width: `${(shadowW / SCENE_W) * 100}%`,
          height: `${(shadowH / SCENE_H) * 100}%`,
          opacity: 0.38 - lift * 0.16,
          zIndex: LAYER_Z[LAYER.floor] + 50,
        }}
      />
    <div
      className={styles.visitor}
      style={{
        left: `${((base.x - FRAME_W / 2) / SCENE_W) * 100}%`,
        top: `${((base.y - FRAME_H) / SCENE_H) * 100}%`,
        width: `${(FRAME_W / SCENE_W) * 100}%`,
        height: `${(FRAME_H / SCENE_H) * 100}%`,
        zIndex,
        backgroundImage: `url('${strip}')`,
        backgroundSize: `${count * 100}% 100%`,
        backgroundPosition: count > 1 ? `${(frame / (count - 1)) * 100}% 0` : '0 0',
        transform: mirrored ? 'scaleX(-1)' : undefined,
      }}
    />
    </>
  )
}

/**
 * The visitors layer. `depthOf` is the same painter's order the furniture
 * uses, so a character passes behind the desk and in front of the rug
 * without anything being told about either.
 */
export function Visitors({ depthOf }: { depthOf: (gx: number, gy: number) => number }) {
  const schedule = useSchedule()
  if (!schedule.active) return null
  const { state } = schedule.active
  return <Visitor state={state} zIndex={depthOf(state.gx, state.gy)} />
}
