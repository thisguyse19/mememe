import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { EXPRESS_ZONES, SKY_LOBBIES } from '../elevator/expressZone'
import { CAR_COLORS, floorLabel, FLOOR_DEFS, FLOOR_MAX, VIP_FLOOR } from '../elevator/sim'
import type { Assignment, CarId, CrashState, SimCar, SimState } from '../elevator/types'

type PolarisLobbyProps = {
  assignment: Assignment | null
  destination: number | null
  brand: SimState['brand']
  accessibility: boolean
  waitElapsed: number
  onSelectFloor: (floor: number, opts?: { express?: boolean }) => void
  onToggleAccessibility: () => void
  onClearAssignment: () => void
  error?: string | null
}

export function PolarisLobbyGuidance({
  assignment,
  destination,
  brand,
  accessibility,
  waitElapsed,
  onSelectFloor,
  onToggleAccessibility,
  onClearAssignment,
  error,
}: PolarisLobbyProps) {
  const isPolaris = brand === 'polaris' || brand === 'hybrid'
  const [touchActive, setTouchActive] = useState(false)
  const [dopMode, setDopMode] = useState<'express' | 'grid' | 'keypad'>('express')
  const [keypadVal, setKeypadVal] = useState('')
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!assignment) return
    dismissRef.current = window.setTimeout(() => {
      onClearAssignment()
      setTouchActive(true)
    }, 5000)
    return () => {
      if (dismissRef.current) window.clearTimeout(dismissRef.current)
    }
  }, [assignment, onClearAssignment])

  const submitKeypad = () => {
    const n = parseInt(keypadVal, 10)
    if (keypadVal === 'PH' || keypadVal === String(VIP_FLOOR)) onSelectFloor(VIP_FLOOR)
    else if (keypadVal === 'B1') onSelectFloor(-1)
    else if (keypadVal === 'B2') onSelectFloor(-2)
    else if (!Number.isNaN(n) && n >= FLOOR_DEFS[0].id && n <= FLOOR_MAX) onSelectFloor(n)
    setKeypadVal('')
  }

  return (
    <div className="polaris-fixture mx-auto w-full max-w-sm overflow-hidden rounded-sm shadow-2xl">
      <div className="polaris-fixture-bezel p-1">
        <div className="polaris-screen relative min-h-[380px] bg-[#0a0a0a] px-4 py-6 text-white sm:px-6 sm:py-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/45">
              {isPolaris ? 'KONE' : 'Otis'}
            </span>
            <span className="text-[10px] text-white/35">{isPolaris ? 'Polaris' : 'Compass 360'}</span>
          </div>

          <AnimatePresence mode="wait">
            {!assignment && !touchActive ? (
              <motion.button
                key="idle"
                type="button"
                className="flex min-h-[280px] w-full cursor-pointer flex-col items-center justify-center border-none bg-transparent text-center text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setTouchActive(true)}
              >
                <motion.div
                  className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/20"
                  animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                >
                  <span className="text-2xl text-white/50">👆</span>
                </motion.div>
                <p className="mt-6 text-sm font-light tracking-wide text-white/70">Select your destination</p>
                <p className="mt-2 text-[11px] text-white/35">Touch panel to begin</p>
              </motion.button>
            ) : !assignment && touchActive ? (
              <motion.div
                key="picker"
                className="min-h-[280px] py-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-3 flex gap-1">
                  {(['express', 'grid', 'keypad'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`flex-1 rounded py-1.5 text-[10px] uppercase tracking-wide ${dopMode === m ? 'bg-white text-black' : 'bg-white/10 text-white/70'}`}
                      onClick={() => setDopMode(m)}
                    >
                      {m === 'express' ? 'Express' : m}
                    </button>
                  ))}
                </div>

                {dopMode === 'express' ? (
                  <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
                    <p className="text-[10px] leading-relaxed text-white/40">
                      Express Zone · non-stop via sky lobbies{' '}
                      {SKY_LOBBIES.map((s) => s).join(' · ')}
                    </p>
                    {EXPRESS_ZONES.map((zone) => (
                      <div key={zone.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-medium text-white/90">{zone.name}</span>
                          <span className="text-[9px] text-white/35">{zone.subtitle}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {zone.picks.map((p) => (
                            <button
                              key={p.floor}
                              type="button"
                              className="rounded border border-sky-400/25 bg-sky-950/40 px-2.5 py-1.5 text-xs tabular-nums text-sky-100/90 transition hover:bg-sky-900/50 active:scale-95"
                              onClick={() => onSelectFloor(p.floor, { express: true })}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : dopMode === 'grid' ? (
                  <div className="grid max-h-52 grid-cols-5 gap-1.5 overflow-y-auto pr-1">
                    {FLOOR_DEFS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`rounded border border-white/15 py-2 text-xs font-medium transition hover:bg-white/15 active:scale-95 ${f.id === VIP_FLOOR ? 'border-amber-400/40 text-amber-200' : 'text-white/85'}`}
                        onClick={() => onSelectFloor(f.id)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 rounded-lg bg-white/10 px-3 py-2 text-right font-mono text-xl tracking-widest">
                      {keypadVal || '—'}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'B1', '0', 'B2'].map((k) => (
                        <button
                          key={k}
                          type="button"
                          className="rounded border border-white/15 py-3 text-sm active:scale-95"
                          onClick={() => setKeypadVal((v) => (v + k).slice(0, 4))}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-2 w-full rounded-lg bg-white py-2.5 text-sm font-medium text-black"
                      onClick={submitKeypad}
                    >
                      Call elevator
                    </button>
                  </div>
                )}

                {error && <p className="mt-3 text-center text-xs text-rose-400">{error}</p>}

                <button
                  type="button"
                  className="mt-3 w-full text-[10px] text-white/30 underline-offset-2 hover:text-white/50 hover:underline"
                  onClick={() => setTouchActive(false)}
                >
                  Cancel
                </button>
              </motion.div>
            ) : assignment ? (
              <motion.div
                key="assigned"
                className="flex min-h-[280px] flex-col items-center justify-center text-center"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {assignment.express && (
                  <p className="mb-2 text-[10px] uppercase tracking-[0.35em] text-sky-300/70">Express Zone</p>
                )}
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Proceed to elevator</p>

                <motion.div
                  className="relative my-6 flex h-32 w-32 items-center justify-center rounded-full border-4"
                  style={{ borderColor: CAR_COLORS[assignment.car], boxShadow: `0 0 40px ${CAR_COLORS[assignment.car]}44` }}
                  initial={{ scale: 0.5, rotate: -8 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                >
                  <motion.span
                    className="text-6xl font-semibold tabular-nums"
                    style={{ color: CAR_COLORS[assignment.car] }}
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  >
                    {assignment.car}
                  </motion.span>
                  <motion.span
                    className="absolute -right-2 -top-2 text-2xl"
                    animate={{ x: assignment.arrow === 'left' ? [-4, 0, -4] : [4, 0, 4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    {assignment.arrow === 'left' ? '←' : '→'}
                  </motion.span>
                </motion.div>

                {destination !== null && (
                  <p className="text-lg font-light text-white/85">
                    Destination · <span className="font-medium">{floorLabel(destination)}</span>
                  </p>
                )}

                {assignment.expressRoute && (
                  <p className="mt-2 max-w-[220px] text-[10px] leading-relaxed text-sky-200/60">
                    {assignment.expressRoute}
                  </p>
                )}

                <div className="mt-5 w-full max-w-[200px]">
                  <div className="h-0.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full bg-white/70"
                      initial={{ width: '0%' }}
                      animate={{ width: `${Math.min(100, (waitElapsed / assignment.waitSec) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-white/40">
                    Arriving · ~{Math.max(0, assignment.waitSec - waitElapsed)}s · panel resets in 5s
                  </p>
                </div>

                {accessibility && (
                  <motion.p
                    className="mt-4 text-[11px] text-emerald-300/80"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    ♿ Audio: Elevator {assignment.car}. Extended door time.
                  </motion.p>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-3">
            <button
              type="button"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base ${accessibility ? 'border-2 border-emerald-400 text-emerald-300' : 'border border-white/20 text-white/50'}`}
              aria-label="Accessibility"
              onClick={onToggleAccessibility}
            >
              ♿
            </button>
            <span className="text-[10px] text-white/35">
              {accessibility ? 'Extended dwell enabled' : 'Accessibility'}
            </span>
          </div>

          <div className="absolute bottom-4 left-0 right-0 text-center text-[9px] uppercase tracking-widest text-white/20">
            mememe tower
          </div>
        </div>
      </div>
    </div>
  )
}

type PolarisCarProps = {
  car: SimCar
  crash: CrashState | null
  brand: SimState['brand']
  riderDest?: number | null
}

export function PolarisCarDisplay({ car, crash, brand, riderDest }: PolarisCarProps) {
  const displayFloor = crash?.active ? Math.floor(crash.spinFloor) : Math.round(car.floor)
  const prevFloor = useRef(displayFloor)
  const [tick, setTick] = useState(0)
  const goingUp = crash?.active ? crash.phase < 2 : car.direction > 0
  const goingDown = crash?.active ? crash.phase >= 2 && crash.phase < 3 : car.direction < 0
  const isPolaris = brand === 'polaris' || brand === 'hybrid'

  useEffect(() => {
    if (displayFloor !== prevFloor.current) {
      prevFloor.current = displayFloor
      setTick((t) => t + 1)
    }
  }, [displayFloor])

  const doorLabel =
    car.door === 'open' ? 'DOORS OPEN' : car.door === 'closing' ? 'CLOSING' : car.door === 'opening' ? 'OPENING' : '●'

  return (
    <div className="polaris-fixture mx-auto w-full max-w-[280px]">
      <div className="polaris-fixture-bezel p-1.5">
        <div
          className={`polaris-screen relative overflow-hidden bg-[#050505] ${crash?.active && crash.car === car.id ? 'polaris-crash-shake' : ''}`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">
              {isPolaris ? 'KONE' : 'OTIS'}
            </span>
            <span className="text-[9px] text-white/30">Car {car.id}</span>
          </div>

          <div className="relative px-4 py-6">
            <AnimatePresence mode="wait">
              {crash?.active && crash.car === car.id ? (
                <CrashReadout key="crash" crash={crash} />
              ) : (
                <motion.div
                  key={`floor-${displayFloor}-${tick}`}
                  className="flex flex-col items-center"
                  initial={{ y: goingUp ? 24 : goingDown ? -24 : 0, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: goingUp ? -24 : goingDown ? 24 : 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-center gap-4">
                    <motion.div className="flex flex-col items-center gap-0.5" animate={{ opacity: goingUp ? 1 : 0.15 }}>
                      <span className="text-lg leading-none text-emerald-400">▲</span>
                    </motion.div>
                    <div className="polaris-floor-digits relative flex items-baseline justify-center tabular-nums">
                      <span className="text-7xl font-light tracking-tight text-white sm:text-8xl">
                        {floorLabel(displayFloor)}
                      </span>
                    </div>
                    <motion.div className="flex flex-col items-center gap-0.5" animate={{ opacity: goingDown ? 1 : 0.15 }}>
                      <span className="text-lg leading-none text-rose-400">▼</span>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.p
              className="mt-4 text-center text-[10px] font-medium uppercase tracking-[0.45em] text-white/45"
              animate={{ opacity: car.door === 'open' ? [0.5, 1, 0.5] : 1 }}
              transition={{ duration: 1.2, repeat: car.door === 'open' ? Infinity : 0 }}
            >
              {doorLabel}
            </motion.p>
          </div>

          {isPolaris && car.stops.length > 0 && !crash?.active && (
            <div className="border-t border-white/8 px-4 py-3">
              <p className="text-[8px] uppercase tracking-widest text-white/30">Next stops</p>
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                {car.stops.slice(0, 10).map((f, i) => (
                  <motion.span
                    key={`${f}-${i}`}
                    className={`shrink-0 rounded px-2 py-1 text-xs tabular-nums ${i === 0 ? 'bg-white text-black' : 'bg-white/10 text-white/70'}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    {floorLabel(f)}
                  </motion.span>
                ))}
              </div>
            </div>
          )}

          {riderDest != null && !crash?.active && (
            <div className="border-t border-white/8 px-4 py-2 text-center">
              <p className="text-[9px] uppercase tracking-widest text-white/30">Your destination</p>
              <p className="text-sm font-medium text-white/80">{floorLabel(riderDest)}</p>
            </div>
          )}

          <div className="px-4 pb-4">
            <div className="h-1 overflow-hidden rounded-full bg-white/8">
              <motion.div
                className="h-full bg-white/50"
                animate={{ width: `${car.loadFactor * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CrashReadout({ crash }: { crash: CrashState }) {
  const messages = [
    '⚠ OVERSPEED',
    '━━━━━━',
    'IMPACT',
    'STUCK BETWEEN FLOORS',
    'REBOOTING…',
    'PLEASE REMAIN CALM',
  ]

  return (
    <motion.div
      className="flex min-h-[120px] flex-col items-center justify-center text-center"
      animate={crash.phase < 3 ? { x: [0, -4, 5, -3, 4, 0] } : {}}
      transition={{ duration: 0.35, repeat: crash.phase < 3 ? Infinity : 0 }}
    >
      {crash.phase < 2 ? (
        <motion.p
          className="font-mono text-4xl font-bold tabular-nums text-rose-500"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.12, repeat: Infinity }}
        >
          {floorLabel(Math.floor(crash.spinFloor))}
        </motion.p>
      ) : (
        <p className="text-3xl font-light text-amber-200/90">{floorLabel(crash.stuckFloor)}?</p>
      )}
      <motion.p
        className="mt-4 max-w-[200px] text-[11px] uppercase tracking-widest text-rose-300/90"
        key={crash.phase}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {messages[Math.min(crash.phase, messages.length - 1)]}
      </motion.p>
      <p className="mt-3 text-[10px] text-white/35">{crash.message}</p>
    </motion.div>
  )
}

type CommuterViewProps = {
  state: SimState
  assignment: Assignment | null
  destination: number | null
  waitElapsed: number
  error?: string | null
  onSelectFloor: (floor: number, opts?: { express?: boolean }) => void
  onToggleAccessibility: () => void
  onClearAssignment: () => void
  onCarSpeedChange: (speed: number) => void
  onEnterCar: (id: CarId) => void
  onCrash: (id: CarId) => void
}

export function CommuterExperience({
  state,
  assignment,
  destination,
  waitElapsed,
  error,
  onSelectFloor,
  onToggleAccessibility,
  onClearAssignment,
  onCarSpeedChange,
  onEnterCar,
  onCrash,
}: CommuterViewProps) {
  const viewCar = state.insideCar ?? assignment?.car ?? state.activeCab
  const car = state.cars.find((c) => c.id === viewCar)!
  const myRequest = state.lobbyQueue.find((q) => q.assigned === viewCar && !q.boarded)
  const riderDest = myRequest?.to ?? state.lobbyQueue.find((q) => q.boarded === viewCar)?.to ?? null

  const canBoard =
    car.door === 'open' &&
    Math.abs(car.floor - Math.round(car.floor)) < 0.05 &&
    Math.round(car.floor) === (state.insideCar ? Math.round(car.floor) : 0)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <p className="mb-3 text-center text-[10px] uppercase tracking-[0.35em] text-slate-500">
          Lobby · Destination Operating Panel
        </p>
        <PolarisLobbyGuidance
          assignment={state.insideCar ? null : assignment}
          destination={destination}
          brand={state.brand}
          accessibility={state.accessibility}
          waitElapsed={waitElapsed}
          onSelectFloor={onSelectFloor}
          onToggleAccessibility={onToggleAccessibility}
          onClearAssignment={onClearAssignment}
          error={error}
        />
      </div>

      <div>
        <p className="mb-3 text-center text-[10px] uppercase tracking-[0.35em] text-slate-500">
          Car {viewCar} · Passenger Display
        </p>
        <PolarisCarDisplay car={car} crash={state.crash} brand={state.brand} riderDest={riderDest} />

        <div className="mt-4 flex flex-col gap-2">
          {!state.insideCar && assignment && canBoard && Math.round(car.floor) === 0 && (
            <button type="button" className="elev-btn w-full py-3" onClick={() => onEnterCar(viewCar)}>
              Step aboard Car {viewCar}
            </button>
          )}
          {state.insideCar && (
            <p className="text-center text-xs text-slate-400">You are aboard Car {state.insideCar}. Watch the floor indicator.</p>
          )}
          <button
            type="button"
            className="elev-btn w-full border-rose-500/30 text-rose-300/80 hover:bg-rose-950/40"
            onClick={() => onCrash(viewCar)}
            disabled={!!state.crash?.active}
          >
            ⚠ Simulate elevator crash (whimsical)
          </button>
          <p className="text-center text-[10px] text-slate-600">
            Nobody gets hurt. The building&apos;s lawyer insisted we say that.
          </p>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="elev-card mb-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-medium text-slate-300">Elevator speed</h3>
              <p className="text-[10px] text-slate-500">{state.carSpeed.toFixed(2)} floors/sec</p>
            </div>
            <span className="text-[10px] text-slate-500">
              {state.carSpeed < 0.8 ? '🐢 Leisurely' : state.carSpeed > 2.5 ? '🚀 Ludicrous' : 'Normal'}
            </span>
          </div>
          <input
            type="range"
            min={0.25}
            max={5}
            step={0.05}
            value={state.carSpeed}
            onChange={(e) => onCarSpeedChange(Number(e.target.value))}
            className="elev-range mt-3 w-full"
            aria-label="Elevator travel speed"
          />
          <div className="mt-1 flex justify-between text-[9px] text-slate-600">
            <span>0.25</span>
            <span>1.35 default</span>
            <span>5.0</span>
          </div>
        </div>

        <p className="mb-3 text-center text-[10px] uppercase tracking-[0.35em] text-slate-500">Hall lanterns</p>
        <div className="flex flex-wrap justify-center gap-4">
          {(['A', 'B', 'C', 'D'] as CarId[]).map((id) => {
            const c = state.cars.find((x) => x.id === id)!
            return <HallLantern key={id} car={c} highlight={id === viewCar} crash={state.crash} />
          })}
        </div>
      </div>
    </div>
  )
}

function HallLantern({ car, highlight, crash }: { car: SimCar; highlight: boolean; crash: CrashState | null }) {
  const crashed = crash?.active && crash.car === car.id
  const floor = crashed ? crash!.stuckFloor : Math.round(car.floor)

  return (
    <div
      className={`flex flex-col items-center rounded-lg border px-4 py-3 ${highlight ? 'border-white/25 bg-white/5' : 'border-white/8 bg-black/30'}`}
    >
      <span className="text-[10px] font-bold text-white/40">{car.id}</span>
      <motion.span
        className={`mt-1 text-2xl font-light tabular-nums ${crashed ? 'text-rose-400' : 'text-white/90'}`}
        animate={crashed ? { opacity: [1, 0.2, 1] } : {}}
        transition={{ duration: 0.2, repeat: crashed ? Infinity : 0 }}
      >
        {floorLabel(floor)}
      </motion.span>
      <div className="mt-1 flex gap-2 text-xs">
        <span className={car.direction > 0 && !crashed ? 'text-emerald-400' : 'text-white/15'}>▲</span>
        <span className={car.direction < 0 && !crashed ? 'text-rose-400' : 'text-white/15'}>▼</span>
      </div>
    </div>
  )
}
