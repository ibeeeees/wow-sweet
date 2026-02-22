// ============================================================
// SweetReturns — GoldenCityPage: 3-column layout
// ============================================================

import { Suspense, lazy, useState } from 'react';
import { useStore } from '../store/useStore';
import { WhaleLeaderboard } from '../components/WhaleLeaderboard';
import { AgentLeaderboard } from '../components/AgentLeaderboard';
import NewsInjector from '../components/NewsInjector';

// Lazy-load heavy 3D components
const CandyCity = lazy(() => import('../components/CandyCity'));
const TimeSlider = lazy(() => import('../components/TimeSlider'));
const SectorFilter = lazy(() => import('../components/SectorFilter'));
const StoreDetail = lazy(() => import('../components/StoreDetail'));
const FuturePredictions = lazy(() => import('../components/FuturePredictions'));

const FONT = `'Leckerli One', cursive`;

export default function GoldenCityPage() {
  const selectedStock = useStore((s) => s.selectedStock);
  const [rightTab, setRightTab] = useState<'news' | 'predictions'>('news');

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      fontFamily: FONT,
      background: '#0a0a1e',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Leckerli+One&display=swap');
        .sweet-scroll::-webkit-scrollbar { width: 4px; }
        .sweet-scroll::-webkit-scrollbar-track { background: rgba(106,0,170,0.07); border-radius: 4px; }
        .sweet-scroll::-webkit-scrollbar-thumb { background: rgba(106,0,170,0.3); border-radius: 4px; }
      `}</style>

      {/* ── FULL-PAGE 3D city ── */}
      <Suspense fallback={null}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <CandyCity />
        </div>
      </Suspense>

      {/* Sector filter — top left (above left panel) */}
      <Suspense fallback={null}>
        <div style={{ position: 'absolute', top: 12, left: 236, zIndex: 10 }}>
          <SectorFilter />
        </div>
      </Suspense>

      {/* Time slider — bottom center */}
      <Suspense fallback={null}>
        <div style={{
          position: 'absolute', bottom: 0,
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 10,
        }}>
          <TimeSlider />
        </div>
      </Suspense>

      {/* Store detail */}
      {selectedStock !== null && (
        <Suspense fallback={null}>
          <StoreDetail />
        </Suspense>
      )}

      {/* ── LEFT COLUMN (overlay) ── */}
      <div style={{
        position: 'absolute',
        top: 8,
        left: 8,
        width: 220,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 20,
      }}>
        {/* Top 5 Agents box */}
        <div style={{
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.72)',
          border: '1.5px solid rgba(106,0,170,0.13)',
          borderRadius: 16,
          boxShadow: '0 2px 16px rgba(106,0,170,0.08)',
          backdropFilter: 'blur(6px)',
        }}>
          <AgentLeaderboard />
        </div>
        {/* Whale Arena box */}
        <div style={{
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.72)',
          border: '1.5px solid rgba(106,0,170,0.13)',
          borderRadius: 16,
          boxShadow: '0 2px 16px rgba(106,0,170,0.08)',
          backdropFilter: 'blur(6px)',
        }}>
          <WhaleLeaderboard />
        </div>
      </div>

      {/* ── RIGHT PANEL: Tabbed News / Predictions (overlay) ── */}
      <div style={{
        position: 'absolute',
        top: 8, right: 8, bottom: 8,
        width: 300,
        background: 'rgba(255,255,255,0.72)',
        border: '1.5px solid rgba(106,0,170,0.13)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(106,0,170,0.08)',
        zIndex: 20,
        backdropFilter: 'blur(6px)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Tab buttons */}
        <div style={{
          display: 'flex', flexShrink: 0,
          borderBottom: '1.5px solid rgba(106,0,170,0.13)',
        }}>
          {([
            { key: 'news' as const, label: 'News Injector' },
            { key: 'predictions' as const, label: 'Predictions' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setRightTab(tab.key)}
              style={{
                flex: 1, padding: '10px 0',
                background: rightTab === tab.key ? 'rgba(106,0,170,0.08)' : 'transparent',
                color: rightTab === tab.key ? '#4b0082' : '#7a4800',
                border: 'none',
                borderBottom: rightTab === tab.key ? '2px solid #6a00aa' : '2px solid transparent',
                fontFamily: FONT,
                fontSize: 11, fontWeight: rightTab === tab.key ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.18s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Tab content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Suspense fallback={null}>
            {rightTab === 'news' ? <NewsInjector /> : <FuturePredictions />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
