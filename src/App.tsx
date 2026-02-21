import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useStore } from './store/useStore';
import { generateStockData, getCorrelationEdges, loadPipelineData, modulateStocksByTime } from './data/stockData';
import type { PageName } from './types';

const GoldenCityPage = lazy(() => import('./pages/GoldenCityPage'));
const StockNetworkPage = lazy(() => import('./pages/StockNetworkPage'));
const AgentReactionsPage = lazy(() => import('./pages/AgentReactionsPage'));
const GraphPlaygroundPage = lazy(() => import('./pages/GraphPlaygroundPage'));

const NAV_ITEMS: { path: string; label: string; icon: string; page: PageName }[] = [
  { path: '/', label: 'City', icon: '\u{1F3D9}', page: 'city' },
  { path: '/network', label: 'Stock Network', icon: '\u{1F4CA}', page: 'network' },
  { path: '/agents', label: 'Agent Reactions', icon: '\u{1F916}', page: 'agents' },
  { path: '/playground', label: 'Playground', icon: '\u{1F3AE}', page: 'playground' },
];

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1a1a2e', color: '#FFD700',
      fontSize: 24, fontFamily: 'system-ui',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{'\u{1F36C}'}</div>
        <div>Loading Golden City...</div>
      </div>
    </div>
  );
}

function NavBar() {
  const setCurrentPage = useStore((s) => s.setCurrentPage);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 48, zIndex: 1000,
      background: 'rgba(16, 12, 30, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 215, 0, 0.15)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 4,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        fontWeight: 700, fontSize: 16, color: '#FFD700',
        marginRight: 24, letterSpacing: '0.5px',
      }}>
        {'\u{1F36B}'} Wolf of Wall Sweet
      </div>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          onClick={() => setCurrentPage(item.page)}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            textDecoration: 'none', fontSize: 13, fontWeight: 500,
            color: isActive ? '#FFD700' : 'rgba(255,255,255,0.6)',
            background: isActive ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
            transition: 'all 0.2s',
          })}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{
        fontSize: 11, color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.5px',
      }}>
        HACKLYTICS 2026
      </div>
    </nav>
  );
}

export default function App() {
  const setStocks = useStore((s) => s.setStocks);
  const setBaseStocks = useStore((s) => s.setBaseStocks);
  const setModulatedBiases = useStore((s) => s.setModulatedBiases);
  const setCorrelationEdges = useStore((s) => s.setCorrelationEdges);
  const setAgentLeaderboard = useStore((s) => s.setAgentLeaderboard);
  const baseStocks = useStore((s) => s.baseStocks);
  const timeSlider = useStore((s) => s.timeSlider);

  useEffect(() => {
    async function init() {
      let stocks;
      let edges;
      try {
        // Load real pipeline data
        const pipeline = await loadPipelineData();
        stocks = pipeline.stocks;
        edges = pipeline.edges;
        console.log(`[SweetReturns] Loaded ${stocks.length} stocks from pipeline data`);
      } catch {
        // Fallback to synthetic data
        console.warn('[SweetReturns] Pipeline data unavailable, using synthetic data');
        stocks = generateStockData();
        edges = getCorrelationEdges(stocks, 0.5);
      }
      setStocks(stocks);
      setBaseStocks(stocks);
      setCorrelationEdges(edges);
      const leaders = Array.from({ length: 100 }, (_, i) => ({
        id: `agent_${Math.floor(Math.random() * 99999)}`,
        name: `Agent_${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        profit: Math.floor(50000 - i * 400 + Math.random() * 200),
        rank: i + 1,
      }));
      setAgentLeaderboard(leaders);
    }
    init();
  }, [setStocks, setBaseStocks, setCorrelationEdges, setAgentLeaderboard]);

  // Time modulation: update biases when date/mode changes (without re-initializing simulation)
  useEffect(() => {
    if (baseStocks.length === 0) return;
    const modulated = modulateStocksByTime(baseStocks, timeSlider.currentDate, timeSlider.mode);
    setModulatedBiases(modulated.map((s) => s.direction_bias));
  }, [baseStocks, timeSlider.currentDate, timeSlider.mode, setModulatedBiases]);

  return (
    <BrowserRouter>
      <div style={{
        width: '100vw', height: '100vh',
        background: '#1a1a2e', color: '#fff',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <NavBar />
        <div style={{ paddingTop: 48, width: '100%', height: 'calc(100vh - 48px)' }}>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<GoldenCityPage />} />
              <Route path="/network" element={<StockNetworkPage />} />
              <Route path="/agents" element={<AgentReactionsPage />} />
              <Route path="/playground" element={<GraphPlaygroundPage />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </BrowserRouter>
  );
}
