import type { Trade } from '../portfolio/portfolioEngine'

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

function formatMoney(value: number): string {
  const sign = value >= 0 ? '+' : '-'
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function actionClass(action: Trade['action']): string {
  if (action === 'Buy' || action === 'Buy to Open') return 'trade-action--buy'
  return 'trade-action--sell'
}

interface TradeHistoryProps {
  trades: Trade[]
}

export default function TradeHistory({ trades }: TradeHistoryProps) {
  if (trades.length === 0) {
    return <p className="positions-table__empty muted">No trades yet. Your fills will show up here.</p>
  }

  return (
    <table className="data-table trade-history__table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Action</th>
          <th>Instrument</th>
          <th className="align-right">Qty</th>
          <th className="align-right">Price</th>
          <th className="align-right">Value</th>
          <th className="align-right">Realized P/L</th>
          <th>Context</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((trade) => {
          const isOption = trade.instrument === 'option'
          const detail = isOption
            ? `${trade.strike} ${trade.optionType} · ${trade.expiry}`
            : trade.name
          return (
            <tr key={trade.id}>
              <td className="mono muted">{formatTime(trade.timestamp)}</td>
              <td>
                <span className={`trade-action ${actionClass(trade.action)}`}>{trade.action}</span>
              </td>
              <td>
                <div className="symbol-cell">
                  <span className="symbol-cell__ticker">
                    {trade.symbol}
                    <span className={`type-badge ${isOption ? (trade.optionType === 'Call' ? 'type-badge--call' : 'type-badge--put') : 'type-badge--stock'} trade-history__badge`}>
                      {isOption ? trade.optionType?.toUpperCase() : 'STK'}
                    </span>
                  </span>
                  <span className="symbol-cell__name">{detail}</span>
                </div>
              </td>
              <td className="align-right mono">{trade.quantity}</td>
              <td className="align-right mono">${trade.price.toFixed(2)}</td>
              <td className="align-right mono">
                ${trade.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="align-right mono">
                {typeof trade.realizedPnL === 'number' ? (
                  <span className={trade.realizedPnL >= 0 ? 'positive' : 'negative'}>
                    {formatMoney(trade.realizedPnL)}
                  </span>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td>
                <div className="trade-history__context">
                  {trade.eventLabel && (
                    <span className="trade-history__event">{trade.eventLabel}</span>
                  )}
                  {trade.regime && (
                    <span className="trade-history__regime muted">{trade.regime}</span>
                  )}
                  {!trade.eventLabel && !trade.regime && <span className="muted">—</span>}
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
