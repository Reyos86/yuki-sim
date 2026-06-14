import { useEffect, useMemo, useState } from 'react'
import { useMarket } from '../context/MarketContext'
import { usePortfolio } from '../context/PortfolioContext'
import { SHARES_PER_CONTRACT } from '../portfolio/portfolioEngine'
import { priceOption, type OptionType } from '../utils/optionsChainGenerator'

export interface OptionsOrderRequest {
  symbol: string
  name: string
  type: OptionType
  strike: number
  expiry: string
}

interface Props {
  request: OptionsOrderRequest | null
  onClose: () => void
}

export default function OptionsOrderModal({ request, onClose }: Props) {
  const { getUnderlying } = useMarket()
  const { buyOption, portfolio } = usePortfolio()
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (request) {
      setQuantity(1)
      setMessage(null)
    }
  }, [request])

  useEffect(() => {
    if (!request) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [request, onClose])

  const underlying = request ? getUnderlying(request.symbol) : null
  const priced = useMemo(() => {
    if (!request || !underlying) return null
    return priceOption(underlying.price, request.strike, request.type, request.symbol)
  }, [request, underlying])

  if (!request) return null

  const ask = priced?.ask ?? 0
  const cost = ask * SHARES_PER_CONTRACT * quantity
  const buyingPower = portfolio.buyingPower
  const insufficient = cost > buyingPower

  function handlePlace() {
    if (!request) return
    const qty = Math.floor(quantity)
    if (qty <= 0) {
      setMessage({ text: 'Enter a valid contract count.', type: 'error' })
      return
    }
    const result = buyOption({
      symbol: request.symbol,
      name: request.name,
      type: request.type,
      strike: request.strike,
      expiry: request.expiry,
      quantity: qty,
    })
    setMessage({ text: result.message, type: result.success ? 'success' : 'error' })
    if (result.success) {
      setTimeout(onClose, 900)
    }
  }

  const typeClass = request.type === 'Call' ? 'option-modal__type--call' : 'option-modal__type--put'

  return (
    <div className="option-modal-backdrop" onClick={onClose}>
      <div
        className="option-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="option-modal__head">
          <div className="option-modal__title">
            <span className={`option-modal__type ${typeClass}`}>
              {request.type.toUpperCase()}
            </span>
            <span className="option-modal__symbol">{request.symbol}</span>
            <span className="option-modal__strike">{request.strike}</span>
          </div>
          <button type="button" className="option-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="option-modal__meta">
          <span className="muted">{request.name}</span>
          <span className="muted">Exp {request.expiry}</span>
        </div>

        <div className="option-modal__quote">
          <div className="option-modal__quote-cell">
            <span className="muted">Bid</span>
            <span className="mono">${priced?.bid.toFixed(2) ?? '—'}</span>
          </div>
          <div className="option-modal__quote-cell option-modal__quote-cell--ask">
            <span className="muted">Ask</span>
            <span className="mono">${priced?.ask.toFixed(2) ?? '—'}</span>
          </div>
          <div className="option-modal__quote-cell">
            <span className="muted">IV</span>
            <span className="mono">{priced?.iv.toFixed(1)}%</span>
          </div>
          <div className="option-modal__quote-cell">
            <span className="muted">Spot</span>
            <span className="mono">${underlying?.price.toFixed(2) ?? '—'}</span>
          </div>
        </div>

        <div className="option-modal__form">
          <label className="form-field">
            <span className="form-field__label">Contracts</span>
            <input
              className="form-field__input mono"
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              autoFocus
            />
          </label>
          <div className="option-modal__hint muted">
            1 contract = {SHARES_PER_CONTRACT} shares
          </div>
        </div>

        <div className="option-modal__summary">
          <div className="summary-row">
            <span className="muted">Limit Price</span>
            <span className="mono">${ask.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span className="muted">Total Premium</span>
            <span className="mono">${cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="summary-row">
            <span className="muted">Buying Power</span>
            <span className={`mono ${insufficient ? 'negative' : ''}`}>
              ${buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {message && (
          <p className={`option-modal__message option-modal__message--${message.type}`}>
            {message.text}
          </p>
        )}

        <div className="option-modal__actions">
          <button type="button" className="option-modal__cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`option-modal__place ${request.type === 'Call' ? 'option-modal__place--call' : 'option-modal__place--put'}`}
            onClick={handlePlace}
            disabled={insufficient || quantity <= 0}
          >
            Buy {quantity} {request.type === 'Call' ? 'Call' : 'Put'}{quantity > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
