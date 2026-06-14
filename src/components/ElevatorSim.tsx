import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  brandLabel,
  cabSelectFloor,
  CAPACITY,
  CAR_COLORS,
  createInitialState,
  drawShaft,
  enterCab,
  exitCab,
  floorLabel,
  FLOOR_DEFS,
  FLOOR_MAX,
  LOBBY_FLOOR,
  requestDestination,
  setBrand,
  setTraffic,
  stepSimulation,
  toggleDoor,
  triggerCrash,
  setCarSpeed,
  DEFAULT_CAR_SPEED,
  VIP_FLOOR,
} from '../elevator/sim'
import { CommuterExperience } from './PolarisDisplay'
import { EXPRESS_ZONES, SKY_LOBBIES } from '../elevator/expressZone'
import type {
  Assignment,
  CarId,
  DopUiMode,
  SimState,
  SystemBrand,
  ThemeSkin,
  TrafficMode,
} from '../elevator/types'
import { CAR_IDS } from '../elevator/types'

const DIRECTORY = [
  { floor: 0, name: 'Lobby & Reception' },
  { floor: 1, name: 'Café / Food Court' },
  { floor: 5, name: 'HR (Good Luck)' },
  { floor: 12, name: 'WeWork-ish Desks' },
  { floor: 20, name: 'Legal — Enter at Own Risk' },
  { floor: 28, name: 'Server Room (Hot)' },
  { floor: 40, name: 'Executive Swag' },
  { floor: 55, name: 'Sky Lounge' },
  { floor: VIP_FLOOR, name: 'Penthouse VIP' },
  { floor: -1, name: 'Parking B1' },
  { floor: -2, name: 'Parking B2' },
]

const SKINS: Record<ThemeSkin, { bg: string; fg: string; accent: string; border: string }> = {
  black: { bg: '#0a0a0c', fg: '#f8fafc', accent: '#38bdf8', border: 'rgba(255,255,255,0.12)' },
  white: { bg: '#f8fafc', fg: '#0f172a', accent: '#0284c7', border: 'rgba(15,23,42,0.12)' },
  silver: { bg: '#e2e8f0', fg: '#1e293b', accent: '#475569', border: 'rgba(30,41,59,0.15)' },
  gold: { bg: '#1c1917', fg: '#fef3c7', accent: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
}

type Panel = 'ride' | 'lobby' | 'cab' | 'admin' | 'remote'

export function ElevatorSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<SimState>(() => createInitialState())
  const [panel, setPanel] = useState<Panel>('ride')
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [lastDestination, setLastDestination] = useState<number | null>(null)
  const [assignTime, setAssignTime] = useState(0)
  const [dopUi, setDopUi] = useState<DopUiMode>('express')
  const [skin, setSkin] = useState<ThemeSkin>('black')
  const [keypadVal, setKeypadVal] = useState('')
  const [pinVal, setPinVal] = useState('')
  const [vipMsg, setVipMsg] = useState<string | null>(null)
  const [remoteFrom, setRemoteFrom] = useState(LOBBY_FLOOR)
  const [remoteTo, setRemoteTo] = useState(10)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [displaySize, setDisplaySize] = useState<'7' | '12'>('12')

  const theme = SKINS[skin]
  const activeCar = state.cars.find((c) => c.id === state.activeCab)!
  const inside = state.insideCar ? state.cars.find((c) => c.id === state.insideCar)! : null

  useEffect(() => {
    let last = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      setState((s) => stepSimulation(s, dt))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawShaft(ctx, rect.width, rect.height, state, assignment?.car ?? state.activeCab)
    }
    draw()
    const id = window.setInterval(draw, 33)
    return () => window.clearInterval(id)
  }, [state, assignment?.car])

  const waitElapsed = assignment ? Math.max(0, Math.floor(state.simTime - assignTime)) : 0

  const callFloor = useCallback(
    (to: number, opts?: { express?: boolean; from?: number }) => {
      const from = opts?.from ?? LOBBY_FLOOR
      setErrMsg(null)
      setLastDestination(to)
      setState((s) => {
        const res = requestDestination(s, from, to, {
          accessible: s.accessibility,
          vip: to === VIP_FLOOR,
          express: opts?.express,
        })
        if (res.error) {
          setErrMsg(res.error)
          return s
        }
        if (res.assignment) {
          setAssignment(res.assignment)
          setAssignTime(s.simTime)
        }
        return res.state
      })
      setPanel('ride')
    },
    [],
  )

  const submitKeypad = useCallback(() => {
    const n = parseInt(keypadVal, 10)
    if (keypadVal === 'PH' || keypadVal === String(VIP_FLOOR)) {
      callFloor(VIP_FLOOR)
    } else if (keypadVal === 'B1') callFloor(-1)
    else if (keypadVal === 'B2') callFloor(-2)
    else if (!Number.isNaN(n) && n >= FLOOR_DEFS[0].id && n <= FLOOR_MAX) callFloor(n)
    else setErrMsg('Invalid floor')
    setKeypadVal('')
  }, [callFloor, keypadVal])

  const submitPin = useCallback(() => {
    if (pinVal === '7777') {
      setState((s) => ({ ...s, vipUnlocked: true }))
      setVipMsg(`VIP access granted — floor ${VIP_FLOOR} unlocked`)
      setPinVal('')
    } else {
      setVipMsg('Access denied')
    }
  }, [pinVal])

  const brand = state.brand

  return (
    <main className="relative z-0 min-h-dvh overflow-x-hidden pb-28 pt-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <header className="mb-4 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400/70">
            mememe Tower · Group {CAR_IDS.join('')}
          </p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight text-slate-100 sm:text-3xl">
            Elevator Simulator
          </h1>
          <p className="mt-1 text-xs text-slate-400/60">{brandLabel(brand)} · {state.traffic} traffic</p>
        </header>

        {/* Shaft */}
        <div className="elev-card mb-4 overflow-hidden p-2">
          <canvas ref={canvasRef} className="h-52 w-full sm:h-64" aria-label="Elevator shaft diagram" />
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-[10px]">
            {CAR_IDS.map((id) => {
              const car = state.cars.find((c) => c.id === id)!
              return (
                <span key={id} className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-2 w-2 rounded-full" style={{ background: CAR_COLORS[id] }} />
                  {id}: {floorLabel(Math.round(car.floor))} · {Math.round(car.loadFactor * 100)}% load
                </span>
              )
            })}
          </div>
        </div>

        {/* Assignment banner */}
        <AnimatePresence>
          {assignment && panel === 'lobby' && (
            <motion.div
              className="elev-card mb-4 border-sky-500/30 bg-sky-950/30 p-4 text-center"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-xs uppercase tracking-widest text-sky-300/60">Proceed to elevator</p>
              <p className="mt-1 text-5xl font-semibold tabular-nums" style={{ color: CAR_COLORS[assignment.car] }}>
                {assignment.car}
              </p>
              <p className="mt-2 text-sm text-slate-300/80">
                {assignment.arrow === 'left' ? '← Left bank' : 'Right bank →'} · ~{assignment.waitSec}s
              </p>
              <p className="mt-1 text-xs text-slate-400/70">{assignment.reason}</p>
              {assignment.expressRoute && (
                <p className="mt-1 text-[10px] text-sky-300/60">{assignment.expressRoute}</p>
              )}
              {state.accessibility && (
                <p className="mt-2 text-xs text-emerald-300/70">♿ Extended dwell · Audio guidance active</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Panel tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(['ride', 'lobby', 'cab', 'remote', 'admin'] as Panel[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`elev-tab ${panel === p ? 'elev-tab--active' : ''}`}
              onClick={() => setPanel(p)}
            >
              {p === 'ride'
                ? 'Commuter View'
                : p === 'lobby'
                  ? 'DOP / Lobby'
                  : p === 'cab'
                    ? 'Inside Cab'
                    : p === 'remote'
                      ? 'RemoteCall'
                      : 'Building Ops'}
            </button>
          ))}
        </div>

        {panel === 'ride' && (
          <CommuterExperience
            state={state}
            assignment={assignment}
            destination={lastDestination}
            waitElapsed={waitElapsed}
            error={errMsg}
            onSelectFloor={callFloor}
            onToggleAccessibility={() =>
              setState((s) => ({
                ...s,
                accessibility: !s.accessibility,
                extendedDwell: !s.accessibility,
              }))
            }
            onClearAssignment={() => setAssignment(null)}
            onCarSpeedChange={(speed) => setState((s) => setCarSpeed(s, speed))}
            onEnterCar={(id) => {
              setState((s) => enterCab(s, id))
              setAssignment(null)
            }}
            onCrash={(id) => setState((s) => triggerCrash(s, id))}
          />
        )}

        {panel === 'lobby' && (
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            {/* DOP touchscreen */}
            <div
              className="elev-dop mx-auto w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
              style={{
                background: theme.bg,
                color: theme.fg,
                border: `1px solid ${theme.border}`,
                minHeight: displaySize === '12' ? 420 : 320,
              }}
            >
              <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: theme.border }}>
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-50">
                    {brand === 'compass360' ? 'Compass 360' : brand === 'polaris' ? 'KONE Polaris' : brandLabel(brand)}
                  </p>
                  <p className="text-sm font-medium">Select destination</p>
                </div>
                <span className="text-xs opacity-40">Floor {floorLabel(LOBBY_FLOOR)}</span>
              </div>

              <div className="flex gap-1 border-b px-2 py-2" style={{ borderColor: theme.border }}>
                {(['express', 'grid', 'keypad', 'directory'] as DopUiMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="flex-1 rounded-lg py-1.5 text-[11px] capitalize"
                    style={{
                      background: dopUi === m ? theme.accent : 'transparent',
                      color: dopUi === m ? (skin === 'white' || skin === 'silver' ? '#fff' : '#0f172a') : theme.fg,
                    }}
                    onClick={() => setDopUi(m)}
                  >
                    {m === 'express' ? 'Express' : m}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {dopUi === 'express' && (
                  <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                    <p className="text-[10px] opacity-50">
                      Express Zone · non-stop via sky lobbies {SKY_LOBBIES.join(' · ')}
                    </p>
                    {EXPRESS_ZONES.map((zone) => (
                      <div
                        key={zone.id}
                        className="rounded-xl p-2.5"
                        style={{ border: `1px solid ${theme.border}` }}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium">{zone.name}</span>
                          <span className="text-[9px] opacity-45">{zone.subtitle}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {zone.picks.map((p) => (
                            <button
                              key={p.floor}
                              type="button"
                              className="elev-floor-btn px-2.5 py-1.5 text-xs tabular-nums"
                              style={{ borderColor: theme.accent + '55', color: theme.fg }}
                              onClick={() => callFloor(p.floor, { express: true })}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {dopUi === 'grid' && (
                  <div className="grid max-h-64 grid-cols-5 gap-1.5 overflow-y-auto pr-1">
                    {FLOOR_DEFS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className="elev-floor-btn py-2 text-xs"
                        style={{ borderColor: theme.border, color: theme.fg }}
                        onClick={() => callFloor(f.id)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}

                {dopUi === 'keypad' && (
                  <div>
                    <div
                      className="mb-3 rounded-xl px-4 py-3 text-right font-mono text-2xl tracking-widest"
                      style={{ background: 'rgba(0,0,0,0.2)' }}
                    >
                      {keypadVal || '—'}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'B1', '0', 'B2'].map((k) => (
                        <button
                          key={k}
                          type="button"
                          className="elev-floor-btn py-4"
                          style={{ borderColor: theme.border, color: theme.fg }}
                          onClick={() => setKeypadVal((v) => (v + k).slice(0, 4))}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-3 w-full rounded-xl py-3 text-sm font-medium"
                      style={{ background: theme.accent, color: skin === 'white' ? '#fff' : '#0f172a' }}
                      onClick={submitKeypad}
                    >
                      Call elevator
                    </button>
                  </div>
                )}

                {dopUi === 'directory' && (
                  <ul className="max-h-64 space-y-1 overflow-y-auto">
                    {DIRECTORY.map((d) => (
                      <li key={d.floor}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:opacity-80"
                          style={{ border: `1px solid ${theme.border}` }}
                          onClick={() => callFloor(d.floor)}
                        >
                          <span>{d.name}</span>
                          <span className="opacity-50">{floorLabel(d.floor)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {errMsg && <p className="mt-3 text-center text-xs text-rose-400">{errMsg}</p>}
              </div>

              <div className="flex items-center gap-2 border-t px-4 py-3" style={{ borderColor: theme.border }}>
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full text-lg"
                  style={{ border: `2px solid ${theme.accent}`, color: theme.accent }}
                  aria-label="Accessibility"
                  title="Accessibility — extended dwell & audio"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      accessibility: !s.accessibility,
                      extendedDwell: !s.accessibility,
                    }))
                  }
                >
                  ♿
                </button>
                <span className="text-[10px] opacity-50">
                  {state.accessibility ? 'A11Y ON · Verbal guidance' : 'Accessibility'}
                </span>
                <div className="ml-auto flex gap-1">
                  {(['black', 'white', 'silver', 'gold'] as ThemeSkin[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`h-5 w-5 rounded-full border ${skin === s ? 'ring-2 ring-sky-400' : ''}`}
                      style={{ background: SKINS[s].bg, borderColor: SKINS[s].border }}
                      aria-label={`Theme ${s}`}
                      onClick={() => setSkin(s)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Side controls */}
            <div className="flex flex-col gap-3">
              <div className="elev-card p-4">
                <h3 className="text-xs font-medium text-slate-300">Card reader</h3>
                <p className="mt-1 text-[10px] text-slate-500">Tap badge or enter VIP PIN for PH</p>
                <div className="mt-2 flex gap-2">
                  <input
                    className="elev-input flex-1 font-mono"
                    placeholder="PIN"
                    value={pinVal}
                    onChange={(e) => setPinVal(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                  />
                  <button type="button" className="elev-btn" onClick={submitPin}>
                    Scan
                  </button>
                </div>
                {vipMsg && <p className="mt-2 text-xs text-amber-200/70">{vipMsg}</p>}
              </div>

              <div className="elev-card p-4">
                <h3 className="text-xs font-medium text-slate-300">Display size</h3>
                <div className="mt-2 flex gap-2">
                  {(['7', '12'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      className={`elev-btn flex-1 ${displaySize === sz ? 'ring-1 ring-sky-400' : ''}`}
                      onClick={() => setDisplaySize(sz)}
                    >
                      {sz}&quot;
                    </button>
                  ))}
                </div>
              </div>

              <div className="elev-card p-4">
                <h3 className="text-xs font-medium text-slate-300">Enter assigned car</h3>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {CAR_IDS.map((id) => {
                    const car = state.cars.find((c) => c.id === id)!
                    const open = car.door === 'open' && Math.round(car.floor) === LOBBY_FLOOR
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={!open}
                        className="elev-btn py-3 text-lg font-semibold disabled:opacity-30"
                        style={{ color: CAR_COLORS[id] }}
                        onClick={() => {
                          setState((s) => enterCab(s, id))
                          setPanel('cab')
                          setAssignment(null)
                        }}
                      >
                        {id}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-[10px] text-slate-500">Doors must be open at lobby</p>
              </div>

              {brand === 'collective' && (
                <div className="elev-card p-4">
                  <h3 className="text-xs font-medium text-slate-300">Hall call (collective)</h3>
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="elev-btn flex-1" onClick={() => callFloor(10)}>
                      ↑ Up
                    </button>
                    <button type="button" className="elev-btn flex-1" onClick={() => callFloor(-1)}>
                      ↓ Down
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {panel === 'cab' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="elev-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-200">
                  Car {state.activeCab} · COP
                </h3>
                <select
                  className="elev-input text-xs"
                  value={state.activeCab}
                  onChange={(e) => setState((s) => ({ ...s, activeCab: e.target.value as CarId }))}
                >
                  {CAR_IDS.map((id) => (
                    <option key={id} value={id}>
                      Car {id}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="mt-4 flex items-center justify-center rounded-xl py-6 font-mono text-4xl tabular-nums"
                style={{ background: '#0f172a', color: CAR_COLORS[state.activeCab] }}
              >
                {floorLabel(Math.round(activeCar.floor))}
              </div>

              <p className="mt-2 text-center text-xs text-slate-500">
                {activeCar.direction > 0 ? '▲ UP' : activeCar.direction < 0 ? '▼ DOWN' : '● IDLE'} ·{' '}
                {activeCar.riders.length}/{CAPACITY} · {activeCar.door}
              </p>

              {/* Destination indicator (Polaris) */}
              {(brand === 'polaris' || brand === 'hybrid') && activeCar.stops.length > 0 && (
                <div className="mt-3 rounded-lg border border-slate-700/50 bg-black/30 px-3 py-2">
                  <p className="text-[10px] uppercase text-slate-500">Destination indicator</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {activeCar.stops.slice(0, 8).map(floorLabel).join(' → ')}
                  </p>
                </div>
              )}

              <div className="mt-4 grid max-h-48 grid-cols-6 gap-1.5 overflow-y-auto">
                {FLOOR_DEFS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`elev-floor-btn text-xs ${activeCar.stops.includes(f.id) ? 'ring-1 ring-sky-400' : ''}`}
                    onClick={() => setState((s) => cabSelectFloor(s, state.activeCab, f.id))}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="elev-btn"
                  onClick={() => setState((s) => toggleDoor(s, state.activeCab, true))}
                >
                  ◫ Open
                </button>
                <button
                  type="button"
                  className="elev-btn"
                  onClick={() => setState((s) => toggleDoor(s, state.activeCab, false))}
                >
                  ◧ Close
                </button>
                <button type="button" className="elev-btn" onClick={() => setState((s) => ({ ...s, logs: [{ id: s.nextId++, t: s.simTime, kind: 'voice' as const, text: '🔔 Alarm — building security notified (not really)' }, ...s.logs].slice(0, 40) }))}>
                  🔔 Alarm
                </button>
                <button type="button" className="elev-btn" onClick={() => setState((s) => ({ ...s, logs: [{ id: s.nextId++, t: s.simTime, kind: 'voice' as const, text: '📞 Elevator phone — connected to hold music' }, ...s.logs].slice(0, 40) }))}>
                  📞 Phone
                </button>
              </div>

              {inside && (
                <button type="button" className="elev-btn mt-4 w-full" onClick={() => setState(exitCab)}>
                  Exit cab at {floorLabel(Math.round(inside.floor))}
                </button>
              )}
            </div>

            <div className="elev-card p-5">
              <h3 className="text-sm font-medium text-slate-200">Load &amp; riders</h3>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${activeCar.loadFactor * 100}%`,
                    background:
                      activeCar.loadFactor > 0.85 ? '#f87171' : activeCar.loadFactor > 0.6 ? '#fbbf24' : '#34d399',
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {brand === 'polaris' ? 'Polaris target load &lt;65% even at peak' : 'Car load factor'}
              </p>
              <ul className="mt-4 max-h-40 space-y-1 overflow-y-auto text-xs text-slate-400">
                {activeCar.riders.length === 0 ? (
                  <li>No riders — enjoy the awkward silence</li>
                ) : (
                  activeCar.riders.map((r) => (
                    <li key={r.id}>
                      → {floorLabel(r.to)} {r.accessible ? '♿' : ''}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}

        {panel === 'remote' && (
          <div className="elev-card mx-auto max-w-sm p-5">
            <h3 className="text-center text-sm font-medium text-slate-200">KONE RemoteCall™</h3>
            <p className="mt-1 text-center text-[10px] text-slate-500">Call elevator from anywhere in building</p>
            <label className="mt-4 block text-xs text-slate-400">
              From floor
              <select
                className="elev-input mt-1 w-full"
                value={remoteFrom}
                onChange={(e) => setRemoteFrom(Number(e.target.value))}
              >
                {FLOOR_DEFS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-xs text-slate-400">
              To floor
              <select
                className="elev-input mt-1 w-full"
                value={remoteTo}
                onChange={(e) => setRemoteTo(Number(e.target.value))}
              >
                {FLOOR_DEFS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="elev-btn mt-4 w-full py-3"
                onClick={() => {
                  setState((s) => {
                    const res = requestDestination(s, remoteFrom, remoteTo)
                    if (res.assignment) {
                      setAssignment(res.assignment)
                      setAssignTime(s.simTime)
                      setLastDestination(remoteTo)
                    }
                    return res.state
                  })
                  setPanel('ride')
                }}
            >
              📱 Call elevator
            </button>
          </div>
        )}

        {panel === 'admin' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="elev-card p-4">
              <h3 className="text-xs font-medium text-slate-300">System brand / mode</h3>
              <div className="mt-3 flex flex-col gap-2">
                {(['compass360', 'polaris', 'hybrid', 'collective'] as SystemBrand[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`elev-btn text-left ${state.brand === b ? 'ring-1 ring-sky-400' : ''}`}
                    onClick={() => setState((s) => setBrand(s, b))}
                  >
                    {brandLabel(b)}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-slate-500">
                Hybrid: DOP at lobby + COP in cars. Collective: traditional hall call only.
              </p>
            </div>

            <div className="elev-card p-4">
              <h3 className="text-xs font-medium text-slate-300">
                {state.brand === 'polaris' ? 'AI traffic learning' : 'Traffic profile'}
              </h3>
              <div className="mt-3 flex gap-2">
                {(['light', 'normal', 'peak'] as TrafficMode[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`elev-btn flex-1 capitalize ${state.traffic === t ? 'ring-1 ring-amber-400' : ''}`}
                    onClick={() => setState((s) => setTraffic(s, t))}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {state.brand === 'polaris' && (
                <p className="mt-2 text-[10px] text-emerald-400/70">AI adjusting group dispatch for {state.traffic} flow…</p>
              )}
            </div>

            <div className="elev-card p-4">
              <h3 className="text-xs font-medium text-slate-300">Fire service / inspection</h3>
              <button
                type="button"
                className={`elev-btn mt-3 w-full ${state.fireService ? 'bg-rose-950/50 ring-1 ring-rose-400' : ''}`}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    fireService: !s.fireService,
                    logs: [
                      {
                        id: s.nextId++,
                        t: s.simTime,
                        kind: 'system' as const,
                        text: s.fireService ? 'Fire service cleared' : '🔥 Fire service — cars recall to lobby',
                      },
                      ...s.logs,
                    ].slice(0, 40),
                  }))
                }
              >
                {state.fireService ? 'Clear fire service' : 'Activate fire service'}
              </button>
            </div>

            <div className="elev-card p-4">
              <h3 className="text-xs font-medium text-slate-300">Travel speed</h3>
              <p className="mt-1 text-[10px] text-slate-500">
                {state.carSpeed.toFixed(2)} fl/s · default {DEFAULT_CAR_SPEED}
              </p>
              <input
                type="range"
                min={0.25}
                max={5}
                step={0.05}
                value={state.carSpeed}
                onChange={(e) => setState((s) => setCarSpeed(s, Number(e.target.value)))}
                className="lobby-range mt-3 w-full"
                aria-label="Elevator travel speed"
              />
            </div>

            <div className="elev-card p-4">
              <h3 className="text-xs font-medium text-slate-300">SuperGroup™ bridge</h3>
              <p className="mt-2 text-[10px] text-slate-500">
                Cars A+B low zone (B2–15), C+D high (16–65). Cross-zone handoff simulated.
              </p>
            </div>
          </div>
        )}

        {/* Event log */}
        <div className="elev-card mt-4 max-h-36 overflow-y-auto p-3">
          <h3 className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">System log</h3>
          <ul className="space-y-1 font-mono text-[10px] text-slate-400">
            {state.logs.map((l) => (
              <li key={l.id}>
                <span className="text-slate-600">[{l.t.toFixed(1)}s]</span> {l.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}
