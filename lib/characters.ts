/**
 * Who's in the room, and when.
 *
 * The shape of the scene is: Suraj is always at the desk, typing. That's the
 * constant. Everyone else is an interruption — and interruptions arrive ONE
 * AT A TIME, with quiet stretches between them, because that's what the room
 * actually feels like. Three independent timers would give you a pile-up and
 * the whole thing would read as a screensaver.
 *
 * So there is one scheduler, not three. It picks a visitor, runs their visit
 * start to finish, then goes quiet for a while before picking the next.
 *
 * THE STATE MACHINE IS YOURS TO WRITE. Everything below is the contract the
 * scene renders against; nothing else in the app depends on how you implement
 * it, so you can rewrite the insides freely.
 */


/** Suraj's spot at the desk. He doesn't move, so he isn't part of the queue. */
export const SURAJ = { x: 146, depth: 0.21, w: 12, h: 26 } as const

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
  /** Art px from the left of the scene. */
  x: number
  /** 0 = against the back wall, 1 = nearest the camera. Same axis as Thing. */
  depth: number
  /** Which way the sprite faces; `front` and `back` are toward/away from you. */
  facing: 'left' | 'right' | 'front' | 'back'
  /** Frame index within the current animation, for sprite-sheet offsetting. */
  frame: number
}

export type Visit = {
  id: CharacterId
  /** Where they end up, in the same coordinates as a Thing. */
  spot: { x: number; depth: number }
  /** Art px per second. */
  speed: number
  /** Min/max ms spent settled before heading out. */
  stay: readonly [number, number]
  /** What they do while settled — one line, and the reason each visit differs. */
  beat: string
}

/**
 * The door is at x 320-352 on the back wall, so everyone enters and exits
 * around x 336, depth 0.
 */
export const DOOR = { x: 336, depth: 0.02 } as const

export const visits: readonly Visit[] = [
  {
    id: 'kibou',
    // Up on the desk, in front of the monitor, as cats do.
    spot: { x: 164, depth: 0.14 },
    speed: 26,
    stay: [4000, 9000],
    beat: 'Sits on the desk between you and the monitor. Tail across the screen.',
  },
  {
    id: 'peanut',
    // Flops on the rug, behind the chair.
    spot: { x: 180, depth: 0.66 },
    speed: 40,
    stay: [8000, 18000],
    beat: 'Crosses to the rug, turns around twice, lies down by the bone.',
  },
  {
    id: 'caitlin',
    // Stops beside the desk, on the door side.
    spot: { x: 206, depth: 0.3 },
    speed: 34,
    stay: [5000, 11000],
    beat: 'Comes to the side of the desk, says something, goes back out.',
  },
]

/** Quiet stretch between one visitor leaving and the next arriving, in ms. */
export const GAP: readonly [number, number] = [12_000, 34_000]

/**
 * A character is positioned exactly like a Thing — pass `{ x, depth, w, h }`
 * to `place()` in room.ts. No separate projection, so a character and a chair
 * can never disagree about where the floor is.
 */
export function initialState(id: CharacterId): CharacterState {
  return { id, phase: 'away', x: DOOR.x, depth: DOOR.depth, facing: 'front', frame: 0 }
}

/**
 * TODO(suraj): the scheduler and the per-visit machine.
 *
 * Suggested order of attack:
 *   1. Make the visit machine a pure function first:
 *      (state, visit, elapsedMs) => state. Pure means every transition is
 *      unit-testable without a browser, which matters here because the bugs
 *      in this kind of code are all timing bugs.
 *   2. Pick durations when you ENTER a phase, not on every tick — otherwise
 *      motion jitters.
 *   3. `facing` follows movement: heading for a bigger depth is 'front',
 *      smaller is 'back', otherwise left/right by dx. That's three sprite
 *      sheets, which is why the shot list wants three angles.
 *   4. Only then wire it to requestAnimationFrame.
 *   5. Never two visitors at once. The scheduler holds a single `active`
 *      slot; a new visit can't start until the previous one reaches 'away'.
 *
 * Returns the unchanged state for now, which is why nobody comes in.
 */
export function step(state: CharacterState, _visit: Visit, _elapsedMs: number): CharacterState {
  return state
}
