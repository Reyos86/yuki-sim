import type { ChartPoint } from '../data/mockMarketData'

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '1D'

export const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '1D']

export const TIMEFRAME_INTERVAL_SECONDS: Record<Timeframe, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '1D': 86_400,
}

const TIMEFRAME_CANDLE_COUNT: Record<Timeframe, number> = {
  '1m': 240,
  '5m': 192,
  '15m': 160,
  '1h': 168,
  '1D': 120,
}

// Per-candle return volatility (decimal). Bigger TFs move more per bar.
const TIMEFRAME_VOL_FACTOR: Record<Timeframe, number> = {
  '1m': 0.0015,
  '5m': 0.0035,
  '15m': 0.006,
  '1h': 0.011,
  '1D': 0.022,
}

// Mild long-run drift per bar to make history look like a real chart, not a flatline.
const TIMEFRAME_DRIFT: Record<Timeframe, number> = {
  '1m': 0.00002,
  '5m': 0.00006,
  '15m': 0.00012,
  '1h': 0.00025,
  '1D': 0.0006,
}

function gaussian(): number {
  const u = 1 - Math.random()
  const v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function alignToInterval(timeSeconds: number, intervalSeconds: number): number {
  return Math.floor(timeSeconds / intervalSeconds) * intervalSeconds
}

function generateTimeframeCandles(
  currentPrice: number,
  endTimeSeconds: number,
  intervalSeconds: number,
  candleCount: number,
  volatility: number,
  drift: number,
  baseVolume: number,
): ChartPoint[] {
  // Build a forward random walk normalised so the final close == currentPrice.
  const rawCloses = new Array<number>(candleCount)
  let p = currentPrice
  rawCloses[0] = p
  for (let i = 1; i < candleCount; i++) {
    const move = gaussian() * volatility + drift
    p = Math.max(0.01, p * (1 + move))
    rawCloses[i] = p
  }
  // Scale so first→last anchors stay realistic but the very last close lands on currentPrice.
  const adjust = currentPrice / rawCloses[candleCount - 1]
  // Mix anchoring so older candles are less stretched (preserve random walk shape).
  for (let i = 0; i < candleCount; i++) {
    const t = i / (candleCount - 1)
    const factor = 1 + (adjust - 1) * t
    rawCloses[i] = Math.max(0.01, rawCloses[i] * factor)
  }
  rawCloses[candleCount - 1] = currentPrice

  const candles: ChartPoint[] = []
  let prevClose = rawCloses[0] * (1 - gaussian() * volatility * 0.5)
  for (let i = 0; i < candleCount; i++) {
    const open = prevClose
    const close = rawCloses[i]
    const bodyRange = Math.abs(close - open)
    const wickSize = bodyRange + Math.abs(gaussian()) * volatility * close * 0.7
    const high = Math.max(open, close) + Math.abs(gaussian()) * wickSize * 0.5
    const low = Math.min(open, close) - Math.abs(gaussian()) * wickSize * 0.5
    const time = endTimeSeconds - (candleCount - 1 - i) * intervalSeconds

    const moveMagnitude = bodyRange / close
    const volumeFactor = 0.45 + Math.random() * 0.9 + moveMagnitude * 90
    const volume = Math.max(1, Math.floor(baseVolume * volumeFactor))

    candles.push({
      time,
      open,
      high: Math.max(high, open, close),
      low: Math.max(0.01, Math.min(low, open, close)),
      close,
      volume,
    })
    prevClose = close
  }
  return candles
}

export function generateAllTimeframeData(
  currentPrice: number,
  sessionStartSeconds: number,
  totalSessionVolume: number,
  volatilityPersonality: number,
): Record<Timeframe, ChartPoint[]> {
  const result = {} as Record<Timeframe, ChartPoint[]>
  for (const tf of TIMEFRAMES) {
    const interval = TIMEFRAME_INTERVAL_SECONDS[tf]
    const count = TIMEFRAME_CANDLE_COUNT[tf]
    const endTime = alignToInterval(sessionStartSeconds, interval)
    const candleVolatility = TIMEFRAME_VOL_FACTOR[tf] * (0.55 + volatilityPersonality)
    const drift = TIMEFRAME_DRIFT[tf] * (Math.random() < 0.5 ? 1 : -1)
    const baseVolume = Math.max(2000, totalSessionVolume / 220)
    result[tf] = generateTimeframeCandles(
      currentPrice,
      endTime,
      interval,
      count,
      candleVolatility,
      drift,
      baseVolume,
    )
  }
  return result
}

export function updateLastCandle(
  candles: ChartPoint[],
  currentPrice: number,
  volumeBump: number,
): ChartPoint[] {
  if (candles.length === 0) return candles
  const last = { ...candles[candles.length - 1] }
  last.close = currentPrice
  last.high = Math.max(last.high, currentPrice)
  last.low = Math.min(last.low, currentPrice)
  last.volume += volumeBump
  return [...candles.slice(0, -1), last]
}

export function appendCandleIfDue(
  candles: ChartPoint[],
  intervalSeconds: number,
  currentTimeSeconds: number,
  currentPrice: number,
): ChartPoint[] {
  if (candles.length === 0) return candles
  const last = candles[candles.length - 1]
  if (currentTimeSeconds < last.time + intervalSeconds) return candles
  const newCandle: ChartPoint = {
    time: last.time + intervalSeconds,
    open: currentPrice,
    high: currentPrice,
    low: currentPrice,
    close: currentPrice,
    volume: 0,
  }
  return [...candles, newCandle]
}
