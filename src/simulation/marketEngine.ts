import type { AssetPersonality, Sector } from '../data/assetPersonalities'
import { personalityBySymbol } from '../data/assetPersonalities'
import type { ChartPoint, IndexTicker, WatchlistItem } from '../data/mockMarketData'
import type { ActiveNewsEvent, EventSeverity } from '../data/newsEvents'
import {
  appendCandleIfDue,
  generateAllTimeframeData,
  TIMEFRAMES,
  TIMEFRAME_INTERVAL_SECONDS,
  updateLastCandle,
  type Timeframe,
} from '../utils/chartDataGenerator'

export interface SimulatedStock {
  symbol: string
  name: string
  price: number
  openPrice: number
  change: number
  changePct: number
  volume: number
  lastTickDelta: number
}

export interface ChartEventMarker {
  instanceId: string
  eventId: string
  headline: string
  severity: EventSeverity
  /** Unix seconds at which the event fired. */
  triggeredAtTimestamp: number
  triggeredAt: Date
}

export type ChartDataBySymbol = Record<string, Record<Timeframe, ChartPoint[]>>

export interface MarketState {
  indices: IndexTicker[]
  stocks: SimulatedStock[]
  chartDataBySymbol: ChartDataBySymbol
  marketTime: Date
  tickCount: number
  activeEvents: ActiveNewsEvent[]
  markersBySymbol: Record<string, ChartEventMarker[]>
}

const SECTOR_INDEX_MAP: Partial<Record<Sector, 'TSQ' | 'PNS'>> = {
  tech: 'TSQ',
  semiconductor: 'TSQ',
  gaming: 'TSQ',
  auto: 'PNS',
  ev: 'PNS',
  consumer: 'PNS',
  'consumer-defensive': 'PNS',
  retail: 'PNS',
  crypto: 'PNS',
  broad: 'PNS',
  'mega-cap': 'PNS',
  energy: 'PNS',
  defense: 'PNS',
}

const SEVERITY_VOL_MULTIPLIER: Record<EventSeverity, number> = {
  Low: 1.4,
  Medium: 1.8,
  High: 2.4,
  Extreme: 3.2,
}

const MAX_MARKERS_PER_SYMBOL = 8

function gaussian(): number {
  const u = 1 - Math.random()
  const v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(0)}K`
  return vol.toFixed(0)
}

function updateIndex(
  index: IndexTicker,
  openValue: number,
  pctMove: number,
): IndexTicker {
  const newValue = index.value * (1 + pctMove)
  const change = newValue - openValue
  const changePct = (change / openValue) * 100
  return {
    ...index,
    value: newValue,
    change,
    changePct,
  }
}

function sectorReturn(
  sector: Sector,
  indexReturns: Record<string, number>,
): number {
  const mapped = SECTOR_INDEX_MAP[sector] ?? 'PNS'
  return indexReturns[mapped] ?? indexReturns.PNS ?? 0
}

interface EventDrifts {
  marketDrift: number
  volatilityDrift: number
  sectorDrift: Partial<Record<Sector, number>>
  symbolDrift: Record<string, number>
  maxVolatilityMultiplier: number
}

function aggregateEventEffects(events: ActiveNewsEvent[]): EventDrifts {
  const result: EventDrifts = {
    marketDrift: 0,
    volatilityDrift: 0,
    sectorDrift: {},
    symbolDrift: {},
    maxVolatilityMultiplier: 1,
  }

  for (const e of events) {
    const progress = 1 - e.remainingTicks / e.durationTicks
    const decay = 1 - Math.pow(progress, 2) * 0.55

    result.marketDrift += e.marketImpact * decay
    result.volatilityDrift += e.volatilityImpact * decay

    for (const [sec, imp] of Object.entries(e.sectorImpacts) as Array<[Sector, number]>) {
      result.sectorDrift[sec] = (result.sectorDrift[sec] ?? 0) + imp * decay
    }

    for (const [sym, imp] of Object.entries(e.symbolImpacts)) {
      result.symbolDrift[sym] = (result.symbolDrift[sym] ?? 0) + imp * decay
    }

    const mult = SEVERITY_VOL_MULTIPLIER[e.severity]
    if (mult > result.maxVolatilityMultiplier) {
      result.maxVolatilityMultiplier = mult
    }
  }

  return result
}

function computeStockMove(
  personality: AssetPersonality,
  marketReturn: number,
  sectorRet: number,
  volatilityMultiplier: number,
  symbolDrift: number,
): number {
  const idio = gaussian() * personality.volatility * 0.004 * volatilityMultiplier
  const eventDrift = symbolDrift * personality.newsSensitivity

  return (
    personality.marketSensitivity * marketReturn +
    personality.sectorSensitivity * sectorRet +
    idio +
    eventDrift
  )
}

function updateStock(stock: SimulatedStock, pctMove: number): SimulatedStock {
  const newPrice = clamp(stock.price * (1 + pctMove), 0.01, 999_999)
  const change = newPrice - stock.openPrice
  const changePct = (change / stock.openPrice) * 100
  const volumeBump = Math.floor(Math.abs(pctMove) * 50_000 + Math.random() * 8_000)

  return {
    ...stock,
    price: newPrice,
    change,
    changePct,
    volume: stock.volume + volumeBump,
    lastTickDelta: pctMove,
  }
}

function advanceMarketTime(current: Date): Date {
  return new Date(current.getTime() + 2_000)
}

function decrementEvents(events: ActiveNewsEvent[]): ActiveNewsEvent[] {
  return events
    .map((e) => ({ ...e, remainingTicks: e.remainingTicks - 1 }))
    .filter((e) => e.remainingTicks > 0)
}

function updateSymbolTimeframes(
  timeframes: Record<Timeframe, ChartPoint[]>,
  currentPrice: number,
  volumeBump: number,
  currentTimeSeconds: number,
): Record<Timeframe, ChartPoint[]> {
  const next = {} as Record<Timeframe, ChartPoint[]>
  for (const tf of TIMEFRAMES) {
    const interval = TIMEFRAME_INTERVAL_SECONDS[tf]
    let candles = timeframes[tf]
    candles = updateLastCandle(candles, currentPrice, volumeBump)
    candles = appendCandleIfDue(candles, interval, currentTimeSeconds, currentPrice)
    next[tf] = candles
  }
  return next
}

export function tickMarket(state: MarketState): MarketState {
  const pns = state.indices.find((i) => i.symbol === 'PNS')!
  const tsq = state.indices.find((i) => i.symbol === 'TSQ')!
  const vex = state.indices.find((i) => i.symbol === 'VEX')!

  const pnsOpen = pns.value - pns.change
  const tsqOpen = tsq.value - tsq.change
  const vexOpen = vex.value - vex.change

  const drifts = aggregateEventEffects(state.activeEvents)
  const volMult = drifts.maxVolatilityMultiplier

  const pnsMove =
    gaussian() * 0.00035 * volMult + 0.00005 + drifts.marketDrift
  const tsqMove =
    pnsMove * 0.65 +
    gaussian() * 0.00045 * volMult +
    (drifts.sectorDrift.tech ?? 0) * 0.4

  const marketReturn = (pnsMove + tsqMove) / 2
  const indexReturns: Record<string, number> = {
    PNS: pnsMove,
    TSQ: tsqMove,
  }

  const avgIndexMove = (pnsMove + tsqMove) / 2
  const vexMove =
    -avgIndexMove * 2.8 +
    gaussian() * 0.0012 * volMult +
    drifts.volatilityDrift +
    (Math.random() < 0.15 ? gaussian() * 0.004 : 0)

  const newIndices = state.indices.map((idx) => {
    if (idx.symbol === 'PNS') return updateIndex(idx, pnsOpen, pnsMove)
    if (idx.symbol === 'TSQ') return updateIndex(idx, tsqOpen, tsqMove)
    if (idx.symbol === 'VEX') return updateIndex(idx, vexOpen, vexMove)
    return idx
  })

  const newStocks = state.stocks.map((stock) => {
    const personality = personalityBySymbol[stock.symbol]
    if (!personality) return { ...stock, lastTickDelta: 0 }

    const baseSectorRet = sectorReturn(personality.sector, indexReturns)
    const sectorEventDrift = drifts.sectorDrift[personality.sector] ?? 0
    const symbolDrift = drifts.symbolDrift[stock.symbol] ?? 0

    const pctMove = computeStockMove(
      personality,
      marketReturn,
      baseSectorRet + sectorEventDrift,
      volMult,
      symbolDrift,
    )

    return updateStock(stock, pctMove)
  })

  const nextMarketTime = advanceMarketTime(state.marketTime)
  const currentTimeSeconds = Math.floor(nextMarketTime.getTime() / 1000)

  const newChartDataBySymbol: ChartDataBySymbol = { ...state.chartDataBySymbol }
  for (const stock of newStocks) {
    const existing = newChartDataBySymbol[stock.symbol]
    if (!existing) continue
    const volumeBump = Math.floor(Math.abs(stock.lastTickDelta) * 80_000)
    newChartDataBySymbol[stock.symbol] = updateSymbolTimeframes(
      existing,
      stock.price,
      volumeBump,
      currentTimeSeconds,
    )
  }

  return {
    indices: newIndices,
    stocks: newStocks,
    chartDataBySymbol: newChartDataBySymbol,
    marketTime: nextMarketTime,
    tickCount: state.tickCount + 1,
    activeEvents: decrementEvents(state.activeEvents),
    markersBySymbol: state.markersBySymbol,
  }
}

export function stockToWatchlistItem(stock: SimulatedStock): WatchlistItem {
  return {
    symbol: stock.symbol,
    name: stock.name,
    price: stock.price,
    change: stock.change,
    changePct: stock.changePct,
    volume: formatVolume(stock.volume),
  }
}

export function createInitialMarketState(
  indices: IndexTicker[],
  watchlist: WatchlistItem[],
  startTime: Date,
): MarketState {
  const stocks = watchlist.map((item) => ({
    symbol: item.symbol,
    name: item.name,
    price: item.price,
    openPrice: item.price - item.change,
    change: item.change,
    changePct: item.changePct,
    volume: parseVolume(item.volume),
    lastTickDelta: 0,
  }))

  const sessionStartSeconds = Math.floor(startTime.getTime() / 1000)
  const chartDataBySymbol: ChartDataBySymbol = {}
  for (const stock of stocks) {
    const personality = personalityBySymbol[stock.symbol]
    const personalityVol = personality?.volatility ?? 0.4
    chartDataBySymbol[stock.symbol] = generateAllTimeframeData(
      stock.price,
      sessionStartSeconds,
      stock.volume,
      personalityVol,
    )
  }

  return {
    indices: indices.map((i) => ({ ...i })),
    stocks,
    chartDataBySymbol,
    marketTime: startTime,
    tickCount: 0,
    activeEvents: [],
    markersBySymbol: {},
  }
}

export function addEventToState(
  state: MarketState,
  event: ActiveNewsEvent,
): MarketState {
  const symbols = event.affectedSymbols.length
    ? event.affectedSymbols
    : state.stocks.map((s) => s.symbol)

  const triggeredAtTimestamp = Math.floor(event.triggeredAt.getTime() / 1000)
  const markersBySymbol = { ...state.markersBySymbol }
  for (const symbol of symbols) {
    if (!state.chartDataBySymbol[symbol]) continue
    const existing = markersBySymbol[symbol] ?? []
    const marker: ChartEventMarker = {
      instanceId: event.instanceId,
      eventId: event.id,
      headline: event.headline,
      severity: event.severity,
      triggeredAtTimestamp,
      triggeredAt: new Date(event.triggeredAt.getTime()),
    }
    markersBySymbol[symbol] = [...existing, marker].slice(-MAX_MARKERS_PER_SYMBOL)
  }

  return {
    ...state,
    activeEvents: [...state.activeEvents, event],
    markersBySymbol,
  }
}

function parseVolume(vol: string): number {
  const num = parseFloat(vol)
  if (vol.endsWith('M')) return num * 1_000_000
  if (vol.endsWith('K')) return num * 1_000
  return num
}
