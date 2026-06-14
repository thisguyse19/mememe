import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { VoidPage } from './components/VoidPage'
import { ArcadePage } from './components/ArcadePage'
import { DuckPond } from './components/DuckPond'
import { ElevatorSim } from './components/ElevatorSim'
import { HobbyLanding } from './components/HobbyLanding'
import { NavPill } from './components/NavPill'
import { PooSimulation } from './components/PooSimulation'
import { LobbyPage } from './components/LobbyPage'
import { RidiculousPage } from './components/RidiculousPage'
import { SecretPortal } from './components/SecretPortal'
import type { NavPage } from './config/nav'

export default function App() {
  const [navPage, setNavPage] = useState<NavPage>('hobby')

  const bgClass =
    navPage === 'duck'
      ? ''
      : navPage === 'poo'
        ? 'septic-drift'
        : navPage === 'cursed'
          ? 'cursed-drift'
          : navPage === 'lobby'
            ? 'lobby-drift'
            : navPage === 'elevator'
              ? 'elevator-drift'
              : navPage === 'arcade'
                ? 'arcade-drift'
                : navPage === 'void'
                  ? 'void-drift'
                  : 'blue-drift'

  return (
    <div className={`relative min-h-dvh overflow-x-hidden ${bgClass}`}>
      <AnimatePresence>
        {navPage === 'duck' && <DuckPond key="pond" />}
        {navPage === 'poo' && <PooSimulation key="poo" />}
        {navPage === 'cursed' && <RidiculousPage key="cursed" />}
        {navPage === 'lobby' && <LobbyPage key="lobby" />}
        {navPage === 'elevator' && <ElevatorSim key="elevator" />}
        {navPage === 'arcade' && <ArcadePage key="arcade" />}
        {navPage === 'void' && <VoidPage key="void" />}
      </AnimatePresence>

      <nav
        className="pointer-events-none fixed top-0 right-0 left-0 z-20 flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
        aria-label="Primary"
      >
        <NavPill currentPage={navPage} onNavigate={setNavPage} />
      </nav>

      <AnimatePresence>
        {navPage === 'hobby' && (
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
