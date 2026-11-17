'use client'

import { Scene } from '@/components/scene/Scene'
import { StaticFallback } from '@/components/StaticFallback'
import { useMode } from '@/lib/capability'

export default function Home() {
  const [mode, setMode] = useMode()

  if (mode === 'static') return <StaticFallback onEnter={() => setMode('scene')} />

  return (
    <main style={{ padding: 'clamp(16px, 4vw, 40px) 20px' }}>
      <h1 className="sr-only">Suraj Gopalakrishnan — software engineer</h1>
      <Scene onLeave={() => setMode('static')} />
    </main>
  )
}
