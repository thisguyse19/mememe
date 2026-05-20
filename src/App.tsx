import { HobbyLanding } from './components/HobbyLanding'
import { SecretPortal } from './components/SecretPortal'

export default function App() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <nav
        className="pointer-events-none fixed top-0 right-0 left-0 z-20 flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
        aria-label="Primary"
      >
        <div className="glass-pill pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80">
          <span className="font-medium tracking-tight text-white">mememe</span>
          <span className="text-white/35">/</span>
          <span className="text-white/60">hobby</span>
        </div>
      </nav>

      <HobbyLanding />
      <SecretPortal />
    </div>
  )
}
