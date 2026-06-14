export const STARTING_CASH = 100_000

export interface StockPosition {
  symbol: string
  name: string
  type: 'Stock'
  quantity: number
  avgPrice: number
  currentPrice: number
  marketValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  dayPnL: number
}

export interface Portfolio {
  cash: number
  buyingPower: number
  positions: StockPosition[]
  realizedPnL: number
  totalAccountValue: number
  dayPnL: number
  sessionStartValue: number
}

export type OrderSide = 'buy' | 'sell'

export type OrderResult =
  | { success: true; message: string }
  | { success: false; message: string }

export function createInitialPortfolio(): Portfolio {
  return {
    cash: STARTING_CASH,
    buyingPower: STARTING_CASH,
    positions: [],
    realizedPnL: 0,
    totalAccountValue: STARTING_CASH,
    dayPnL: 0,
    sessionStartValue: STARTING_CASH,
  }
}

interface MarketStock {
  symbol: string
  name: string
  price: number
  openPrice: number
}

export function refreshPortfolioWithMarket(
  portfolio: Portfolio,
  stocks: MarketStock[],
): Portfolio {
  const positions = portfolio.positions.map((pos) => {
    const stock = stocks.find((s) => s.symbol === pos.symbol)
    if (!stock) return pos

    const currentPrice = stock.price
    const marketValue = pos.quantity * currentPrice
    const costBasis = pos.quantity * pos.avgPrice
    const unrealizedPnL = marketValue - costBasis
    const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0
    const dayPnL = pos.quantity * (currentPrice - stock.openPrice)

    return {
      ...pos,
      currentPrice,
      marketValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      dayPnL,
    }
  })

  const positionsValue = positions.reduce((sum, p) => sum + p.marketValue, 0)
  const totalAccountValue = portfolio.cash + positionsValue
  const dayPnL = totalAccountValue - portfolio.sessionStartValue

  return {
    ...portfolio,
    positions,
    totalAccountValue,
    buyingPower: portfolio.cash,
    dayPnL,
  }
}

export function executeBuy(
  portfolio: Portfolio,
  stocks: MarketStock[],
  symbol: string,
  quantity: number,
): { portfolio: Portfolio; result: OrderResult } {
  if (quantity <= 0 || !Number.isFinite(quantity)) {
    return { portfolio, result: { success: false, message: 'Enter a valid quantity.' } }
  }

  const stock = stocks.find((s) => s.symbol === symbol)
  if (!stock) {
    return { portfolio, result: { success: false, message: 'Unknown symbol.' } }
  }

  const price = stock.price
  const cost = price * quantity

  if (cost > portfolio.cash) {
    return { portfolio, result: { success: false, message: 'Not enough buying power.' } }
  }

  const existing = portfolio.positions.find((p) => p.symbol === symbol)
  let positions: StockPosition[]

  if (existing) {
    const newQty = existing.quantity + quantity
    const newAvg = (existing.avgPrice * existing.quantity + price * quantity) / newQty
    positions = portfolio.positions.map((p) =>
      p.symbol === symbol
        ? { ...p, quantity: newQty, avgPrice: newAvg }
        : p,
    )
  } else {
    positions = [
      ...portfolio.positions,
      {
        symbol,
        name: stock.name,
        type: 'Stock',
        quantity,
        avgPrice: price,
        currentPrice: price,
        marketValue: price * quantity,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        dayPnL: quantity * (price - stock.openPrice),
      },
    ]
  }

  const next: Portfolio = {
    ...portfolio,
    cash: portfolio.cash - cost,
    positions,
  }

  const refreshed = refreshPortfolioWithMarket(next, stocks)
  return {
    portfolio: refreshed,
    result: {
      success: true,
      message: `Bought ${quantity} ${symbol} @ $${price.toFixed(2)}`,
    },
  }
}

export function executeSell(
  portfolio: Portfolio,
  stocks: MarketStock[],
  symbol: string,
  quantity: number,
): { portfolio: Portfolio; result: OrderResult } {
  if (quantity <= 0 || !Number.isFinite(quantity)) {
    return { portfolio, result: { success: false, message: 'Enter a valid quantity.' } }
  }

  const stock = stocks.find((s) => s.symbol === symbol)
  if (!stock) {
    return { portfolio, result: { success: false, message: 'Unknown symbol.' } }
  }

  const existing = portfolio.positions.find((p) => p.symbol === symbol)
  if (!existing || existing.quantity < quantity) {
    return { portfolio, result: { success: false, message: 'Not enough shares to sell.' } }
  }

  const price = stock.price
  const proceeds = price * quantity
  const realized = (price - existing.avgPrice) * quantity

  const remainingQty = existing.quantity - quantity
  const positions =
    remainingQty === 0
      ? portfolio.positions.filter((p) => p.symbol !== symbol)
      : portfolio.positions.map((p) =>
          p.symbol === symbol ? { ...p, quantity: remainingQty } : p,
        )

  const next: Portfolio = {
    ...portfolio,
    cash: portfolio.cash + proceeds,
    positions,
    realizedPnL: portfolio.realizedPnL + realized,
  }

  const refreshed = refreshPortfolioWithMarket(next, stocks)
  return {
    portfolio: refreshed,
    result: {
      success: true,
      message: `Sold ${quantity} ${symbol} @ $${price.toFixed(2)}`,
    },
  }
}
