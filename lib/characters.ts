/**
 * Who's in the room, and when.
 *
 * Suraj is always at the desk, typing. That's the constant. Everyone else is
 * an interruption, and interruptions arrive ONE AT A TIME with quiet
 * stretches between them, because that's what the room actually feels like.
 * Three independent timers would give you a pile-up and the whole thing would
 * read as a screensaver.
 *
 * So there is one scheduler, not three: it picks a visitor, runs their visit
 * start to finish, then goes quiet before picking the next.
 *
 * Positions are TILES on the isometric floor — the same coordinates every
 * object in `iso.ts` uses — so a character and a chair can never disagree
 * about where the floor is. Convert with `toScreen` when you draw.
 *
 * THE STATE MACHINE IS YOURS TO WRITE. Everything below is the contract the
 * scene renders against, and `npm test` is its specification.
 */

export type CharacterId = 'kibou' | 'peanut' | 'caitlin'

export type Phase =
  /** Not in the room. The scheduler is counting down to the next visit. */
  | 'away'
  /** Coming through the door, heading for their spot. */
  | 'entering'
  /** At their spot, doing their thing. */
  | 'settled'
  /** Heading back to the door. */
  | 'leaving'

export type CharacterState = {
  id: CharacterId
  phase: Phase
  /** Tiles. gx runs away to the right, gy away to the left. */
  gx: number
  gy: number
  /** Height above the floor in px — a cat on the desk is up at 26. */
  z: number
  /**
   * Which way the sprite faces. In isometric there are four: two toward the
   * camera and two away, named for where they go on screen.
   */
  facing: 'down-left' | 'down-right' | 'up-left' | 'up-right'
  /** Frame index within the current animation. */
  frame: number
  /**
   * Milliseconds left in the current phase. `step` is pure, so the countdown
   * lives in the state rather than a closure.
   */
  timer: number
  /**
   * Milliseconds spent in the current phase so far, reset on entry. The
   * counterpart to `timer`: some beats are measured from the start of a
   * phase rather than its end — Peanut circling before she lies down, for
   * one.
   */
  elapsed: number
}

export type Visit = {
  id: CharacterId
  /** Where they end up, in tiles, with an optional height off the floor. */
  spot: { gx: number; gy: number; z?: number }
  /** Tiles per second. A person walks about 1.2. */
  speed: number
  /** Min/max ms spent settled before heading out. */
  stay: readonly [number, number]
  /** What they do while settled — the reason each visit differs. */
  beat: string
  /** Circles a couple of times before settling, the way a dog does. */
  circlesFirst?: boolean
}

/** The doorway, in tiles: the west wall, nearest the camera. */
export const DOOR = { gx: 0.5, gy: 7.6 } as const

/** Suraj's chair at the desk. He doesn't move, so he isn't in the queue. */
export const SURAJ = { gx: 7.5, gy: 2.8 } as const

export const visits: readonly Visit[] = [
  {
    id: 'kibou',
    // Up on the desk, between you and the monitor, as cats do.
    spot: { gx: 8.4, gy: 3.1, z: 26 },
    speed: 1.6,
    stay: [4000, 9000],
    beat: 'Sits on the desk between you and the monitor. Tail across the screen.',
  },
  {
    id: 'peanut',
    // The middle of the rug, by the bone.
    spot: { gx: 4.4, gy: 4.6 },
    speed: 2.4,
    stay: [8000, 18000],
    beat: 'Crosses to the rug, turns around twice, lies down.',
    circlesFirst: true,
  },
  {
    id: 'caitlin',
    // Beside the desk, on the door side of it.
    spot: { gx: 6.6, gy: 4.4 },
    speed: 2.0,
    stay: [5000, 11000],
    beat: 'Comes to the side of the desk, says something, goes back out.',
  },
]

/** Quiet stretch between one visitor leaving and the next arriving, in ms. */
export const GAP: readonly [number, number] = [12_000, 34_000]

export function initialState(id: CharacterId): CharacterState {
  return {
    id,
    phase: 'away',
    gx: DOOR.gx,
    gy: DOOR.gy,
    z: 0,
    facing: 'down-right',
    frame: 0,
    timer: 0,
    elapsed: 0,
  }
}

/**
 * Which way a character faces, given where it's heading. In this projection
 * increasing gx moves down-right on screen and increasing gy moves down-left,
 * so the four names are literal.
 */
export function facingFor(dgx: number, dgy: number): CharacterState['facing'] {
  if (Math.abs(dgx) >= Math.abs(dgy)) return dgx >= 0 ? 'down-right' : 'up-left'
  return dgy >= 0 ? 'down-left' : 'up-right'
}

/** How close to the spot a character has to be before it starts to climb. */
const HOP = 0.8

/**
 * How long the circling lasts before a dog drops. Two full turns, which is
 * what the beat says and roughly what she actually does.
 */
export const CIRCLE_MS = 1400

/** Is this character still circling rather than settled? */
export function isCircling(state: CharacterState, visit: Visit): boolean {
  return state.phase === 'settled' && !!visit.circlesFirst && state.elapsed < CIRCLE_MS
}

const TURN_ORDER: readonly CharacterState['facing'][] = [
  'down-right',
  'down-left',
  'up-left',
  'up-right',
]

/**
 * Height above the floor, derived from where the character is rather than
 * stored as a separate animation. A cat heading for the desk rises over the
 * last stretch and sinks again on the way out, and neither needs its own
 * state — the position already says everything.
 */
function heightFor(gx: number, gy: number, visit: Visit): number {
  const top = visit.spot.z ?? 0
  if (!top) return 0
  const d = Math.hypot(gx - visit.spot.gx, gy - visit.spot.gy)
  return top * Math.min(1, Math.max(0, 1 - d / HOP))
}

/** Pick a duration from a range. The one unpure moment, and the reason no
 *  two visits are the same length. */
function pick([lo, hi]: readonly [number, number]): number {
  return lo + Math.random() * (hi - lo)
}

/**
 * One tick of one visit.
 *
 * Pure apart from the duration drawn when a phase begins: given the same
 * state and the same elapsed time it produces the same movement, which is
 * what makes the whole thing testable without a browser. Every bug in this
 * kind of code is a timing bug, and timing bugs are invisible on screen and
 * obvious in a trace.
 */
export function step(state: CharacterState, visit: Visit, elapsedMs: number): CharacterState {
  const reach = (visit.speed * elapsedMs) / 1000

  /** Move toward a target, and say whether we arrived this tick. */
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
    case 'entering': {
      const m = toward(visit.spot.gx, visit.spot.gy)
      const z = heightFor(m.gx, m.gy, visit)
      if (m.arrived) {
        return {
          ...state,
          gx: m.gx,
          gy: m.gy,
          z,
          phase: 'settled',
          timer: pick(visit.stay),
          elapsed: 0,
          frame: 0,
        }
      }
      return {
        ...state,
        gx: m.gx,
        gy: m.gy,
        z,
        facing: facingFor(m.dgx, m.dgy),
        frame: (state.frame + 1) % 4,
        elapsed: state.elapsed + elapsedMs,
      }
    }

    case 'settled': {
      const timer = state.timer - elapsedMs
      const elapsed = state.elapsed + elapsedMs
      if (timer <= 0) return { ...state, phase: 'leaving', timer: 0, elapsed: 0, frame: 0 }

      // A dog circles before it drops. Two turns, using the walk frames and
      // stepping through all four facings — which is why `elapsed` exists.
      if (visit.circlesFirst && elapsed < CIRCLE_MS) {
        const stepsIn = Math.floor((elapsed / CIRCLE_MS) * 8)
        return {
          ...state,
          timer,
          elapsed,
          facing: TURN_ORDER[stepsIn % TURN_ORDER.length],
          frame: Math.floor(elapsed / 110) % 4,
        }
      }

      // Two idle frames, swapping about twice a second.
      return { ...state, timer, elapsed, frame: Math.floor(timer / 500) % 2 }
    }

    case 'leaving': {
      const m = toward(DOOR.gx, DOOR.gy)
      const z = heightFor(m.gx, m.gy, visit)
      if (m.arrived) {
        return { ...state, gx: m.gx, gy: m.gy, z: 0, phase: 'away', timer: 0, elapsed: 0, frame: 0 }
      }
      return {
        ...state,
        gx: m.gx,
        gy: m.gy,
        z,
        facing: facingFor(m.dgx, m.dgy),
        frame: (state.frame + 1) % 4,
        elapsed: state.elapsed + elapsedMs,
      }
    }

    default:
      return state
  }
}

/**
 * The scheduler: one visitor at a time, with a quiet stretch between.
 *
 * Three independent timers would pile up and the room would read as a
 * screensaver. This holds a single slot — nobody new can start until the
 * last one is back through the door — which is what makes the room feel
 * like working alone and being interrupted.
 */
export type Schedule = {
  /** The visit in progress, or null during a quiet stretch. */
  active: { visit: Visit; state: CharacterState } | null
  /** Milliseconds until the next visitor is picked. */
  until: number
}

export function startSchedule(now = pick(GAP)): Schedule {
  return { active: null, until: now }
}

/**
 * Advance the schedule. `eligible` is the visits that can actually be shown
 * — a character with no sprites yet is configured but never picked.
 */
export function tickSchedule(
  schedule: Schedule,
  eligible: readonly Visit[],
  elapsedMs: number,
): Schedule {
  if (schedule.active) {
    const state = step(schedule.active.state, schedule.active.visit, elapsedMs)
    if (state.phase === 'away') return { active: null, until: pick(GAP) }
    return { ...schedule, active: { ...schedule.active, state } }
  }

  const until = schedule.until - elapsedMs
  if (until > 0 || eligible.length === 0) return { ...schedule, until }

  const visit = eligible[Math.floor(Math.random() * eligible.length)]
  return {
    active: {
      visit,
      state: { ...initialState(visit.id), phase: 'entering', facing: 'down-right', elapsed: 0 },
    },
    until: 0,
  }
}
