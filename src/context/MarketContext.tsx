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
import { coerceSeed, setSeed } from '../utils/prng'
import {
  getSessionStart,
  msUntilTick,
  tickFromWallClock,
} from '../utils/simClock'

export type UnderlyingKind = 'stock' | 'index'

export interface Underlying {
  symbol: string
  name: string
  price: number
  openPrice: number
  kind: UnderlyingKind
}

const DEFAULT_SYMBOL = 'BSLA'
const MEME_REVERSAL_CHANCE = 0.6
const DEFAULT_SEED_LABEL = 'yuki'

interface SimBootstrap {
  seed: number
  seedLabel: string
  sessionStart: number
  initialState: MarketState
}

function readSeedFromUrl(): { seed: number; label: string } {
  let label = DEFAULT_SEED_LABEL
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('seed')
    if (raw && raw.length > 0) label = raw
  }
  return { seed: coerceSeed(label, coerceSeed(DEFAULT_SEED_LABEL, 1337)), label }
}

/**
 * One-shot bootstrap: seed the PRNG, build the initial state at the session
 * anchor, then replay ticks deterministically until we catch up to the current
 * wall-clock tick. Every viewer with the same seed + URL converges here.
 */
function bootstrapSim(): SimBootstrap {
  const { seed, label } = readSeedFromUrl()
  setSeed(seed)
  const sessionStart = getSessionStart()
  let state = createInitialMarketState(
    indexTickers,
    watchlist,
    new Date(sessionStart),
  )
  const targetTick = tickFromWallClock(sessionStart)
  for (let i = 0; i < targetTick; i++) {
    state = tickMarket(state)
  }
  return { seed, seedLabel: label, sessionStart, initialState: state }
}

interface MarketContextValue {
  state: MarketState
  watchlist: ReturnType<typeof stockToWatchlistItem>[]
  selectedSymbol: string
  selectedName: string
  selectedUnderlying: Underlying | null
  chartDataBySymbol: ChartDataBySymbol
  markersBySymbol: Record<string, ChartEventMarker[]>
  setSelectedSymbol: (symbol: string) => void
  activeEvents: ActiveNewsEvent[]
  triggerEvent: (eventId: string) => ActiveNewsEvent | null
  triggerRandomEvent: () => ActiveNewsEvent | null
  affectedSymbols: Set<string>
  underlyings: Underlying[]
  getUnderlying: (symbol: string) => Underlying | null
  seed: number
  seedLabel: string
  sessionStart: number
  shareUrl: string
}

const MarketContext = createContext<MarketContextValue | null>(null)

export function MarketProvider({ children }: { children: ReactNode }) {
  const bootstrapRef = useRef<SimBootstrap | null>(null)
  if (!bootstrapRef.current) {
    bootstrapRef.current = bootstrapSim()
  }
  const { seed, seedLabel, sessionStart, initialState } = bootstrapRef.current

  const [state, setState] = useState<MarketState>(initialState)
  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOL)

  useEffect(() => {
    let cancelled = false
    let timeoutId: number | undefined

    function schedule() {
      if (cancelled) return
      const nextTick = tickFromWallClock(sessionStart) + 1
      const delay = msUntilTick(sessionStart, nextTick)
      timeoutId = window.setTimeout(() => {
        if (cancelled) return
        setState((prev) => {
          const target = tickFromWallClock(sessionStart)
          let next = prev
          // Catch-up loop: if the tab was backgrounded, replay all missed ticks.
          while (next.tickCount < target) {
            next = tickMarket(next)
          }
          // Meme-reversal is intentionally non-deterministic and local-only —
          // a user triggering an event doesn't desync the shared market stream
          // because event impacts feed back into tickMarket via aggregateEventEffects
          // without consuming additional shared-PRNG calls.
          const expiring = prev.activeEvents.filter((e) => e.remainingTicks === 1)
          for (const e of expiring) {
            if (e.id === 'meme-frenzy' && Math.random() < MEME_REVERSAL_CHANCE) {
              const reversal = eventTemplateById['meme-reversal']
              if (reversal) {
                const instance = instantiateEvent(reversal, next.marketTime, next.tickCount)
                next = addEventToState(next, instance)
              }
            }
          }
          return next
        })
        schedule()
      }, Math.max(16, delay))
    }

    schedule()
    return () => {
      cancelled = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [sessionStart])

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

  const underlyings = useMemo<Underlying[]>(() => {
    const stockUnderlyings: Underlying[] = state.stocks.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      price: s.price,
      openPrice: s.openPrice,
      kind: 'stock',
    }))
    const indexUnderlyings: Underlying[] = state.indices.map((i) => ({
      symbol: i.symbol,
      name: i.name,
      price: i.value,
      openPrice: i.value - i.change,
      kind: 'index',
    }))
    return [...stockUnderlyings, ...indexUnderlyings]
  }, [state.stocks, state.indices])

  const getUnderlying = useCallback(
    (symbol: string): Underlying | null =>
      underlyings.find((u) => u.symbol === symbol) ?? null,
    [underlyings],
  )

  const selectedUnderlying = useMemo(
    () => getUnderlying(selectedSymbol),
    [getUnderlying, selectedSymbol],
  )
  const selectedName = selectedUnderlying?.name ?? selectedSymbol

  const affectedSymbols = useMemo(() => {
    const set = new Set<string>()
    for (const e of state.activeEvents) {
      for (const sym of e.affectedSymbols) set.add(sym)
      for (const sym of Object.keys(e.symbolImpacts)) set.add(sym)
    }
    return set
  }, [state.activeEvents])

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const url = new URL(window.location.href)
    url.searchParams.set('seed', seedLabel)
    return url.toString()
  }, [seedLabel])

  const value = useMemo<MarketContextValue>(
    () => ({
      state,
      watchlist: state.stocks.map(stockToWatchlistItem),
      selectedSymbol,
      selectedName,
      selectedUnderlying,
      chartDataBySymbol: state.chartDataBySymbol,
      markersBySymbol: state.markersBySymbol,
      setSelectedSymbol,
      activeEvents: state.activeEvents,
      triggerEvent,
      triggerRandomEvent,
      affectedSymbols,
      underlyings,
      getUnderlying,
      seed,
      seedLabel,
      sessionStart,
      shareUrl,
    }),
    [
      state,
      selectedSymbol,
      selectedName,
      selectedUnderlying,
      triggerEvent,
      triggerRandomEvent,
      affectedSymbols,
      underlyings,
      getUnderlying,
      seed,
      seedLabel,
      sessionStart,
      shareUrl,
    ],
  )

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
}

export function useMarket(): MarketContextValue {
  const ctx = useContext(MarketContext)
  if (!ctx) throw new Error('useMarket must be used within MarketProvider')
  return ctx
}
