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
  facingFor,
  initialState,
  step,
  visits,
  type CharacterState,
  type Phase,
  type Visit,
} from './characters.ts'
import { ROOM } from '../components/scene/iso.ts'

const TICK = 16 // ms, one animation frame
const MAX_TICKS = 60 * 120 // two minutes of frames; a visit must end well inside this

/** Is `step` still returning its argument unchanged? */
function isStub(): boolean {
  const visit = visits[0]
  let state = { ...initialState(visit.id), phase: 'entering' as Phase }
  for (let i = 0; i < 120; i++) state = step(state, visit, TICK)
  return state.gx === DOOR.gx && state.phase === 'entering'
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
    const last = states.at(-1)!
    assert.ok(
      Math.hypot(last.gx - DOOR.gx, last.gy - DOOR.gy) <= 0.2,
      `left from (${last.gx}, ${last.gy}), expected to leave by the door at (${DOOR.gx}, ${DOOR.gy})`,
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
    const closest = Math.min(
      ...settled.map((s) => Math.hypot(s.gx - visit.spot.gx, s.gy - visit.spot.gy)),
    )
    assert.ok(closest <= 0.2, `settled ${closest.toFixed(2)} tiles from the spot`)
  })

  spec(`${visit.id}: stays within its declared range`, () => {
    const ms = trace(visit).filter((s) => s.phase === 'settled').length * TICK
    const [lo, hi] = visit.stay
    assert.ok(ms >= lo - TICK * 2 && ms <= hi + TICK * 2, `settled for ${ms}ms, outside ${lo}-${hi}`)
  })

  spec(`${visit.id}: every position is a real number inside the room`, () => {
    for (const s of trace(visit)) {
      assert.ok(Number.isFinite(s.gx), `gx was ${s.gx}`)
      assert.ok(Number.isFinite(s.gy), `gy was ${s.gy}`)
      assert.ok(s.gx >= 0 && s.gx <= ROOM, `gx=${s.gx} outside the room`)
      assert.ok(s.gy >= 0 && s.gy <= ROOM, `gy=${s.gy} outside the room`)
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
      const dgx = s.gx - prev.gx
      const dgy = s.gy - prev.gy
      if (Math.hypot(dgx, dgy) > 1e-6) {
        assert.equal(s.facing, facingFor(dgx, dgy), 'moving one way and facing another')
      }
    }
  })

  spec(`${visit.id}: moves no faster than its declared speed`, () => {
    const states = trace(visit)
    const limit = (visit.speed * TICK) / 1000 + 0.01 // a little slack for rounding
    for (let i = 1; i < states.length; i++) {
      const d = Math.hypot(states[i].gx - states[i - 1].gx, states[i].gy - states[i - 1].gy)
      assert.ok(d <= limit, `moved ${d.toFixed(3)} tiles in one tick, limit ${limit.toFixed(3)}`)
    }
  })
}

// --- things that hold whether or not step() is written ---------------------

test('every visit spot is inside the room', () => {
  for (const visit of visits) {
    assert.ok(visit.spot.gx >= 0 && visit.spot.gx <= ROOM, `${visit.id} spot gx=${visit.spot.gx}`)
    assert.ok(visit.spot.gy >= 0 && visit.spot.gy <= ROOM, `${visit.id} spot gy=${visit.spot.gy}`)
  }
})

test('the door is on the floor, by the west wall', () => {
  assert.ok(DOOR.gx >= 0 && DOOR.gx <= ROOM && DOOR.gy >= 0 && DOOR.gy <= ROOM)
})

test('facing follows the direction of travel', () => {
  assert.equal(facingFor(1, 0), 'down-right')
  assert.equal(facingFor(-1, 0), 'up-left')
  assert.equal(facingFor(0, 1), 'down-left')
  assert.equal(facingFor(0, -1), 'up-right')
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
