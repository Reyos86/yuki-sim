import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useMarket } from './MarketContext'
import type { Underlying } from './MarketContext'
import {
  createInitialPortfolio,
  createEndOfDayReport,
  executeBuy,
  executeOptionBuy,
  executeOptionClose,
  executeSell,
  refreshPortfolioWithMarket,
  rollPortfolioSession,
  type EndOfDayReport,
  type OptionOrderInput,
  type OptionPosition,
  type OrderResult,
  type OrderSide,
  type Portfolio,
  type StockPosition,
  type Trade,
  type TradeFill,
} from '../portfolio/portfolioEngine'

const PORTFOLIO_SAVE_KEY = 'yuki-sim.portfolio.v1'
const MAX_TRADES = 500

function loadSavedPortfolio(): Portfolio | null {
  try {
    const raw = window.localStorage.getItem(PORTFOLIO_SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Portfolio
    if (typeof parsed.cash !== 'number' || !Array.isArray(parsed.positions)) return null
    // Backfill fields added after older saves were written.
    return {
      ...parsed,
      trades: Array.isArray(parsed.trades) ? parsed.trades : [],
      sessionStartedAt:
        typeof parsed.sessionStartedAt === 'number' ? parsed.sessionStartedAt : Date.now(),
    }
  } catch {
    return null
  }
}

function savePortfolio(portfolio: Portfolio): void {
  window.localStorage.setItem(PORTFOLIO_SAVE_KEY, JSON.stringify(portfolio))
}

interface PortfolioContextValue {
  portfolio: Portfolio
  positions: StockPosition[]
  optionPositions: OptionPosition[]
  trades: Trade[]
  buyStock: (symbol: string, quantity: number) => OrderResult
  sellStock: (symbol: string, quantity: number) => OrderResult
  buyOption: (order: OptionOrderInput) => OrderResult
  closeOption: (positionId: string, quantity?: number) => OrderResult
  resetPortfolio: (startingCash: number) => void
  endDay: () => EndOfDayReport
  hasSavedPortfolio: boolean
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null)

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { state, underlyings, currentRegime, activeEvents } = useMarket()
  const [portfolio, setPortfolio] = useState<Portfolio>(() =>
    loadSavedPortfolio() ?? createInitialPortfolio(),
  )
  const [hasSavedPortfolio, setHasSavedPortfolio] = useState(() => loadSavedPortfolio() !== null)
  const portfolioRef = useRef(portfolio)
  portfolioRef.current = portfolio

  // Snapshot of market context, read at fill time without re-creating callbacks each tick.
  const marketMetaRef = useRef<{ regime?: string; eventLabel?: string }>({})
  marketMetaRef.current = {
    regime: currentRegime?.name,
    eventLabel: activeEvents[0]?.markerLabel,
  }

  const applyFill = useCallback((next: Portfolio, fill?: TradeFill): Portfolio => {
    if (!fill) return next
    const trade: Trade = {
      ...fill,
      id: `trade-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      regime: marketMetaRef.current.regime,
      eventLabel: marketMetaRef.current.eventLabel,
    }
    return { ...next, trades: [trade, ...next.trades].slice(0, MAX_TRADES) }
  }, [])

  useEffect(() => {
    if (!hasSavedPortfolio) return
    savePortfolio(portfolio)
  }, [portfolio, hasSavedPortfolio])

  // Use the combined list so option positions on indices re-mark too.
  useEffect(() => {
    setPortfolio((prev) => refreshPortfolioWithMarket(prev, underlyings as Underlying[]))
  }, [state.tickCount, underlyings])

  const buyStock = useCallback(
    (symbol: string, quantity: number): OrderResult => {
      const outcome = executeBuy(portfolioRef.current, state.stocks, symbol, quantity)
      setPortfolio(applyFill(outcome.portfolio, outcome.fill))
      return outcome.result
    },
    [state.stocks, applyFill],
  )

  const sellStock = useCallback(
    (symbol: string, quantity: number): OrderResult => {
      const outcome = executeSell(portfolioRef.current, state.stocks, symbol, quantity)
      setPortfolio(applyFill(outcome.portfolio, outcome.fill))
      return outcome.result
    },
    [state.stocks, applyFill],
  )

  const buyOption = useCallback(
    (order: OptionOrderInput): OrderResult => {
      const outcome = executeOptionBuy(portfolioRef.current, underlyings, order)
      setPortfolio(applyFill(outcome.portfolio, outcome.fill))
      return outcome.result
    },
    [underlyings, applyFill],
  )

  const closeOption = useCallback(
    (positionId: string, quantity?: number): OrderResult => {
      const outcome = executeOptionClose(portfolioRef.current, underlyings, positionId, quantity)
      setPortfolio(applyFill(outcome.portfolio, outcome.fill))
      return outcome.result
    },
    [underlyings, applyFill],
  )

  const resetPortfolio = useCallback((startingCash: number) => {
    const next = createInitialPortfolio(startingCash)
    setPortfolio(next)
    savePortfolio(next)
    setHasSavedPortfolio(true)
  }, [])

  const endDay = useCallback((): EndOfDayReport => {
    const report = createEndOfDayReport(portfolioRef.current)
    setPortfolio((prev) => rollPortfolioSession(prev))
    return report
  }, [])

  const value = useMemo<PortfolioContextValue>(
    () => ({
      portfolio,
      positions: portfolio.positions,
      optionPositions: portfolio.optionPositions,
      trades: portfolio.trades,
      buyStock,
      sellStock,
      buyOption,
      closeOption,
      resetPortfolio,
      endDay,
      hasSavedPortfolio,
    }),
    [portfolio, buyStock, sellStock, buyOption, closeOption, resetPortfolio, endDay, hasSavedPortfolio],
  )

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider')
  return ctx
}

export type { OrderSide }
