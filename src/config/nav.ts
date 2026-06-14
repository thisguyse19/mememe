export const NAV_COMMANDS = {
  hobby: 'hobby',
  duck: 'duck',
  poo: 'poo',
  cursed: 'cursed',
  lobby: 'lobby',
  elevator: 'elevator',
  arcade: 'arcade',
  void: 'void',
} as const

export type NavPage = (typeof NAV_COMMANDS)[keyof typeof NAV_COMMANDS]

export const NAV_INPUT_MAX = 24
