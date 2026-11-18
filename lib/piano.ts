'use client'

/**
 * The desk keyboard, playable.
 *
 * Two rules from the plan, both kept here: sound is OFF until the visitor
 * asks for it, and no AudioContext exists before that click — browsers block
 * one created unasked, and creating one anyway is rude.
 *
 * The notes are a C major pentatonic spread over two octaves. Pentatonic
 * because the piano is played by sweeping a pointer across it: there is no
 * wrong order, so nothing a visitor does can sound like a mistake.
 */

/** Semitones from middle C, in the order the keys are laid out. */
export const KEYS = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24] as const

/** Equal temperament, A4 = 440Hz. Middle C is 9 semitones below it. */
export function frequency(semitonesFromMiddleC: number): number {
  return 440 * 2 ** ((semitonesFromMiddleC - 9) / 12)
}

let ctx: AudioContext | null = null
let master: GainNode | null = null

export function unlock(): void {
  if (ctx) return
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return
  ctx = new Ctor()
  master = ctx.createGain()
  master.gain.value = 0.22
  master.connect(ctx.destination)
}

export function teardown(): void {
  master?.disconnect()
  master = null
  ctx?.close().catch(() => {})
  ctx = null
}

export function isPlaying(): boolean {
  return ctx !== null
}

/**
 * One plucked note. A triangle for the body and a detuned square a fifth
 * quieter for the attack, both through a decaying envelope and a lowpass that
 * closes as the note dies — which is what makes a pluck sound plucked rather
 * than like a beep ending.
 */
export function playNote(semitonesFromMiddleC: number, when = 0): void {
  if (!ctx || !master) return
  const t = ctx.currentTime + when
  const hz = frequency(semitonesFromMiddleC)
  const dur = 1.1

  const env = ctx.createGain()
  env.gain.setValueAtTime(0, t)
  env.gain.linearRampToValueAtTime(1, t + 0.006) // fast attack, no click
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)

  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.setValueAtTime(Math.min(hz * 8, 7000), t)
  tone.frequency.exponentialRampToValueAtTime(Math.max(hz * 2, 220), t + dur)

  const body = ctx.createOscillator()
  body.type = 'triangle'
  body.frequency.value = hz

  const edge = ctx.createOscillator()
  edge.type = 'square'
  edge.frequency.value = hz
  edge.detune.value = 4
  const edgeGain = ctx.createGain()
  edgeGain.gain.value = 0.2

  body.connect(tone)
  edge.connect(edgeGain).connect(tone)
  tone.connect(env).connect(master)

  body.start(t)
  edge.start(t)
  body.stop(t + dur)
  edge.stop(t + dur)
}
