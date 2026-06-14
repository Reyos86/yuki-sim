export interface IndexTicker {
  symbol: string
  name: string
  value: number
  change: number
  changePct: number
}

export interface WatchlistItem {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  volume: string
}

export interface ChartPoint {
  /** Unix timestamp in seconds (UTC). */
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface NewsItem {
  id: string
  headline: string
  source: string
  time: string
  tag: 'breaking' | 'earnings' | 'macro' | 'sector'
  symbol?: string
}

export interface AccountData {
  buyingPower: number
  cashBalance: number
  portfolioValue: number
  dayPL: number
  dayPLPct: number
  totalPL: number
  totalPLPct: number
  marginUsed: number
  marginAvailable: number
}

export interface Position {
  symbol: string
  name: string
  type: 'stock' | 'option'
  qty: number
  avgCost: number
  last: number
  marketValue: number
  dayPL: number
  totalPL: number
  totalPLPct: number
}

export interface OptionContract {
  strike: number
  callBid: number
  callAsk: number
  callVol: number
  callOI: number
  putBid: number
  putAsk: number
  putVol: number
  putOI: number
  iv: number
}

export const MARKET_TIME = '10:42:18 AM ET'
export const MARKET_DATE = 'Fri, Jun 13, 2026'

export const indexTickers: IndexTicker[] = [
  { symbol: 'PNS', name: 'P&S 5000', value: 5021.37, change: 34.12, changePct: 0.68 },
  { symbol: 'TSQ', name: 'Tech Sector Index', value: 12847.92, change: -89.44, changePct: -0.69 },
  { symbol: 'VEX', name: 'Volatility Index', value: 18.24, change: 1.08, changePct: 6.29 },
]

export const watchlist: WatchlistItem[] = [
  { symbol: 'BSLA', name: 'Besla Motors', price: 287.42, change: 12.18, changePct: 4.43, volume: '42.8M' },
  { symbol: 'NVDA', name: 'Novidia Corp', price: 134.67, change: -2.31, changePct: -1.69, volume: '38.1M' },
  { symbol: 'AAPL', name: 'Appleton Inc', price: 198.34, change: 1.22, changePct: 0.62, volume: '28.4M' },
  { symbol: 'MSFT', name: 'Macrosoft', price: 421.89, change: 3.45, changePct: 0.82, volume: '15.2M' },
  { symbol: 'AMZN', name: 'Amazin', price: 187.56, change: -0.89, changePct: -0.47, volume: '22.7M' },
  { symbol: 'GOOG', name: 'Goggle', price: 176.23, change: 2.11, changePct: 1.21, volume: '11.9M' },
  { symbol: 'META', name: 'Metaphor', price: 512.08, change: 8.74, changePct: 1.74, volume: '9.8M' },
  { symbol: 'TSLA', name: 'Tessla', price: 245.91, change: -5.67, changePct: -2.25, volume: '31.5M' },
  { symbol: 'COIN', name: 'Coinbase Pro', price: 234.12, change: 18.44, changePct: 8.55, volume: '12.3M' },
  { symbol: 'AMD', name: 'Adv Micro', price: 156.78, change: 4.32, changePct: 2.84, volume: '19.6M' },
  { symbol: 'CLN', name: 'ColaNova', price: 58.14, change: 0.08, changePct: 0.14, volume: '4.2M' },
  { symbol: 'GMP', name: 'GamePop', price: 23.67, change: -1.84, changePct: -7.22, volume: '28.9M' },
  { symbol: 'HXN', name: 'Hexxon Energy', price: 112.45, change: 0.62, changePct: 0.55, volume: '8.1M' },
  { symbol: 'LMD', name: 'Lockmart Defense', price: 478.20, change: 1.85, changePct: 0.39, volume: '2.6M' },
  { symbol: 'SHPR', name: 'Shopper Mart', price: 164.30, change: -0.92, changePct: -0.56, volume: '5.7M' },
]

export const selectedSymbol = 'BSLA'
export const selectedName = 'Besla Motors'

export const newsItems: NewsItem[] = [
  {
    id: '1',
    headline: 'Besla unveils next-gen battery pack with 40% range boost',
    source: 'MarketWire',
    time: '10:38 AM',
    tag: 'breaking',
    symbol: 'BSLA',
  },
  {
    id: '2',
    headline: 'Fed minutes suggest rate hold through Q3; futures steady',
    source: 'EconPulse',
    time: '10:22 AM',
    tag: 'macro',
  },
  {
    id: '3',
    headline: 'Novidia beats Q1 estimates on data-center GPU demand',
    source: 'TechLedger',
    time: '09:54 AM',
    tag: 'earnings',
    symbol: 'NVDA',
  },
  {
    id: '4',
    headline: 'VEX spikes as traders hedge ahead of CPI release',
    source: 'VolTracker',
    time: '09:41 AM',
    tag: 'sector',
    symbol: 'VEX',
  },
  {
    id: '5',
    headline: 'Coinbase Pro volume surges on altcoin rally',
    source: 'CryptoDesk',
    time: '09:15 AM',
    tag: 'breaking',
    symbol: 'COIN',
  },
  {
    id: '6',
    headline: 'Semiconductor names lead TSQ lower on export concerns',
    source: 'SectorScan',
    time: '08:58 AM',
    tag: 'sector',
  },
]

export const account: AccountData = {
  buyingPower: 124580.42,
  cashBalance: 48230.18,
  portfolioValue: 287450.67,
  dayPL: 3842.19,
  dayPLPct: 1.35,
  totalPL: 42180.33,
  totalPLPct: 17.21,
  marginUsed: 12400.00,
  marginAvailable: 87600.00,
}

export const positions: Position[] = [
  {
    symbol: 'BSLA',
    name: 'Besla Motors',
    type: 'stock',
    qty: 150,
    avgCost: 248.30,
    last: 287.42,
    marketValue: 43113.00,
    dayPL: 1827.00,
    totalPL: 5868.00,
    totalPLPct: 15.75,
  },
  {
    symbol: 'NVDA',
    name: 'Novidia Corp',
    type: 'stock',
    qty: 80,
    avgCost: 118.50,
    last: 134.67,
    marketValue: 10773.60,
    dayPL: -184.80,
    totalPL: 1293.60,
    totalPLPct: 13.65,
  },
  {
    symbol: 'BSLA',
    name: 'Besla Jun27 300C',
    type: 'option',
    qty: 5,
    avgCost: 4.20,
    last: 6.85,
    marketValue: 3425.00,
    dayPL: 825.00,
    totalPL: 1325.00,
    totalPLPct: 63.10,
  },
  {
    symbol: 'COIN',
    name: 'Coinbase Pro',
    type: 'stock',
    qty: 40,
    avgCost: 198.00,
    last: 234.12,
    marketValue: 9364.80,
    dayPL: 737.60,
    totalPL: 1444.80,
    totalPLPct: 18.24,
  },
  {
    symbol: 'AMD',
    name: 'Adv Micro',
    type: 'stock',
    qty: 100,
    avgCost: 142.10,
    last: 156.78,
    marketValue: 15678.00,
    dayPL: 432.00,
    totalPL: 1468.00,
    totalPLPct: 10.33,
  },
]

export const optionsChain: OptionContract[] = [
  { strike: 270, callBid: 19.40, callAsk: 19.80, callVol: 842, callOI: 4210, putBid: 2.10, putAsk: 2.30, putVol: 312, putOI: 1890, iv: 42.1 },
  { strike: 275, callBid: 15.20, callAsk: 15.60, callVol: 1204, callOI: 5830, putBid: 3.40, putAsk: 3.60, putVol: 445, putOI: 2340, iv: 41.3 },
  { strike: 280, callBid: 11.50, callAsk: 11.90, callVol: 2108, callOI: 8920, putBid: 5.10, putAsk: 5.30, putVol: 678, putOI: 4120, iv: 40.8 },
  { strike: 285, callBid: 8.20, callAsk: 8.50, callVol: 3421, callOI: 12450, putBid: 7.80, putAsk: 8.10, putVol: 934, putOI: 6780, iv: 40.2 },
  { strike: 290, callBid: 5.60, callAsk: 5.90, callVol: 4892, callOI: 18230, putBid: 11.20, putAsk: 11.50, putVol: 1245, putOI: 9340, iv: 39.7 },
  { strike: 295, callBid: 3.40, callAsk: 3.70, callVol: 3210, callOI: 9840, putBid: 15.80, putAsk: 16.20, putVol: 567, putOI: 3210, iv: 39.4 },
  { strike: 300, callBid: 1.90, callAsk: 2.20, callVol: 2845, callOI: 14200, putBid: 20.40, putAsk: 20.80, putVol: 389, putOI: 4560, iv: 39.1 },
]

export const tradeTicketDefaults = {
  symbol: 'BSLA',
  side: 'buy' as 'buy' | 'sell',
  orderType: 'limit' as const,
  quantity: 10,
  limitPrice: 287.00,
  timeInForce: 'DAY',
}
