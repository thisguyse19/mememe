export {
  FLOOR_DEFS,
  FLOOR_MAX,
  FLOOR_MIN,
  LOBBY_FLOOR,
  CAR_IDS,
} from './types'

import type {
  Assignment,
  CarId,
  LobbyRequest,
  SimCar,
  SimLog,
  SimState,
  SystemBrand,
  TrafficMode,
} from './types'
import { CAR_IDS, FLOOR_DEFS, FLOOR_MAX, FLOOR_MIN, LOBBY_FLOOR } from './types'

const CAR_SPEED = 1.35
const DOOR_CYCLE = 0.55
const DOOR_OPEN = 1.8
const DOOR_OPEN_A11Y = 3.2
const CAPACITY = 12
const CAR_COLORS: Record<CarId, string> = { A: '#f59e0b', B: '#22d3ee', C: '#fb7185', D: '#a3e635' }

export { CAR_COLORS, CAPACITY }

export function floorLabel(id: number): string {
  return FLOOR_DEFS.find((f) => f.id === id)?.label ?? String(id)
}

export function floorZone(id: number): string {
  return FLOOR_DEFS.find((f) => f.id === id)?.zone ?? 'mid'
}

export function createInitialState(): SimState {
  return {
    cars: CAR_IDS.map((id) => ({
      id,
      floor: id === 'A' ? 0 : id === 'B' ? 3 : id === 'C' ? 8 : 14,
      direction: 0,
      speed: 0,
      door: 'closed',
      doorT: 0,
      stops: [],
      riders: [],
      dwellLeft: 0,
      mode: 'auto',
      loadFactor: 0,
    })),
    lobbyQueue: [],
    hallCalls: [],
    simTime: 0,
    traffic: 'normal',
    brand: 'compass360',
    accessibility: false,
    extendedDwell: false,
    vipUnlocked: false,
    fireService: false,
    logs: [{ id: 0, t: 0, kind: 'system', text: 'Group controller online. 4 cars, 27 floors.' }],
    nextId: 1,
    activeCab: 'A',
    insideCar: null,
  }
}

function log(state: SimState, kind: SimLog['kind'], text: string): SimLog {
  const entry: SimLog = { id: state.nextId++, t: state.simTime, kind, text }
  state.logs.unshift(entry)
  state.logs = state.logs.slice(0, 40)
  return entry
}

function zoneOf(floor: number): string {
  return floorZone(floor)
}

function sortStops(stops: number[], direction: -1 | 0 | 1, current: number): number[] {
  const uniq = [...new Set(stops)]
  if (direction >= 0) {
    const up = uniq.filter((f) => f >= current).sort((a, b) => a - b)
    const down = uniq.filter((f) => f < current).sort((a, b) => b - a)
    return direction === 1 ? [...up, ...down] : [...down, ...up]
  }
  const down = uniq.filter((f) => f <= current).sort((a, b) => b - a)
  const up = uniq.filter((f) => f > current).sort((a, b) => a - b)
  return [...down, ...up]
}

function addStop(car: SimCar, floor: number) {
  if (!car.stops.includes(floor)) car.stops.push(floor)
  car.stops = sortStops(car.stops, car.direction || (floor > car.floor ? 1 : -1), Math.round(car.floor))
}

function eta(car: SimCar, target: number): number {
  const dist = Math.abs(target - car.floor)
  const stops = car.stops.filter((s) =>
    car.direction === 0
      ? true
      : car.direction === 1
        ? s >= Math.floor(car.floor) && s <= target
        : s <= Math.ceil(car.floor) && s >= target,
  ).length
  return dist / CAR_SPEED + stops * (DOOR_CYCLE * 2 + DOOR_OPEN) + (car.door !== 'closed' ? 1 : 0)
}

export function dispatchAssign(state: SimState, req: LobbyRequest): Assignment {
  const brand = state.brand
  let best: CarId = 'A'
  let bestScore = Infinity
  let bestReason = 'Nearest available car'

  for (const car of state.cars) {
    if (car.mode !== 'auto') continue
    const load = car.riders.length / CAPACITY
    if (load >= 1) continue

    const pickupEta = eta(car, req.from)
    const tripEta = eta({ ...car, floor: req.from }, req.to)
    let score = pickupEta + tripEta

    const sameZone = car.riders.some((r) => zoneOf(r.to) === zoneOf(req.to))
    const sameDest = car.riders.some((r) => r.to === req.to)
    if (brand === 'compass360' || brand === 'polaris' || brand === 'hybrid') {
      if (sameDest) score *= 0.55
      else if (sameZone) score *= 0.72
    }

    if (state.accessibility && load > 0.65) score += 4

    const goingUp = req.to > req.from
    if (car.direction === 1 && !goingUp && req.from < car.floor) score += 3
    if (car.direction === -1 && goingUp && req.from > car.floor) score += 3

    if (brand === 'polaris') score += load * 2.2

    if (score < bestScore) {
      bestScore = score
      best = car.id
      if (sameDest) bestReason = 'SmartGroup™ — same destination'
      else if (sameZone) bestReason = 'SmartGroup™ — same zone'
      else if (pickupEta < 2) bestReason = 'Car arriving imminently'
      else bestReason = brand === 'polaris' ? 'AI dispatch — optimal load balance' : 'Compass dispatch — shortest journey'
    }
  }

  const idx = CAR_IDS.indexOf(best)
  const arrow = idx <= 1 ? 'left' : 'right'

  return { car: best, waitSec: Math.max(3, Math.round(bestScore)), reason: bestReason, arrow }
}

export function requestDestination(
  state: SimState,
  from: number,
  to: number,
  opts?: { accessible?: boolean; vip?: boolean },
): { state: SimState; assignment?: Assignment; error?: string } {
  const next = structuredClone(state) as SimState
  if (from === to) return { state: next, error: 'Already on this floor' }
  if (to === 25 && !next.vipUnlocked && from === LOBBY_FLOOR) {
    return { state: next, error: 'PH requires VIP credential (PIN 7777)' }
  }
  if (next.fireService) return { state: next, error: 'Fire service active — lobby dispatch disabled' }

  const usesDop =
    next.brand === 'compass360' ||
    next.brand === 'polaris' ||
    (next.brand === 'hybrid' && from === LOBBY_FLOOR)

  const req: LobbyRequest = {
    id: next.nextId++,
    from,
    to,
    accessible: opts?.accessible ?? next.accessibility,
    vip: opts?.vip ?? false,
  }

  if (usesDop) {
    const assignment = dispatchAssign(next, req)
    req.assigned = assignment.car
    req.assignedAt = next.simTime
    next.lobbyQueue.push(req)
    const car = next.cars.find((c) => c.id === assignment.car)!
    addStop(car, from)
    addStop(car, to)
    log(
      next,
      'assign',
      `→ Car ${assignment.car} to ${floorLabel(to)} (~${assignment.waitSec}s). ${assignment.reason}`,
    )
    if (next.accessibility) {
      log(next, 'voice', `Please proceed to elevator ${assignment.car}. Extended door time enabled.`)
    }
    return { state: next, assignment }
  }

  next.hallCalls.push({ id: next.nextId++, floor: from, dir: (to > from ? 1 : -1) as 1 | -1 })
  addHallCall(next, from, to > from ? 1 : -1)
  log(next, 'system', `Hall call registered ${floorLabel(from)} ${to > from ? '↑' : '↓'}`)
  return { state: next }
}

function addHallCall(state: SimState, floor: number, dir: 1 | -1) {
  for (const car of state.cars) {
    addStop(car, floor)
    const ridersHere = state.lobbyQueue.filter((r) => r.from === floor && r.assigned === car.id)
    for (const r of ridersHere) addStop(car, r.to)
  }
  if (!state.hallCalls.some((h) => h.floor === floor && h.dir === dir)) {
    state.hallCalls.push({ id: state.nextId++, floor, dir })
  }
}

export function cabSelectFloor(state: SimState, carId: CarId, floor: number): SimState {
  const next = structuredClone(state) as SimState
  const car = next.cars.find((c) => c.id === carId)
  if (!car || car.mode === 'fire') return next
  if (floor < FLOOR_MIN || floor > FLOOR_MAX) return next
  addStop(car, floor)
  log(next, 'system', `Car ${carId} COP → ${floorLabel(floor)}`)
  return next
}

export function toggleDoor(state: SimState, carId: CarId, open: boolean): SimState {
  const next = structuredClone(state) as SimState
  const car = next.cars.find((c) => c.id === carId)
  if (!car || Math.abs(car.speed) > 0.05) return next
  if (open && car.door === 'closed') {
    car.door = 'opening'
    car.doorT = 0
  } else if (!open && car.door === 'open') {
    car.door = 'closing'
    car.doorT = 0
  }
  return next
}

export function enterCab(state: SimState, carId: CarId): SimState {
  const next = structuredClone(state) as SimState
  const car = next.cars.find((c) => c.id === carId)!
  if (car.door !== 'open' || Math.abs(car.floor - Math.round(car.floor)) > 0.05) return next
  if (Math.round(car.floor) !== LOBBY_FLOOR && next.insideCar === null) {
    // can enter at any floor if doors open
  }
  next.insideCar = carId
  next.activeCab = carId
  return next
}

export function exitCab(state: SimState): SimState {
  const next = structuredClone(state) as SimState
  next.insideCar = null
  return next
}

export function setBrand(state: SimState, brand: SystemBrand): SimState {
  const next = structuredClone(state) as SimState
  next.brand = brand
  log(next, 'system', `Operating mode: ${brandLabel(brand)}`)
  return next
}

export function setTraffic(state: SimState, traffic: TrafficMode): SimState {
  const next = structuredClone(state) as SimState
  next.traffic = traffic
  log(next, 'traffic', `Traffic profile: ${traffic}${next.brand === 'polaris' ? ' — AI recalibrating' : ''}`)
  return next
}

export function brandLabel(brand: SystemBrand): string {
  switch (brand) {
    case 'compass360':
      return 'Otis Compass 360'
    case 'polaris':
      return 'KONE Polaris'
    case 'hybrid':
      return 'Hybrid DCS'
    case 'collective':
      return 'Collective (traditional)'
  }
}

function processBoarding(state: SimState, car: SimCar) {
  const floor = Math.round(car.floor)
  car.riders = car.riders.filter((r) => r.to !== floor)

  const waiting = state.lobbyQueue.filter(
    (q) => !q.boarded && q.assigned === car.id && q.from === floor,
  )
  for (const w of waiting) {
    if (car.riders.length >= CAPACITY) break
    w.boarded = car.id
    car.riders.push({ id: w.id, from: w.from, to: w.to, accessible: w.accessible })
    addStop(car, w.to)
    log(state, 'board', `Rider boarded Car ${car.id} → ${floorLabel(w.to)}`)
  }

  car.loadFactor = car.riders.length / CAPACITY
  state.lobbyQueue = state.lobbyQueue.filter((q) => !q.boarded)
}

function nextStop(car: SimCar): number | null {
  if (car.stops.length === 0) return null
  const f = Math.round(car.floor)
  if (car.direction === 0) {
    car.direction = car.stops[0] > car.floor ? 1 : -1
  }
  const sorted = sortStops(car.stops, car.direction, f)
  car.stops = sorted
  return sorted[0] ?? null
}

export function stepSimulation(state: SimState, dt: number): SimState {
  const next = structuredClone(state) as SimState
  next.simTime += dt

  if (next.fireService) {
    for (const car of next.cars) {
      car.mode = 'fire'
      if (car.id === 'A' && car.stops.length === 0) addStop(car, LOBBY_FLOOR)
    }
  }

  for (const car of next.cars) {
    if (car.door !== 'closed' && car.door !== 'opening' && car.door !== 'closing') {
      // open dwell handled below
    }

    if (car.door === 'opening') {
      car.doorT += dt
      if (car.doorT >= DOOR_CYCLE) {
        car.door = 'open'
        car.doorT = 0
        car.dwellLeft =
          (next.extendedDwell || next.accessibility ? DOOR_OPEN_A11Y : DOOR_OPEN) +
          (car.riders.some((r) => r.accessible) ? 0.8 : 0)
        processBoarding(next, car)
      }
      continue
    }

    if (car.door === 'open') {
      car.dwellLeft -= dt
      if (car.dwellLeft <= 0) {
        car.door = 'closing'
        car.doorT = 0
      }
      continue
    }

    if (car.door === 'closing') {
      car.doorT += dt
      if (car.doorT >= DOOR_CYCLE) {
        car.door = 'closed'
        car.doorT = 0
      }
      continue
    }

    const stop = nextStop(car)
    if (stop === null) {
      car.direction = 0
      car.speed = 0
      continue
    }

    const diff = stop - car.floor
    if (Math.abs(diff) < 0.02) {
      car.floor = stop
      car.speed = 0
      car.stops = car.stops.filter((s) => s !== stop)
      car.door = 'opening'
      car.doorT = 0
      if (next.insideCar === car.id) next.activeCab = car.id
      continue
    }

    car.direction = diff > 0 ? 1 : -1
    car.speed = CAR_SPEED
    car.floor += car.direction * CAR_SPEED * dt
    car.floor = Math.max(FLOOR_MIN, Math.min(FLOOR_MAX, car.floor))
  }

  maybeSpawnNpc(next)
  return next
}

function maybeSpawnNpc(state: SimState) {
  const rate = state.traffic === 'peak' ? 0.35 : state.traffic === 'normal' ? 0.12 : 0.04
  if (Math.random() > rate * 0.016) return
  if (state.brand === 'collective') return

  const from = LOBBY_FLOOR
  let to = Math.floor(Math.random() * (FLOOR_MAX - 1)) + 1
  if (Math.random() < 0.15) to = -1

  const req: LobbyRequest = {
    id: state.nextId++,
    from,
    to,
    accessible: Math.random() < 0.08,
    vip: false,
  }
  const assignment = dispatchAssign(state, req)
  req.assigned = assignment.car
  req.assignedAt = state.simTime
  state.lobbyQueue.push(req)
  const car = state.cars.find((c) => c.id === assignment.car)!
  addStop(car, from)
  addStop(car, to)
}

export function drawShaft(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: SimState,
  highlight?: CarId,
) {
  const pad = 28
  const shaftTop = pad
  const shaftBot = h - pad
  const shaftH = shaftBot - shaftTop
  const colW = (w - pad * 2) / CAR_IDS.length

  const floorY = (f: number) => shaftBot - ((f - FLOOR_MIN) / (FLOOR_MAX - FLOOR_MIN)) * shaftH

  ctx.fillStyle = '#0c1018'
  ctx.fillRect(0, 0, w, h)

  for (const f of FLOOR_DEFS) {
    const y = floorY(f.id)
    ctx.strokeStyle = f.id === LOBBY_FLOOR ? 'rgba(96,165,250,0.35)' : 'rgba(255,255,255,0.06)'
    ctx.lineWidth = f.id === LOBBY_FLOOR ? 1.5 : 1
    ctx.beginPath()
    ctx.moveTo(pad, y)
    ctx.lineTo(w - pad, y)
    ctx.stroke()
    ctx.fillStyle = 'rgba(148,163,184,0.55)'
    ctx.font = '10px ui-monospace, monospace'
    ctx.textAlign = 'right'
    ctx.fillText(f.label, pad - 6, y + 3)
  }

  CAR_IDS.forEach((id, i) => {
    const car = state.cars.find((c) => c.id === id)!
    const x = pad + i * colW + colW * 0.12
    const cw = colW * 0.76
    const ch = shaftH / (FLOOR_MAX - FLOOR_MIN + 2) * 1.6
    const cy = floorY(car.floor) - ch / 2

    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    ctx.fillRect(x, shaftTop, cw, shaftH)

    ctx.fillStyle = id === highlight ? CAR_COLORS[id] : `${CAR_COLORS[id]}cc`
    ctx.shadowColor = CAR_COLORS[id]
    ctx.shadowBlur = id === highlight ? 18 : 6
    roundRect(ctx, x, cy, cw, ch, 4)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.fillStyle = '#0f172a'
    ctx.font = 'bold 13px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(id, x + cw / 2, cy + ch / 2 + 4)

    const doorGap = car.door === 'open' || car.door === 'opening' ? cw * 0.22 : 0
    ctx.fillStyle = 'rgba(15,23,42,0.85)'
    ctx.fillRect(x + 2, cy + 2, cw / 2 - 1 - doorGap / 2, ch - 4)
    ctx.fillRect(x + cw / 2 + 1 + doorGap / 2, cy + 2, cw / 2 - 1 - doorGap / 2, ch - 4)

    if (car.direction !== 0) {
      ctx.fillStyle = car.direction > 0 ? '#86efac' : '#fca5a5'
      ctx.font = '10px system-ui'
      ctx.fillText(car.direction > 0 ? '▲' : '▼', x + cw / 2, cy - 4)
    }
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
