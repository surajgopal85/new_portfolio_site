/**
 * Suraj, who lives here.
 *
 * He is not a visitor. He has no door, no scheduler slot and no quiet gap —
 * he's at the desk, and the visitors are the ones who come and go. That
 * asymmetry is the whole premise of the room, so this is a separate machine
 * from `lib/characters.ts` rather than a fourth entry in it.
 *
 * He does get up occasionally, which exists for one reason: walking toward
 * the camera is the only angle that shows his glasses, and they're what
 * makes him recognisable at 44 pixels. The rest of the time his back is to
 * you, which is what a person at a desk looks like.
 */

import { SURAJ, facingFor, type CharacterState } from './characters'

export type ResidentPhase =
  /** Seated or standing at the desk, typing. The default by a long way. */
  | 'working'
  /** Crossing to somewhere in the room. */
  | 'crossing'
  /** Standing there a moment. */
  | 'standing'
  /** Heading back to the chair. */
  | 'returning'

export type ResidentState = {
  phase: ResidentPhase
  gx: number
  gy: number
  facing: CharacterState['facing']
  frame: number
  timer: number
  elapsed: number
  /** Where he's crossing to this time. */
  target: { gx: number; gy: number }
}

/**
 * Where he goes. Short trips: the window, the piano corner, the middle of
 * the floor. Nowhere that would take him out of frame or behind the desk.
 */
export const WANDER = [
  { gx: 4.2, gy: 2.2 }, // the middle of the rug
  { gx: 2.6, gy: 4.4 }, // over by the piano
  { gx: 5.4, gy: 1.6 }, // under the windows
] as const

/** Tiles per second. He's not in a hurry; it's his house. */
export const SPEED = 1.7

/**
 * How long he works between trips, and how long a trip lasts.
 *
 * The ratio is the point: he's at the desk the large majority of the time.
 * If he wandered freely he'd be a fourth visitor, the chair would be empty
 * again, and the room would lose the thing that makes it work.
 */
export const WORK_MS: readonly [number, number] = [75_000, 150_000]
export const STAND_MS: readonly [number, number] = [5_000, 11_000]

const pick = ([lo, hi]: readonly [number, number]) => lo + Math.random() * (hi - lo)
const pickSpot = () => WANDER[Math.floor(Math.random() * WANDER.length)]

export function startResident(firstTrip = pick(WORK_MS)): ResidentState {
  return {
    phase: 'working',
    gx: SURAJ.gx,
    gy: SURAJ.gy,
    facing: 'up-right',
    frame: 0,
    timer: firstTrip,
    elapsed: 0,
    target: pickSpot(),
  }
}

/** One tick. Pure but for the durations drawn when a phase begins. */
export function stepResident(state: ResidentState, elapsedMs: number): ResidentState {
  const reach = (SPEED * elapsedMs) / 1000
  const timer = state.timer - elapsedMs
  const elapsed = state.elapsed + elapsedMs

  const toward = (tx: number, ty: number) => {
    const dgx = tx - state.gx
    const dgy = ty - state.gy
    const dist = Math.hypot(dgx, dgy)
    if (dist <= reach || dist === 0) return { gx: tx, gy: ty, arrived: true, dgx, dgy }
    return {
      gx: state.gx + (dgx / dist) * reach,
      gy: state.gy + (dgy / dist) * reach,
      arrived: false,
      dgx,
      dgy,
    }
  }

  switch (state.phase) {
    case 'working':
      if (timer > 0) return { ...state, timer, elapsed }
      return { ...state, phase: 'crossing', timer: 0, elapsed: 0, frame: 0, target: pickSpot() }

    case 'crossing': {
      const m = toward(state.target.gx, state.target.gy)
      if (m.arrived) {
        return {
          ...state,
          gx: m.gx,
          gy: m.gy,
          phase: 'standing',
          facing: 'down-right',
          timer: pick(STAND_MS),
          elapsed: 0,
          frame: 0,
        }
      }
      return {
        ...state,
        gx: m.gx,
        gy: m.gy,
        facing: facingFor(m.dgx, m.dgy),
        frame: (state.frame + 1) % 4,
        elapsed,
      }
    }

    case 'standing':
      if (timer > 0) return { ...state, timer, elapsed, frame: Math.floor(elapsed / 600) % 2 }
      return { ...state, phase: 'returning', timer: 0, elapsed: 0, frame: 0 }

    case 'returning': {
      const m = toward(SURAJ.gx, SURAJ.gy)
      if (m.arrived) {
        return {
          ...state,
          gx: m.gx,
          gy: m.gy,
          phase: 'working',
          facing: 'up-right',
          timer: pick(WORK_MS),
          elapsed: 0,
          frame: 0,
        }
      }
      return {
        ...state,
        gx: m.gx,
        gy: m.gy,
        facing: facingFor(m.dgx, m.dgy),
        frame: (state.frame + 1) % 4,
        elapsed,
      }
    }
  }
}
