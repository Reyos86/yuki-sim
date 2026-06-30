import { useMarket } from '../context/MarketContext'
import { newsItems } from '../data/mockMarketData'
import {
  severityColors,
  triggerableEventIds,
  triggerButtonLabels,
} from '../data/newsEvents'

const tagLabels: Record<string, string> = {
  breaking: 'BREAKING',
  earnings: 'EARNINGS',
  macro: 'MACRO',
  sector: 'SECTOR',
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  })
}

export default function NewsPanel() {
  const { activeEvents, recentEvents, currentRegime, triggerEvent, triggerRandomEvent } = useMarket()
  const completedEvents = recentEvents.filter(
    (event) => !activeEvents.some((active) => active.instanceId === event.instanceId),
  )

  return (
    <aside className="news-panel panel">
      <div className="panel__header">
        <h2 className="panel__title">Current Events</h2>
        <span className="panel__meta live-indicator">
          <span className="status-dot status-dot--pulse" />
          Live
        </span>
      </div>

      <div className="news-panel__body">
      <div className="news-panel__triggers">
        <button
          type="button"
          className="trigger-btn trigger-btn--random"
          onClick={() => triggerRandomEvent()}
        >
          Trigger Random Event
        </button>
        <div className="trigger-btn-grid">
          {triggerableEventIds.map((id) => (
            <button
              key={id}
              type="button"
              className="trigger-btn"
              onClick={() => triggerEvent(id)}
            >
              {triggerButtonLabels[id]}
            </button>
          ))}
        </div>
      </div>

      <div className="market-regime-card">
        <div className="market-regime-card__head">
          <span className="news-panel__section-label">Market Regime</span>
          <span className="market-regime-card__ticks">{currentRegime.remainingTicks} ticks</span>
        </div>
        <strong className="market-regime-card__name">{currentRegime.name}</strong>
        <p className="market-regime-card__description">{currentRegime.description}</p>
        <div className="market-regime-card__stats">
          <span>PNS {currentRegime.marketDrift >= 0 ? '+' : ''}{(currentRegime.marketDrift * 10000).toFixed(1)}bp</span>
          <span>TSQ {currentRegime.tasdaqDrift >= 0 ? '+' : ''}{(currentRegime.tasdaqDrift * 10000).toFixed(1)}bp</span>
          <span>Vol {currentRegime.volatilityMultiplier.toFixed(2)}x</span>
        </div>
      </div>

      {activeEvents.length > 0 && (
        <div className="news-panel__active">
          <span className="news-panel__section-label">Active Events</span>
          <ul className="active-event-list">
            {activeEvents.map((event) => {
              const total = event.durationTicks
              const elapsed = total - event.remainingTicks
              const pct = Math.min(100, Math.max(0, (elapsed / total) * 100))
              return (
                <li key={event.instanceId} className="active-event">
                  <div className="active-event__head">
                    <span
                      className="severity-badge"
                      style={{ background: severityColors[event.severity] }}
                    >
                      {event.severity.toUpperCase()}
                    </span>
                    {event.isFollowUp && (
                      <span className="follow-up-badge">FOLLOW-UP</span>
                    )}
                    <span className="active-event__time muted">
                      {formatTime(event.triggeredAt)} ET
                    </span>
                    <span className="active-event__ticks">
                      {event.remainingTicks} ticks left
                    </span>
                  </div>
                  <p className="active-event__headline">{event.headline}</p>
                  <p className="active-event__description">{event.description}</p>
                  {event.affectedSymbols.length > 0 && (
                    <div className="active-event__symbols">
                      {event.affectedSymbols.map((sym) => (
                        <span key={sym} className="active-event__symbol">{sym}</span>
                      ))}
                    </div>
                  )}
                  <div
                    className="active-event__bar"
                    style={{ ['--progress' as string]: `${pct}%` }}
                  >
                    <span className="active-event__bar-fill" />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {completedEvents.length > 0 && (
        <div className="news-panel__generated">
          <span className="news-panel__section-label">Recent Generated News</span>
          <ul className="generated-event-list">
            {completedEvents.slice(0, 5).map((event) => (
              <li key={event.instanceId} className="generated-event">
                <div className="generated-event__meta">
                  <span
                    className="severity-dot"
                    style={{ background: severityColors[event.severity] }}
                  />
                  <span className="generated-event__label">{event.markerLabel}</span>
                  {event.isFollowUp && <span className="follow-up-badge">FOLLOW-UP</span>}
                  <span className="generated-event__time muted">{formatTime(event.triggeredAt)} ET</span>
                </div>
                <p className="generated-event__headline">{event.headline}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <span className="news-panel__section-label news-panel__section-label--feed">News Feed</span>
      <ul className="news-list">
        {newsItems.map((item) => (
          <li key={item.id} className={`news-item news-item--${item.tag}`}>
            <div className="news-item__meta">
              <span className={`news-tag news-tag--${item.tag}`}>{tagLabels[item.tag]}</span>
              {item.symbol && <span className="news-item__symbol">{item.symbol}</span>}
              <span className="news-item__time muted">{item.time}</span>
            </div>
            <p className="news-item__headline">{item.headline}</p>
            <span className="news-item__source muted">{item.source}</span>
          </li>
        ))}
      </ul>
      </div>
    </aside>
  )
}
