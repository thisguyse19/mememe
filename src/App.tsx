import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DuckPond } from './components/DuckPond'
import { HobbyLanding } from './components/HobbyLanding'
import { NavPill } from './components/NavPill'
import { SecretPortal } from './components/SecretPortal'

export default function App() {
  const [duckMode, setDuckMode] = useState(false)

  return (
    <div className={`relative min-h-dvh overflow-x-hidden ${duckMode ? '' : 'blue-drift'}`}>
      <AnimatePresence>{duckMode && <DuckPond key="pond" />}</AnimatePresence>

      <nav
        className="pointer-events-none fixed top-0 right-0 left-0 z-20 flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
        aria-label="Primary"
      >
        <NavPill
          duckMode={duckMode}
          onDuckMode={() => setDuckMode(true)}
          onHobbyMode={() => setDuckMode(false)}
        />
      </nav>

      <AnimatePresence>
        {!duckMode && (
          <motion.div
            key="landing"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <HobbyLanding />
          </motion.div>
        )}
      </AnimatePresence>

      <SecretPortal />
    </div>
  )
}
