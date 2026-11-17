import test from 'node:test'
import assert from 'node:assert/strict'
import { KEYS, frequency } from './piano.ts'

test('A4 is 440Hz', () => {
  assert.ok(Math.abs(frequency(9) - 440) < 1e-9)
})

test('middle C is 261.63Hz', () => {
  assert.ok(Math.abs(frequency(0) - 261.6255653) < 1e-4)
})

test('an octave doubles', () => {
  for (const n of [-12, 0, 7, 24]) {
    assert.ok(Math.abs(frequency(n + 12) / frequency(n) - 2) < 1e-12)
  }
})

test('the keys are pentatonic, ascending, and inside hearing range', () => {
  const inOctave = KEYS.map((k) => ((k % 12) + 12) % 12)
  const pentatonic = new Set([0, 2, 4, 7, 9])
  for (const k of inOctave) assert.ok(pentatonic.has(k), `${k} is not in C major pentatonic`)
  for (let i = 1; i < KEYS.length; i++) assert.ok(KEYS[i] > KEYS[i - 1], 'keys are not ascending')
  for (const k of KEYS) {
    const hz = frequency(k)
    assert.ok(hz > 200 && hz < 2000, `${hz}Hz is outside a comfortable range`)
  }
})
