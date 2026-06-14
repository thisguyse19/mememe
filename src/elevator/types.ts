export const CAR_IDS = ['A', 'B', 'C', 'D'] as const
export type CarId = (typeof CAR_IDS)[number]

export const FLOOR_DEFS = [
  { id: -2, label: 'B2', zone: 'parking' as const },
  { id: -1, label: 'B1', zone: 'parking' as const },
  { id: 0, label: 'L', zone: 'lobby' as const },
  ...Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    label: String(i + 1),
    zone: (i + 1 <= 8 ? 'low' : i + 1 <= 16 ? 'mid' : 'high') as 'low' | 'mid' | 'high',
  })),
  { id: 25, label: 'PH', zone: 'vip' as const },
]

export const FLOOR_MIN = FLOOR_DEFS[0].id
export const FLOOR_MAX = FLOOR_DEFS[FLOOR_DEFS.length - 1].id
export const LOBBY_FLOOR = 0

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
  mode: 'auto' | 'independent' | 'fire' | 'inspection'
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
