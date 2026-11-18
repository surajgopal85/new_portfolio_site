'use client'

import { IsoScene } from '@/components/scene/IsoScene'
import { StaticFallback } from '@/components/StaticFallback'
import { site } from '@/content/site'
import { setMode } from '@/lib/capability'

/**
 * Both versions render into the HTML. Which one the visitor sees was decided
 * by the script in <head> before first paint — see lib/capability.ts. CSS
 * hides the other with `display: none`, which also takes it out of the
 * accessibility tree, so nothing is announced twice.
 *
 * One <main> for both: the document may only contain one that isn't hidden.
 */
export default function Home() {
  return (
    <main>
      <div className="mode-static">
        <StaticFallback onEnter={() => setMode('scene')} />
      </div>

      <div className="mode-scene" style={{ padding: 'clamp(16px, 4vw, 40px) 20px' }}>
        <h1 className="sr-only">{`${site.name} — ${site.role.toLowerCase()}`}</h1>
        <IsoScene onLeave={() => setMode('static')} />
      </div>
    </main>
  )
}
