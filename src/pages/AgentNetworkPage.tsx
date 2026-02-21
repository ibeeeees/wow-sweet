// ============================================================
// SweetReturns — Agent Network Page
// Shows agents as a network graph with cross-portfolio impact
// ============================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { SECTORS } from '../data/stockData';

const PAGE_BG = '#1a1a2e';
const ACCENT = '#FFD700';

interface NetworkNode {
  id: string;
  name: string;
  type: 'whale' | 'agent';
  color: string;
  profit: number;
  positions: { ticker: string; action: string; weight: number }[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface NetworkLink {
  source: string;
  target: string;
  sharedTickers: string[];
  weight: number;
}

interface ShockState {
  active: boolean;
  sourceId: string | null;
  affected: Map<string, { intensity: number; timestamp: number }>;
}

function sectorColor(sector: string): string {
  return SECTORS.find(s => s.name === sector)?.color ?? '#888';
}

const NetworkCanvas: React.FC<{
  nodes: NetworkNode[];
  links: NetworkLink[];
  shock: ShockState;
  onNodeClick: (node: NetworkNode) => void;
  selectedNode: string | null;
}> = ({ nodes, links, shock, onNodeClick, selectedNode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(new Map());
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize positions
    const posMap = posRef.current;
    nodes.forEach((n, i) => {
      if (!posMap.has(n.id)) {
        const angle = (i / nodes.length) * Math.PI * 2;
        const r = 180 + Math.random() * 80;
        posMap.set(n.id, {
          x: canvas.width / 2 + Math.cos(angle) * r,
          y: canvas.height / 2 + Math.sin(angle) * r,
          vx: 0, vy: 0,
        });
      }
    });

    const linkMap = new Map<string, NetworkLink[]>();
    links.forEach(l => {
      if (!linkMap.has(l.source)) linkMap.set(l.source, []);
      if (!linkMap.has(l.target)) linkMap.set(l.target, []);
      linkMap.get(l.source)!.push(l);
      linkMap.get(l.target)!.push(l);
    });

    function simulate() {
      if (!ctx || !canvas) return;
      const W = canvas.width;
      const H = canvas.height;

      // Force simulation
      const positions = Array.from(posMap.entries());

      // Center gravity
      positions.forEach(([, p]) => {
        p.vx += (W / 2 - p.x) * 0.001;
        p.vy += (H / 2 - p.y) * 0.001;
      });

      // Repulsion between nodes
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const [, a] = positions[i];
          const [, b] = positions[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 800 / (dist * dist);
          a.vx += (dx / dist) * force;
          a.vy += (dy / dist) * force;
          b.vx -= (dx / dist) * force;
          b.vy -= (dy / dist) * force;
        }
      }

      // Link attraction
      links.forEach(link => {
        const a = posMap.get(link.source);
        const b = posMap.get(link.target);
        if (!a || !b) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 120) * 0.003 * link.weight;
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
        b.vx -= (dx / dist) * force;
        b.vy -= (dy / dist) * force;
      });

      // Shock shaking
      const now = Date.now();
      if (shock.active) {
        shock.affected.forEach((info, nodeId) => {
          const p = posMap.get(nodeId);
          if (!p) return;
          const elapsed = now - info.timestamp;
          if (elapsed < 3000) {
            const fade = 1 - elapsed / 3000;
            const shake = info.intensity * fade * 8;
            p.vx += (Math.random() - 0.5) * shake;
            p.vy += (Math.random() - 0.5) * shake;
          }
        });
      }

      // Apply velocities
      positions.forEach(([, p]) => {
        p.vx *= 0.85;
        p.vy *= 0.85;
        p.x += p.vx;
        p.y += p.vy;
        p.x = Math.max(30, Math.min(W - 30, p.x));
        p.y = Math.max(30, Math.min(H - 30, p.y));
      });

      // Draw
      ctx.clearRect(0, 0, W, H);

      // Draw links
      links.forEach(link => {
        const a = posMap.get(link.source);
        const b = posMap.get(link.target);
        if (!a || !b) return;

        const isSelected = selectedNode === link.source || selectedNode === link.target;
        const isShocked = shock.active && (shock.affected.has(link.source) || shock.affected.has(link.target));

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isShocked
          ? `rgba(255, 69, 0, ${0.3 + link.weight * 0.5})`
          : isSelected
            ? `rgba(255, 215, 0, ${0.4 + link.weight * 0.4})`
            : `rgba(255, 255, 255, ${0.05 + link.weight * 0.15})`;
        ctx.lineWidth = isShocked ? 2 + link.weight * 3 : isSelected ? 1.5 : 0.5 + link.weight;
        ctx.stroke();

        // Shared ticker label
        if (isSelected && link.sharedTickers.length > 0) {
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          ctx.font = '8px monospace';
          ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
          ctx.textAlign = 'center';
          ctx.fillText(link.sharedTickers.slice(0, 3).join(', '), mx, my - 4);
        }
      });

      // Draw shock ripple rings
      if (shock.active && shock.sourceId) {
        const sourcePos = posMap.get(shock.sourceId);
        if (sourcePos) {
          const elapsed = now - (shock.affected.get(shock.sourceId)?.timestamp || now);
          for (let ring = 0; ring < 3; ring++) {
            const ringElapsed = elapsed - ring * 400;
            if (ringElapsed > 0 && ringElapsed < 2000) {
              const progress = ringElapsed / 2000;
              const r = progress * 200;
              ctx.beginPath();
              ctx.arc(sourcePos.x, sourcePos.y, r, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(255, 69, 0, ${(1 - progress) * 0.3})`;
              ctx.lineWidth = 2 * (1 - progress);
              ctx.stroke();
            }
          }
        }
      }

      // Draw nodes
      nodes.forEach(node => {
        const p = posMap.get(node.id);
        if (!p) return;

        const isSelected = selectedNode === node.id;
        const isShocked = shock.active && shock.affected.has(node.id);
        const shockInfo = shock.affected.get(node.id);
        let shockScale = 1;
        if (isShocked && shockInfo) {
          const elapsed = now - shockInfo.timestamp;
          const fade = Math.max(0, 1 - elapsed / 3000);
          shockScale = 1 + fade * shockInfo.intensity * 0.5 * Math.sin(elapsed * 0.02);
        }

        const r = node.radius * shockScale;

        // Glow
        if (isSelected || isShocked) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 8, 0, Math.PI * 2);
          const glow = ctx.createRadialGradient(p.x, p.y, r, p.x, p.y, r + 8);
          glow.addColorStop(0, isShocked ? 'rgba(255, 69, 0, 0.4)' : 'rgba(255, 215, 0, 0.4)');
          glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#FFD700' : isShocked ? '#FF4500' : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // Label
        ctx.font = node.type === 'whale' ? 'bold 10px monospace' : '9px monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, p.x, p.y + r + 14);

        // Profit
        ctx.font = '8px monospace';
        ctx.fillStyle = node.profit >= 0 ? '#00FF7F' : '#FF4500';
        ctx.fillText(
          `${node.profit >= 0 ? '+' : ''}$${Math.abs(node.profit) >= 1000 ? (node.profit / 1000).toFixed(0) + 'K' : node.profit.toFixed(0)}`,
          p.x, p.y + r + 24
        );
      });

      animRef.current = requestAnimationFrame(simulate);
    }

    simulate();
    return () => cancelAnimationFrame(animRef.current);
  }, [nodes, links, shock, selectedNode]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const node of nodes) {
      const p = posRef.current.get(node.id);
      if (!p) continue;
      const dx = mx - p.x;
      const dy = my - p.y;
      if (dx * dx + dy * dy < (node.radius + 5) ** 2) {
        onNodeClick(node);
        return;
      }
    }
    onNodeClick(null as any);
  }, [nodes, onNodeClick]);

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={600}
      onClick={handleClick}
      style={{ width: '100%', height: '100%', cursor: 'pointer' }}
    />
  );
};

export default function AgentNetworkPage() {
  const stocks = useStore(s => s.stocks);
  const leaderboard = useStore(s => s.agentLeaderboard);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [shock, setShock] = useState<ShockState>({ active: false, sourceId: null, affected: new Map() });

  // Build network from leaderboard + whale data
  const { nodes, links } = useMemo(() => {
    const actions = ['BUY', 'CALL', 'PUT', 'SHORT'];
    const whaleNodes: NetworkNode[] = [
      { id: 'wonka', name: 'Wonka Fund', type: 'whale', color: '#FFD700', profit: 42000, positions: [], x: 0, y: 0, vx: 0, vy: 0, radius: 18 },
      { id: 'bear', name: 'Bear Fund', type: 'whale', color: '#FF4500', profit: -8000, positions: [], x: 0, y: 0, vx: 0, vy: 0, radius: 15 },
      { id: 'bull', name: 'Bull Fund', type: 'whale', color: '#00FF7F', profit: 31000, positions: [], x: 0, y: 0, vx: 0, vy: 0, radius: 16 },
      { id: 'void', name: 'Void Fund', type: 'whale', color: '#9370DB', profit: 5000, positions: [], x: 0, y: 0, vx: 0, vy: 0, radius: 14 },
    ];

    // Give whales positions from top stocks
    const topStocks = stocks.slice(0, 30);
    whaleNodes.forEach((whale, wi) => {
      const slice = topStocks.slice(wi * 6, wi * 6 + 8);
      whale.positions = slice.map(s => ({
        ticker: s.ticker,
        action: actions[Math.floor(Math.random() * actions.length)],
        weight: 0.1 + Math.random() * 0.3,
      }));
    });

    // Agent nodes from leaderboard top 10
    const agentNodes: NetworkNode[] = leaderboard.slice(0, 10).map(agent => ({
      id: agent.id,
      name: agent.name,
      type: 'agent' as const,
      color: sectorColor(stocks[Math.floor(Math.random() * Math.min(stocks.length, 11))]?.sector || 'Technology'),
      profit: agent.profit,
      positions: (agent.trades || []).slice(0, 5).map(t => ({
        ticker: t.ticker,
        action: t.action,
        weight: 0.1 + Math.random() * 0.2,
      })),
      x: 0, y: 0, vx: 0, vy: 0,
      radius: 8 + Math.min(agent.profit / 10000, 6),
    }));

    const allNodes = [...whaleNodes, ...agentNodes];

    // Compute links from shared positions
    const networkLinks: NetworkLink[] = [];
    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        const a = allNodes[i];
        const b = allNodes[j];
        const aTickers = new Set(a.positions.map(p => p.ticker));
        const shared = b.positions.filter(p => aTickers.has(p.ticker)).map(p => p.ticker);
        if (shared.length > 0) {
          networkLinks.push({
            source: a.id,
            target: b.id,
            sharedTickers: shared,
            weight: shared.length / Math.max(a.positions.length, b.positions.length, 1),
          });
        }
      }
    }

    return { nodes: allNodes, links: networkLinks };
  }, [stocks, leaderboard]);

  const handleShock = useCallback((nodeId: string) => {
    const now = Date.now();
    const affected = new Map<string, { intensity: number; timestamp: number }>();
    affected.set(nodeId, { intensity: 1.0, timestamp: now });

    // BFS propagation
    const visited = new Set([nodeId]);
    let frontier = [nodeId];
    let depth = 1;

    while (frontier.length > 0 && depth <= 3) {
      const nextFrontier: string[] = [];
      for (const nid of frontier) {
        links.forEach(link => {
          const neighbor = link.source === nid ? link.target : link.target === nid ? link.source : null;
          if (neighbor && !visited.has(neighbor)) {
            visited.add(neighbor);
            nextFrontier.push(neighbor);
            affected.set(neighbor, {
              intensity: link.weight * (1 / depth),
              timestamp: now + depth * 300,
            });
          }
        });
      }
      frontier = nextFrontier;
      depth++;
    }

    setShock({ active: true, sourceId: nodeId, affected });
    setTimeout(() => setShock({ active: false, sourceId: null, affected: new Map() }), 4000);
  }, [links]);

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <div style={{ width: '100%', height: '100%', background: PAGE_BG, display: 'flex' }}>
      {/* Left Panel */}
      <div style={{
        width: 260, borderRight: '1px solid rgba(255,215,0,0.15)',
        padding: 16, overflowY: 'auto', flexShrink: 0,
      }}>
        <h2 style={{ fontSize: 16, color: ACCENT, margin: '0 0 12px', fontFamily: 'monospace' }}>
          Agent Network
        </h2>
        <p style={{ fontSize: 11, color: '#999', lineHeight: 1.4, marginBottom: 16 }}>
          Nodes are whale funds and top agents. Edges show shared portfolio positions.
          Click a node to highlight connections. Double-click to simulate a trade shock.
        </p>

        <div style={{ fontSize: 10, color: '#888', marginBottom: 8, fontWeight: 700 }}>NODES</div>
        {nodes.map(n => (
          <button
            key={n.id}
            onClick={() => setSelectedNode(selectedNode === n.id ? null : n.id)}
            onDoubleClick={() => handleShock(n.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 8px', marginBottom: 2, width: '100%',
              background: selectedNode === n.id ? 'rgba(255,215,0,0.1)' : 'transparent',
              border: '1px solid ' + (selectedNode === n.id ? '#FFD70044' : 'transparent'),
              borderRadius: 4, cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#ddd', flex: 1 }}>{n.name}</span>
            <span style={{ fontSize: 9, color: n.profit >= 0 ? '#00FF7F' : '#FF4500', fontWeight: 600 }}>
              {n.profit >= 0 ? '+' : ''}{(n.profit / 1000).toFixed(0)}K
            </span>
          </button>
        ))}

        {/* Selected node details */}
        {selectedNodeData && (
          <div style={{
            marginTop: 16, padding: 10,
            background: 'rgba(255,215,0,0.05)',
            borderRadius: 8, border: '1px solid rgba(255,215,0,0.15)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: selectedNodeData.color, marginBottom: 6 }}>
              {selectedNodeData.name}
            </div>
            <div style={{ fontSize: 9, color: '#999', marginBottom: 6 }}>
              Portfolio ({selectedNodeData.positions.length} positions)
            </div>
            {selectedNodeData.positions.map((pos, i) => (
              <div key={i} style={{ fontSize: 9, color: '#ccc', padding: '1px 0' }}>
                <span style={{
                  color: pos.action === 'BUY' || pos.action === 'CALL' ? '#00FF7F' : '#FF4500',
                  fontWeight: 600, width: 38, display: 'inline-block',
                }}>{pos.action}</span>
                {pos.ticker} <span style={{ color: '#666' }}>({(pos.weight * 100).toFixed(0)}%)</span>
              </div>
            ))}
            <button
              onClick={() => handleShock(selectedNodeData.id)}
              style={{
                marginTop: 8, padding: '4px 12px', width: '100%',
                background: 'rgba(255,69,0,0.15)', border: '1px solid rgba(255,69,0,0.3)',
                borderRadius: 4, color: '#FF4500', fontSize: 10, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Simulate Trade Shock
            </button>
          </div>
        )}
      </div>

      {/* Graph Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <NetworkCanvas
          nodes={nodes}
          links={links}
          shock={shock}
          onNodeClick={(n) => setSelectedNode(n ? n.id : null)}
          selectedNode={selectedNode}
        />
      </div>
    </div>
  );
}
