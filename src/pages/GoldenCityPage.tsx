// ============================================================
// SweetReturns — GoldenCityPage: full-page 3D background + floating panels
// ============================================================

import { Suspense, lazy } from 'react';
import { useStore } from '../store/useStore';
import { WhaleLeaderboard } from '../components/WhaleLeaderboard';
import { AgentLeaderboard } from '../components/AgentLeaderboard';
import NewsInjector from '../components/NewsInjector';

// Lazy-load heavy 3D components
const CandyCity = lazy(() => import('../components/CandyCity'));
const TimeSlider = lazy(() => import('../components/TimeSlider'));
const SectorFilter = lazy(() => import('../components/SectorFilter'));
const StoreDetail = lazy(() => import('../components/StoreDetail'));

const FONT = `'Leckerli One', cursive`;

const PANEL_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.84)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1.5px solid rgba(106,0,170,0.15)',
  borderRadius: 18,
  overflow: 'hidden',
  boxShadow: '0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(106,0,170,0.10)',
};

export default function GoldenCityPage() {
  const selectedStock = useStore((s) => s.selectedStock);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      fontFamily: FONT,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Leckerli+One&display=swap');
        .sweet-scroll::-webkit-scrollbar { width: 4px; }
        .sweet-scroll::-webkit-scrollbar-track { background: rgba(106,0,170,0.07); border-radius: 4px; }
        .sweet-scroll::-webkit-scrollbar-thumb { background: rgba(106,0,170,0.3); border-radius: 4px; }
      `}</style>

      {/* ── FULL-PAGE 3D CITY BACKGROUND ── */}
      <Suspense fallback={<div style={{ position: 'absolute', inset: 0, background: '#0a0a1e' }} />}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <CandyCity />
        </div>
      </Suspense>

      {/* ── TOP 5 AGENTS — top-left, fixed height to fit 5 rows ── */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        width: 300,
        height: 312,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        ...PANEL_STYLE,
      }}>
        <AgentLeaderboard />
      </div>

      {/* ── WHALE ARENA — below agents, auto height ── */}
      <div style={{
        position: 'absolute',
        top: 334,
        left: 10,
        width: 300,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        ...PANEL_STYLE,
      }}>
        <WhaleLeaderboard />
      </div>

      {/* ── RIGHT PANEL: News Injector — full height ── */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        bottom: 10,
        width: 310,
        zIndex: 10,
        ...PANEL_STYLE,
      }}>
        <NewsInjector />
      </div>

      {/* ── SECTOR FILTER — top-center ── */}
      <Suspense fallback={null}>
        <div style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
        }}>
          <SectorFilter />
        </div>
      </Suspense>

      {/* ── TIME SLIDER — bottom-center ── */}
      <Suspense fallback={null}>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
        }}>
          <TimeSlider />
        </div>
      </Suspense>

      {/* ── STORE DETAIL (when a stock is selected) ── */}
      {selectedStock !== null && (
        <Suspense fallback={null}>
          <StoreDetail />
        </Suspense>
      )}
    </div>
  );
}
