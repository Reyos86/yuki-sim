import { useMemo } from 'react'
import { useMarket } from '../context/MarketContext'
import { generateOptionsChain, getAtmStrike } from '../utils/optionsChainGenerator'

export default function OptionsChain() {
  const { selectedSymbol, state } = useMarket()
  const selectedStock = state.stocks.find((s) => s.symbol === selectedSymbol)
  const spotPrice = selectedStock?.price ?? 0

  const optionsChain = useMemo(
    () => generateOptionsChain(spotPrice, selectedSymbol),
    [spotPrice, selectedSymbol, state.tickCount],
  )

  const atmStrike = getAtmStrike(spotPrice)

  return (
    <section className="options-chain panel">
      <div className="panel__header">
        <h2 className="panel__title">Options Chain</h2>
        <div className="options-chain__meta">
          <span className="panel__meta">{selectedSymbol}</span>
        <span className="options-chain__expiry">Exp: Jun 27, 2026 · View only</span>
        </div>
      </div>

      <div className="options-chain__wrap">
        <table className="data-table options-table">
          <thead>
            <tr>
              <th colSpan={4} className="options-table__calls-header">Calls</th>
              <th className="options-table__strike-header">Strike</th>
              <th colSpan={4} className="options-table__puts-header">Puts</th>
            </tr>
            <tr className="options-table__subhead">
              <th className="align-right">Bid</th>
              <th className="align-right">Ask</th>
              <th className="align-right">Vol</th>
              <th className="align-right">OI</th>
              <th className="align-center"> </th>
              <th className="align-right">Bid</th>
              <th className="align-right">Ask</th>
              <th className="align-right">Vol</th>
              <th className="align-right">OI</th>
            </tr>
          </thead>
          <tbody>
            {optionsChain.map((row) => {
              const isATM = row.strike === atmStrike
              return (
                <tr key={row.strike} className={isATM ? 'row--atm' : ''}>
                  <td className="align-right mono call-cell">{row.callBid.toFixed(2)}</td>
                  <td className="align-right mono call-cell">{row.callAsk.toFixed(2)}</td>
                  <td className="align-right mono muted">{row.callVol.toLocaleString()}</td>
                  <td className="align-right mono muted">{row.callOI.toLocaleString()}</td>
                  <td className="align-center strike-cell">
                    <span className="strike-value">{row.strike}</span>
                    {isATM && <span className="atm-badge">ATM</span>}
                    <span className="iv-label muted">{row.iv.toFixed(1)}% IV</span>
                  </td>
                  <td className="align-right mono put-cell">{row.putBid.toFixed(2)}</td>
                  <td className="align-right mono put-cell">{row.putAsk.toFixed(2)}</td>
                  <td className="align-right mono muted">{row.putVol.toLocaleString()}</td>
                  <td className="align-right mono muted">{row.putOI.toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
