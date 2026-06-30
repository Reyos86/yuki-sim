import { useMemo, useState } from 'react'
import { useMarket } from '../context/MarketContext'

type SortKey = 'last' | 'chg'
type SortDirection = 'asc' | 'desc'

function formatIndexValue(v: number): string {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Watchlist() {
  const {
    watchlist,
    state,
    selectedSymbol,
    setSelectedSymbol,
    affectedSymbols,
    heavilyAffectedSymbols,
  } = useMarket()
  const [sortKey, setSortKey] = useState<SortKey>('chg')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const sortedWatchlist = useMemo(() => {
    return [...watchlist].sort((a, b) => {
      const aValue = sortKey === 'last' ? a.price : a.changePct
      const bValue = sortKey === 'last' ? b.price : b.changePct
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    })
  }, [watchlist, sortKey, sortDirection])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((d) => d === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortKey(key)
    setSortDirection('desc')
  }

  function sortArrow(key: SortKey): string {
    if (sortKey !== key) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

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
              <th colSpan={4} className="watchlist__section-label">
                Indices · Options Tradable
              </th>
            </tr>
          </thead>
          <tbody>
            {state.indices.map((idx) => {
              const positive = idx.change >= 0
              const isSelected = idx.symbol === selectedSymbol
              return (
                <tr
                  key={`idx-${idx.symbol}-${state.tickCount}`}
                  className={[
                    'row--index',
                    isSelected ? 'row--active' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedSymbol(idx.symbol)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedSymbol(idx.symbol)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-selected={isSelected}
                  aria-label={`Select ${idx.name}`}
                >
                  <td>
                    <div className="symbol-cell">
                      <span className="symbol-cell__ticker">
                        {idx.symbol}
                        <span className="index-pill" title="Index">IDX</span>
                      </span>
                      <span className="symbol-cell__name">{idx.name}</span>
                    </div>
                  </td>
                  <td className={`align-right mono ${positive ? 'positive' : 'negative'}`}>
                    {formatIndexValue(idx.value)}
                  </td>
                  <td className={`align-right mono ${positive ? 'positive' : 'negative'}`}>
                    {positive ? '+' : ''}{idx.changePct.toFixed(2)}%
                  </td>
                  <td className="align-right muted">—</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <table className="data-table watchlist__table">
          <thead>
            <tr>
              <th colSpan={4} className="watchlist__section-label">Stocks</th>
            </tr>
            <tr>
              <th>Symbol</th>
              <th className="align-right">
                <button
                  type="button"
                  className={`watchlist-sort-btn ${sortKey === 'last' ? 'watchlist-sort-btn--active' : ''}`}
                  onClick={() => toggleSort('last')}
                >
                  Last <span>{sortArrow('last')}</span>
                </button>
              </th>
              <th className="align-right">
                <button
                  type="button"
                  className={`watchlist-sort-btn ${sortKey === 'chg' ? 'watchlist-sort-btn--active' : ''}`}
                  onClick={() => toggleSort('chg')}
                >
                  Chg <span>{sortArrow('chg')}</span>
                </button>
              </th>
              <th className="align-right">Vol</th>
            </tr>
          </thead>
          <tbody>
            {sortedWatchlist.map((item) => {
              const positive = item.change >= 0
              const isSelected = item.symbol === selectedSymbol
              const stock = state.stocks.find((s) => s.symbol === item.symbol)
              const tickUp = (stock?.lastTickDelta ?? 0) > 0
              const tickDown = (stock?.lastTickDelta ?? 0) < 0
              const hasNews = affectedSymbols.has(item.symbol)
              const hasHeavyNews = heavilyAffectedSymbols.has(item.symbol)
              return (
                <tr
                  key={`${item.symbol}-${state.tickCount}`}
                  className={[
                    isSelected ? 'row--active' : '',
                    tickUp ? 'row--tick-up' : '',
                    tickDown ? 'row--tick-down' : '',
                    hasNews ? 'row--news' : '',
                    hasHeavyNews ? 'row--news-heavy' : '',
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
                        {hasNews && (
                          <span
                            className={`news-pill ${hasHeavyNews ? 'news-pill--heavy' : ''}`}
                            title={hasHeavyNews ? 'High-impact active event' : 'Active news event'}
                          >
                            {hasHeavyNews ? 'HOT' : 'NEWS'}
                          </span>
                        )}
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
