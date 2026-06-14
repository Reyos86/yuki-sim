import { useMemo, useState } from 'react'
import { useMarket } from '../context/MarketContext'
import { generateOptionsChain, getAtmStrike } from '../utils/optionsChainGenerator'
import OptionsOrderModal, { type OptionsOrderRequest } from './OptionsOrderModal'

const EXPIRY_LABEL = 'Jun 27, 2026'

export default function OptionsChain() {
  const { selectedSymbol, selectedName, selectedUnderlying, state } = useMarket()
  const spotPrice = selectedUnderlying?.price ?? 0

  const [orderRequest, setOrderRequest] = useState<OptionsOrderRequest | null>(null)

  const optionsChain = useMemo(
    () => generateOptionsChain(spotPrice, selectedSymbol),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spotPrice, selectedSymbol, state.tickCount],
  )

  const atmStrike = getAtmStrike(spotPrice)

  function openOrder(type: 'Call' | 'Put', strike: number) {
    if (!selectedUnderlying) return
    setOrderRequest({
      symbol: selectedSymbol,
      name: selectedName,
      type,
      strike,
      expiry: EXPIRY_LABEL,
    })
  }

  return (
    <section className="options-chain panel">
      <div className="panel__header">
        <h2 className="panel__title">Options Chain</h2>
        <div className="options-chain__meta">
          <span className="panel__meta">{selectedSymbol}</span>
          <span className="options-chain__expiry">Exp: {EXPIRY_LABEL} · click Bid/Ask to trade</span>
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
                  <td
                    className="align-right mono call-cell option-cell--tradable"
                    onClick={() => openOrder('Call', row.strike)}
                    title={`Buy ${selectedSymbol} ${row.strike} Call @ bid`}
                  >
                    {row.callBid.toFixed(2)}
                  </td>
                  <td
                    className="align-right mono call-cell option-cell--tradable option-cell--ask"
                    onClick={() => openOrder('Call', row.strike)}
                    title={`Buy ${selectedSymbol} ${row.strike} Call @ ask`}
                  >
                    {row.callAsk.toFixed(2)}
                  </td>
                  <td className="align-right mono muted">{row.callVol.toLocaleString()}</td>
                  <td className="align-right mono muted">{row.callOI.toLocaleString()}</td>
                  <td className="align-center strike-cell">
                    <span className="strike-value">{row.strike}</span>
                    {isATM && <span className="atm-badge">ATM</span>}
                    <span className="iv-label muted">{row.iv.toFixed(1)}% IV</span>
                  </td>
                  <td
                    className="align-right mono put-cell option-cell--tradable"
                    onClick={() => openOrder('Put', row.strike)}
                    title={`Buy ${selectedSymbol} ${row.strike} Put @ bid`}
                  >
                    {row.putBid.toFixed(2)}
                  </td>
                  <td
                    className="align-right mono put-cell option-cell--tradable option-cell--ask"
                    onClick={() => openOrder('Put', row.strike)}
                    title={`Buy ${selectedSymbol} ${row.strike} Put @ ask`}
                  >
                    {row.putAsk.toFixed(2)}
                  </td>
                  <td className="align-right mono muted">{row.putVol.toLocaleString()}</td>
                  <td className="align-right mono muted">{row.putOI.toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <OptionsOrderModal request={orderRequest} onClose={() => setOrderRequest(null)} />
    </section>
  )
}
