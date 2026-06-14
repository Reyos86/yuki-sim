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
  executeBuy,
  executeOptionBuy,
  executeOptionClose,
  executeSell,
  refreshPortfolioWithMarket,
  type OptionOrderInput,
  type OptionPosition,
  type OrderResult,
  type OrderSide,
  type Portfolio,
  type StockPosition,
} from '../portfolio/portfolioEngine'

interface PortfolioContextValue {
  portfolio: Portfolio
  positions: StockPosition[]
  optionPositions: OptionPosition[]
  buyStock: (symbol: string, quantity: number) => OrderResult
  sellStock: (symbol: string, quantity: number) => OrderResult
  buyOption: (order: OptionOrderInput) => OrderResult
  closeOption: (positionId: string, quantity?: number) => OrderResult
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null)

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { state, underlyings } = useMarket()
  const [portfolio, setPortfolio] = useState<Portfolio>(createInitialPortfolio)
  const portfolioRef = useRef(portfolio)
  portfolioRef.current = portfolio

  // Use the combined list so option positions on indices re-mark too.
  useEffect(() => {
    setPortfolio((prev) => refreshPortfolioWithMarket(prev, underlyings as Underlying[]))
  }, [state.tickCount, underlyings])

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

  const buyOption = useCallback(
    (order: OptionOrderInput): OrderResult => {
      const outcome = executeOptionBuy(portfolioRef.current, underlyings, order)
      setPortfolio(outcome.portfolio)
      return outcome.result
    },
    [underlyings],
  )

  const closeOption = useCallback(
    (positionId: string, quantity?: number): OrderResult => {
      const outcome = executeOptionClose(portfolioRef.current, underlyings, positionId, quantity)
      setPortfolio(outcome.portfolio)
      return outcome.result
    },
    [underlyings],
  )

  const value = useMemo<PortfolioContextValue>(
    () => ({
      portfolio,
      positions: portfolio.positions,
      optionPositions: portfolio.optionPositions,
      buyStock,
      sellStock,
      buyOption,
      closeOption,
    }),
    [portfolio, buyStock, sellStock, buyOption, closeOption],
  )

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider')
  return ctx
}

export type { OrderSide }
