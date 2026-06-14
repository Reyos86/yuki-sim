import type { Sector } from './assetPersonalities'

export type EventSeverity = 'Low' | 'Medium' | 'High' | 'Extreme'

export interface NewsEventTemplate {
  id: string
  headline: string
  description: string
  source: string
  severity: EventSeverity
  durationTicks: number
  marketImpact: number
  volatilityImpact: number
  sectorImpacts: Partial<Record<Sector, number>>
  symbolImpacts: Record<string, number>
  affectedSymbols: string[]
}

export interface ActiveNewsEvent extends NewsEventTemplate {
  instanceId: string
  triggeredAt: Date
  triggeredTickIndex: number
  remainingTicks: number
}

export const newsEventTemplates: NewsEventTemplate[] = [
  {
    id: 'regional-conflict',
    headline: 'Breaking: Regional conflict escalates overnight',
    description:
      'Border tensions in the eastern corridor flare into open conflict. Risk-off bid in defense and energy; tech and EV names under pressure.',
    source: 'GlobalDesk',
    severity: 'Extreme',
    durationTicks: 14,
    marketImpact: -0.0018,
    volatilityImpact: 0.012,
    sectorImpacts: {
      defense: 0.0060,
      energy: 0.0045,
      tech: -0.0030,
      ev: -0.0040,
      semiconductor: -0.0025,
      retail: -0.0015,
    },
    symbolImpacts: {},
    affectedSymbols: ['LMD', 'HXN', 'NVDA', 'BSLA', 'TSLA', 'MSFT', 'SHPR'],
  },
  {
    id: 'besla-battery',
    headline: 'Besla reveals next-generation battery with 40% range boost',
    description:
      'Besla unveils a solid-state battery pack with 40% greater range. EV peers ride the halo, volatility cools as risk appetite returns.',
    source: 'MarketWire',
    severity: 'High',
    durationTicks: 10,
    marketImpact: 0.0004,
    volatilityImpact: -0.0035,
    sectorImpacts: {
      ev: 0.0035,
      tech: 0.0008,
      semiconductor: 0.0006,
    },
    symbolImpacts: {
      BSLA: 0.0090,
      TSLA: 0.0020,
    },
    affectedSymbols: ['BSLA', 'TSLA', 'NVDA'],
  },
  {
    id: 'inflation-hot',
    headline: 'Inflation report comes in hotter than expected',
    description:
      'CPI surprise sends yields higher. Risk assets unwind, growth/tech leads the decline while consumer defensives catch a small bid.',
    source: 'EconPulse',
    severity: 'High',
    durationTicks: 12,
    marketImpact: -0.0010,
    volatilityImpact: 0.0080,
    sectorImpacts: {
      tech: -0.0030,
      semiconductor: -0.0025,
      ev: -0.0020,
      crypto: -0.0030,
      'consumer-defensive': 0.0010,
      energy: 0.0005,
    },
    symbolImpacts: {},
    affectedSymbols: ['MSFT', 'AAPL', 'GOOG', 'META', 'AMZN', 'NVDA', 'AMD', 'BSLA', 'TSLA', 'COIN', 'CLN'],
  },
  {
    id: 'ai-chip-boom',
    headline: 'AI chip demand surges after massive data center spending report',
    description:
      'Hyperscaler capex guide blows past estimates. Semis rip, megacap software catches a bid, vol fades on the goldilocks read.',
    source: 'TechLedger',
    severity: 'High',
    durationTicks: 10,
    marketImpact: 0.0008,
    volatilityImpact: -0.0040,
    sectorImpacts: {
      semiconductor: 0.0035,
      tech: 0.0018,
    },
    symbolImpacts: {
      NVDA: 0.0095,
      AMD: 0.0050,
      MSFT: 0.0015,
    },
    affectedSymbols: ['NVDA', 'AMD', 'MSFT', 'GOOG'],
  },
  {
    id: 'energy-shock',
    headline: 'Major energy supply disruption sends oil prices higher',
    description:
      'Pipeline disruption tightens crude supply. Energy ramps, consumer-facing names hit on margin fears, vol expands.',
    source: 'CommodityWatch',
    severity: 'High',
    durationTicks: 12,
    marketImpact: -0.0005,
    volatilityImpact: 0.0060,
    sectorImpacts: {
      energy: 0.0055,
      retail: -0.0035,
      tech: -0.0018,
      'consumer-defensive': -0.0010,
    },
    symbolImpacts: {
      HXN: 0.0085,
      SHPR: -0.0050,
    },
    affectedSymbols: ['HXN', 'SHPR', 'CLN', 'MSFT', 'AAPL'],
  },
  {
    id: 'meme-frenzy',
    headline: 'GamePop trends worldwide as retail traders pile in',
    description:
      'GamePop goes viral on retail social feeds. Vertical move on huge volume — late buyers beware: reversal risk is elevated post-event.',
    source: 'RetailRadar',
    severity: 'Extreme',
    durationTicks: 8,
    marketImpact: 0.0,
    volatilityImpact: 0.0050,
    sectorImpacts: {
      gaming: 0.0020,
    },
    symbolImpacts: {
      GMP: 0.0180,
    },
    affectedSymbols: ['GMP'],
  },
  {
    id: 'meme-reversal',
    headline: 'GamePop reverses hard as momentum fades',
    description:
      'Retail piles out of GamePop after the parabolic move stalls. Hot money rotates and the squeeze unwinds.',
    source: 'RetailRadar',
    severity: 'High',
    durationTicks: 6,
    marketImpact: 0.0,
    volatilityImpact: 0.0030,
    sectorImpacts: {
      gaming: -0.0015,
    },
    symbolImpacts: {
      GMP: -0.0170,
    },
    affectedSymbols: ['GMP'],
  },
]

export const eventTemplateById = Object.fromEntries(
  newsEventTemplates.map((t) => [t.id, t]),
) as Record<string, NewsEventTemplate>

export const triggerableEventIds = [
  'regional-conflict',
  'besla-battery',
  'inflation-hot',
  'ai-chip-boom',
  'energy-shock',
  'meme-frenzy',
] as const

export type TriggerableEventId = (typeof triggerableEventIds)[number]

export const triggerButtonLabels: Record<TriggerableEventId, string> = {
  'regional-conflict': 'Conflict',
  'besla-battery': 'Besla News',
  'inflation-hot': 'Inflation',
  'ai-chip-boom': 'AI Boom',
  'energy-shock': 'Energy Shock',
  'meme-frenzy': 'Meme Frenzy',
}

export const severityColors: Record<EventSeverity, string> = {
  Low: '#60a5fa',
  Medium: '#fbbf24',
  High: '#fb923c',
  Extreme: '#ef4444',
}

export function pickRandomEventId(): TriggerableEventId {
  return triggerableEventIds[Math.floor(Math.random() * triggerableEventIds.length)]
}

export function instantiateEvent(
  template: NewsEventTemplate,
  triggeredAt: Date,
  tickIndex: number,
): ActiveNewsEvent {
  return {
    ...template,
    instanceId: `${template.id}-${tickIndex}-${Math.floor(Math.random() * 10_000)}`,
    triggeredAt: new Date(triggeredAt.getTime()),
    triggeredTickIndex: tickIndex,
    remainingTicks: template.durationTicks,
  }
}
