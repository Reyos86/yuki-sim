import { usePortfolio } from '../context/PortfolioContext'

function formatMoney(value: number) {
  const sign = value >= 0 ? '+' : ''
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export default function PositionsTable() {
  const { positions } = usePortfolio()

  return (
    <section className="positions-table panel">
      <div className="panel__header">
        <h2 className="panel__title">Open Positions</h2>
        <span className="panel__meta">{positions.length} positions</span>
      </div>
      <div className="positions-table__wrap">
        {positions.length === 0 ? (
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
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => {
                const dayPositive = pos.dayPnL >= 0
                const unrealizedPositive = pos.unrealizedPnL >= 0
                return (
                  <tr key={pos.symbol}>
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
