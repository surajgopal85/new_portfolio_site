/**
 * Character state machine — YOURS TO WRITE.
 *
 * This file is the contract only: the types below are what `<Scene>` expects,
 * and nothing else in the app depends on how you implement it. That means you
 * can rewrite the insides however you like without touching a component.
 *
 * The shape from the plan: idle -> walk in -> pause -> walk out, driven by a
 * random scheduler, one machine per character (cat, dog, Caitlin).
 *
 * Suggested order of attack:
 *   1. Make `step()` a pure function: (state, elapsedMs) => state. Pure means
 *      you can unit-test every transition without a browser.
 *   2. Give each phase a duration range and pick from it when you enter the
 *      phase, not on every tick — otherwise motion jitters.
 *   3. Only then wire it to requestAnimationFrame in a hook.
 *   4. Reduced motion: the scene already drops to the static fallback, so your
 *      machine never has to care.
 *
 * Bring your best attempt plus one specific question if you get stuck.
 */

export type CharacterId = 'cat' | 'dog' | 'caitlin'

export type Phase = 'offstage' | 'walking-in' | 'paused' | 'walking-out'

export type CharacterState = {
  id: CharacterId
  phase: Phase
  /** 0..1 across the room, left to right. */
  x: number
  /** Which way the sprite faces. */
  facing: 'left' | 'right'
  /** Frame index within the current animation, for sprite-sheet offsetting. */
  frame: number
}

export type CharacterConfig = {
  id: CharacterId
  /** Where this character enters and leaves — a doorway, in 0..1 across the room. */
  entrance: number
  /** How far in they wander before pausing, in 0..1. */
  target: number
  /** Art px per second. */
  speed: number
  /** Min/max ms to linger before heading back out. */
  pause: readonly [number, number]
  /** Min/max ms offstage between visits. */
  gap: readonly [number, number]
}

export const characters: readonly CharacterConfig[] = [
  { id: 'cat', entrance: 0.08, target: 0.42, speed: 18, pause: [1800, 6000], gap: [9000, 26000] },
  { id: 'dog', entrance: 0.94, target: 0.6, speed: 26, pause: [1200, 3500], gap: [14000, 40000] },
  { id: 'caitlin', entrance: 0.94, target: 0.72, speed: 22, pause: [2500, 7000], gap: [25000, 70000] },
]

export function initialState(config: CharacterConfig): CharacterState {
  return {
    id: config.id,
    phase: 'offstage',
    x: config.entrance,
    facing: config.entrance < 0.5 ? 'right' : 'left',
    frame: 0,
  }
}

/**
 * TODO(suraj): implement. Until you do, everyone stays offstage, which is why
 * the scene currently has no cat in it.
 */
export function step(state: CharacterState, _config: CharacterConfig, _elapsedMs: number): CharacterState {
  return state
}
