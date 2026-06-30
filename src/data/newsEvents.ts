import type { Sector } from './assetPersonalities'
import {
  randomBetween,
  randomChance,
  randomChoice,
  randomInt,
} from '../utils/prng'

export type EventSeverity = 'Low' | 'Medium' | 'High' | 'Extreme'

type ImpactRange = readonly [number, number]

export interface FollowUpOption {
  templateId: string
  chance: number
}

export interface NewsEventTemplate {
  id: string
  category: string
  buttonLabel: string
  markerLabel: string
  headlineVariations: string[]
  descriptionVariations: string[]
  severityOptions: EventSeverity[]
  durationTicksMin: number
  durationTicksMax: number
  marketImpactMin: number
  marketImpactMax: number
  volatilityImpactMin: number
  volatilityImpactMax: number
  sectorImpactRanges: Partial<Record<Sector, ImpactRange>>
  symbolImpactRanges: Record<string, ImpactRange>
  affectedSectorOptions: Sector[]
  affectedSymbolOptions: string[]
  followUpOptions: FollowUpOption[]
  source: string
  isFollowUp?: boolean
}

export interface ActiveNewsEvent {
  id: string
  templateId: string
  category: string
  buttonLabel: string
  markerLabel: string
  headline: string
  description: string
  source: string
  severity: EventSeverity
  durationTicks: number
  marketImpact: number
  volatilityImpact: number
  sectorImpacts: Partial<Record<Sector, number>>
  symbolImpacts: Record<string, number>
  affectedSectors: Sector[]
  affectedSymbols: string[]
  followUpOptions: FollowUpOption[]
  isFollowUp: boolean
  parentEventId?: string
  instanceId: string
  triggeredAt: Date
  triggeredTickIndex: number
  remainingTicks: number
}

const sectorMembers: Record<Sector, string[]> = {
  broad: [],
  tech: ['MSFT', 'AMZN', 'GOOG', 'META'],
  auto: [],
  ev: ['BSLA', 'TSLA'],
  consumer: [],
  'consumer-defensive': ['CLN'],
  retail: ['SHPR'],
  crypto: ['COIN'],
  semiconductor: ['NVDA', 'AMD'],
  gaming: ['GMP'],
  'mega-cap': ['AAPL'],
  energy: ['HXN'],
  defense: ['LMD'],
}

function template(input: NewsEventTemplate): NewsEventTemplate {
  return input
}

export const newsEventTemplates: NewsEventTemplate[] = [
  template({
    id: 'conflict-shock',
    category: 'Conflict Shock',
    buttonLabel: 'Conflict',
    markerLabel: 'CONFLICT',
    headlineVariations: [
      'Breaking: Regional conflict escalates overnight',
      'Alert: Overseas tensions rattle global markets',
      'Developing: Military strike sends traders into risk-off mode',
      'Breaking: Peace talks collapse as markets sell off',
      'Alert: Defense sector jumps after global security warning',
      'Developing: Shipping route tensions spark market volatility',
    ],
    descriptionVariations: [
      'Risk-off flows hit growth shares while defense and energy catch aggressive bids.',
      'Traders cut exposure as shipping risk, security warnings, and volatility spike together.',
      'Defense contractors and energy names outperform while tech and EV momentum fades.',
    ],
    severityOptions: ['Medium', 'High', 'Extreme'],
    durationTicksMin: 8,
    durationTicksMax: 18,
    marketImpactMin: -0.0024,
    marketImpactMax: -0.0007,
    volatilityImpactMin: 0.006,
    volatilityImpactMax: 0.018,
    sectorImpactRanges: {
      defense: [0.003, 0.008],
      energy: [0.002, 0.006],
      tech: [-0.004, -0.001],
      ev: [-0.005, -0.0015],
      semiconductor: [-0.0035, -0.0008],
      retail: [-0.0025, -0.0003],
    },
    symbolImpactRanges: {},
    affectedSectorOptions: ['defense', 'energy', 'tech', 'ev', 'semiconductor', 'retail'],
    affectedSymbolOptions: ['LMD', 'HXN', 'NVDA', 'MSFT', 'BSLA', 'TSLA', 'SHPR'],
    followUpOptions: [
      { templateId: 'peace-talks-announced', chance: 0.18 },
      { templateId: 'energy-route-disruption', chance: 0.16 },
      { templateId: 'defense-contract-surge', chance: 0.14 },
    ],
    source: 'GlobalDesk',
  }),
  template({
    id: 'besla-battery',
    category: 'Besla Battery News',
    buttonLabel: 'Besla News',
    markerLabel: 'BESLA',
    headlineVariations: [
      'Besla reveals next-generation battery with major range boost',
      'Rumor: Besla battery breakthrough leaks before product event',
      'Besla teases high-density battery pack ahead of investor day',
      'Analysts raise Besla targets after battery production report',
      'Besla shares surge after prototype range numbers leak',
      'Besla supplier hints at major battery efficiency gains',
    ],
    descriptionVariations: [
      'EV momentum improves as traders price in a better battery roadmap.',
      'Besla catches a sharp bid and EV peers move higher in sympathy.',
      'Investors chase range-improvement headlines while volatility cools.',
    ],
    severityOptions: ['Medium', 'High', 'Extreme'],
    durationTicksMin: 7,
    durationTicksMax: 15,
    marketImpactMin: 0.0001,
    marketImpactMax: 0.0008,
    volatilityImpactMin: -0.006,
    volatilityImpactMax: -0.001,
    sectorImpactRanges: {
      ev: [0.002, 0.006],
      tech: [0.0002, 0.0012],
    },
    symbolImpactRanges: {
      BSLA: [0.005, 0.014],
      TSLA: [0.0008, 0.003],
    },
    affectedSectorOptions: ['ev', 'tech'],
    affectedSymbolOptions: ['BSLA', 'TSLA', 'NVDA'],
    followUpOptions: [
      { templateId: 'confirmed-breakthrough', chance: 0.18 },
      { templateId: 'product-delay', chance: 0.14 },
      { templateId: 'recall-concern', chance: 0.1 },
      { templateId: 'overhyped-announcement', chance: 0.14 },
    ],
    source: 'MarketWire',
  }),
  template({
    id: 'inflation-shock',
    category: 'Inflation Shock',
    buttonLabel: 'Inflation',
    markerLabel: 'INFLATION',
    headlineVariations: [
      'Inflation report comes in hotter than expected',
      'Traders dump growth stocks after surprise inflation spike',
      'Central bank rate fears return after sticky inflation data',
      'Bond yields jump as inflation pressure builds',
      'Hot inflation print hits Tasdaq futures',
      'Market turns lower as rate-cut hopes fade',
    ],
    descriptionVariations: [
      'Growth and tech sell off as rate-cut hopes fade and volatility rises.',
      'Defensive shares hold steadier while Tasdaq momentum unwinds.',
      'Sticky inflation forces traders to reprice risk across high-beta names.',
    ],
    severityOptions: ['Low', 'Medium', 'High', 'Extreme'],
    durationTicksMin: 8,
    durationTicksMax: 18,
    marketImpactMin: -0.0017,
    marketImpactMax: -0.0003,
    volatilityImpactMin: 0.004,
    volatilityImpactMax: 0.014,
    sectorImpactRanges: {
      tech: [-0.0045, -0.001],
      semiconductor: [-0.004, -0.001],
      ev: [-0.004, -0.0008],
      crypto: [-0.005, -0.001],
      'consumer-defensive': [-0.0002, 0.0014],
    },
    symbolImpactRanges: {},
    affectedSectorOptions: ['tech', 'semiconductor', 'ev', 'crypto', 'consumer-defensive'],
    affectedSymbolOptions: ['MSFT', 'AAPL', 'GOOG', 'META', 'AMZN', 'NVDA', 'AMD', 'BSLA', 'TSLA', 'COIN', 'CLN'],
    followUpOptions: [
      { templateId: 'central-bank-statement', chance: 0.12 },
      { templateId: 'market-relief-rally', chance: 0.18 },
      { templateId: 'second-wave-selloff', chance: 0.16 },
    ],
    source: 'EconPulse',
  }),
  template({
    id: 'ai-chip-boom',
    category: 'AI Chip Boom',
    buttonLabel: 'AI Boom',
    markerLabel: 'AI BOOM',
    headlineVariations: [
      'AI chip demand surges after massive data center spending report',
      'Nvidiotron jumps as cloud giants race for AI hardware',
      'Analysts call AI chip cycle stronger than expected',
      'Tasdaq rallies as semiconductor demand accelerates',
      'Nvidiotron announces next-gen accelerator demand is sold out',
      'Macrosoft expands AI cloud spending forecast',
    ],
    descriptionVariations: [
      'Semiconductors lead the tape as AI infrastructure demand surprises higher.',
      'Tasdaq catches a bid, led by Nvidiotron and AI-exposed software names.',
      'Investors rotate back into chips as data-center spending forecasts rise.',
    ],
    severityOptions: ['Medium', 'High', 'Extreme'],
    durationTicksMin: 7,
    durationTicksMax: 16,
    marketImpactMin: 0.0002,
    marketImpactMax: 0.0012,
    volatilityImpactMin: -0.006,
    volatilityImpactMax: -0.0005,
    sectorImpactRanges: {
      semiconductor: [0.003, 0.008],
      tech: [0.001, 0.003],
      ev: [0.0001, 0.001],
    },
    symbolImpactRanges: {
      NVDA: [0.006, 0.015],
      AMD: [0.002, 0.007],
      MSFT: [0.0008, 0.003],
      BSLA: [0, 0.0018],
    },
    affectedSectorOptions: ['semiconductor', 'tech', 'ev'],
    affectedSymbolOptions: ['NVDA', 'AMD', 'MSFT', 'GOOG', 'BSLA'],
    followUpOptions: [
      { templateId: 'supply-shortage', chance: 0.14 },
      { templateId: 'export-restriction-rumor', chance: 0.12 },
      { templateId: 'analyst-upgrade-wave', chance: 0.14 },
      { templateId: 'valuation-warning', chance: 0.14 },
    ],
    source: 'TechLedger',
  }),
  template({
    id: 'energy-shock',
    category: 'Energy Supply Shock',
    buttonLabel: 'Energy Shock',
    markerLabel: 'ENERGY',
    headlineVariations: [
      'Major energy supply disruption sends oil prices higher',
      'Hexxon rallies after global supply concerns intensify',
      'Fuel futures spike after refinery outage report',
      'Energy stocks jump as shipping delays hit supply routes',
      'Oil shock pressures retail and transport stocks',
      'Traders rotate into energy after supply scare',
    ],
    descriptionVariations: [
      'Energy leads while retail and consumer-facing names lag on margin fears.',
      'Hexxon draws aggressive buying as traders price tighter supply.',
      'Volatility rises as fuel-cost pressure ripples through the market.',
    ],
    severityOptions: ['Medium', 'High', 'Extreme'],
    durationTicksMin: 8,
    durationTicksMax: 18,
    marketImpactMin: -0.0008,
    marketImpactMax: 0.0002,
    volatilityImpactMin: 0.003,
    volatilityImpactMax: 0.011,
    sectorImpactRanges: {
      energy: [0.003, 0.008],
      retail: [-0.005, -0.001],
      tech: [-0.0025, -0.0002],
      'consumer-defensive': [-0.0015, 0.0002],
    },
    symbolImpactRanges: {
      HXN: [0.006, 0.014],
      SHPR: [-0.007, -0.0015],
    },
    affectedSectorOptions: ['energy', 'retail', 'tech', 'consumer-defensive'],
    affectedSymbolOptions: ['HXN', 'SHPR', 'CLN', 'MSFT', 'AAPL'],
    followUpOptions: [
      { templateId: 'supply-restored', chance: 0.16 },
      { templateId: 'second-outage', chance: 0.15 },
      { templateId: 'government-reserve-release', chance: 0.12 },
    ],
    source: 'CommodityWatch',
  }),
  template({
    id: 'meme-frenzy',
    category: 'Meme Stock Frenzy',
    buttonLabel: 'Meme Frenzy',
    markerLabel: 'MEME',
    headlineVariations: [
      'GamePop trends worldwide as retail traders pile in',
      'GamePop volume explodes after viral trading challenge',
      'Retail traders target GamePop in sudden short squeeze attempt',
      'GamePop options volume hits record high',
      'Social media buzz sends GamePop into chaos',
      'GamePop halted briefly after violent price spike',
    ],
    descriptionVariations: [
      'GamePop rips higher as retail attention, options flow, and squeeze chatter collide.',
      'Volatility explodes in GamePop as late momentum buyers chase the move.',
      'A violent retail bid lifts GamePop, but follow-through risk is extremely unstable.',
    ],
    severityOptions: ['High', 'Extreme'],
    durationTicksMin: 5,
    durationTicksMax: 10,
    marketImpactMin: -0.0001,
    marketImpactMax: 0.0002,
    volatilityImpactMin: 0.002,
    volatilityImpactMax: 0.008,
    sectorImpactRanges: {
      gaming: [0.001, 0.004],
    },
    symbolImpactRanges: {
      GMP: [0.014, 0.032],
    },
    affectedSectorOptions: ['gaming'],
    affectedSymbolOptions: ['GMP'],
    followUpOptions: [
      { templateId: 'short-squeeze-continues', chance: 0.18 },
      { templateId: 'trading-halt', chance: 0.16 },
      { templateId: 'rug-pull-reversal', chance: 0.28 },
      { templateId: 'momentum-fades', chance: 0.22 },
    ],
    source: 'RetailRadar',
  }),
]

const followUpTemplates: NewsEventTemplate[] = [
  template({
    id: 'peace-talks-announced',
    category: 'Peace Talks Announced',
    buttonLabel: 'Peace Talks',
    markerLabel: 'RELIEF',
    headlineVariations: ['Follow-up: Peace talks announced after overnight tension', 'Developing: Diplomats reopen talks as risk appetite returns'],
    descriptionVariations: ['Risk assets recover as traders unwind part of the conflict shock.', 'Defense and energy cool as broad market relief buying returns.'],
    severityOptions: ['Low', 'Medium', 'High'],
    durationTicksMin: 5,
    durationTicksMax: 11,
    marketImpactMin: 0.0005,
    marketImpactMax: 0.0018,
    volatilityImpactMin: -0.01,
    volatilityImpactMax: -0.003,
    sectorImpactRanges: { defense: [-0.004, -0.001], energy: [-0.003, -0.0005], tech: [0.0005, 0.002] },
    symbolImpactRanges: {},
    affectedSectorOptions: ['defense', 'energy', 'tech'],
    affectedSymbolOptions: ['LMD', 'HXN', 'MSFT', 'NVDA', 'BSLA'],
    followUpOptions: [],
    source: 'GlobalDesk',
    isFollowUp: true,
  }),
  template({
    id: 'energy-route-disruption',
    category: 'Energy Route Disruption',
    buttonLabel: 'Route Disruption',
    markerLabel: 'ENERGY',
    headlineVariations: ['Follow-up: Shipping route disruption intensifies energy scare', 'Alert: Energy route delays deepen as insurance costs jump'],
    descriptionVariations: ['Energy names extend gains as supply fears persist.', 'Hexxon catches another bid while broad indexes wobble.'],
    severityOptions: ['Medium', 'High', 'Extreme'],
    durationTicksMin: 5,
    durationTicksMax: 12,
    marketImpactMin: -0.0012,
    marketImpactMax: -0.0002,
    volatilityImpactMin: 0.004,
    volatilityImpactMax: 0.012,
    sectorImpactRanges: { energy: [0.004, 0.009], retail: [-0.003, -0.0008] },
    symbolImpactRanges: { HXN: [0.005, 0.014] },
    affectedSectorOptions: ['energy', 'retail'],
    affectedSymbolOptions: ['HXN', 'SHPR'],
    followUpOptions: [],
    source: 'CommodityWatch',
    isFollowUp: true,
  }),
  template({
    id: 'defense-contract-surge',
    category: 'Defense Contract Surge',
    buttonLabel: 'Defense Surge',
    markerLabel: 'DEFENSE',
    headlineVariations: ['Follow-up: Lockmart Defense jumps on emergency contract chatter', 'Alert: Defense procurement rumor sends Lockmart higher'],
    descriptionVariations: ['Defense names extend gains while the broader market is mixed.', 'Lockmart outperforms as traders price a potential contract wave.'],
    severityOptions: ['Medium', 'High'],
    durationTicksMin: 5,
    durationTicksMax: 10,
    marketImpactMin: -0.0001,
    marketImpactMax: 0.0006,
    volatilityImpactMin: 0.0005,
    volatilityImpactMax: 0.005,
    sectorImpactRanges: { defense: [0.004, 0.009] },
    symbolImpactRanges: { LMD: [0.006, 0.016] },
    affectedSectorOptions: ['defense'],
    affectedSymbolOptions: ['LMD'],
    followUpOptions: [],
    source: 'GlobalDesk',
    isFollowUp: true,
  }),
  template({
    id: 'product-delay',
    category: 'Product Delay',
    buttonLabel: 'Product Delay',
    markerLabel: 'DELAY',
    headlineVariations: ['Follow-up: Besla battery rollout reportedly delayed', 'Alert: Besla supplier timing raises launch concerns'],
    descriptionVariations: ['Besla reverses as traders question the production timeline.', 'EV sentiment cools after a delay rumor hits the tape.'],
    severityOptions: ['Medium', 'High', 'Extreme'],
    durationTicksMin: 5,
    durationTicksMax: 11,
    marketImpactMin: -0.0005,
    marketImpactMax: 0.0001,
    volatilityImpactMin: 0.002,
    volatilityImpactMax: 0.009,
    sectorImpactRanges: { ev: [-0.006, -0.002] },
    symbolImpactRanges: { BSLA: [-0.016, -0.006], TSLA: [-0.004, -0.001] },
    affectedSectorOptions: ['ev'],
    affectedSymbolOptions: ['BSLA', 'TSLA'],
    followUpOptions: [],
    source: 'MarketWire',
    isFollowUp: true,
  }),
  template({
    id: 'recall-concern',
    category: 'Recall Concern',
    buttonLabel: 'Recall Concern',
    markerLabel: 'RECALL',
    headlineVariations: ['Follow-up: Besla recall concern pressures EV shares', 'Developing: Safety question hits Besla after battery headlines'],
    descriptionVariations: ['Besla gives back gains as recall chatter spreads.', 'EV names slip as traders reassess battery execution risk.'],
    severityOptions: ['Medium', 'High'],
    durationTicksMin: 5,
    durationTicksMax: 10,
    marketImpactMin: -0.0003,
    marketImpactMax: 0,
    volatilityImpactMin: 0.001,
    volatilityImpactMax: 0.006,
    sectorImpactRanges: { ev: [-0.004, -0.001] },
    symbolImpactRanges: { BSLA: [-0.011, -0.004] },
    affectedSectorOptions: ['ev'],
    affectedSymbolOptions: ['BSLA', 'TSLA'],
    followUpOptions: [],
    source: 'MarketWire',
    isFollowUp: true,
  }),
  template({
    id: 'confirmed-breakthrough',
    category: 'Confirmed Breakthrough',
    buttonLabel: 'Confirmed Breakthrough',
    markerLabel: 'BESLA',
    headlineVariations: ['Follow-up: Besla confirms battery breakthrough details', 'Breaking: Besla validates high-density pack performance'],
    descriptionVariations: ['Besla extends gains as confirmation removes doubt.', 'EV sentiment improves after details appear stronger than rumored.'],
    severityOptions: ['Medium', 'High', 'Extreme'],
    durationTicksMin: 5,
    durationTicksMax: 12,
    marketImpactMin: 0.0002,
    marketImpactMax: 0.001,
    volatilityImpactMin: -0.006,
    volatilityImpactMax: -0.001,
    sectorImpactRanges: { ev: [0.003, 0.008], tech: [0.0002, 0.001] },
    symbolImpactRanges: { BSLA: [0.007, 0.018], TSLA: [0.001, 0.004] },
    affectedSectorOptions: ['ev', 'tech'],
    affectedSymbolOptions: ['BSLA', 'TSLA', 'NVDA'],
    followUpOptions: [],
    source: 'MarketWire',
    isFollowUp: true,
  }),
  template({
    id: 'overhyped-announcement',
    category: 'Overhyped Announcement',
    buttonLabel: 'Overhyped',
    markerLabel: 'REVERSAL',
    headlineVariations: ['Follow-up: Besla event underwhelms after battery hype', 'Alert: Besla reverses as traders call battery reveal overhyped'],
    descriptionVariations: ['Late buyers unload as the announcement fails to match expectations.', 'EV momentum fades and volatility rises slightly.'],
    severityOptions: ['Medium', 'High'],
    durationTicksMin: 5,
    durationTicksMax: 10,
    marketImpactMin: -0.0004,
    marketImpactMax: 0.0001,
    volatilityImpactMin: 0.001,
    volatilityImpactMax: 0.006,
    sectorImpactRanges: { ev: [-0.0045, -0.001] },
    symbolImpactRanges: { BSLA: [-0.014, -0.004] },
    affectedSectorOptions: ['ev'],
    affectedSymbolOptions: ['BSLA', 'TSLA'],
    followUpOptions: [],
    source: 'MarketWire',
    isFollowUp: true,
  }),
  template({
    id: 'central-bank-statement',
    category: 'Central Bank Statement',
    buttonLabel: 'Central Bank',
    markerLabel: 'FED',
    headlineVariations: ['Follow-up: Central bank statement cools inflation panic', 'Developing: Officials signal patience after inflation spike'],
    descriptionVariations: ['Indexes stabilize as traders parse a less-hawkish tone.', 'Volatility eases, though growth remains jumpy.'],
    severityOptions: ['Low', 'Medium'],
    durationTicksMin: 4,
    durationTicksMax: 9,
    marketImpactMin: 0.0001,
    marketImpactMax: 0.0009,
    volatilityImpactMin: -0.006,
    volatilityImpactMax: -0.001,
    sectorImpactRanges: { tech: [0, 0.0015], 'consumer-defensive': [-0.0004, 0.0003] },
    symbolImpactRanges: {},
    affectedSectorOptions: ['tech', 'consumer-defensive'],
    affectedSymbolOptions: ['MSFT', 'NVDA', 'CLN'],
    followUpOptions: [],
    source: 'EconPulse',
    isFollowUp: true,
  }),
  template({
    id: 'market-relief-rally',
    category: 'Market Relief Rally',
    buttonLabel: 'Relief Rally',
    markerLabel: 'RELIEF',
    headlineVariations: ['Follow-up: Buyers step in after inflation selloff', 'Alert: Market relief rally starts as rates stabilize'],
    descriptionVariations: ['Risk assets rebound and VEX cools as oversold buyers appear.', 'Tasdaq bounces after the initial inflation shock fades.'],
    severityOptions: ['Medium', 'High'],
    durationTicksMin: 5,
    durationTicksMax: 12,
    marketImpactMin: 0.0006,
    marketImpactMax: 0.0018,
    volatilityImpactMin: -0.01,
    volatilityImpactMax: -0.003,
    sectorImpactRanges: { tech: [0.001, 0.004], semiconductor: [0.001, 0.004], ev: [0.0005, 0.003] },
    symbolImpactRanges: {},
    affectedSectorOptions: ['tech', 'semiconductor', 'ev'],
    affectedSymbolOptions: ['MSFT', 'NVDA', 'AMD', 'BSLA'],
    followUpOptions: [],
    source: 'EconPulse',
    isFollowUp: true,
  }),
  template({
    id: 'second-wave-selloff',
    category: 'Second Wave Selloff',
    buttonLabel: 'Second Selloff',
    markerLabel: 'SELL OFF',
    headlineVariations: ['Follow-up: Second wave selling hits after inflation shock', 'Alert: Growth stocks roll over again as yields climb'],
    descriptionVariations: ['The initial dip fails and volatility surges into another leg lower.', 'Tasdaq leads losses as traders cut high-duration exposure.'],
    severityOptions: ['Medium', 'High', 'Extreme'],
    durationTicksMin: 5,
    durationTicksMax: 12,
    marketImpactMin: -0.002,
    marketImpactMax: -0.0006,
    volatilityImpactMin: 0.006,
    volatilityImpactMax: 0.016,
    sectorImpactRanges: { tech: [-0.005, -0.0015], semiconductor: [-0.005, -0.0015], ev: [-0.004, -0.001] },
    symbolImpactRanges: {},
    affectedSectorOptions: ['tech', 'semiconductor', 'ev'],
    affectedSymbolOptions: ['MSFT', 'NVDA', 'AMD', 'BSLA', 'TSLA'],
    followUpOptions: [],
    source: 'EconPulse',
    isFollowUp: true,
  }),
  template({
    id: 'supply-shortage',
    category: 'Supply Shortage',
    buttonLabel: 'Supply Shortage',
    markerLabel: 'SHORTAGE',
    headlineVariations: ['Follow-up: AI chip supply shortage extends Nvidiotron rally', 'Alert: Chip backlog grows as AI demand outstrips supply'],
    descriptionVariations: ['Nvidiotron rises on scarcity pricing while Tasdaq trades mixed.', 'Volatility increases as supply constraints complicate the AI boom.'],
    severityOptions: ['Medium', 'High'],
    durationTicksMin: 5,
    durationTicksMax: 11,
    marketImpactMin: -0.0002,
    marketImpactMax: 0.0005,
    volatilityImpactMin: 0.001,
    volatilityImpactMax: 0.007,
    sectorImpactRanges: { semiconductor: [0.001, 0.005], tech: [-0.0005, 0.001] },
    symbolImpactRanges: { NVDA: [0.003, 0.01], AMD: [0.001, 0.004] },
    affectedSectorOptions: ['semiconductor', 'tech'],
    affectedSymbolOptions: ['NVDA', 'AMD', 'MSFT'],
    followUpOptions: [],
    source: 'TechLedger',
    isFollowUp: true,
  }),
  template({
    id: 'export-restriction-rumor',
    category: 'Export Restriction Rumor',
    buttonLabel: 'Export Rumor',
    markerLabel: 'EXPORT',
    headlineVariations: ['Follow-up: Export restriction rumor hits Nvidiotron', 'Alert: AI chip export headlines pressure semis'],
    descriptionVariations: ['Nvidiotron reverses sharply as traders price policy risk.', 'Tasdaq weakens and VEX rises on semiconductor uncertainty.'],
    severityOptions: ['Medium', 'High', 'Extreme'],
    durationTicksMin: 5,
    durationTicksMax: 12,
    marketImpactMin: -0.0012,
    marketImpactMax: -0.0002,
    volatilityImpactMin: 0.003,
    volatilityImpactMax: 0.012,
    sectorImpactRanges: { semiconductor: [-0.007, -0.002], tech: [-0.002, -0.0005] },
    symbolImpactRanges: { NVDA: [-0.018, -0.006], AMD: [-0.008, -0.002] },
    affectedSectorOptions: ['semiconductor', 'tech'],
    affectedSymbolOptions: ['NVDA', 'AMD', 'MSFT'],
    followUpOptions: [],
    source: 'TechLedger',
    isFollowUp: true,
  }),
  template({
    id: 'analyst-upgrade-wave',
    category: 'Analyst Upgrade Wave',
    buttonLabel: 'Upgrades',
    markerLabel: 'UPGRADE',
    headlineVariations: ['Follow-up: Analysts lift AI hardware targets across the board', 'Alert: Upgrade wave fuels another semi bid'],
    descriptionVariations: ['Chip names extend gains as analysts chase the AI demand cycle.', 'Tasdaq strengthens again on broad semiconductor upgrades.'],
    severityOptions: ['Low', 'Medium', 'High'],
    durationTicksMin: 5,
    durationTicksMax: 10,
    marketImpactMin: 0.0002,
    marketImpactMax: 0.001,
    volatilityImpactMin: -0.004,
    volatilityImpactMax: 0.001,
    sectorImpactRanges: { semiconductor: [0.002, 0.006], tech: [0.0005, 0.002] },
    symbolImpactRanges: { NVDA: [0.003, 0.01], AMD: [0.002, 0.006] },
    affectedSectorOptions: ['semiconductor', 'tech'],
    affectedSymbolOptions: ['NVDA', 'AMD', 'MSFT'],
    followUpOptions: [],
    source: 'TechLedger',
    isFollowUp: true,
  }),
  template({
    id: 'valuation-warning',
    category: 'Valuation Warning',
    buttonLabel: 'Valuation',
    markerLabel: 'WARNING',
    headlineVariations: ['Follow-up: Valuation warning cools AI trade', 'Alert: Strategists warn AI chip rally has run too far'],
    descriptionVariations: ['Semis give back part of the move as valuation concerns spread.', 'Tasdaq stalls while traders fade the crowded AI trade.'],
    severityOptions: ['Low', 'Medium', 'High'],
    durationTicksMin: 5,
    durationTicksMax: 10,
    marketImpactMin: -0.0008,
    marketImpactMax: -0.0001,
    volatilityImpactMin: 0.001,
    volatilityImpactMax: 0.006,
    sectorImpactRanges: { semiconductor: [-0.005, -0.001], tech: [-0.0015, -0.0002] },
    symbolImpactRanges: { NVDA: [-0.01, -0.003], AMD: [-0.005, -0.001] },
    affectedSectorOptions: ['semiconductor', 'tech'],
    affectedSymbolOptions: ['NVDA', 'AMD', 'MSFT'],
    followUpOptions: [],
    source: 'TechLedger',
    isFollowUp: true,
  }),
  template({
    id: 'supply-restored',
    category: 'Supply Restored',
    buttonLabel: 'Supply Restored',
    markerLabel: 'RELIEF',
    headlineVariations: ['Follow-up: Energy supply restored faster than expected', 'Alert: Fuel supply fears ease after repair update'],
    descriptionVariations: ['Hexxon cools and retail stabilizes as supply pressure eases.', 'VEX fades as energy-shock fears unwind.'],
    severityOptions: ['Low', 'Medium'],
    durationTicksMin: 4,
    durationTicksMax: 9,
    marketImpactMin: 0.0002,
    marketImpactMax: 0.001,
    volatilityImpactMin: -0.008,
    volatilityImpactMax: -0.002,
    sectorImpactRanges: { energy: [-0.005, -0.001], retail: [0.001, 0.004] },
    symbolImpactRanges: { HXN: [-0.008, -0.002], SHPR: [0.002, 0.006] },
    affectedSectorOptions: ['energy', 'retail'],
    affectedSymbolOptions: ['HXN', 'SHPR'],
    followUpOptions: [],
    source: 'CommodityWatch',
    isFollowUp: true,
  }),
  template({
    id: 'second-outage',
    category: 'Second Outage',
    buttonLabel: 'Second Outage',
    markerLabel: 'ENERGY',
    headlineVariations: ['Follow-up: Second refinery outage renews energy shock', 'Breaking: Additional outage sends fuel futures higher again'],
    descriptionVariations: ['Energy extends gains and retail pressure returns.', 'VEX rises as supply-risk headlines compound.'],
    severityOptions: ['Medium', 'High', 'Extreme'],
    durationTicksMin: 5,
    durationTicksMax: 12,
    marketImpactMin: -0.001,
    marketImpactMax: 0,
    volatilityImpactMin: 0.004,
    volatilityImpactMax: 0.012,
    sectorImpactRanges: { energy: [0.004, 0.01], retail: [-0.005, -0.001] },
    symbolImpactRanges: { HXN: [0.006, 0.015], SHPR: [-0.006, -0.0015] },
    affectedSectorOptions: ['energy', 'retail'],
    affectedSymbolOptions: ['HXN', 'SHPR'],
    followUpOptions: [],
    source: 'CommodityWatch',
    isFollowUp: true,
  }),
  template({
    id: 'government-reserve-release',
    category: 'Government Reserve Release',
    buttonLabel: 'Reserve Release',
    markerLabel: 'RELIEF',
    headlineVariations: ['Follow-up: Reserve release plan cools energy spike', 'Alert: Government fuel reserve release pressures energy shares'],
    descriptionVariations: ['Energy cools while consumer names recover modestly.', 'Market breadth improves as fuel-cost fears ease.'],
    severityOptions: ['Low', 'Medium'],
    durationTicksMin: 4,
    durationTicksMax: 9,
    marketImpactMin: 0.0002,
    marketImpactMax: 0.001,
    volatilityImpactMin: -0.007,
    volatilityImpactMax: -0.001,
    sectorImpactRanges: { energy: [-0.004, -0.001], retail: [0.001, 0.004] },
    symbolImpactRanges: { HXN: [-0.006, -0.001], SHPR: [0.001, 0.005] },
    affectedSectorOptions: ['energy', 'retail'],
    affectedSymbolOptions: ['HXN', 'SHPR'],
    followUpOptions: [],
    source: 'CommodityWatch',
    isFollowUp: true,
  }),
  template({
    id: 'short-squeeze-continues',
    category: 'Short Squeeze Continues',
    buttonLabel: 'Squeeze Continues',
    markerLabel: 'MEME',
    headlineVariations: ['Follow-up: GamePop short squeeze accelerates again', 'Alert: GamePop momentum extends as retail refuses to sell'],
    descriptionVariations: ['GamePop adds another leg higher as squeeze chatter intensifies.', 'Volatility remains wild and late buyers chase another spike.'],
    severityOptions: ['High', 'Extreme'],
    durationTicksMin: 4,
    durationTicksMax: 8,
    marketImpactMin: 0,
    marketImpactMax: 0.0002,
    volatilityImpactMin: 0.002,
    volatilityImpactMax: 0.008,
    sectorImpactRanges: { gaming: [0.001, 0.004] },
    symbolImpactRanges: { GMP: [0.012, 0.026] },
    affectedSectorOptions: ['gaming'],
    affectedSymbolOptions: ['GMP'],
    followUpOptions: [{ templateId: 'rug-pull-reversal', chance: 0.25 }, { templateId: 'momentum-fades', chance: 0.2 }],
    source: 'RetailRadar',
    isFollowUp: true,
  }),
  template({
    id: 'trading-halt',
    category: 'Trading Halt',
    buttonLabel: 'Trading Halt',
    markerLabel: 'HALT',
    headlineVariations: ['Follow-up: GamePop halted briefly after volatility burst', 'Alert: GamePop trading slows after exchange volatility pause'],
    descriptionVariations: ['GamePop barely moves as the tape digests the halt.', 'Volatility remains elevated while momentum cools temporarily.'],
    severityOptions: ['Medium', 'High'],
    durationTicksMin: 3,
    durationTicksMax: 7,
    marketImpactMin: 0,
    marketImpactMax: 0.0001,
    volatilityImpactMin: 0.001,
    volatilityImpactMax: 0.006,
    sectorImpactRanges: { gaming: [-0.0004, 0.0004] },
    symbolImpactRanges: { GMP: [-0.001, 0.001] },
    affectedSectorOptions: ['gaming'],
    affectedSymbolOptions: ['GMP'],
    followUpOptions: [{ templateId: 'rug-pull-reversal', chance: 0.18 }, { templateId: 'short-squeeze-continues', chance: 0.14 }],
    source: 'RetailRadar',
    isFollowUp: true,
  }),
  template({
    id: 'rug-pull-reversal',
    category: 'Rug Pull Reversal',
    buttonLabel: 'Rug Pull',
    markerLabel: 'RUG PULL',
    headlineVariations: ['Follow-up: GamePop rug pull reversal hammers late buyers', 'Breaking: GamePop collapses as meme momentum vanishes'],
    descriptionVariations: ['GamePop drops violently as hot money exits the trade.', 'A sharp reversal hits after the squeeze fails to attract new buyers.'],
    severityOptions: ['High', 'Extreme'],
    durationTicksMin: 4,
    durationTicksMax: 9,
    marketImpactMin: -0.0001,
    marketImpactMax: 0.0001,
    volatilityImpactMin: 0.002,
    volatilityImpactMax: 0.009,
    sectorImpactRanges: { gaming: [-0.004, -0.001] },
    symbolImpactRanges: { GMP: [-0.032, -0.014] },
    affectedSectorOptions: ['gaming'],
    affectedSymbolOptions: ['GMP'],
    followUpOptions: [],
    source: 'RetailRadar',
    isFollowUp: true,
  }),
  template({
    id: 'momentum-fades',
    category: 'Momentum Fades',
    buttonLabel: 'Momentum Fades',
    markerLabel: 'FADE',
    headlineVariations: ['Follow-up: GamePop momentum fades as volume dries up', 'Alert: GamePop slips as retail attention moves on'],
    descriptionVariations: ['GamePop fades lower after the initial viral wave cools.', 'The squeeze loses energy and volatility remains elevated.'],
    severityOptions: ['Medium', 'High'],
    durationTicksMin: 4,
    durationTicksMax: 8,
    marketImpactMin: 0,
    marketImpactMax: 0.0001,
    volatilityImpactMin: 0.001,
    volatilityImpactMax: 0.005,
    sectorImpactRanges: { gaming: [-0.0025, -0.0005] },
    symbolImpactRanges: { GMP: [-0.014, -0.005] },
    affectedSectorOptions: ['gaming'],
    affectedSymbolOptions: ['GMP'],
    followUpOptions: [],
    source: 'RetailRadar',
    isFollowUp: true,
  }),
]

export const allEventTemplates = [...newsEventTemplates, ...followUpTemplates]

export const eventTemplateById = Object.fromEntries(
  allEventTemplates.map((t) => [t.id, t]),
) as Record<string, NewsEventTemplate>

export const triggerableEventIds = [
  'conflict-shock',
  'besla-battery',
  'inflation-shock',
  'ai-chip-boom',
  'energy-shock',
  'meme-frenzy',
] as const

export type TriggerableEventId = (typeof triggerableEventIds)[number]

export const triggerButtonLabels = Object.fromEntries(
  triggerableEventIds.map((id) => [id, eventTemplateById[id].buttonLabel]),
) as Record<TriggerableEventId, string>

export const severityColors: Record<EventSeverity, string> = {
  Low: '#60a5fa',
  Medium: '#fbbf24',
  High: '#fb923c',
  Extreme: '#ef4444',
}

const severityImpactScale: Record<EventSeverity, number> = {
  Low: 0.45,
  Medium: 0.72,
  High: 0.95,
  Extreme: 1.2,
}
const FOLLOW_UP_CHANCE_SCALE = 0.65

function pickSome<T>(items: readonly T[], min: number, max: number): T[] {
  const pool = [...items]
  const count = Math.min(pool.length, randomInt(min, Math.max(min, max)))
  const result: T[] = []
  for (let i = 0; i < count; i++) {
    const idx = randomInt(0, pool.length - 1)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}

function impactFromRange(range: ImpactRange, scale: number): number {
  return randomBetween(range[0], range[1]) * scale
}

export function pickRandomEventId(): TriggerableEventId {
  return randomChoice(triggerableEventIds)
}

export function chooseFollowUpOption(event: ActiveNewsEvent): FollowUpOption | null {
  for (const option of event.followUpOptions) {
    if (randomChance(option.chance * FOLLOW_UP_CHANCE_SCALE)) return option
  }
  return null
}

export function instantiateEvent(
  template: NewsEventTemplate,
  triggeredAt: Date,
  tickIndex: number,
  parentEvent?: ActiveNewsEvent,
): ActiveNewsEvent {
  const severity = randomChoice(template.severityOptions)
  const scale = severityImpactScale[severity]
  const chosenSectors = pickSome(
    template.affectedSectorOptions,
    Math.min(1, template.affectedSectorOptions.length),
    Math.max(1, Math.ceil(template.affectedSectorOptions.length * 0.75)),
  )
  const chosenSymbols = new Set(
    pickSome(
      template.affectedSymbolOptions,
      Math.min(1, template.affectedSymbolOptions.length),
      Math.max(1, Math.ceil(template.affectedSymbolOptions.length * 0.8)),
    ),
  )

  for (const sector of chosenSectors) {
    for (const symbol of sectorMembers[sector] ?? []) {
      chosenSymbols.add(symbol)
    }
  }

  const sectorImpacts: Partial<Record<Sector, number>> = {}
  for (const [sector, range] of Object.entries(template.sectorImpactRanges) as Array<[Sector, ImpactRange]>) {
    if (chosenSectors.includes(sector) || randomChance(0.35)) {
      sectorImpacts[sector] = impactFromRange(range, scale)
    }
  }

  const symbolImpacts: Record<string, number> = {}
  for (const [symbol, range] of Object.entries(template.symbolImpactRanges)) {
    if (chosenSymbols.has(symbol) || randomChance(0.5)) {
      symbolImpacts[symbol] = impactFromRange(range, scale)
      chosenSymbols.add(symbol)
    }
  }

  return {
    id: template.id,
    templateId: template.id,
    category: template.category,
    buttonLabel: template.buttonLabel,
    markerLabel: template.markerLabel,
    headline: randomChoice(template.headlineVariations),
    description: randomChoice(template.descriptionVariations),
    source: template.source,
    severity,
    durationTicks: randomInt(template.durationTicksMin, template.durationTicksMax),
    marketImpact: randomBetween(template.marketImpactMin, template.marketImpactMax) * scale,
    volatilityImpact: randomBetween(template.volatilityImpactMin, template.volatilityImpactMax) * scale,
    sectorImpacts,
    symbolImpacts,
    affectedSectors: chosenSectors,
    affectedSymbols: [...chosenSymbols],
    followUpOptions: template.followUpOptions,
    isFollowUp: template.isFollowUp ?? false,
    parentEventId: parentEvent?.instanceId,
    instanceId: `${template.id}-${tickIndex}-${randomInt(1000, 9999)}`,
    triggeredAt: new Date(triggeredAt.getTime()),
    triggeredTickIndex: tickIndex,
    remainingTicks: 0,
  }
}

export function instantiateEventById(
  templateId: string,
  triggeredAt: Date,
  tickIndex: number,
  parentEvent?: ActiveNewsEvent,
): ActiveNewsEvent | null {
  const template = eventTemplateById[templateId]
  if (!template) return null
  const event = instantiateEvent(template, triggeredAt, tickIndex, parentEvent)
  event.remainingTicks = event.durationTicks
  return event
}
