import type { EndOfDayReport } from '../portfolio/portfolioEngine'

interface EndOfDayReportModalProps {
  report: EndOfDayReport
  modeName: string
  onClose: () => void
}

function money(value: number): string {
  const sign = value >= 0 ? '+' : '-'
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function plainMoney(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function EndOfDayReportModal({
  report,
  modeName,
  onClose,
}: EndOfDayReportModalProps) {
  const positive = report.dayPnL >= 0

  return (
    <div className="report-backdrop">
      <section className="report-modal">
        <div className="report-modal__head">
          <div>
            <span className="report-modal__kicker">End Of Day Report</span>
            <h2>{modeName} Session</h2>
          </div>
          <span className={`report-modal__grade ${positive ? 'report-modal__grade--good' : 'report-modal__grade--bad'}`}>
            {report.grade}
          </span>
        </div>

        <div className="report-modal__hero">
          <span>Session P/L</span>
          <strong className={positive ? 'positive' : 'negative'}>
            {money(report.dayPnL)}
          </strong>
          <em className={positive ? 'positive' : 'negative'}>
            {positive ? '+' : ''}{report.dayPnLPercent.toFixed(2)}%
          </em>
        </div>

        <div className="report-modal__grid">
          <div>
            <span>Starting Value</span>
            <strong>{plainMoney(report.startingValue)}</strong>
          </div>
          <div>
            <span>Ending Value</span>
            <strong>{plainMoney(report.endingValue)}</strong>
          </div>
          <div>
            <span>Cash</span>
            <strong>{plainMoney(report.cash)}</strong>
          </div>
          <div>
            <span>Realized P/L</span>
            <strong className={report.realizedPnL >= 0 ? 'positive' : 'negative'}>
              {money(report.realizedPnL)}
            </strong>
          </div>
          <div>
            <span>Unrealized P/L</span>
            <strong className={report.unrealizedPnL >= 0 ? 'positive' : 'negative'}>
              {money(report.unrealizedPnL)}
            </strong>
          </div>
          <div>
            <span>Open Positions</span>
            <strong>{report.stockPositions + report.optionPositions}</strong>
          </div>
        </div>

        <div className="report-modal__stats-head">Trade Activity</div>
        <div className="report-modal__grid">
          <div>
            <span>Trades Placed</span>
            <strong>{report.tradeCount}</strong>
          </div>
          <div>
            <span>Closed Trades</span>
            <strong>{report.closedCount}</strong>
          </div>
          <div>
            <span>Win Rate</span>
            <strong>
              {report.closedCount > 0 ? `${report.winRate.toFixed(0)}%` : '—'}
              <span className="report-modal__sub">
                {report.closedCount > 0 ? ` ${report.wins}W / ${report.losses}L` : ''}
              </span>
            </strong>
          </div>
          <div>
            <span>Realized (Session)</span>
            <strong className={report.sessionRealized >= 0 ? 'positive' : 'negative'}>
              {money(report.sessionRealized)}
            </strong>
          </div>
          <div>
            <span>Best Trade</span>
            <strong className={report.bestTrade && report.bestTrade.pnl >= 0 ? 'positive' : report.bestTrade ? 'negative' : ''}>
              {report.bestTrade ? (
                <>
                  {money(report.bestTrade.pnl)}
                  <span className="report-modal__sub"> {report.bestTrade.label}</span>
                </>
              ) : (
                '—'
              )}
            </strong>
          </div>
          <div>
            <span>Worst Trade</span>
            <strong className={report.worstTrade && report.worstTrade.pnl < 0 ? 'negative' : ''}>
              {report.worstTrade ? (
                <>
                  {money(report.worstTrade.pnl)}
                  <span className="report-modal__sub"> {report.worstTrade.label}</span>
                </>
              ) : (
                '—'
              )}
            </strong>
          </div>
        </div>

        <p className="report-modal__note">
          Your current open positions stay open. The next session starts from your current account value.
        </p>

        <button type="button" className="report-modal__close" onClick={onClose}>
          Continue
        </button>
      </section>
    </div>
  )
}
