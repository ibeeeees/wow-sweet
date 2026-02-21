// ============================================================
// SweetReturns — AgentReactionsPage: Real simulation data
//   Whale leaderboard, agent heatmap, store pressure, decision stream
// ============================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateStockData, loadPipelineData, SECTORS } from '../data/stockData';
import { getWhales, type WhaleFund } from '../services/whaleArena';
import { getFeaturedAgents, getLatestChain, type FeaturedAgent, type ReasoningChain } from '../services/geminiService';
import type { StockData } from '../types';

const PAGE_BG = '#1a1a2e';
const PANEL_BG = '#0f0f23';
const ACCENT = '#FFD700';
const TEXT_COLOR = '#e0e0e0';
const BORDER_COLOR = '#2a2a4a';

// ---- Color scale: intensity from count ----
function pressureColor(count: number, maxCount: number): string {
  if (maxCount === 0) return '#1e1e3a';
  const t = Math.min(count / maxCount, 1);
  const r = Math.round(30 + t * 225);
  const g = Math.round(30 + t * 60);
  const b = Math.round(60 - t * 30);
  return `rgb(${r},${g},${b})`;
}

// ============================================================
// Whale + Agent Leaderboard (left column)
// ============================================================
const Leaderboard: React.FC<{
  whales: WhaleFund[];
  featuredAgents: FeaturedAgent[];
}> = ({ whales, featuredAgents }) => {
  const sorted = [...whales].sort((a, b) => b.totalProfit - a.totalProfit);
  const activeAgents = featuredAgents.filter(
    (a) => a.decision && Date.now() - a.lastUpdated < 30000,
  );

  return (
    <div
      style={{
        background: PANEL_BG,
        borderRadius: 8,
        padding: 12,
        height: '100%',
        overflowY: 'auto',
        border: `1px solid ${BORDER_COLOR}`,
      }}
    >
      {/* Whale Rankings */}
      <h3
        style={{
          color: ACCENT,
          fontSize: 13,
          margin: '0 0 10px',
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        Whale Arena
      </h3>
      {sorted.map((whale, rank) => (
        <div
          key={whale.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 4px',
            borderBottom: `1px solid ${BORDER_COLOR}`,
            fontSize: 12,
          }}
        >
          <span
            style={{
              color: rank === 0 ? ACCENT : rank === 1 ? '#C0C0C0' : '#666',
              fontWeight: rank < 2 ? 700 : 400,
              minWidth: 20,
              textAlign: 'right',
              fontSize: 12,
            }}
          >
            #{rank + 1}
          </span>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: whale.color,
              boxShadow: `0 0 6px ${whale.color}66`,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: whale.color,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {whale.icon} {whale.name}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
              {whale.strategy} | {whale.allocations.length} pos | {whale.tradeCount} trades
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'monospace',
                color: whale.totalProfit >= 0 ? '#00FF7F' : '#FF4500',
              }}
            >
              {whale.totalProfit >= 0 ? '+' : ''}
              {whale.totalProfit.toFixed(0)}
            </div>
          </div>
        </div>
      ))}

      {/* Wonka reasoning */}
      {sorted[0]?.reasoning && (
        <div
          style={{
            marginTop: 8,
            padding: '6px 8px',
            background: 'rgba(255, 215, 0, 0.06)',
            borderRadius: 6,
            border: '1px solid rgba(255, 215, 0, 0.1)',
          }}
        >
          <div style={{ fontSize: 9, color: '#FFD700', fontWeight: 600, marginBottom: 2 }}>
            AI REASONING
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>
            {sorted[0].reasoning}
          </div>
        </div>
      )}

      {/* Featured AI Agents */}
      {activeAgents.length > 0 && (
        <>
          <h3
            style={{
              color: '#00BFFF',
              fontSize: 11,
              margin: '14px 0 8px',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Featured AI Agents
          </h3>
          {activeAgents.slice(0, 10).map((agent) => (
            <div
              key={agent.index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 4px',
                borderBottom: `1px solid ${BORDER_COLOR}`,
                fontSize: 11,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: ACCENT, fontSize: 10 }}>
                  {agent.name}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    color:
                      agent.decision?.action === 'BUY' || agent.decision?.action === 'CALL'
                        ? '#00FF7F'
                        : '#FF4500',
                    fontWeight: 600,
                    fontSize: 10,
                  }}
                >
                  {agent.decision?.action}
                </span>
                <span style={{ color: '#888', fontSize: 9, marginLeft: 4 }}>
                  {agent.decision?.targetTicker}
                </span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

// ============================================================
// Agent Heatmap (center, canvas-based) — real store counts
// ============================================================
const AgentHeatmap: React.FC<{
  stocks: StockData[];
  storeAgentCounts: Int16Array;
  storeDoorCounts: Int16Array;
}> = ({ stocks, storeAgentCounts, storeDoorCounts }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || stocks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = Math.ceil(Math.sqrt(stocks.length));
    const rows = Math.ceil(stocks.length / cols);
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    // Find max for normalization
    let maxCount = 1;
    for (let i = 0; i < stocks.length; i++) {
      const total =
        (i < storeAgentCounts.length ? storeAgentCounts[i] : 0) +
        (i < storeDoorCounts.length ? storeDoorCounts[i] : 0);
      if (total > maxCount) maxCount = total;
    }

    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stocks.forEach((stock, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const inside = i < storeAgentCounts.length ? storeAgentCounts[i] : 0;
      const door = i < storeDoorCounts.length ? storeDoorCounts[i] : 0;
      const count = inside + door;
      const t = Math.min(count / maxCount, 1);

      const sc = SECTORS.find((s) => s.name === stock.sector)?.color ?? '#444';
      const r = parseInt(sc.slice(1, 3), 16) || 80;
      const g = parseInt(sc.slice(3, 5), 16) || 80;
      const b = parseInt(sc.slice(5, 7), 16) || 80;

      const hr = Math.round(r + (255 - r) * t);
      const hg = Math.round(g * (1 - t * 0.5) + 100 * t);
      const hb = Math.round(b * (1 - t * 0.7));

      ctx.fillStyle = `rgb(${hr},${hg},${hb})`;
      ctx.fillRect(col * cellW + 0.5, row * cellH + 0.5, cellW - 1, cellH - 1);

      if (cellW > 16 && cellH > 10) {
        ctx.fillStyle = t > 0.5 ? '#000' : '#aaa';
        ctx.font = `${Math.min(cellW * 0.35, 9)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stock.ticker, col * cellW + cellW / 2, row * cellH + cellH / 2);
      }
    });
  }, [stocks, storeAgentCounts, storeDoorCounts]);

  return (
    <div
      style={{
        background: PANEL_BG,
        borderRadius: 8,
        padding: 12,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${BORDER_COLOR}`,
      }}
    >
      <h3
        style={{
          color: ACCENT,
          fontSize: 13,
          margin: '0 0 10px',
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        Agent Heatmap (Live)
      </h3>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{ width: '100%', flex: 1, borderRadius: 4, imageRendering: 'pixelated' }}
      />
    </div>
  );
};

// ============================================================
// Store Pressure Map (right column) — real counts
// ============================================================
const StorePressureMap: React.FC<{
  stocks: StockData[];
  storeAgentCounts: Int16Array;
  storeDoorCounts: Int16Array;
  storeLaneCounts: Int16Array;
}> = ({ stocks, storeAgentCounts, storeDoorCounts, storeLaneCounts }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const maxCount = useMemo(() => {
    let max = 1;
    for (let i = 0; i < stocks.length; i++) {
      const total =
        (i < storeAgentCounts.length ? storeAgentCounts[i] : 0) +
        (i < storeDoorCounts.length ? storeDoorCounts[i] : 0);
      if (total > max) max = total;
    }
    return max;
  }, [stocks, storeAgentCounts, storeDoorCounts]);

  const breakdown = useMemo(() => {
    if (selectedIdx === null || selectedIdx >= stocks.length) return null;
    const inside = selectedIdx < storeAgentCounts.length ? storeAgentCounts[selectedIdx] : 0;
    const door = selectedIdx < storeDoorCounts.length ? storeDoorCounts[selectedIdx] : 0;
    const hasLanes = storeLaneCounts.length > selectedIdx * 4 + 3;
    return {
      ticker: stocks[selectedIdx].ticker,
      inside,
      door,
      total: inside + door,
      lanes: {
        BUY: hasLanes ? storeLaneCounts[selectedIdx * 4] : 0,
        CALL: hasLanes ? storeLaneCounts[selectedIdx * 4 + 1] : 0,
        PUT: hasLanes ? storeLaneCounts[selectedIdx * 4 + 2] : 0,
        SHORT: hasLanes ? storeLaneCounts[selectedIdx * 4 + 3] : 0,
      },
    };
  }, [selectedIdx, stocks, storeAgentCounts, storeDoorCounts, storeLaneCounts]);

  const laneColors: Record<string, string> = {
    BUY: '#00ff7f',
    CALL: '#00bfff',
    PUT: '#ff8c00',
    SHORT: '#ff4444',
  };

  return (
    <div
      style={{
        background: PANEL_BG,
        borderRadius: 8,
        padding: 12,
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${BORDER_COLOR}`,
      }}
    >
      <h3
        style={{
          color: ACCENT,
          fontSize: 13,
          margin: '0 0 10px',
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        Store Pressure (Live)
      </h3>

      {breakdown && (
        <div
          style={{
            padding: 8,
            marginBottom: 10,
            background: '#1e1e3a',
            borderRadius: 6,
            border: `1px solid ${ACCENT}44`,
            fontSize: 12,
          }}
        >
          <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 4 }}>
            {breakdown.ticker} — {breakdown.total} agents
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FF69B4', fontSize: 11 }}>
            <span>Door fighting</span>
            <span style={{ fontFamily: 'monospace' }}>{breakdown.door}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00FF7F', fontSize: 11 }}>
            <span>Inside</span>
            <span style={{ fontFamily: 'monospace' }}>{breakdown.inside}</span>
          </div>
          <div style={{ height: 1, background: BORDER_COLOR, margin: '4px 0' }} />
          {Object.entries(breakdown.lanes).map(([lane, count]) => (
            <div
              key={lane}
              style={{ display: 'flex', justifyContent: 'space-between', color: laneColors[lane] || '#bbb', fontSize: 10 }}
            >
              <span>{lane}</span>
              <span style={{ fontFamily: 'monospace' }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
          gap: 2,
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {stocks.map((stock, i) => {
          const inside = i < storeAgentCounts.length ? storeAgentCounts[i] : 0;
          const door = i < storeDoorCounts.length ? storeDoorCounts[i] : 0;
          const count = inside + door;
          const isSelected = selectedIdx === i;
          return (
            <div
              key={stock.ticker}
              onClick={() => setSelectedIdx(isSelected ? null : i)}
              style={{
                background: pressureColor(count, maxCount),
                borderRadius: 3,
                padding: '3px 2px',
                textAlign: 'center',
                fontSize: 8,
                fontFamily: 'monospace',
                color: count > maxCount * 0.5 ? '#fff' : '#aaa',
                cursor: 'pointer',
                border: isSelected ? `2px solid ${ACCENT}` : '2px solid transparent',
                transition: 'border-color 0.15s',
                lineHeight: 1.3,
              }}
              title={`${stock.ticker}: ${count} agents (${inside} inside, ${door} door)`}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 7,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {stock.ticker}
              </div>
              <div style={{ fontSize: 9, color: ACCENT }}>{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// Decision Stream (bottom bar) — real Gemini reasoning chain
// ============================================================
interface StreamEntry {
  id: string;
  timestamp: string;
  source: string;
  ticker: string;
  action: string;
  detail: string;
  color: string;
}

const DecisionStream: React.FC<{
  whales: WhaleFund[];
  chain: ReasoningChain | null;
  featuredAgents: FeaturedAgent[];
}> = ({ whales, chain, featuredAgents }) => {
  const entries = useMemo(() => {
    const result: StreamEntry[] = [];
    const now = new Date();

    // Whale allocation entries
    for (const whale of whales) {
      if (whale.allocations.length === 0) continue;
      for (const alloc of whale.allocations.slice(0, 3)) {
        result.push({
          id: `${whale.id}-${alloc.ticker}`,
          timestamp: new Date(whale.lastUpdated || now.getTime()).toLocaleTimeString(),
          source: `${whale.icon} ${whale.name}`,
          ticker: alloc.ticker,
          action: alloc.action,
          detail: `Weight: ${(alloc.weight * 100).toFixed(0)}%`,
          color: whale.color,
        });
      }
    }

    // Featured agent decisions
    for (const agent of featuredAgents) {
      if (!agent.decision || Date.now() - agent.lastUpdated > 30000) continue;
      result.push({
        id: `agent-${agent.index}`,
        timestamp: new Date(agent.lastUpdated).toLocaleTimeString(),
        source: agent.name,
        ticker: agent.decision.targetTicker,
        action: agent.decision.action,
        detail: agent.decision.reasoning,
        color: '#FFD700',
      });
    }

    // Sector reports from reasoning chain
    if (chain) {
      for (const report of chain.sectorReports) {
        for (const pick of report.topPicks.slice(0, 1)) {
          result.push({
            id: `sector-${report.sector}-${pick.ticker}`,
            timestamp: new Date(chain.timestamp).toLocaleTimeString(),
            source: `${report.sector} Analyst`,
            ticker: pick.ticker,
            action: pick.action,
            detail: pick.reason,
            color:
              report.sectorSentiment === 'bullish'
                ? '#00FF7F'
                : report.sectorSentiment === 'bearish'
                  ? '#FF4500'
                  : '#808080',
          });
        }
      }
    }

    return result;
  }, [whales, chain, featuredAgents]);

  const actionColor = (action: string): string => {
    switch (action) {
      case 'BUY': return '#00ff7f';
      case 'CALL': return '#00bfff';
      case 'SHORT': return '#ff4444';
      case 'PUT': return '#ff8c00';
      default: return TEXT_COLOR;
    }
  };

  return (
    <div
      style={{
        background: PANEL_BG,
        borderRadius: 8,
        padding: '8px 12px',
        overflowX: 'auto',
        overflowY: 'hidden',
        display: 'flex',
        gap: 12,
        border: `1px solid ${BORDER_COLOR}`,
        whiteSpace: 'nowrap',
      }}
    >
      <h3
        style={{
          color: ACCENT,
          fontSize: 11,
          letterSpacing: 1,
          textTransform: 'uppercase',
          writingMode: 'vertical-lr',
          margin: 0,
          padding: '0 4px 0 0',
          flexShrink: 0,
        }}
      >
        Live Decisions
      </h3>
      {entries.length === 0 && (
        <div style={{ color: '#666', fontSize: 11, padding: '8px 0' }}>
          Waiting for AI decisions...
        </div>
      )}
      {entries.map((entry) => (
        <div
          key={entry.id}
          style={{
            flexShrink: 0,
            padding: '6px 10px',
            background: '#1e1e3a',
            borderRadius: 6,
            border: `1px solid ${BORDER_COLOR}`,
            fontSize: 11,
            minWidth: 180,
            borderLeft: `3px solid ${entry.color}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: '#888', fontSize: 10 }}>{entry.timestamp}</span>
            <span style={{ color: actionColor(entry.action), fontWeight: 700 }}>{entry.action}</span>
          </div>
          <div style={{ marginTop: 2 }}>
            <span style={{ color: entry.color, fontSize: 10 }}>{entry.source}</span>
            <span style={{ color: '#555' }}> &rarr; </span>
            <span style={{ color: ACCENT }}>{entry.ticker}</span>
          </div>
          <div style={{ color: '#666', fontSize: 10, marginTop: 2 }}>{entry.detail}</div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// Main Page
// ============================================================
export default function AgentReactionsPage() {
  const stocks = useStore((s) => s.stocks);
  const setStocks = useStore((s) => s.setStocks);
  const storeAgentCounts = useStore((s) => s.storeAgentCounts);
  const storeDoorCounts = useStore((s) => s.storeDoorCounts);
  const storeLaneCounts = useStore((s) => s.storeLaneCounts);

  const [whales, setWhales] = useState<WhaleFund[]>(getWhales());
  const [featuredAgents, setFeaturedAgents] = useState<FeaturedAgent[]>(getFeaturedAgents());
  const [chain, setChain] = useState<ReasoningChain | null>(getLatestChain());

  // Initialize stocks if empty
  useEffect(() => {
    if (stocks.length === 0) {
      loadPipelineData()
        .then(({ stocks: s }) => setStocks(s))
        .catch(() => setStocks(generateStockData()));
    }
  }, [stocks.length, setStocks]);

  // Poll real data from services
  useEffect(() => {
    const interval = setInterval(() => {
      setWhales([...getWhales()]);
      setFeaturedAgents([...getFeaturedAgents()]);
      setChain(getLatestChain());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (stocks.length === 0) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: PAGE_BG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: ACCENT,
          fontFamily: 'monospace',
          fontSize: 16,
        }}
      >
        Loading agent data...
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: PAGE_BG,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        color: TEXT_COLOR,
        overflow: 'hidden',
      }}
    >
      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', gap: 8, padding: '12px 12px 0 12px', minHeight: 0 }}>
        {/* Left column (20%) — Whale + Agent Leaderboard */}
        <div style={{ width: '20%', minWidth: 180 }}>
          <Leaderboard whales={whales} featuredAgents={featuredAgents} />
        </div>

        {/* Center (50%) — Agent Heatmap */}
        <div style={{ width: '50%', minWidth: 300 }}>
          <AgentHeatmap
            stocks={stocks}
            storeAgentCounts={storeAgentCounts}
            storeDoorCounts={storeDoorCounts}
          />
        </div>

        {/* Right (30%) — Store Pressure Map */}
        <div style={{ width: '30%', minWidth: 200 }}>
          <StorePressureMap
            stocks={stocks}
            storeAgentCounts={storeAgentCounts}
            storeDoorCounts={storeDoorCounts}
            storeLaneCounts={storeLaneCounts}
          />
        </div>
      </div>

      {/* Bottom — Decision Stream */}
      <div style={{ padding: '8px 12px 12px 12px', flexShrink: 0, maxHeight: 130 }}>
        <DecisionStream whales={whales} chain={chain} featuredAgents={featuredAgents} />
      </div>
    </div>
  );
}
