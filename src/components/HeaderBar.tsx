import { useState } from 'react'
import { useMarket } from '../context/MarketContext'

function formatChange(change: number, pct: number) {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)} (${sign}${pct.toFixed(2)}%)`
}

function formatMarketTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  }) + ' ET'
}

export default function HeaderBar() {
  const { state, seedLabel, shareUrl } = useMarket()
  const [copied, setCopied] = useState(false)

  function copyShareLink() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1600)
      },
      () => {
        setCopied(false)
      },
    )
  }

  return (
    <header className="header-bar">
      <div className="header-bar__left">
        <div className="header-bar__brand">
          <span className="header-bar__logo">Y</span>
          <div>
            <h1 className="header-bar__title">Yuki Trading Simulator</h1>
            <span className="header-bar__subtitle">Paper Trading · Fictional Markets</span>
          </div>
        </div>
        <span className="badge badge--sim">SIMULATION MODE</span>
        <span className="badge badge--open">
          <span className="status-dot" />
          Market Open
        </span>
        <button
          type="button"
          className={`seed-pill ${copied ? 'seed-pill--copied' : ''}`}
          onClick={copyShareLink}
          title="Copy a shareable link — anyone opening it sees the exact same market"
        >
          <span className="seed-pill__label">SEED</span>
          <span className="seed-pill__value">{seedLabel}</span>
          <span className="seed-pill__action">{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      <div className="header-bar__center">
        <span className="header-bar__date">
          {state.marketTime.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'America/New_York',
          })}
        </span>
        <span className="header-bar__time">{formatMarketTime(state.marketTime)}</span>
      </div>

      <div className="header-bar__tickers">
        {state.indices.map((ticker) => {
          const positive = ticker.change >= 0
          return (
            <div key={ticker.symbol} className="index-ticker" title={ticker.name}>
              <span className="index-ticker__symbol">{ticker.name}</span>
              <span className="index-ticker__value">
                {ticker.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`index-ticker__change ${positive ? 'positive' : 'negative'}`}>
                {formatChange(ticker.change, ticker.changePct)}
              </span>
            </div>
          )
        })}
      </div>
    </header>
  )
}
