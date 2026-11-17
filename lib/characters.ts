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
  return { id, phase: 'away', gx: DOOR.gx, gy: DOOR.gy, z: 0, facing: 'down-right', frame: 0, timer: 0 }
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

/**
 * TODO(suraj): the scheduler and the per-visit machine.
 *
 * `npm test` is the specification — the tests skip themselves while this is
 * a stub and activate the moment it moves anyone. The suite has been checked
 * against a throwaway implementation, so if it fails, the implementation is
 * wrong rather than the tests.
 *
 * Order of attack:
 *   1. Keep `step` pure: (state, visit, elapsedMs) => state. Every bug in
 *      this kind of code is a timing bug, and timing bugs are invisible in a
 *      browser and obvious in a trace.
 *   2. Pick durations when you ENTER a phase, not on every tick, or motion
 *      jitters.
 *   3. `facing` follows movement — `facingFor` does that part.
 *   4. Only then wire it to requestAnimationFrame.
 *   5. Never two visitors at once: the scheduler holds one `active` slot and
 *      a new visit can't start until the last reaches 'away'.
 */
export function step(state: CharacterState, _visit: Visit, _elapsedMs: number): CharacterState {
  return state
}
