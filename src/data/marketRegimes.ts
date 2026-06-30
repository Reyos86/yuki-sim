import type { Sector } from './assetPersonalities'
import { randomChoice, randomInt } from '../utils/prng'

export interface MarketRegimeTemplate {
  id: string
  name: string
  description: string
  durationTicksMin: number
  durationTicksMax: number
  marketDrift: number
  tasdaqDrift: number
  vexDrift: number
  volatilityMultiplier: number
  sectorBiases: Partial<Record<Sector, number>>
  symbolBiases: Record<string, number>
}

export interface ActiveMarketRegime extends MarketRegimeTemplate {
  instanceId: string
  remainingTicks: number
  startedAtTick: number
}

export const marketRegimes: MarketRegimeTemplate[] = [
  {
    id: 'bull-trend',
    name: 'Bull Trend',
    description: 'Steady risk-on tape. Broad market grinds higher while volatility fades.',
    durationTicksMin: 70,
    durationTicksMax: 140,
    marketDrift: 0.00012,
    tasdaqDrift: 0.00017,
    vexDrift: -0.00065,
    volatilityMultiplier: 0.85,
    sectorBiases: {
      tech: 0.00008,
      semiconductor: 0.0001,
      ev: 0.00008,
      'consumer-defensive': -0.00003,
    },
    symbolBiases: {},
  },
  {
    id: 'bear-trend',
    name: 'Bear Trend',
    description: 'Risk appetite is thin. Growth names are heavy and volatility trends higher.',
    durationTicksMin: 55,
    durationTicksMax: 120,
    marketDrift: -0.00013,
    tasdaqDrift: -0.00022,
    vexDrift: 0.00075,
    volatilityMultiplier: 1.2,
    sectorBiases: {
      tech: -0.00012,
      semiconductor: -0.00014,
      ev: -0.00016,
      crypto: -0.00018,
      'consumer-defensive': 0.00005,
    },
    symbolBiases: {},
  },
  {
    id: 'choppy-market',
    name: 'Choppy Market',
    description: 'No clear direction. Indexes chop around and traders fade every move.',
    durationTicksMin: 50,
    durationTicksMax: 120,
    marketDrift: 0,
    tasdaqDrift: 0,
    vexDrift: 0.0002,
    volatilityMultiplier: 1.35,
    sectorBiases: {},
    symbolBiases: {},
  },
  {
    id: 'panic',
    name: 'Panic',
    description: 'Fast de-risking. Volatility spikes and defensive names hold up better.',
    durationTicksMin: 24,
    durationTicksMax: 60,
    marketDrift: -0.00042,
    tasdaqDrift: -0.00065,
    vexDrift: 0.0024,
    volatilityMultiplier: 2.35,
    sectorBiases: {
      tech: -0.00024,
      semiconductor: -0.00026,
      ev: -0.0003,
      retail: -0.0002,
      'consumer-defensive': 0.00012,
      defense: 0.00008,
      energy: 0.00004,
    },
    symbolBiases: {},
  },
  {
    id: 'recovery-rally',
    name: 'Recovery Rally',
    description: 'Buyers step back in after weakness. Volatile growth rebounds hard.',
    durationTicksMin: 40,
    durationTicksMax: 95,
    marketDrift: 0.00022,
    tasdaqDrift: 0.00036,
    vexDrift: -0.00105,
    volatilityMultiplier: 1.15,
    sectorBiases: {
      tech: 0.00016,
      semiconductor: 0.0002,
      ev: 0.00024,
      crypto: 0.0002,
      gaming: 0.00015,
    },
    symbolBiases: {
      BSLA: 0.00014,
      GMP: 0.00018,
    },
  },
  {
    id: 'tech-rally',
    name: 'Tech Rally',
    description: 'Tasdaq leads as semis, software, and EV momentum attract buyers.',
    durationTicksMin: 45,
    durationTicksMax: 110,
    marketDrift: 0.00008,
    tasdaqDrift: 0.00035,
    vexDrift: -0.00055,
    volatilityMultiplier: 1.05,
    sectorBiases: {
      tech: 0.0002,
      semiconductor: 0.00028,
      ev: 0.00012,
      energy: -0.00008,
      'consumer-defensive': -0.00005,
    },
    symbolBiases: {
      NVDA: 0.00025,
      MSFT: 0.00013,
      BSLA: 0.0001,
    },
  },
  {
    id: 'energy-rotation',
    name: 'Energy Rotation',
    description: 'Capital rotates into energy. Hexxon leads while growth is mixed.',
    durationTicksMin: 45,
    durationTicksMax: 100,
    marketDrift: 0.00002,
    tasdaqDrift: -0.00008,
    vexDrift: 0.00018,
    volatilityMultiplier: 1.1,
    sectorBiases: {
      energy: 0.0003,
      retail: -0.00012,
      tech: -0.00005,
      semiconductor: -0.00004,
    },
    symbolBiases: {
      HXN: 0.00032,
      SHPR: -0.00013,
    },
  },
  {
    id: 'defense-rally',
    name: 'Defense Rally',
    description: 'Security spending chatter lifts defense while the wider market stays mixed.',
    durationTicksMin: 40,
    durationTicksMax: 95,
    marketDrift: 0.00002,
    tasdaqDrift: -0.00002,
    vexDrift: 0.00032,
    volatilityMultiplier: 1.12,
    sectorBiases: {
      defense: 0.00032,
      energy: 0.00006,
      tech: -0.00004,
    },
    symbolBiases: {
      LMD: 0.00034,
    },
  },
]

export function instantiateRegime(
  template: MarketRegimeTemplate,
  tickIndex: number,
): ActiveMarketRegime {
  return {
    ...template,
    instanceId: `${template.id}-${tickIndex}-${randomInt(1000, 9999)}`,
    remainingTicks: randomInt(template.durationTicksMin, template.durationTicksMax),
    startedAtTick: tickIndex,
  }
}

export function pickRandomRegime(): MarketRegimeTemplate {
  return randomChoice(marketRegimes)
}

export function instantiateRandomRegime(tickIndex: number): ActiveMarketRegime {
  return instantiateRegime(pickRandomRegime(), tickIndex)
}
