import { useMarket } from '../context/MarketContext'

export default function Watchlist() {
  const { watchlist, state, selectedSymbol, setSelectedSymbol, affectedSymbols } = useMarket()

  return (
    <aside className="watchlist panel">
      <div className="panel__header">
        <h2 className="panel__title">Watchlist</h2>
        <span className="panel__meta">{watchlist.length} symbols · tick {state.tickCount}</span>
      </div>
      <div className="watchlist__table-wrap">
        <table className="data-table watchlist__table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th className="align-right">Last</th>
              <th className="align-right">Chg</th>
              <th className="align-right">Vol</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((item) => {
              const positive = item.change >= 0
              const isSelected = item.symbol === selectedSymbol
              const stock = state.stocks.find((s) => s.symbol === item.symbol)
              const tickUp = (stock?.lastTickDelta ?? 0) > 0
              const tickDown = (stock?.lastTickDelta ?? 0) < 0
              const hasNews = affectedSymbols.has(item.symbol)
              return (
                <tr
                  key={`${item.symbol}-${state.tickCount}`}
                  className={[
                    isSelected ? 'row--active' : '',
                    tickUp ? 'row--tick-up' : '',
                    tickDown ? 'row--tick-down' : '',
                    hasNews ? 'row--news' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedSymbol(item.symbol)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedSymbol(item.symbol)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-selected={isSelected}
                  aria-label={`Select ${item.symbol} ${item.name}`}
                >
                  <td>
                    <div className="symbol-cell">
                      <span className="symbol-cell__ticker">
                        {item.symbol}
                        {hasNews && <span className="news-pill" title="Active news event">NEWS</span>}
                      </span>
                      <span className="symbol-cell__name">{item.name}</span>
                    </div>
                  </td>
                  <td className={`align-right mono ${positive ? 'positive' : 'negative'}`}>
                    {item.price.toFixed(2)}
                  </td>
                  <td className={`align-right mono ${positive ? 'positive' : 'negative'}`}>
                    {positive ? '+' : ''}{item.changePct.toFixed(2)}%
                  </td>
                  <td className="align-right muted">{item.volume}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </aside>
  )
}
