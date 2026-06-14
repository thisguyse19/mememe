export const CAR_IDS = ['A', 'B', 'C', 'D'] as const
export type CarId = (typeof CAR_IDS)[number]

export const VIP_FLOOR = 65
export const LOBBY_FLOOR = 0

function zoneForFloor(n: number) {
  if (n <= 15) return 'low' as const
  if (n <= 35) return 'mid' as const
  if (n <= 55) return 'high' as const
  if (n <= 64) return 'sky' as const
  return 'vip' as const
}

export const FLOOR_DEFS = [
  { id: -2, label: 'B2', zone: 'parking' as const },
  { id: -1, label: 'B1', zone: 'parking' as const },
  { id: 0, label: 'L', zone: 'lobby' as const },
  ...Array.from({ length: 65 }, (_, i) => {
    const id = i + 1
    return {
      id,
      label: id === VIP_FLOOR ? '65' : String(id),
      zone: zoneForFloor(id),
    }
  }),
]

export const FLOOR_MIN = FLOOR_DEFS[0].id
export const FLOOR_MAX = VIP_FLOOR

export type SystemBrand = 'compass360' | 'polaris' | 'hybrid' | 'collective'
export type DoorState = 'closed' | 'opening' | 'open' | 'closing'
export type TrafficMode = 'light' | 'normal' | 'peak'
export type DopUiMode = 'grid' | 'keypad' | 'directory'
export type ThemeSkin = 'black' | 'white' | 'silver' | 'gold'

export type Rider = {
  id: number
  from: number
  to: number
  accessible: boolean
}

export type LobbyRequest = {
  id: number
  from: number
  to: number
  assigned?: CarId
  assignedAt?: number
  accessible: boolean
  vip: boolean
  boarded?: CarId
}

export type HallCall = {
  id: number
  floor: number
  dir: 1 | -1
}

export type CrashState = {
  active: boolean
  car: CarId
  phase: number
  phaseT: number
  stuckFloor: number
  spinFloor: number
  message: string
}

export type SimCar = {
  id: CarId
  floor: number
  direction: -1 | 0 | 1
  speed: number
  door: DoorState
  doorT: number
  stops: number[]
  riders: Rider[]
  dwellLeft: number
  mode: 'auto' | 'independent' | 'fire' | 'inspection' | 'crash'
  loadFactor: number
}

export type SimState = {
  cars: SimCar[]
  lobbyQueue: LobbyRequest[]
  hallCalls: HallCall[]
  simTime: number
  traffic: TrafficMode
  brand: SystemBrand
  accessibility: boolean
  extendedDwell: boolean
  vipUnlocked: boolean
  fireService: boolean
  crash: CrashState | null
  logs: SimLog[]
  nextId: number
  activeCab: CarId
  insideCar: CarId | null
}

export type SimLog = {
  id: number
  t: number
  kind: 'assign' | 'board' | 'traffic' | 'system' | 'voice'
  text: string
}

export type Assignment = {
  car: CarId
  waitSec: number
  reason: string
  arrow: 'left' | 'right' | 'center'
}

export type RemoteCall = {
  from: number
  to: number
}
