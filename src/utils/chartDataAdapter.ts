import type {
  CandlestickData,
  HistogramData,
  LineData,
  UTCTimestamp,
} from 'lightweight-charts'
import type { ChartPoint } from '../data/mockMarketData'

const GREEN_VOL = 'rgba(74, 222, 128, 0.45)'
const RED_VOL = 'rgba(248, 113, 113, 0.45)'

export function toCandlestickData(points: ChartPoint[]): CandlestickData[] {
  return points.map((p) => ({
    time: p.time as UTCTimestamp,
    open: p.open,
    high: p.high,
    low: p.low,
    close: p.close,
  }))
}

export function toVolumeData(points: ChartPoint[]): HistogramData[] {
  return points.map((p) => ({
    time: p.time as UTCTimestamp,
    value: p.volume,
    color: p.close >= p.open ? GREEN_VOL : RED_VOL,
  }))
}

export function toCandleUpdate(point: ChartPoint): CandlestickData {
  return {
    time: point.time as UTCTimestamp,
    open: point.open,
    high: point.high,
    low: point.low,
    close: point.close,
  }
}

export function toVolumeUpdate(point: ChartPoint): HistogramData {
  return {
    time: point.time as UTCTimestamp,
    value: point.volume,
    color: point.close >= point.open ? GREEN_VOL : RED_VOL,
  }
}

export function computeSMA(points: ChartPoint[], period: number): LineData[] {
  if (points.length < period) return []
  const out: LineData[] = []
  let sum = 0
  for (let i = 0; i < period; i++) sum += points[i].close
  out.push({ time: points[period - 1].time as UTCTimestamp, value: sum / period })
  for (let i = period; i < points.length; i++) {
    sum += points[i].close - points[i - period].close
    out.push({ time: points[i].time as UTCTimestamp, value: sum / period })
  }
  return out
}
