'use client'

import { useEffect, useRef, useState } from 'react'
import { SEATS, startResident, stepResident, type ResidentState } from '@/lib/resident'
import {
  isCircling,
  startSchedule,
  tickSchedule,
  visits,
  type CharacterId,
  type CharacterState,
  type Schedule,
  type Visit,
} from '@/lib/characters'
import { LAYER, LAYER_Z, SCENE_H, SCENE_W, toScreen } from './iso'
import styles from './iso.module.css'

/**
 * Who has sprites, and at what size. A character configured in
 * characters.ts but not listed here is never scheduled — so Caitlin can sit
 * in that file, fully described, until someone draws her.
 *
 * Frame sizes differ per character: Peanut is nearly twice Kibou's height.
 * See scripts/characters.mjs.
 */
type Art = {
  down: string
  up: string
  idle: string
  walkFrames: number
  idleFrames: number
  frameW: number
  frameH: number
}

const SPRITES: Partial<Record<CharacterId, Art>> = {
  kibou: {
    down: '/art/characters/kibou-down-right.png',
    up: '/art/characters/kibou-up-right.png',
    idle: '/art/characters/kibou-idle.png',
    walkFrames: 4,
    idleFrames: 2,
    frameW: 20,
    frameH: 16,
  },
  peanut: {
    down: '/art/characters/peanut-down-right.png',
    up: '/art/characters/peanut-up-right.png',
    idle: '/art/characters/peanut-idle.png',
    walkFrames: 4,
    idleFrames: 2,
    frameW: 26,
    frameH: 22,
  },
  caitlin: {
    down: '/art/characters/caitlin-down-right.png',
    up: '/art/characters/caitlin-up-right.png',
    idle: '/art/characters/caitlin-idle.png',
    walkFrames: 4,
    idleFrames: 2,
    frameW: 22,
    frameH: 44,
  },
}

const eligible = visits.filter((v) => SPRITES[v.id])

/**
 * `?who=peanut` summons one visitor immediately and keeps summoning only
 * them — for checking a character's art without waiting out the schedule.
 *
 * Visits are one at a time with a 12-34s gap and a coin flip each time, so
 * a particular animal can easily be three minutes away. That's right for a
 * room and wrong for looking at a sprite you just redrew.
 */
function requested(): { only: readonly Visit[]; delay: number } {
  if (typeof window === 'undefined') return { only: eligible, delay: 2000 }
  const who = new URLSearchParams(window.location.search).get('who')
  const match = eligible.filter((v) => v.id === who)
  return match.length ? { only: match, delay: 200 } : { only: eligible, delay: 2000 }
}

/** `?who=suraj` sends him off on a wander straight away, for checking it. */
export function hurryResident(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('who') === 'suraj'
}

/**
 * Runs the schedule on an animation frame. One visitor at a time; see
 * lib/characters.ts for why that's a single slot rather than three timers.
 */
function useSchedule(): Schedule {
  const [cast] = useState(requested)
  const [schedule, setSchedule] = useState<Schedule>(() => startSchedule(cast.delay))
  const raf = useRef(0)
  const last = useRef(0)

  useEffect(() => {
    if (cast.only.length === 0) return
    const frame = (now: number) => {
      const elapsed = last.current ? Math.min(now - last.current, 100) : 16
      last.current = now
      setSchedule((s) => tickSchedule(s, cast.only, elapsed))
      raf.current = requestAnimationFrame(frame)
    }
    raf.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf.current)
  }, [cast])

  return schedule
}

/**
 * One visitor, drawn from a sprite strip.
 *
 * Only two directions are drawn; the other two are these mirrored, which is
 * lossless on a whole-pixel sprite and halves the art. See
 * docs/characters.md.
 */
function Visitor({ state, visit, zIndex }: { state: CharacterState; visit: Visit; zIndex: number }) {
  const sprite = SPRITES[state.id]
  if (!sprite) return null

  // Circling counts as walking, not as settled — a dog turning twice before
  // she drops is still on her feet.
  const idle = state.phase === 'settled' && !isCircling(state, visit)
  const strip = idle ? sprite.idle : state.facing.startsWith('up') ? sprite.up : sprite.down
  const count = idle ? sprite.idleFrames : sprite.walkFrames
  const frame = Math.min(state.frame, count - 1)
  const mirrored = state.facing.endsWith('left')

  const base = toScreen({ gx: state.gx, gy: state.gy, z: state.z })

  // The contact shadow sits on the floor under him, above the rug and below
  // the furniture. It's what stops a character reading as a sticker laid
  // over the room — and it shrinks as he climbs, because the floor is
  // further away. `state.z` already knows how high he is.
  const floor = toScreen({ gx: state.gx, gy: state.gy })
  const lift = state.z / 26
  const shadowW = sprite.frameW * 0.55 * (1 - lift * 0.45)
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
      {/* Her beat says she says something. There are no words in it and
          there shouldn't be — a wordless mark beats putting words in
          someone's mouth. */}
      {idle && state.id === 'caitlin' && (
        <div
          className={styles.speech}
          style={{
            left: `${((base.x + 3) / SCENE_W) * 100}%`,
            // The frame is taller than she is — her head starts a dozen
            // rows down it — so the mark hangs off the sprite's top edge
            // rather than above the whole frame.
            top: `${((base.y - sprite.frameH + 3) / SCENE_H) * 100}%`,
            zIndex: zIndex + 1,
          }}
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </div>
      )}
      <div
        className={styles.visitor}
        style={{
          left: `${((base.x - sprite.frameW / 2) / SCENE_W) * 100}%`,
          top: `${((base.y - sprite.frameH) / SCENE_H) * 100}%`,
          width: `${(sprite.frameW / SCENE_W) * 100}%`,
          height: `${(sprite.frameH / SCENE_H) * 100}%`,
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
 * Suraj, who lives here.
 *
 * At the desk by a long way most of the time — seated when it's down,
 * standing when it's up, which is the room's best small joke. Every few
 * minutes he gets up, crosses the room, stands a moment and comes back.
 * That exists so you can see his face: walking toward the camera is the
 * only angle that shows the glasses.
 *
 * See lib/resident.ts for why he isn't a visitor.
 */
export function Resident({
  deskUp,
  depthOf,
  hurry,
}: {
  deskUp: boolean
  depthOf: (gx: number, gy: number) => number
  hurry: boolean
}) {
  const [state, setState] = useState<ResidentState>(() => startResident(hurry ? 1200 : undefined))
  const [bob, setBob] = useState(0)
  const raf = useRef(0)
  const last = useRef(0)

  useEffect(() => {
    const frame = (now: number) => {
      const elapsed = last.current ? Math.min(now - last.current, 100) : 16
      last.current = now
      setState((s) => stepResident(s, elapsed))
      raf.current = requestAnimationFrame(frame)
    }
    raf.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  // The typing bob runs on its own clock, because it's a loop rather than a
  // phase.
  useEffect(() => {
    const t = window.setInterval(() => setBob((b) => (b + 1) % 2), 240)
    return () => window.clearInterval(t)
  }, [])

  const W = 22
  const H = 44
  const working = state.phase === 'working'
  const seat = SEATS[state.seat]
  const front = seat.front

  // Which pose. The standing desk is the computer end of the L, so only
  // that end stands up with it; at the writing end he stays seated whatever
  // the desk is doing. Seated sprites include the chair and stand on the
  // floor, so nothing here needs a seat height.
  const strip = working
    ? front
      ? '/art/characters/suraj-sit-front.png'
      : deskUp
        ? '/art/characters/suraj-type.png'
        : '/art/characters/suraj-sit.png'
    : state.phase === 'standing'
      ? '/art/characters/suraj-idle.png'
      : state.facing.startsWith('up')
        ? '/art/characters/suraj-up-right.png'
        : '/art/characters/suraj-down-right.png'

  const count = working || state.phase === 'standing' ? 2 : 4
  const frame = working ? bob : Math.min(state.frame, count - 1)
  const mirrored = !working && state.facing.endsWith('left')

  const base = toScreen({ gx: state.gx, gy: state.gy })
  const floor = toScreen({ gx: state.gx, gy: state.gy })

  // The chair is drawn into the seated sprites rather than placed as a
  // prop. Two sprites that have to line up pixel-for-pixel never quite do;
  // one sprite always does, and "he's in the chair" is the whole point.

  return (
    <>

      <div
        className={styles.shadow}
        style={{
          left: `${((floor.x - 7) / SCENE_W) * 100}%`,
          top: `${((floor.y - 4) / SCENE_H) * 100}%`,
          width: `${(14 / SCENE_W) * 100}%`,
          height: `${(7 / SCENE_H) * 100}%`,
          opacity: 0.34,
          zIndex: LAYER_Z[LAYER.floor] + 50,
        }}
      />
      <div
        className={styles.visitor}
        style={{
          left: `${((base.x - W / 2) / SCENE_W) * 100}%`,
          top: `${((base.y - H) / SCENE_H) * 100}%`,
          width: `${(W / SCENE_W) * 100}%`,
          height: `${(H / SCENE_H) * 100}%`,
          zIndex: depthOf(state.gx, state.gy),
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
  const { state, visit } = schedule.active
  return <Visitor state={state} visit={visit} zIndex={depthOf(state.gx, state.gy)} />
}
