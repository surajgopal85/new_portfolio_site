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
  /** Which seat he's at, or heading for. */
  seat: SeatName
  /** True when the trip is a stretch of the legs rather than a seat change. */
  wandering: boolean
}

/**
 * The two places he works.
 *
 * The desk is an L. At the computer he faces the north wall, so his back is
 * to the room — true to life, and it hides the glasses. At the writing side
 * he faces along the return, which is toward the camera: the desk hides his
 * legs and his face is visible over it.
 *
 * Switching between them is better than wandering for the same purpose. He
 * never leaves the desk, so the premise gets stronger rather than weaker.
 */
export const SEATS = {
  /** The computer end: seated, back to the room, which is true to life. */
  computer: { gx: SURAJ.gx, gy: SURAJ.gy, facing: 'up-right' as const, front: false, stands: false },
  /**
   * The writing end of the L: he stands at it, facing into the room.
   *
   * Standing rather than sitting for a plain reason — seated, his head is
   * 33px and the return in front of him is 27px, so the desk ate all but
   * his hair. Standing he's 39px and clears it, and leaning on a desk to
   * write something is what people do anyway.
   *
   * And he stands at the END of the return rather than along its side.
   * Beside a long box in isometric you always lose: the desk's sort key
   * comes from its far corner, so it paints over anything level with it.
   * Past its near end he's unambiguously in front, and fully visible.
   */
  writing: { gx: 7.8, gy: 5.1, facing: 'down-right' as const, front: true, stands: true },
}

export type SeatName = keyof typeof SEATS

/**
 * Where he goes on the rarer occasions he actually gets up. Short trips,
 * nowhere that takes him out of frame.
 */
export const WANDER = [
  { gx: 4.2, gy: 2.2 }, // the middle of the rug
  { gx: 2.6, gy: 4.4 }, // over by the piano
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
const other = (seat: SeatName): SeatName => (seat === 'computer' ? 'writing' : 'computer')

/**
 * Most trips are a move to the other end of the desk; one in four is a
 * stretch of the legs. Both show his face — the seat change because the
 * writing side looks into the room, the wander because walking toward the
 * camera does.
 */
function nextTrip(seat: SeatName) {
  if (Math.random() < 0.25) {
    const spot = WANDER[Math.floor(Math.random() * WANDER.length)]
    return { target: spot, seat, wandering: true }
  }
  const next = other(seat)
  return { target: { gx: SEATS[next].gx, gy: SEATS[next].gy }, seat: next, wandering: false }
}

export function startResident(firstTrip = pick(WORK_MS)): ResidentState {
  return {
    phase: 'working',
    gx: SEATS.computer.gx,
    gy: SEATS.computer.gy,
    facing: SEATS.computer.facing,
    frame: 0,
    timer: firstTrip,
    elapsed: 0,
    target: { gx: SEATS.writing.gx, gy: SEATS.writing.gy },
    seat: 'computer',
    wandering: false,
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
    case 'working': {
      if (timer > 0) return { ...state, timer, elapsed }
      const trip = nextTrip(state.seat)
      return { ...state, phase: 'crossing', timer: 0, elapsed: 0, frame: 0, ...trip }
    }

    case 'crossing': {
      const m = toward(state.target.gx, state.target.gy)
      if (m.arrived) {
        // A seat change goes straight back to work; a wander stands a while.
        if (!state.wandering) {
          return {
            ...state,
            gx: m.gx,
            gy: m.gy,
            phase: 'working',
            facing: SEATS[state.seat].facing,
            timer: pick(WORK_MS),
            elapsed: 0,
            frame: 0,
          }
        }
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
      const m = toward(SEATS[state.seat].gx, SEATS[state.seat].gy)
      if (m.arrived) {
        return {
          ...state,
          gx: m.gx,
          gy: m.gy,
          phase: 'working',
          facing: SEATS[state.seat].facing,
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
