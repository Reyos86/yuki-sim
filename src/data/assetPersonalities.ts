export type Sector =
  | 'broad'
  | 'tech'
  | 'auto'
  | 'ev'
  | 'consumer'
  | 'consumer-defensive'
  | 'retail'
  | 'crypto'
  | 'semiconductor'
  | 'gaming'
  | 'mega-cap'
  | 'energy'
  | 'defense'

export interface AssetPersonality {
  symbol: string
  name: string
  sector: Sector
  volatility: number
  marketSensitivity: number
  sectorSensitivity: number
  newsSensitivity: number
}

export const assetPersonalities: AssetPersonality[] = [
  { symbol: 'BSLA', name: 'Besla Motors', sector: 'ev', volatility: 0.85, marketSensitivity: 1.15, sectorSensitivity: 0.9, newsSensitivity: 0.95 },
  { symbol: 'NVDA', name: 'Nvidiotron', sector: 'semiconductor', volatility: 0.55, marketSensitivity: 1.0, sectorSensitivity: 1.2, newsSensitivity: 0.7 },
  { symbol: 'AAPL', name: 'Appleton Inc', sector: 'mega-cap', volatility: 0.22, marketSensitivity: 0.85, sectorSensitivity: 0.75, newsSensitivity: 0.35 },
  { symbol: 'MSFT', name: 'Macrosoft', sector: 'tech', volatility: 0.2, marketSensitivity: 0.8, sectorSensitivity: 0.85, newsSensitivity: 0.3 },
  { symbol: 'AMZN', name: 'Amazin', sector: 'tech', volatility: 0.28, marketSensitivity: 0.9, sectorSensitivity: 0.8, newsSensitivity: 0.4 },
  { symbol: 'GOOG', name: 'Goggle', sector: 'tech', volatility: 0.25, marketSensitivity: 0.85, sectorSensitivity: 0.8, newsSensitivity: 0.35 },
  { symbol: 'META', name: 'Metaphor', sector: 'tech', volatility: 0.35, marketSensitivity: 0.95, sectorSensitivity: 0.9, newsSensitivity: 0.5 },
  { symbol: 'TSLA', name: 'Tessla', sector: 'ev', volatility: 0.75, marketSensitivity: 1.1, sectorSensitivity: 0.85, newsSensitivity: 0.8 },
  { symbol: 'COIN', name: 'Coinbase Pro', sector: 'crypto', volatility: 0.7, marketSensitivity: 0.6, sectorSensitivity: 0.5, newsSensitivity: 0.85 },
  { symbol: 'AMD', name: 'Adv Micro', sector: 'semiconductor', volatility: 0.5, marketSensitivity: 1.0, sectorSensitivity: 1.15, newsSensitivity: 0.55 },
  { symbol: 'CLN', name: 'ColaNova', sector: 'consumer-defensive', volatility: 0.12, marketSensitivity: 0.45, sectorSensitivity: 0.35, newsSensitivity: 0.15 },
  { symbol: 'GMP', name: 'GamePop', sector: 'gaming', volatility: 0.95, marketSensitivity: 0.75, sectorSensitivity: 1.1, newsSensitivity: 0.9 },
  { symbol: 'HXN', name: 'Hexxon Energy', sector: 'energy', volatility: 0.45, marketSensitivity: 0.65, sectorSensitivity: 1.3, newsSensitivity: 0.7 },
  { symbol: 'LMD', name: 'Lockmart Defense', sector: 'defense', volatility: 0.3, marketSensitivity: 0.55, sectorSensitivity: 1.2, newsSensitivity: 0.75 },
  { symbol: 'SHPR', name: 'Shopper Mart', sector: 'retail', volatility: 0.25, marketSensitivity: 0.85, sectorSensitivity: 1.0, newsSensitivity: 0.5 },
]

export const personalityBySymbol = Object.fromEntries(
  assetPersonalities.map((a) => [a.symbol, a]),
) as Record<string, AssetPersonality>
