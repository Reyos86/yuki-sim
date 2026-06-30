export type GameModeId = 'sandbox' | 'career' | 'challenge' | 'options-bootcamp'

export interface GameMode {
  id: GameModeId
  name: string
  tagline: string
  description: string
  startingCash: number
  difficulty: 'Relaxed' | 'Standard' | 'Hard' | 'Focused'
}

export const gameModes: GameMode[] = [
  {
    id: 'sandbox',
    name: 'Sandbox',
    tagline: 'Free Play',
    description: 'Start with a large account and experiment with stocks, options, events, and chart tools.',
    startingCash: 100_000,
    difficulty: 'Relaxed',
  },
  {
    id: 'career',
    name: 'Career',
    tagline: 'Build The Account',
    description: 'Begin with a smaller account and grow it through disciplined trading sessions.',
    startingCash: 25_000,
    difficulty: 'Standard',
  },
  {
    id: 'challenge',
    name: '30-Day Challenge',
    tagline: 'Survive The Market',
    description: 'A tighter account with less room for mistakes. Focus on drawdown control and consistency.',
    startingCash: 10_000,
    difficulty: 'Hard',
  },
  {
    id: 'options-bootcamp',
    name: 'Options Bootcamp',
    tagline: 'Calls & Puts',
    description: 'A focused mode for learning options entries, exits, premiums, and live P/L behavior.',
    startingCash: 50_000,
    difficulty: 'Focused',
  },
]

export const defaultGameMode = gameModes[0]

export function getGameMode(id: string | null | undefined): GameMode {
  return gameModes.find((mode) => mode.id === id) ?? defaultGameMode
}
