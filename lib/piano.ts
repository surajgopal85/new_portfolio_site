'use client'

/**
 * The desk keyboard is a playable piano — phase 2.
 *
 * Two rules the plan sets and this module has to keep: sound is OFF until the
 * visitor turns it on, and an AudioContext is never created before that click
 * (browsers block it, and creating one unasked is rude).
 */

let ctx: AudioContext | null = null

export function unlock(): void {
  if (ctx) return
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (Ctor) ctx = new Ctor()
}

export function teardown(): void {
  ctx?.close().catch(() => {})
  ctx = null
}

/**
 * TODO(phase 2): a short plucked tone per key — square or triangle wave through
 * a gain envelope is plenty, and suits the art better than a sampled piano.
 * Takes a semitone offset from middle C.
 */
export function playNote(_semitone: number): void {
  if (!ctx) return
}
