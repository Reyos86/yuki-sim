import { useState } from 'react'
import { useMarket } from '../context/MarketContext'
import { usePortfolio, type OrderSide } from '../context/PortfolioContext'

export default function TradeTicket() {
  const { selectedSymbol, selectedUnderlying } = useMarket()
  const { portfolio, buyStock, sellStock } = usePortfolio()

  const [side, setSide] = useState<OrderSide>('buy')
  const [quantity, setQuantity] = useState(10)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)

  const isIndex = selectedUnderlying?.kind === 'index'
  const marketPrice = selectedUnderlying?.price ?? 0
  const estValue = marketPrice * quantity

  function handlePlaceOrder() {
    if (isIndex) {
      setMessage({
        text: 'Indices are not directly tradable — trade options on them below.',
        type: 'error',
      })
      return
    }
    const qty = Math.floor(quantity)
    if (qty <= 0) {
      setMessage({ text: 'Enter a valid quantity.', type: 'error' })
      return
    }

    const result = side === 'buy'
      ? buyStock(selectedSymbol, qty)
      : sellStock(selectedSymbol, qty)

    setMessage({ text: result.message, type: result.success ? 'success' : 'error' })
  }

  return (
    <section className="trade-ticket panel">
      <div className="panel__header">
        <h2 className="panel__title">Trade Ticket</h2>
        <span className="panel__meta">{selectedSymbol}</span>
      </div>

      {isIndex && (
        <div className="trade-ticket__index-banner">
          <strong>{selectedSymbol}</strong> is an index — shares aren't directly tradable.
          Use the <em>Options Chain</em> below to buy calls or puts on it.
        </div>
      )}

      <div className="trade-ticket__sides">
        <button
          type="button"
          className={`side-btn side-btn--buy ${side === 'buy' ? 'side-btn--active' : ''}`}
          onClick={() => { setSide('buy'); setMessage(null) }}
          disabled={isIndex}
        >
          Buy
        </button>
        <button
          type="button"
          className={`side-btn side-btn--sell ${side === 'sell' ? 'side-btn--active' : ''}`}
          onClick={() => { setSide('sell'); setMessage(null) }}
          disabled={isIndex}
        >
          Sell
        </button>
      </div>

      <div className="trade-ticket__form">
        <label className="form-field">
          <span className="form-field__label">Order Type</span>
          <select className="form-field__input" defaultValue="market" disabled>
            <option value="market">Market</option>
          </select>
        </label>

        <label className="form-field">
          <span className="form-field__label">Quantity</span>
          <input
            className="form-field__input"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min={1}
            step={1}
          />
        </label>

        <label className="form-field">
          <span className="form-field__label">Market Price</span>
          <input
            className="form-field__input mono"
            type="text"
            value={marketPrice > 0 ? marketPrice.toFixed(2) : '—'}
            readOnly
          />
        </label>

        <div className="form-field">
          <span className="form-field__label">Buying Power</span>
          <span className="form-field__static mono">
            ${portfolio.buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="trade-ticket__summary">
        <div className="summary-row">
          <span className="muted">Est. Order Value</span>
          <span className="mono">${estValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="summary-row">
          <span className="muted">Commission</span>
          <span className="mono">$0.00</span>
        </div>
      </div>

      {message && (
        <p className={`trade-ticket__message trade-ticket__message--${message.type}`}>
          {message.text}
        </p>
      )}

      <button
        type="button"
        className={`submit-btn ${side === 'buy' ? 'submit-btn--buy' : 'submit-btn--sell'}`}
        onClick={handlePlaceOrder}
        disabled={isIndex}
      >
        {isIndex ? 'Index — Trade Options Below' : 'Place Order'}
      </button>

      <p className="trade-ticket__disclaimer muted">
        Simulated orders only. No real execution.
      </p>
    </section>
  )
}
