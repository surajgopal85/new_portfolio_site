'use client'

import { IsoScene } from '@/components/scene/IsoScene'
import { setMode } from '@/lib/capability'

/**
 * A preview route for the isometric room while it's being built, so the live
 * scene keeps working. Deleted when the swap happens.
 */
export default function IsoPreview() {
  return (
    <main style={{ padding: 'clamp(16px, 4vw, 40px) 20px' }}>
      <h1 className="sr-only">Isometric room, in progress</h1>
      <IsoScene onLeave={() => setMode('static')} />
    </main>
  )
}
