import { priceOption, type OptionType } from '../utils/optionsChainGenerator'

export const STARTING_CASH = 100_000
export const SHARES_PER_CONTRACT = 100

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

export interface OptionPosition {
  id: string
  symbol: string
  name: string
  type: 'Call' | 'Put'
  strike: number
  expiry: string
  /** Number of contracts (each contract controls 100 shares). */
  quantity: number
  /** Premium paid per share, e.g. 3.45 means $3.45 × 100 × qty paid. */
  avgPrice: number
  /** Premium opening day mark (per share) for day P/L calc. */
  openPrice: number
  /** Current mark price per share. */
  currentPrice: number
  /** Notional value of position = currentPrice × 100 × qty. */
  marketValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  dayPnL: number
}

export interface Portfolio {
  cash: number
  buyingPower: number
  positions: StockPosition[]
  optionPositions: OptionPosition[]
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
    optionPositions: [],
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

function newOptionId(): string {
  return `opt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
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

  const optionPositions = portfolio.optionPositions.map((pos) => {
    const stock = stocks.find((s) => s.symbol === pos.symbol)
    if (!stock) return pos
    const { mid } = priceOption(stock.price, pos.strike, pos.type, pos.symbol)
    const marketValue = mid * SHARES_PER_CONTRACT * pos.quantity
    const costBasis = pos.avgPrice * SHARES_PER_CONTRACT * pos.quantity
    const unrealizedPnL = marketValue - costBasis
    const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0
    const dayPnL = (mid - pos.openPrice) * SHARES_PER_CONTRACT * pos.quantity
    return {
      ...pos,
      currentPrice: mid,
      marketValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      dayPnL,
    }
  })

  const stockValue = positions.reduce((sum, p) => sum + p.marketValue, 0)
  const optionValue = optionPositions.reduce((sum, p) => sum + p.marketValue, 0)
  const totalAccountValue = portfolio.cash + stockValue + optionValue
  const dayPnL = totalAccountValue - portfolio.sessionStartValue

  return {
    ...portfolio,
    positions,
    optionPositions,
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

export interface OptionOrderInput {
  symbol: string
  name: string
  type: OptionType
  strike: number
  expiry: string
  quantity: number
}

export function executeOptionBuy(
  portfolio: Portfolio,
  stocks: MarketStock[],
  order: OptionOrderInput,
): { portfolio: Portfolio; result: OrderResult } {
  const { symbol, name, type, strike, expiry, quantity } = order
  if (quantity <= 0 || !Number.isFinite(quantity)) {
    return { portfolio, result: { success: false, message: 'Enter a valid contract count.' } }
  }

  const stock = stocks.find((s) => s.symbol === symbol)
  if (!stock) {
    return { portfolio, result: { success: false, message: 'Unknown underlying.' } }
  }

  const { ask, mid } = priceOption(stock.price, strike, type, symbol)
  const cost = ask * SHARES_PER_CONTRACT * quantity

  if (cost > portfolio.cash) {
    return { portfolio, result: { success: false, message: 'Not enough buying power.' } }
  }

  const newPosition: OptionPosition = {
    id: newOptionId(),
    symbol,
    name,
    type,
    strike,
    expiry,
    quantity,
    avgPrice: ask,
    openPrice: mid,
    currentPrice: mid,
    marketValue: mid * SHARES_PER_CONTRACT * quantity,
    unrealizedPnL: (mid - ask) * SHARES_PER_CONTRACT * quantity,
    unrealizedPnLPercent: ask > 0 ? ((mid - ask) / ask) * 100 : 0,
    dayPnL: 0,
  }

  const next: Portfolio = {
    ...portfolio,
    cash: portfolio.cash - cost,
    optionPositions: [...portfolio.optionPositions, newPosition],
  }

  const refreshed = refreshPortfolioWithMarket(next, stocks)
  return {
    portfolio: refreshed,
    result: {
      success: true,
      message: `Bought ${quantity}x ${symbol} ${strike} ${type} @ $${ask.toFixed(2)}`,
    },
  }
}

export function executeOptionClose(
  portfolio: Portfolio,
  stocks: MarketStock[],
  positionId: string,
  quantity?: number,
): { portfolio: Portfolio; result: OrderResult } {
  const existing = portfolio.optionPositions.find((p) => p.id === positionId)
  if (!existing) {
    return { portfolio, result: { success: false, message: 'Position not found.' } }
  }

  const closeQty = quantity ?? existing.quantity
  if (closeQty <= 0 || closeQty > existing.quantity) {
    return { portfolio, result: { success: false, message: 'Invalid close quantity.' } }
  }

  const stock = stocks.find((s) => s.symbol === existing.symbol)
  if (!stock) {
    return { portfolio, result: { success: false, message: 'Unknown underlying.' } }
  }

  const { bid } = priceOption(stock.price, existing.strike, existing.type, existing.symbol)
  const proceeds = bid * SHARES_PER_CONTRACT * closeQty
  const realized = (bid - existing.avgPrice) * SHARES_PER_CONTRACT * closeQty

  const remaining = existing.quantity - closeQty
  const optionPositions =
    remaining === 0
      ? portfolio.optionPositions.filter((p) => p.id !== positionId)
      : portfolio.optionPositions.map((p) =>
          p.id === positionId ? { ...p, quantity: remaining } : p,
        )

  const next: Portfolio = {
    ...portfolio,
    cash: portfolio.cash + proceeds,
    optionPositions,
    realizedPnL: portfolio.realizedPnL + realized,
  }

  const refreshed = refreshPortfolioWithMarket(next, stocks)
  return {
    portfolio: refreshed,
    result: {
      success: true,
      message: `Closed ${closeQty}x ${existing.symbol} ${existing.strike} ${existing.type} @ $${bid.toFixed(2)}`,
    },
  }
}
