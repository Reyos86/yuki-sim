import { useMarket } from '../context/MarketContext'
import { gameModes, getGameMode, type GameModeId } from '../data/gameModes'

interface MainMenuProps {
  currentModeId: GameModeId
  hasSavedRun: boolean
  onStart: (modeId: GameModeId, resetRun: boolean) => void
}

export default function MainMenu({ currentModeId, hasSavedRun, onStart }: MainMenuProps) {
  const { state, currentRegime, seedLabel } = useMarket()
  const currentMode = getGameMode(currentModeId)

  return (
    <main className="main-menu">
      <div className="main-menu__bg-grid" />
      <div className="main-menu__ambient main-menu__ambient--one" />
      <div className="main-menu__ambient main-menu__ambient--two" />
      <div className="main-menu__ticker-ribbon" aria-hidden="true">
        {Array.from({ length: 26 }).map((_, i) => (
          <span
            // Static decorative bars only.
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className={i % 3 === 0 ? 'main-menu__bar main-menu__bar--down' : 'main-menu__bar'}
            style={{
              height: `${18 + ((i * 17) % 54)}px`,
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
      <section className="main-menu__hero">
        <div className="main-menu__brand-row">
          <span className="main-menu__logo">Y</span>
          <span className="badge badge--sim">Simulation Mode</span>
          <span className="main-menu__seed">Seed: {seedLabel}</span>
        </div>

        <p className="main-menu__eyebrow">Fictional Options Trading Simulator</p>
        <h1 className="main-menu__title">Yuki Trading Simulator</h1>
        <p className="main-menu__subtitle">
          Practice reading candles, trading stocks and options, reacting to generated
          market events, and managing risk without real money or real broker access.
        </p>

        <div className="main-menu__actions">
          <button
            type="button"
            className="main-menu__start"
            onClick={() => onStart(currentMode.id, true)}
          >
            New {currentMode.name} Run
          </button>
          {hasSavedRun && (
            <button
              type="button"
              className="main-menu__secondary"
              onClick={() => onStart(currentMode.id, false)}
            >
              Continue Run
            </button>
          )}
          <a className="main-menu__secondary" href="https://github.com/Reyos86/yuki-sim" target="_blank" rel="noreferrer">
            View Project
          </a>
        </div>
      </section>

      <section className="main-menu__market-card">
        <div className="main-menu__card-head">
          <span>Live Fictional Market</span>
          <strong>{currentRegime.name}</strong>
        </div>
        <p>{currentRegime.description}</p>
        <div className="main-menu__indices">
          {state.indices.map((index) => {
            const positive = index.change >= 0
            return (
              <div key={index.symbol} className="main-menu__index">
                <span>{index.name}</span>
                <strong>{index.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                <em className={positive ? 'positive' : 'negative'}>
                  {positive ? '+' : ''}{index.changePct.toFixed(2)}%
                </em>
              </div>
            )
          })}
        </div>
      </section>

      <section className="main-menu__modes">
        <div className="main-menu__modes-head">
          <span>Choose Mode</span>
          <strong>{currentMode.name}</strong>
        </div>
        <div className="main-menu__mode-grid">
          {gameModes.map((mode) => {
            const active = mode.id === currentMode.id
            return (
              <button
                key={mode.id}
                type="button"
                className={`main-menu__mode-card ${active ? 'main-menu__mode-card--active' : ''}`}
                onClick={() => onStart(mode.id, true)}
              >
                <span className="main-menu__mode-tag">{mode.tagline}</span>
                <strong>{mode.name}</strong>
                <p>{mode.description}</p>
                <em>${mode.startingCash.toLocaleString()} · {mode.difficulty}</em>
              </button>
            )
          })}
        </div>
      </section>

      <section className="main-menu__features">
        <article>
          <span className="main-menu__feature-kicker">Trade</span>
          <h2>Stocks & Options</h2>
          <p>Place simulated stock orders, buy calls or puts, and track live P/L as the fake market moves.</p>
        </article>
        <article>
          <span className="main-menu__feature-kicker">React</span>
          <h2>Events & Regimes</h2>
          <p>Background market moods and randomized breaking-news events push sectors and symbols around.</p>
        </article>
        <article>
          <span className="main-menu__feature-kicker">Chart</span>
          <h2>Candles & Tools</h2>
          <p>Use timeframes, moving averages, trend lines, horizontal levels, and option P/L markers.</p>
        </article>
      </section>
    </main>
  )
}
