import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { indexTickers, watchlist } from '../data/mockMarketData'
import {
  eventTemplateById,
  instantiateEvent,
  pickRandomEventId,
  type ActiveNewsEvent,
  type TriggerableEventId,
} from '../data/newsEvents'
import {
  addEventToState,
  createInitialMarketState,
  stockToWatchlistItem,
  tickMarket,
  type ChartDataBySymbol,
  type ChartEventMarker,
  type MarketState,
} from '../simulation/marketEngine'

const TICK_INTERVAL_MS = 2000
const DEFAULT_SYMBOL = 'BSLA'
const MEME_REVERSAL_CHANCE = 0.6

const initialStartTime = new Date(2026, 5, 13, 10, 42, 18)

interface MarketContextValue {
  state: MarketState
  watchlist: ReturnType<typeof stockToWatchlistItem>[]
  selectedSymbol: string
  selectedName: string
  chartDataBySymbol: ChartDataBySymbol
  markersBySymbol: Record<string, ChartEventMarker[]>
  setSelectedSymbol: (symbol: string) => void
  activeEvents: ActiveNewsEvent[]
  triggerEvent: (eventId: string) => ActiveNewsEvent | null
  triggerRandomEvent: () => ActiveNewsEvent | null
  affectedSymbols: Set<string>
}

const MarketContext = createContext<MarketContextValue | null>(null)

export function MarketProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MarketState>(() =>
    createInitialMarketState(indexTickers, watchlist, initialStartTime),
  )
  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOL)

  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        const next = tickMarket(prev)
        const expiring = prev.activeEvents.filter((e) => e.remainingTicks === 1)
        for (const e of expiring) {
          if (e.id === 'meme-frenzy' && Math.random() < MEME_REVERSAL_CHANCE) {
            const reversal = eventTemplateById['meme-reversal']
            if (reversal) {
              const instance = instantiateEvent(reversal, next.marketTime, next.tickCount)
              return addEventToState(next, instance)
            }
          }
        }
        return next
      })
    }, TICK_INTERVAL_MS)

    return () => clearInterval(id)
  }, [])

  const triggerEvent = useCallback((eventId: string): ActiveNewsEvent | null => {
    const template = eventTemplateById[eventId]
    if (!template) return null
    let created: ActiveNewsEvent | null = null
    setState((prev) => {
      const instance = instantiateEvent(template, prev.marketTime, prev.tickCount)
      created = instance
      return addEventToState(prev, instance)
    })
    return created
  }, [])

  const triggerRandomEvent = useCallback((): ActiveNewsEvent | null => {
    const id: TriggerableEventId = pickRandomEventId()
    return triggerEvent(id)
  }, [triggerEvent])

  const selectedStock = state.stocks.find((s) => s.symbol === selectedSymbol)
  const selectedName = selectedStock?.name ?? selectedSymbol

  const affectedSymbols = useMemo(() => {
    const set = new Set<string>()
    for (const e of state.activeEvents) {
      for (const sym of e.affectedSymbols) set.add(sym)
      for (const sym of Object.keys(e.symbolImpacts)) set.add(sym)
    }
    return set
  }, [state.activeEvents])

  const value = useMemo<MarketContextValue>(
    () => ({
      state,
      watchlist: state.stocks.map(stockToWatchlistItem),
      selectedSymbol,
      selectedName,
      chartDataBySymbol: state.chartDataBySymbol,
      markersBySymbol: state.markersBySymbol,
      setSelectedSymbol,
      activeEvents: state.activeEvents,
      triggerEvent,
      triggerRandomEvent,
      affectedSymbols,
    }),
    [state, selectedSymbol, selectedName, triggerEvent, triggerRandomEvent, affectedSymbols],
  )

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
}

export function useMarket(): MarketContextValue {
  const ctx = useContext(MarketContext)
  if (!ctx) throw new Error('useMarket must be used within MarketProvider')
  return ctx
}
