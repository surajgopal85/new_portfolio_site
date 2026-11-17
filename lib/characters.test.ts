/**
 * The contract the character state machine has to satisfy.
 *
 * These tests are a specification, written before the implementation. While
 * `step` is still the stub they skip themselves with a message; the moment it
 * actually moves a character they activate and start holding it to this.
 *
 *   npm test
 *
 * Every bug this kind of code has is a timing bug, and timing bugs are
 * invisible in a browser and obvious in a trace. That's the whole reason
 * `step` is specified as a pure function.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DOOR,
  GAP,
  initialState,
  step,
  visits,
  type CharacterState,
  type Phase,
  type Visit,
} from './characters.ts'
import { SCENE_W } from '../components/scene/room.ts'

const TICK = 16 // ms, one animation frame
const MAX_TICKS = 60 * 120 // two minutes of frames; a visit must end well inside this

/** Is `step` still returning its argument unchanged? */
function isStub(): boolean {
  const visit = visits[0]
  let state = { ...initialState(visit.id), phase: 'entering' as Phase }
  for (let i = 0; i < 120; i++) state = step(state, visit, TICK)
  return state.x === DOOR.x && state.phase === 'entering'
}

const stubbed = isStub()
const spec = (name: string, fn: () => void) =>
  test(name, { skip: stubbed && 'step() is still the stub — implement it and this activates' }, fn)

/** Drive one visit from away to away, collecting every state along the way. */
function trace(visit: Visit): CharacterState[] {
  const states: CharacterState[] = [{ ...initialState(visit.id), phase: 'entering' }]
  for (let i = 0; i < MAX_TICKS; i++) {
    const next = step(states[states.length - 1], visit, TICK)
    states.push(next)
    if (next.phase === 'away' && i > 0) break
  }
  return states
}

for (const visit of visits) {
  spec(`${visit.id}: a visit starts and ends at the door`, () => {
    const states = trace(visit)
    assert.equal(states.at(-1)?.phase, 'away', 'the visit never finished')
    assert.ok(
      Math.abs(states.at(-1)!.x - DOOR.x) <= 2,
      `left from x=${states.at(-1)!.x}, expected to leave by the door at ${DOOR.x}`,
    )
  })

  spec(`${visit.id}: phases advance in order and never go backwards`, () => {
    const order: Phase[] = ['entering', 'settled', 'leaving', 'away']
    let seen = 0
    for (const s of trace(visit)) {
      const i = order.indexOf(s.phase)
      assert.notEqual(i, -1, `unknown phase ${s.phase}`)
      assert.ok(i >= seen, `phase went backwards: ${order[seen]} -> ${s.phase}`)
      seen = i
    }
    assert.equal(seen, order.length - 1, 'the visit never reached away')
  })

  spec(`${visit.id}: reaches its spot while settled`, () => {
    const settled = trace(visit).filter((s) => s.phase === 'settled')
    assert.ok(settled.length > 0, 'never settled')
    const closest = Math.min(...settled.map((s) => Math.abs(s.x - visit.spot.x)))
    assert.ok(closest <= 2, `settled ${closest}px from the spot, expected to arrive at it`)
  })

  spec(`${visit.id}: stays within its declared range`, () => {
    const ms = trace(visit).filter((s) => s.phase === 'settled').length * TICK
    const [lo, hi] = visit.stay
    assert.ok(ms >= lo - TICK * 2 && ms <= hi + TICK * 2, `settled for ${ms}ms, outside ${lo}-${hi}`)
  })

  spec(`${visit.id}: every position is a real number inside the room`, () => {
    for (const s of trace(visit)) {
      assert.ok(Number.isFinite(s.x), `x was ${s.x}`)
      assert.ok(Number.isFinite(s.depth), `depth was ${s.depth}`)
      assert.ok(s.x >= 0 && s.x <= SCENE_W, `x=${s.x} outside 0..${SCENE_W}`)
      assert.ok(s.depth >= 0 && s.depth <= 1, `depth=${s.depth} outside 0..1`)
      assert.ok(Number.isInteger(s.frame) && s.frame >= 0, `frame was ${s.frame}`)
    }
  })

  spec(`${visit.id}: faces the way it's moving`, () => {
    const states = trace(visit)
    for (let i = 1; i < states.length; i++) {
      const prev = states[i - 1]
      const s = states[i]
      // The tick that changes phase is exempt: arriving somewhere and turning
      // to face the room is correct, even though the position also moved.
      if (s.phase !== prev.phase) continue
      const dx = s.x - prev.x
      const dd = s.depth - prev.depth
      if (Math.abs(dd) > Math.abs(dx) && Math.abs(dd) > 1e-6) {
        assert.equal(s.facing, dd > 0 ? 'front' : 'back', 'moving in depth but not facing that way')
      } else if (Math.abs(dx) > 1e-6) {
        assert.equal(s.facing, dx > 0 ? 'right' : 'left', 'moving sideways but not facing that way')
      }
    }
  })

  spec(`${visit.id}: moves no faster than its declared speed`, () => {
    const states = trace(visit)
    const limit = (visit.speed * TICK) / 1000 + 0.5 // half a pixel of slack for rounding
    for (let i = 1; i < states.length; i++) {
      const dx = Math.abs(states[i].x - states[i - 1].x)
      assert.ok(dx <= limit, `jumped ${dx.toFixed(2)}px in one tick, limit ${limit.toFixed(2)}`)
    }
  })
}

// --- things that hold whether or not step() is written ---------------------

test('every visit spot is inside the room', () => {
  for (const visit of visits) {
    assert.ok(visit.spot.x >= 0 && visit.spot.x <= SCENE_W, `${visit.id} spot x=${visit.spot.x}`)
    assert.ok(visit.spot.depth >= 0 && visit.spot.depth <= 1, `${visit.id} spot depth=${visit.spot.depth}`)
  }
})

test('every visit has a sane duration range', () => {
  for (const visit of visits) {
    const [lo, hi] = visit.stay
    assert.ok(lo > 0 && hi > lo, `${visit.id} stay range ${lo}-${hi}`)
    assert.ok(visit.speed > 0, `${visit.id} speed ${visit.speed}`)
  }
})

test('the quiet gap is longer than the longest stay', () => {
  // Otherwise the room never feels like working alone — which is the point.
  const longestStay = Math.max(...visits.map((v) => v.stay[1]))
  assert.ok(GAP[0] >= longestStay * 0.5, `gap ${GAP[0]}ms is short against a ${longestStay}ms stay`)
  assert.ok(GAP[1] > GAP[0], 'gap range is inverted')
})

test('characters are unique', () => {
  const ids = visits.map((v) => v.id)
  assert.equal(new Set(ids).size, ids.length, 'two visits share a character')
})
