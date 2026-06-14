import type { OptionContract } from '../data/mockMarketData'

export type OptionType = 'Call' | 'Put'

export interface PricedOption {
  bid: number
  ask: number
  mid: number
  iv: number
}

function getStrikeIncrement(price: number): number {
  if (price >= 10000) return 100
  if (price >= 4000) return 25
  if (price >= 1000) return 10
  if (price >= 400) return 10
  if (price >= 200) return 5
  if (price >= 50) return 2.5
  if (price >= 20) return 1
  return 0.5
}

function roundStrike(price: number, increment: number): number {
  return Math.round(price / increment) * increment
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function baseIvFor(symbol: string): number {
  if (symbol === 'GMP') return 62
  if (symbol === 'BSLA') return 42
  if (symbol === 'CLN') return 18
  if (symbol === 'VEX') return 70
  if (symbol === 'PNS') return 14
  if (symbol === 'TSQ') return 20
  return 32
}

export function priceOption(
  spotPrice: number,
  strike: number,
  type: OptionType,
  symbol: string,
): PricedOption {
  const dist = spotPrice - strike
  const absDist = Math.abs(dist)
  const safeSpot = Math.max(0.01, spotPrice)
  const moneyness = absDist / safeSpot
  const iv = round2(baseIvFor(symbol) + moneyness * 12)

  const intrinsic = type === 'Call'
    ? Math.max(0, spotPrice - strike)
    : Math.max(0, strike - spotPrice)

  const timeValue = Math.max(0, safeSpot * 0.025 * (1 - moneyness * 2))
  const directionFactor =
    type === 'Call' ? (dist < 0 ? 1.2 : 0.6) : (dist > 0 ? 1.2 : 0.6)

  const mid = round2(Math.max(0.05, intrinsic + timeValue * directionFactor))
  const spread = Math.max(0.1, mid * 0.04)
  const bid = round2(Math.max(0.05, mid - spread / 2))
  const ask = round2(mid + spread / 2)

  return { bid, ask, mid, iv }
}

export function generateOptionsChain(spotPrice: number, symbol: string): OptionContract[] {
  const increment = getStrikeIncrement(spotPrice)
  const atm = roundStrike(spotPrice, increment)
  const strikes: number[] = []

  for (let i = -3; i <= 3; i++) {
    strikes.push(round2(atm + i * increment))
  }

  return strikes.map((strike) => {
    const call = priceOption(spotPrice, strike, 'Call', symbol)
    const put = priceOption(spotPrice, strike, 'Put', symbol)

    const moneyness = Math.abs(spotPrice - strike) / Math.max(0.01, spotPrice)
    const otmFactor = 1 + moneyness * 3
    const volBase = Math.floor(800 + 1200 / otmFactor + (strike * 13) % 400)
    const oiBase = Math.floor(volBase * (4 + moneyness * 2))

    return {
      strike,
      callBid: call.bid,
      callAsk: call.ask,
      callVol: volBase,
      callOI: oiBase,
      putBid: put.bid,
      putAsk: put.ask,
      putVol: Math.floor(volBase * 0.7),
      putOI: Math.floor(oiBase * 0.8),
      iv: call.iv,
    }
  })
}

export function getAtmStrike(spotPrice: number): number {
  const increment = getStrikeIncrement(spotPrice)
  return roundStrike(spotPrice, increment)
}
