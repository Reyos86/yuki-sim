import { usePortfolio } from '../context/PortfolioContext'

function formatMoney(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function PLCell({ value }: { value: number }) {
  const positive = value >= 0
  return (
    <span className={`pl-value ${positive ? 'positive' : 'negative'}`}>
      {positive ? '+' : ''}{formatMoney(value)}
    </span>
  )
}

export default function AccountSummary() {
  const { portfolio } = usePortfolio()
  const dayPnLPct = portfolio.sessionStartValue > 0
    ? (portfolio.dayPnL / portfolio.sessionStartValue) * 100
    : 0

  return (
    <section className="account-summary panel">
      <div className="panel__header">
        <h2 className="panel__title">Account Summary</h2>
        <span className="panel__meta">Sim Account #YK-48291</span>
      </div>
      <div className="account-summary__grid">
        <div className="account-metric">
          <span className="account-metric__label">Total Account Value</span>
          <span className="account-metric__value">{formatMoney(portfolio.totalAccountValue)}</span>
        </div>
        <div className="account-metric">
          <span className="account-metric__label">Cash</span>
          <span className="account-metric__value">{formatMoney(portfolio.cash)}</span>
        </div>
        <div className="account-metric">
          <span className="account-metric__label">Buying Power</span>
          <span className="account-metric__value">{formatMoney(portfolio.buyingPower)}</span>
        </div>
        <div className="account-metric">
          <span className="account-metric__label">Day P/L</span>
          <span className="account-metric__value">
            <span className={`pl-value ${portfolio.dayPnL >= 0 ? 'positive' : 'negative'}`}>
              {portfolio.dayPnL >= 0 ? '+' : ''}{formatMoney(portfolio.dayPnL)}
              <span className="pl-value__pct">
                {' '}({portfolio.dayPnL >= 0 ? '+' : ''}{dayPnLPct.toFixed(2)}%)
              </span>
            </span>
          </span>
        </div>
        <div className="account-metric">
          <span className="account-metric__label">Realized P/L</span>
          <span className="account-metric__value">
            <PLCell value={portfolio.realizedPnL} />
          </span>
        </div>
        <div className="account-metric">
          <span className="account-metric__label">Positions Value</span>
          <span className="account-metric__value">
            {formatMoney(portfolio.totalAccountValue - portfolio.cash)}
          </span>
        </div>
      </div>
    </section>
  )
}
