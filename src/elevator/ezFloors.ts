import { VIP_FLOOR } from './types'

export const EZ_FLOORS: { floor: number; label: string; sub: string }[] = [
  { floor: -2, label: 'B2', sub: 'Parking' },
  { floor: -1, label: 'B1', sub: 'Parking' },
  { floor: 0, label: 'L', sub: 'Lobby' },
  { floor: 1, label: '1', sub: 'Café' },
  { floor: 5, label: '5', sub: 'HR' },
  { floor: 12, label: '12', sub: 'Desks' },
  { floor: 20, label: '20', sub: 'Legal' },
  { floor: 28, label: '28', sub: 'Servers' },
  { floor: 40, label: '40', sub: 'Exec' },
  { floor: 55, label: '55', sub: 'Sky Lounge' },
  { floor: VIP_FLOOR, label: '65', sub: 'Penthouse' },
]
