import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type UTCTimestamp,
} from 'lightweight-charts'
import { useMarket } from '../context/MarketContext'
import {
  computeSMA,
  toCandleUpdate,
  toCandlestickData,
  toVolumeData,
  toVolumeUpdate,
} from '../utils/chartDataAdapter'
import {
  TIMEFRAMES,
  type Timeframe,
} from '../utils/chartDataGenerator'
import { usePortfolio } from '../context/PortfolioContext'

const CANDLE_UP = '#4ade80'
const CANDLE_DOWN = '#f87171'
const MA20_COLOR = 'rgba(96, 165, 250, 0.95)'
const MA50_COLOR = 'rgba(196, 132, 252, 0.95)'

type DrawingTool = 'cursor' | 'horizontal' | 'trend'

interface HorizontalDrawing {
  id: string
  type: 'horizontal'
  price: number
}

interface TrendDrawing {
  id: string
  type: 'trend'
  start: { time: number; price: number }
  end: { time: number; price: number }
}

type Drawing = HorizontalDrawing | TrendDrawing

interface PendingTrend {
  time: number
  price: number
}

const TOOL_BUTTONS: Array<{ id: DrawingTool; label: string; icon: string }> = [
  { id: 'cursor', label: 'Cursor', icon: '⤤' },
  { id: 'trend', label: 'Trend Line', icon: '↗' },
  { id: 'horizontal', label: 'Horizontal Line', icon: '—' },
]

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export default function ChartPanel() {
  const {
    state,
    selectedSymbol,
    selectedName,
    chartDataBySymbol,
  } = useMarket()
  const { positions, optionPositions } = usePortfolio()

  const [timeframe, setTimeframe] = useState<Timeframe>('5m')
  const [tool, setTool] = useState<DrawingTool>('cursor')
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [pendingTrend, setPendingTrend] = useState<PendingTrend | null>(null)
  const [hoverPos, setHoverPos] = useState<{ time: number; price: number } | null>(null)
  const [showMA20, setShowMA20] = useState(false)
  const [showMA50, setShowMA50] = useState(false)
  const [redrawTick, setRedrawTick] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const ma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const initializedRef = useRef(false)
  const prevSymbolRef = useRef(selectedSymbol)
  const prevTimeframeRef = useRef<Timeframe>(timeframe)
  const containerSizeRef = useRef({ width: 0, height: 0 })

  const toolRef = useRef(tool)
  toolRef.current = tool
  const pendingTrendRef = useRef(pendingTrend)
  pendingTrendRef.current = pendingTrend

  const chartData = useMemo(
    () => chartDataBySymbol[selectedSymbol]?.[timeframe] ?? [],
    [chartDataBySymbol, selectedSymbol, timeframe],
  )
  const selectedStock = state.stocks.find((s) => s.symbol === selectedSymbol)

  const last = chartData[chartData.length - 1]
  const first = chartData[0]
  const dayChange = selectedStock?.change ?? (last && first ? last.close - first.open : 0)
  const dayChangePct =
    selectedStock?.changePct ?? (first ? (dayChange / first.open) * 100 : 0)
  const positive = dayChange >= 0
  const high = chartData.length ? Math.max(...chartData.map((d) => d.high)) : 0
  const low = chartData.length ? Math.min(...chartData.map((d) => d.low)) : 0
  const volume = chartData.reduce((sum, d) => sum + d.volume, 0)
  const selectedPositionExposure = useMemo(() => {
    const stockPosition = positions.find((p) => p.symbol === selectedSymbol)
    const optionsForSymbol = optionPositions.filter((p) => p.symbol === selectedSymbol)
    const stockQuantity = stockPosition?.quantity ?? 0
    const optionContracts = optionsForSymbol.reduce((sum, p) => sum + p.quantity, 0)
    const stockPnl = stockPosition?.unrealizedPnL ?? 0
    const optionPnl = optionsForSymbol.reduce((sum, p) => sum + p.unrealizedPnL, 0)

    return {
      hasPosition: stockQuantity > 0 || optionContracts > 0,
      stockQuantity,
      optionContracts,
      pnl: stockPnl + optionPnl,
      label:
        stockQuantity > 0 && optionContracts > 0
          ? `${stockQuantity} SH · ${optionContracts} OPT`
          : stockQuantity > 0
            ? `${stockQuantity} SH`
            : `${optionContracts} OPT`,
    }
  }, [positions, optionPositions, selectedSymbol])

  const forceRedraw = useCallback(() => setRedrawTick((c) => c + 1), [])

  /* ───── Chart init ───── */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#111318' },
        textColor: '#9aa0ab',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(46, 48, 56, 0.4)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(46, 48, 56, 0.4)', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#4b5563', labelBackgroundColor: '#252830', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#4b5563', labelBackgroundColor: '#252830', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: '#252830',
        scaleMargins: { top: 0.08, bottom: 0.28 },
        visible: true,
      },
      timeScale: {
        borderColor: '#252830',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: 6,
        minBarSpacing: 2,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: true,
      },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: CANDLE_UP,
      downColor: CANDLE_DOWN,
      borderVisible: false,
      wickUpColor: CANDLE_UP,
      wickDownColor: CANDLE_DOWN,
      priceLineVisible: true,
      priceLineColor: 'rgba(129, 140, 248, 0.6)',
      priceLineStyle: LineStyle.Dashed,
      lastValueVisible: true,
    })

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      lastValueVisible: false,
      priceLineVisible: false,
    })
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    })

    const ma20Series = chart.addSeries(LineSeries, {
      color: MA20_COLOR,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
      crosshairMarkerVisible: false,
    })

    const ma50Series = chart.addSeries(LineSeries, {
      color: MA50_COLOR,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
      crosshairMarkerVisible: false,
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries
    ma20SeriesRef.current = ma20Series
    ma50SeriesRef.current = ma50Series
    initializedRef.current = false

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) {
        chart.applyOptions({ width, height })
        containerSizeRef.current = { width, height }
        forceRedraw()
      }
    })
    resizeObserver.observe(container)

    const timeRangeHandler = () => forceRedraw()
    chart.timeScale().subscribeVisibleTimeRangeChange(timeRangeHandler)

    const clickHandler = (param: MouseEventParams) => {
      const candleSeriesNow = candleSeriesRef.current
      if (!candleSeriesNow || !param.point || param.time === undefined) return
      const price = candleSeriesNow.coordinateToPrice(param.point.y)
      if (price === null) return
      const timeSeconds = Number(param.time)

      const currentTool = toolRef.current
      if (currentTool === 'horizontal') {
        setDrawings((d) => [...d, { id: newId(), type: 'horizontal', price: Number(price) }])
      } else if (currentTool === 'trend') {
        const pending = pendingTrendRef.current
        if (!pending) {
          setPendingTrend({ time: timeSeconds, price: Number(price) })
        } else {
          setDrawings((d) => [
            ...d,
            {
              id: newId(),
              type: 'trend',
              start: pending,
              end: { time: timeSeconds, price: Number(price) },
            },
          ])
          setPendingTrend(null)
        }
      }
    }
    chart.subscribeClick(clickHandler)

    const crosshairHandler = (param: MouseEventParams) => {
      const candleSeriesNow = candleSeriesRef.current
      if (!candleSeriesNow) return
      if (toolRef.current !== 'trend' || !pendingTrendRef.current) {
        setHoverPos(null)
        return
      }
      if (!param.point || param.time === undefined) {
        setHoverPos(null)
        return
      }
      const price = candleSeriesNow.coordinateToPrice(param.point.y)
      if (price === null) {
        setHoverPos(null)
        return
      }
      setHoverPos({ time: Number(param.time), price: Number(price) })
    }
    chart.subscribeCrosshairMove(crosshairHandler)

    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(timeRangeHandler)
      chart.unsubscribeClick(clickHandler)
      chart.unsubscribeCrosshairMove(crosshairHandler)
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      volumeSeriesRef.current = null
      ma20SeriesRef.current = null
      ma50SeriesRef.current = null
      initializedRef.current = false
    }
  }, [forceRedraw])

  /* ───── Push data into series ───── */
  useEffect(() => {
    const chart = chartRef.current
    const candleSeries = candleSeriesRef.current
    const volumeSeries = volumeSeriesRef.current
    if (!chart || !candleSeries || !volumeSeries || chartData.length === 0) return

    const symbolChanged = prevSymbolRef.current !== selectedSymbol
    const timeframeChanged = prevTimeframeRef.current !== timeframe

    if (!initializedRef.current || symbolChanged || timeframeChanged) {
      candleSeries.setData(toCandlestickData(chartData))
      volumeSeries.setData(toVolumeData(chartData))
      const total = chartData.length
      const visible = Math.min(70, total)
      chart.priceScale('right').applyOptions({
        autoScale: true,
        scaleMargins: { top: 0.08, bottom: 0.28 },
      })
      chart.timeScale().setVisibleLogicalRange({
        from: total - visible,
        to: total + 4,
      })
      chart.timeScale().scrollToRealTime()
      initializedRef.current = true
      prevSymbolRef.current = selectedSymbol
      prevTimeframeRef.current = timeframe
      forceRedraw()
      return
    }

    const lastPoint = chartData[chartData.length - 1]
    candleSeries.update(toCandleUpdate(lastPoint))
    volumeSeries.update(toVolumeUpdate(lastPoint))
  }, [chartData, selectedSymbol, timeframe, forceRedraw])

  /* ───── Moving averages ───── */
  useEffect(() => {
    const ma20 = ma20SeriesRef.current
    if (!ma20) return
    ma20.applyOptions({ visible: showMA20 })
    if (showMA20) ma20.setData(computeSMA(chartData, 20))
  }, [chartData, showMA20, selectedSymbol, timeframe])

  useEffect(() => {
    const ma50 = ma50SeriesRef.current
    if (!ma50) return
    ma50.applyOptions({ visible: showMA50 })
    if (showMA50) ma50.setData(computeSMA(chartData, 50))
  }, [chartData, showMA50, selectedSymbol, timeframe])

  /* ───── Drawing tool actions ───── */
  const handleSelectTool = useCallback((next: DrawingTool) => {
    setTool(next)
    if (next !== 'trend') setPendingTrend(null)
  }, [])

  const handleClearDrawings = useCallback(() => {
    setDrawings([])
    setPendingTrend(null)
  }, [])

  const handleJumpLive = useCallback(() => {
    chartRef.current?.timeScale().scrollToRealTime()
  }, [])

  /* ───── Render drawings to SVG ───── */
  const overlay = (() => {
    const chart = chartRef.current
    const candleSeries = candleSeriesRef.current
    const { width, height } = containerSizeRef.current
    if (!chart || !candleSeries || width === 0 || height === 0) return null

    const timeScale = chart.timeScale()
    const priceScale = chart.priceScale('right')
    const priceScaleWidth = priceScale.width()
    const paneRight = Math.max(0, width - priceScaleWidth)

    type RenderedDrawing =
      | { kind: 'h'; key: string; y: number; price: number }
      | { kind: 't'; key: string; x1: number; y1: number; x2: number; y2: number }

    const rendered: RenderedDrawing[] = []

    for (const d of drawings) {
      if (d.type === 'horizontal') {
        const y = candleSeries.priceToCoordinate(d.price)
        if (y === null) continue
        rendered.push({ kind: 'h', key: d.id, y, price: d.price })
      } else {
        const x1 = timeScale.timeToCoordinate(d.start.time as UTCTimestamp)
        const y1 = candleSeries.priceToCoordinate(d.start.price)
        const x2 = timeScale.timeToCoordinate(d.end.time as UTCTimestamp)
        const y2 = candleSeries.priceToCoordinate(d.end.price)
        if (x1 === null || y1 === null || x2 === null || y2 === null) continue
        rendered.push({ kind: 't', key: d.id, x1, y1, x2, y2 })
      }
    }

    let pendingMarker: { x: number; y: number } | null = null
    let previewLine: { x1: number; y1: number; x2: number; y2: number } | null = null
    if (pendingTrend) {
      const x = timeScale.timeToCoordinate(pendingTrend.time as UTCTimestamp)
      const y = candleSeries.priceToCoordinate(pendingTrend.price)
      if (x !== null && y !== null) pendingMarker = { x, y }
      if (pendingMarker && hoverPos) {
        const hx = timeScale.timeToCoordinate(hoverPos.time as UTCTimestamp)
        const hy = candleSeries.priceToCoordinate(hoverPos.price)
        if (hx !== null && hy !== null) {
          previewLine = { x1: pendingMarker.x, y1: pendingMarker.y, x2: hx, y2: hy }
        }
      }
    }

    let positionPnlMarker:
      | {
          y: number
          labelX: number
          labelY: number
          pnl: number
          label: string
          positive: boolean
        }
      | null = null
    if (selectedPositionExposure.hasPosition && last) {
      const y = candleSeries.priceToCoordinate(last.close)
      if (y !== null) {
        const labelWidth = 136
        const labelX = Math.max(8, paneRight - labelWidth - 8)
        const labelY = Math.min(Math.max(8, y - 14), Math.max(8, height - 30))
        positionPnlMarker = {
          y,
          labelX,
          labelY,
          pnl: selectedPositionExposure.pnl,
          label: selectedPositionExposure.label,
          positive: selectedPositionExposure.pnl >= 0,
        }
      }
    }

    return (
      <svg
        className="chart-drawing-overlay"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ pointerEvents: 'none' }}
      >
        {rendered.map((r) => {
          if (r.kind === 'h') {
            return (
              <g key={r.key}>
                <line
                  x1={0}
                  y1={r.y}
                  x2={paneRight}
                  y2={r.y}
                  className="drawing-line drawing-line--horizontal"
                />
                <rect
                  x={paneRight - 54}
                  y={r.y - 9}
                  width={50}
                  height={16}
                  rx={2}
                  className="drawing-label-bg"
                />
                <text
                  x={paneRight - 8}
                  y={r.y + 3}
                  textAnchor="end"
                  className="drawing-label-text"
                >
                  {r.price.toFixed(2)}
                </text>
              </g>
            )
          }
          return (
            <line
              key={r.key}
              x1={r.x1}
              y1={r.y1}
              x2={r.x2}
              y2={r.y2}
              className="drawing-line drawing-line--trend"
            />
          )
        })}
        {pendingMarker && (
          <circle
            cx={pendingMarker.x}
            cy={pendingMarker.y}
            r={4}
            className="drawing-anchor"
          />
        )}
        {previewLine && (
          <line
            x1={previewLine.x1}
            y1={previewLine.y1}
            x2={previewLine.x2}
            y2={previewLine.y2}
            className="drawing-line drawing-line--preview"
          />
        )}
        {positionPnlMarker && (
          <g className="option-pnl-marker">
            <line
              x1={0}
              y1={positionPnlMarker.y}
              x2={positionPnlMarker.labelX}
              y2={positionPnlMarker.y}
              className={
                positionPnlMarker.positive
                  ? 'option-pnl-marker__guide option-pnl-marker__guide--positive'
                  : 'option-pnl-marker__guide option-pnl-marker__guide--negative'
              }
            />
            <rect
              x={positionPnlMarker.labelX}
              y={positionPnlMarker.labelY}
              width={136}
              height={26}
              rx={3}
              className={
                positionPnlMarker.positive
                  ? 'option-pnl-marker__box option-pnl-marker__box--positive'
                  : 'option-pnl-marker__box option-pnl-marker__box--negative'
              }
            />
            <text
              x={positionPnlMarker.labelX + 8}
              y={positionPnlMarker.labelY + 16}
              className="option-pnl-marker__text"
            >
              {`${positionPnlMarker.positive ? '+' : '-'}$${Math.abs(positionPnlMarker.pnl).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
            </text>
            <text
              x={positionPnlMarker.labelX + 128}
              y={positionPnlMarker.labelY + 16}
              textAnchor="end"
              className="option-pnl-marker__contracts"
            >
              {positionPnlMarker.label}
            </text>
          </g>
        )}
      </svg>
    )
  })()

  // Re-trigger render whenever the chart pans/zooms/resizes
  void redrawTick

  if (!last) {
    return (
      <section className="chart-panel panel">
        <div className="chart-panel__header">
          <h2 className="chart-panel__ticker">{selectedSymbol}</h2>
        </div>
        <div className="chart-panel__canvas chart-panel__canvas--empty">
          <span className="muted">No chart data for {selectedSymbol}</span>
        </div>
      </section>
    )
  }

  return (
    <section className="chart-panel panel">
      <div className="chart-panel__header">
        <div className="chart-panel__symbol">
          <h2 className="chart-panel__ticker">{selectedSymbol}</h2>
          <span className="chart-panel__name">{selectedName}</span>
        </div>
        <div className="chart-panel__quote">
          <span className="chart-panel__price">{last.close.toFixed(2)}</span>
          <span className={`chart-panel__change ${positive ? 'positive' : 'negative'}`}>
            {positive ? '+' : ''}
            {dayChange.toFixed(2)} ({positive ? '+' : ''}
            {dayChangePct.toFixed(2)}%)
          </span>
        </div>
        <div className="chart-panel__stats">
          <div className="stat-pill">
            <span className="stat-pill__label">H</span>
            <span className="stat-pill__value">{high.toFixed(2)}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill__label">L</span>
            <span className="stat-pill__value">{low.toFixed(2)}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill__label">Vol</span>
            <span className="stat-pill__value">{(volume / 1e6).toFixed(1)}M</span>
          </div>
        </div>
      </div>

      <div className="chart-panel__toolbar">
        <div className="timeframe-tabs">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              className={`timeframe-tab ${tf === timeframe ? 'timeframe-tab--active' : ''}`}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="chart-tools">
          {TOOL_BUTTONS.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`chart-tool ${tool === b.id ? 'chart-tool--active' : ''}`}
              onClick={() => handleSelectTool(b.id)}
              title={b.label}
              aria-label={b.label}
            >
              <span className="chart-tool__icon" aria-hidden>{b.icon}</span>
              <span className="chart-tool__label">{b.label}</span>
            </button>
          ))}
          <button
            type="button"
            className="chart-tool chart-tool--danger"
            onClick={handleClearDrawings}
            title="Clear Drawings"
          >
            <span className="chart-tool__icon" aria-hidden>×</span>
            <span className="chart-tool__label">Clear</span>
          </button>
        </div>

        <div className="chart-indicators">
          <button
            type="button"
            className={`indicator-toggle ${showMA20 ? 'indicator-toggle--on' : ''}`}
            onClick={() => setShowMA20((v) => !v)}
            style={showMA20 ? { borderColor: MA20_COLOR, color: MA20_COLOR } : undefined}
          >
            MA 20
          </button>
          <button
            type="button"
            className={`indicator-toggle ${showMA50 ? 'indicator-toggle--on' : ''}`}
            onClick={() => setShowMA50((v) => !v)}
            style={showMA50 ? { borderColor: MA50_COLOR, color: MA50_COLOR } : undefined}
          >
            MA 50
          </button>
        </div>

        <button type="button" className="live-btn" onClick={handleJumpLive} title="Jump to latest candle">
          <span className="live-btn__dot" />
          Live
        </button>
      </div>

      <div className="chart-panel__canvas-wrap">
        <div className="chart-panel__canvas" ref={containerRef} />
        {overlay}
        {tool !== 'cursor' && (
          <div className="chart-tool-hint">
            {tool === 'horizontal' && 'Click anywhere on the chart to add a horizontal line'}
            {tool === 'trend' &&
              (pendingTrend ? 'Click again to set the trend line end point' : 'Click to set the trend line start point')}
          </div>
        )}
      </div>
    </section>
  )
}
