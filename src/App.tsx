import { MarketProvider } from './context/MarketContext'
import { PortfolioProvider } from './context/PortfolioContext'
import HeaderBar from './components/HeaderBar'
import Watchlist from './components/Watchlist'
import ChartPanel from './components/ChartPanel'
import NewsPanel from './components/NewsPanel'
import TradeTicket from './components/TradeTicket'
import AccountSummary from './components/AccountSummary'
import PositionsTable from './components/PositionsTable'
import OptionsChain from './components/OptionsChain'
import './App.css'

function App() {
  return (
    <MarketProvider>
      <PortfolioProvider>
        <div className="dashboard">
          <HeaderBar />

          <div className="dashboard__main">
            <Watchlist />

            <div className="dashboard__center">
              <ChartPanel />
            </div>

            <div className="dashboard__right">
              <NewsPanel />
              <TradeTicket />
            </div>
          </div>

          <div className="dashboard__bottom">
            <AccountSummary />
            <PositionsTable />
            <OptionsChain />
          </div>
        </div>
      </PortfolioProvider>
    </MarketProvider>
  )
}

export default App
