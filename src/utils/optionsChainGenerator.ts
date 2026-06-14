import type { OptionContract } from '../data/mockMarketData'

function getStrikeIncrement(price: number): number {
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

export function generateOptionsChain(spotPrice: number, symbol: string): OptionContract[] {
  const increment = getStrikeIncrement(spotPrice)
  const atm = roundStrike(spotPrice, increment)
  const strikes: number[] = []

  for (let i = -3; i <= 3; i++) {
    strikes.push(round2(atm + i * increment))
  }

  const baseIv = symbol === 'GMP' ? 62 : symbol === 'BSLA' ? 42 : symbol === 'CLN' ? 18 : 32

  return strikes.map((strike) => {
    const dist = spotPrice - strike
    const absDist = Math.abs(dist)
    const moneyness = absDist / spotPrice
    const iv = round2(baseIv + moneyness * 12 + (symbol === 'VEX' ? 5 : 0))

    const callIntrinsic = Math.max(0, spotPrice - strike)
    const putIntrinsic = Math.max(0, strike - spotPrice)
    const timeValue = spotPrice * 0.025 * (1 - moneyness * 2)

    const callMid = round2(callIntrinsic + timeValue * (dist < 0 ? 1.2 : 0.6))
    const putMid = round2(putIntrinsic + timeValue * (dist > 0 ? 1.2 : 0.6))
    const spread = Math.max(0.1, callMid * 0.04)

    const otmFactor = 1 + moneyness * 3
    const volBase = Math.floor(800 + 1200 / otmFactor + (strike * 13) % 400)
    const oiBase = Math.floor(volBase * (4 + moneyness * 2))

    return {
      strike,
      callBid: round2(Math.max(0.05, callMid - spread / 2)),
      callAsk: round2(callMid + spread / 2),
      callVol: volBase,
      callOI: oiBase,
      putBid: round2(Math.max(0.05, putMid - spread / 2)),
      putAsk: round2(putMid + spread / 2),
      putVol: Math.floor(volBase * 0.7),
      putOI: Math.floor(oiBase * 0.8),
      iv,
    }
  })
}

export function getAtmStrike(spotPrice: number): number {
  const increment = getStrikeIncrement(spotPrice)
  return roundStrike(spotPrice, increment)
}
