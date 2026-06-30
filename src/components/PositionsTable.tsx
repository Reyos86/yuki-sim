import { useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { SHARES_PER_CONTRACT } from '../portfolio/portfolioEngine'
import TradeHistory from './TradeHistory'

function formatMoney(value: number) {
  const sign = value >= 0 ? '+' : ''
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

type Tab = 'positions' | 'history'

export default function PositionsTable() {
  const { positions, optionPositions, closeOption, trades } = usePortfolio()
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [tab, setTab] = useState<Tab>('positions')

  const totalCount = positions.length + optionPositions.length

  function handleClose(positionId: string) {
    const result = closeOption(positionId)
    setMessage({ text: result.message, type: result.success ? 'success' : 'error' })
    if (result.success) setTimeout(() => setMessage(null), 2500)
  }

  return (
    <section className="positions-table panel">
      <div className="panel__header positions-table__header">
        <div className="positions-table__tabs">
          <button
            type="button"
            className={`positions-tab ${tab === 'positions' ? 'positions-tab--active' : ''}`}
            onClick={() => setTab('positions')}
          >
            Open Positions{totalCount > 0 ? ` (${totalCount})` : ''}
          </button>
          <button
            type="button"
            className={`positions-tab ${tab === 'history' ? 'positions-tab--active' : ''}`}
            onClick={() => setTab('history')}
          >
            History{trades.length > 0 ? ` (${trades.length})` : ''}
          </button>
        </div>
      </div>
      {message && (
        <p className={`positions-table__message positions-table__message--${message.type}`}>
          {message.text}
        </p>
      )}
      {tab === 'history' ? (
        <div className="positions-table__wrap">
          <TradeHistory trades={trades} />
        </div>
      ) : (
      <div className="positions-table__wrap">
        {totalCount === 0 ? (
          <p className="positions-table__empty muted">No open positions yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Type</th>
                <th className="align-right">Qty</th>
                <th className="align-right">Avg Cost</th>
                <th className="align-right">Last</th>
                <th className="align-right">Mkt Value</th>
                <th className="align-right">Day P/L</th>
                <th className="align-right">Unrealized P/L</th>
                <th className="align-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => {
                const dayPositive = pos.dayPnL >= 0
                const unrealizedPositive = pos.unrealizedPnL >= 0
                return (
                  <tr key={`stk-${pos.symbol}`}>
                    <td>
                      <div className="symbol-cell">
                        <span className="symbol-cell__ticker">{pos.symbol}</span>
                        <span className="symbol-cell__name">{pos.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="type-badge type-badge--stock">STK</span>
                    </td>
                    <td className="align-right mono">{pos.quantity}</td>
                    <td className="align-right mono">${pos.avgPrice.toFixed(2)}</td>
                    <td className="align-right mono">${pos.currentPrice.toFixed(2)}</td>
                    <td className="align-right mono">
                      ${pos.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`align-right mono ${dayPositive ? 'positive' : 'negative'}`}>
                      {formatMoney(pos.dayPnL)}
                    </td>
                    <td className={`align-right mono ${unrealizedPositive ? 'positive' : 'negative'}`}>
                      {formatMoney(pos.unrealizedPnL)}
                      <span className="pl-pct">
                        {' '}({unrealizedPositive ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="align-right muted">—</td>
                  </tr>
                )
              })}
              {optionPositions.map((pos) => {
                const dayPositive = pos.dayPnL >= 0
                const unrealizedPositive = pos.unrealizedPnL >= 0
                const typeClass =
                  pos.type === 'Call' ? 'type-badge--call' : 'type-badge--put'
                return (
                  <tr key={`opt-${pos.id}`}>
                    <td>
                      <div className="symbol-cell">
                        <span className="symbol-cell__ticker">{pos.symbol}</span>
                        <span className="symbol-cell__name">
                          {pos.strike} {pos.type} · {pos.expiry}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`type-badge ${typeClass}`}>
                        {pos.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="align-right mono">{pos.quantity}</td>
                    <td className="align-right mono">${pos.avgPrice.toFixed(2)}</td>
                    <td className="align-right mono">${pos.currentPrice.toFixed(2)}</td>
                    <td className="align-right mono">
                      ${pos.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`align-right mono ${dayPositive ? 'positive' : 'negative'}`}>
                      {formatMoney(pos.dayPnL)}
                    </td>
                    <td className={`align-right mono ${unrealizedPositive ? 'positive' : 'negative'}`}>
                      {formatMoney(pos.unrealizedPnL)}
                      <span className="pl-pct">
                        {' '}({unrealizedPositive ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="align-right">
                      <button
                        type="button"
                        className="position-close-btn"
                        onClick={() => handleClose(pos.id)}
                        title={`Close ${pos.quantity} contract${pos.quantity > 1 ? 's' : ''}`}
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      )}
      {tab === 'positions' && optionPositions.length > 0 && (
        <p className="positions-table__footnote muted">
          Each option contract controls {SHARES_PER_CONTRACT} shares of the underlying.
        </p>
      )}
    </section>
  )
}
