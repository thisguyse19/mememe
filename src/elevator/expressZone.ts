import type { CarId } from './types'
import { VIP_FLOOR } from './types'

export const SKY_LOBBIES = [15, 35, 55, VIP_FLOOR] as const

export type ExpressZoneId = 'low' | 'mid' | 'high' | 'sky'

export type ExpressZoneDef = {
  id: ExpressZoneId
  name: string
  subtitle: string
  skyLobby: number
  floorMin: number
  floorMax: number
  cars: CarId[]
  picks: { floor: number; label: string }[]
}

export const EXPRESS_ZONES: ExpressZoneDef[] = [
  {
    id: 'low',
    name: 'Low Express',
    subtitle: 'Cars A · B · stops 1–15',
    skyLobby: 15,
    floorMin: 1,
    floorMax: 15,
    cars: ['A', 'B'],
    picks: [
      { floor: 1, label: '1' },
      { floor: 5, label: '5' },
      { floor: 12, label: '12' },
      { floor: 15, label: '15 ★' },
    ],
  },
  {
    id: 'mid',
    name: 'Mid Express',
    subtitle: 'Cars B · C · via Sky 35',
    skyLobby: 35,
    floorMin: 16,
    floorMax: 35,
    cars: ['B', 'C'],
    picks: [
      { floor: 20, label: '20' },
      { floor: 28, label: '28' },
      { floor: 35, label: '35 ★' },
    ],
  },
  {
    id: 'high',
    name: 'High Express',
    subtitle: 'Cars C · D · via Sky 55',
    skyLobby: 55,
    floorMin: 36,
    floorMax: 55,
    cars: ['C', 'D'],
    picks: [
      { floor: 40, label: '40' },
      { floor: 48, label: '48' },
      { floor: 55, label: '55 ★' },
    ],
  },
  {
    id: 'sky',
    name: 'Sky Express',
    subtitle: 'Car D · non-stop to top',
    skyLobby: VIP_FLOOR,
    floorMin: 56,
    floorMax: VIP_FLOOR,
    cars: ['D'],
    picks: [
      { floor: 56, label: '56' },
      { floor: 60, label: '60' },
      { floor: VIP_FLOOR, label: '65 ★' },
    ],
  },
]

export function expressZoneForFloor(floor: number): ExpressZoneDef | undefined {
  return EXPRESS_ZONES.find((z) => floor >= z.floorMin && floor <= z.floorMax)
}

/** Non-stop express path: hits sky lobbies between origin and destination only. */
export function buildExpressPath(from: number, to: number): number[] {
  if (from === to) return [from]
  const path: number[] = [from]
  const up = to > from

  if (up) {
    for (const sky of SKY_LOBBIES) {
      if (sky > from && sky < to) path.push(sky)
    }
  } else {
    for (const sky of [...SKY_LOBBIES].reverse()) {
      if (sky < from && sky > to) path.push(sky)
    }
  }

  path.push(to)
  return [...new Set(path)]
}

export function expressPathLabel(from: number, to: number): string {
  const path = buildExpressPath(from, to)
  if (path.length <= 2) return 'Direct express'
  return path.map((f) => (SKY_LOBBIES.includes(f as (typeof SKY_LOBBIES)[number]) ? `Sky ${f}` : String(f))).join(' → ')
}
