'use client'

import { useEffect, useState } from 'react'

export type Mode = 'static' | 'scene'

const OVERRIDE_KEY = 'office:mode'

/**
 * Which landing experience to render.
 *
 * The server always renders `static`, so the exported HTML holds real,
 * crawlable, screen-reader-friendly content and the first paint is instant.
 * After mount we upgrade to the animated scene only if the device looks like it
 * can carry it. A visitor can force either mode, and that choice sticks.
 *
 * Borrowed straight from felixrieseberg.com: an ambitious site stops feeling
 * fragile the moment the weak-device path is a deliberate design, not a bug.
 */
export function useMode(): [Mode, (m: Mode) => void] {
  const [mode, setMode] = useState<Mode>('static')

  useEffect(() => {
    const stored = safeGet(OVERRIDE_KEY)
    if (stored === 'static' || stored === 'scene') {
      setMode(stored)
      return
    }
    if (canRunScene()) setMode('scene')
  }, [])

  const choose = (m: Mode) => {
    setMode(m)
    safeSet(OVERRIDE_KEY, m)
  }

  return [mode, choose]
}

function canRunScene(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false

  // Coarse but honest signals. Both are optional in the platform, so a missing
  // value counts as "fine" rather than "bail out".
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  if (nav.connection?.saveData) return false
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return false
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency < 4) return false

  return true
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* private window, blocked storage — the mode just won't persist */
  }
}
