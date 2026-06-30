import { useEffect, useState } from 'react'
import { MarketProvider } from './context/MarketContext'
import { PortfolioProvider } from './context/PortfolioContext'
import HeaderBar from './components/HeaderBar'
import MainMenu from './components/MainMenu'
import Watchlist from './components/Watchlist'
import ChartPanel from './components/ChartPanel'
import NewsPanel from './components/NewsPanel'
import TradeTicket from './components/TradeTicket'
import AccountSummary from './components/AccountSummary'
import PositionsTable from './components/PositionsTable'
import OptionsChain from './components/OptionsChain'
import ResizeHandle from './components/ResizeHandle'
import TutorialOverlay from './components/TutorialOverlay'
import EndOfDayReportModal from './components/EndOfDayReportModal'
import { getGameMode, type GameModeId } from './data/gameModes'
import { usePortfolio } from './context/PortfolioContext'
import type { EndOfDayReport } from './portfolio/portfolioEngine'
import './App.css'

const MODE_SAVE_KEY = 'yuki-sim.mode.v1'
const TUTORIAL_DONE_KEY = 'yuki-sim.tutorial-complete.v1'
const LAYOUT_SAVE_KEY = 'yuki-sim.layout.v2'

type LayoutSizes = {
  watchlistW: number
  rightW: number
  bottomH: number
  tradeH: number
  accountW: number
  positionsW: number
}

const DEFAULT_LAYOUT: LayoutSizes = {
  watchlistW: 220,
  rightW: 300,
  bottomH: 230,
  tradeH: 360,
  accountW: 340,
  positionsW: 560,
}

const LAYOUT_BOUNDS: Record<keyof LayoutSizes, [number, number]> = {
  watchlistW: [160, 460],
  rightW: [240, 560],
  bottomH: [120, 620],
  tradeH: [200, 760],
  accountW: [220, 680],
  positionsW: [260, 960],
}

function clampSize(key: keyof LayoutSizes, value: number): number {
  const [min, max] = LAYOUT_BOUNDS[key]
  return Math.min(max, Math.max(min, Math.round(value)))
}

function loadLayout(): LayoutSizes {
  if (typeof window === 'undefined') return { ...DEFAULT_LAYOUT }
  try {
    const raw = window.localStorage.getItem(LAYOUT_SAVE_KEY)
    if (!raw) return { ...DEFAULT_LAYOUT }
    const parsed = JSON.parse(raw) as Partial<LayoutSizes>
    const merged = { ...DEFAULT_LAYOUT, ...parsed }
    return (Object.keys(DEFAULT_LAYOUT) as (keyof LayoutSizes)[]).reduce((acc, key) => {
      acc[key] = clampSize(key, merged[key])
      return acc
    }, {} as LayoutSizes)
  } catch {
    return { ...DEFAULT_LAYOUT }
  }
}

function GameShell() {
  const [screen, setScreen] = useState<'menu' | 'dashboard'>('menu')
  const [modeId, setModeId] = useState<GameModeId>(() =>
    getGameMode(window.localStorage.getItem(MODE_SAVE_KEY)).id,
  )
  const [showTutorial, setShowTutorial] = useState(
    () => window.localStorage.getItem(TUTORIAL_DONE_KEY) !== 'true',
  )
  const [dayReport, setDayReport] = useState<EndOfDayReport | null>(null)
  const [layout, setLayout] = useState<LayoutSizes>(loadLayout)
  const { resetPortfolio, endDay, hasSavedPortfolio } = usePortfolio()

  const mode = getGameMode(modeId)

  useEffect(() => {
    window.localStorage.setItem(LAYOUT_SAVE_KEY, JSON.stringify(layout))
  }, [layout])

  function resizeLayout(key: keyof LayoutSizes, delta: number) {
    setLayout((prev) => ({ ...prev, [key]: clampSize(key, prev[key] + delta) }))
  }

  function resetLayout() {
    setLayout({ ...DEFAULT_LAYOUT })
  }

  function startMode(nextModeId: GameModeId, resetRun: boolean) {
    const nextMode = getGameMode(nextModeId)
    setModeId(nextMode.id)
    window.localStorage.setItem(MODE_SAVE_KEY, nextMode.id)
    if (resetRun) {
      resetPortfolio(nextMode.startingCash)
      setShowTutorial(true)
      window.localStorage.removeItem(TUTORIAL_DONE_KEY)
    }
    setScreen('dashboard')
  }

  function finishTutorial() {
    setShowTutorial(false)
    window.localStorage.setItem(TUTORIAL_DONE_KEY, 'true')
  }

  function handleEndDay() {
    setDayReport(endDay())
  }

  if (screen === 'menu') {
    return (
      <MainMenu
        currentModeId={mode.id}
        hasSavedRun={hasSavedPortfolio}
        onStart={startMode}
      />
    )
  }

  return (
    <div className="dashboard">
      <HeaderBar
        modeName={mode.name}
        onOpenMenu={() => setScreen('menu')}
        onEndDay={handleEndDay}
        onResetLayout={resetLayout}
      />

      <div className="dashboard__body">
        <div className="dashboard__main">
          <div className="dashboard__pane" style={{ width: layout.watchlistW }}>
            <Watchlist />
          </div>
          <ResizeHandle
            axis="x"
            ariaLabel="Resize watchlist"
            onResize={(d) => resizeLayout('watchlistW', d)}
            onReset={resetLayout}
          />

          <div className="dashboard__center">
            <ChartPanel />
          </div>

          <ResizeHandle
            axis="x"
            ariaLabel="Resize trade panel"
            onResize={(d) => resizeLayout('rightW', -d)}
            onReset={resetLayout}
          />
          <div className="dashboard__right" style={{ width: layout.rightW }}>
            <div className="dashboard__right-top" style={{ height: layout.tradeH }}>
              <TradeTicket />
            </div>
            <ResizeHandle
              axis="y"
              ariaLabel="Resize trade ticket"
              onResize={(d) => resizeLayout('tradeH', d)}
              onReset={resetLayout}
            />
            <div className="dashboard__right-bottom">
              <NewsPanel />
            </div>
          </div>
        </div>

        <ResizeHandle
          axis="y"
          ariaLabel="Resize bottom panels"
          onResize={(d) => resizeLayout('bottomH', -d)}
          onReset={resetLayout}
        />

        <div className="dashboard__bottom" style={{ height: layout.bottomH }}>
          <div className="dashboard__dock" style={{ width: layout.accountW }}>
            <AccountSummary />
          </div>
          <ResizeHandle
            axis="x"
            ariaLabel="Resize account summary"
            onResize={(d) => resizeLayout('accountW', d)}
            onReset={resetLayout}
          />
          <div className="dashboard__dock" style={{ width: layout.positionsW }}>
            <PositionsTable />
          </div>
          <ResizeHandle
            axis="x"
            ariaLabel="Resize positions"
            onResize={(d) => resizeLayout('positionsW', d)}
            onReset={resetLayout}
          />
          <div className="dashboard__dock dashboard__dock--flex">
            <OptionsChain />
          </div>
        </div>
      </div>

      {showTutorial && <TutorialOverlay onDone={finishTutorial} onSkip={finishTutorial} />}
      {dayReport && (
        <EndOfDayReportModal
          report={dayReport}
          modeName={mode.name}
          onClose={() => setDayReport(null)}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <MarketProvider>
      <PortfolioProvider>
        <GameShell />
      </PortfolioProvider>
    </MarketProvider>
  )
}

export default App
