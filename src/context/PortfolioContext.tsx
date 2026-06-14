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
import {
  createInitialPortfolio,
  executeBuy,
  executeSell,
  refreshPortfolioWithMarket,
  type OrderResult,
  type OrderSide,
  type Portfolio,
  type StockPosition,
} from '../portfolio/portfolioEngine'

interface PortfolioContextValue {
  portfolio: Portfolio
  positions: StockPosition[]
  buyStock: (symbol: string, quantity: number) => OrderResult
  sellStock: (symbol: string, quantity: number) => OrderResult
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null)

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { state } = useMarket()
  const [portfolio, setPortfolio] = useState<Portfolio>(createInitialPortfolio)
  const portfolioRef = useRef(portfolio)
  portfolioRef.current = portfolio

  useEffect(() => {
    setPortfolio((prev) => refreshPortfolioWithMarket(prev, state.stocks))
  }, [state.tickCount, state.stocks])

  const buyStock = useCallback(
    (symbol: string, quantity: number): OrderResult => {
      const outcome = executeBuy(portfolioRef.current, state.stocks, symbol, quantity)
      setPortfolio(outcome.portfolio)
      return outcome.result
    },
    [state.stocks],
  )

  const sellStock = useCallback(
    (symbol: string, quantity: number): OrderResult => {
      const outcome = executeSell(portfolioRef.current, state.stocks, symbol, quantity)
      setPortfolio(outcome.portfolio)
      return outcome.result
    },
    [state.stocks],
  )

  const value = useMemo<PortfolioContextValue>(
    () => ({
      portfolio,
      positions: portfolio.positions,
      buyStock,
      sellStock,
    }),
    [portfolio, buyStock, sellStock],
  )

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider')
  return ctx
}

export type { OrderSide }
