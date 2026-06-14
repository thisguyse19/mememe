import { HobbyLanding } from './components/HobbyLanding'
import { SecretPortal } from './components/SecretPortal'

export default function App() {
  return (
    <div className="blue-drift relative min-h-dvh overflow-x-hidden">
      <nav
        className="pointer-events-none fixed top-0 right-0 left-0 z-20 flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
        aria-label="Primary"
      >
        <div className="glass-pill pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm text-blue-100/80">
          <span className="font-medium tracking-tight text-blue-50">mememe</span>
          <span className="text-blue-200/30">/</span>
          <span className="text-blue-100/55">hobby</span>
        </div>
      </nav>

      <HobbyLanding />
      <SecretPortal />
    </div>
  )
}
