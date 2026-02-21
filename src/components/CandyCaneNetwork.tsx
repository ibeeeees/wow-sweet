// ============================================================
// CandyCaneNetwork — Interlocked candy cane pairs connecting
// correlated stocks in the 3D city.  Each connection is two
// candy canes whose J-hooks thread through each other in
// perpendicular planes, with classic helical red/white stripes.
// ============================================================

import React, { useMemo, useRef } from 'react';
import {
  CatmullRomCurve3,
  Vector3,
  TubeGeometry,
  Color,
  Group,
  Float32BufferAttribute,
} from 'three';
import { useStore } from '../store/useStore.ts';
import type { StockData, GraphEdge } from '../types/index.ts';

/* ---------- constants ---------- */

const MAX_EDGES = 200;
const TUBE_SEG = 48;         // segments along the tube length
const RAD_SEG = 8;           // segments around the circumference
const STRIPE_CYCLES = 8;     // helical stripe revolutions along length
const HOOK_ANGLE = Math.PI * 0.8;  // 144-degree J-hook
const HOOK_STEPS = 12;       // smoothness of the hook arc

/* ---------- types ---------- */

interface ArcData {
  edge: GraphEdge;
  source: StockData;
  target: StockData;
  absWeight: number;
}

interface InterlockEntry {
  geoA: TubeGeometry;
  geoB: TubeGeometry;
  key: string;
  edge: GraphEdge;
}

/* ---------- helpers ---------- */

/** Two mutually-perpendicular unit vectors orthogonal to `dir`. */
function perps(dir: Vector3): [Vector3, Vector3] {
  const ref = Math.abs(dir.y) < 0.99
    ? new Vector3(0, 1, 0)
    : new Vector3(1, 0, 0);
  const p = new Vector3().crossVectors(dir, ref).normalize();
  const q = new Vector3().crossVectors(dir, p).normalize();
  return [p, q];
}

/**
 * Build the control points for one candy cane:
 *   straight shaft from `from` → `hookOrigin`,
 *   then a J-hook curling toward `hookAxis`.
 */
function canePoints(
  from: Vector3,
  hookOrigin: Vector3,
  along: Vector3,
  hookAxis: Vector3,
  hookR: number,
): Vector3[] {
  const pts: Vector3[] = [];

  // Straight shaft (6 evenly-spaced points)
  for (let i = 0; i <= 5; i++) {
    pts.push(new Vector3().lerpVectors(from, hookOrigin, i / 5));
  }

  // J-hook arc
  for (let i = 1; i <= HOOK_STEPS; i++) {
    const a = (i / HOOK_STEPS) * HOOK_ANGLE;
    const pt = hookOrigin
      .clone()
      .addScaledVector(hookAxis, Math.sin(a) * hookR)
      .addScaledVector(along, (1 - Math.cos(a)) * hookR);
    pts.push(pt);
  }

  return pts;
}

/**
 * Paint helical candy-cane stripes onto a TubeGeometry
 * by writing per-vertex colours into a `color` attribute.
 */
function paintStripes(
  geo: TubeGeometry,
  c1: Color,
  c2: Color,
) {
  const count = geo.attributes.position.count;
  const buf = new Float32Array(count * 3);

  for (let i = 0; i <= TUBE_SEG; i++) {
    const t = i / TUBE_SEG; // 0 → 1 along the length
    for (let j = 0; j <= RAD_SEG; j++) {
      const angle = (j / RAD_SEG) * Math.PI * 2;
      // helical stripe: combine length progress with circumferential angle
      const v = Math.sin(t * Math.PI * STRIPE_CYCLES + angle);
      const c = v > 0 ? c1 : c2;
      const idx = (i * (RAD_SEG + 1) + j) * 3;
      buf[idx]     = c.r;
      buf[idx + 1] = c.g;
      buf[idx + 2] = c.b;
    }
  }

  geo.setAttribute('color', new Float32BufferAttribute(buf, 3));
}

/* ---------- component ---------- */

function CandyCaneNetworkInner() {
  const stocks = useStore((s) => s.stocks);
  const correlationEdges = useStore((s) => s.correlationEdges);
  const showCorrelations = useStore((s) => s.showCorrelations);
  const selectedStock = useStore((s) => s.selectedStock);
  const groupRef = useRef<Group>(null);

  // Ticker → StockData lookup
  const stockMap = useMemo(() => {
    const m = new Map<string, StockData>();
    for (const s of stocks) m.set(s.ticker, s);
    return m;
  }, [stocks]);

  // Strongest |weight| edges
  const topEdges = useMemo<ArcData[]>(() => {
    const sorted = [...correlationEdges]
      .map((e) => ({ edge: e, absWeight: Math.abs(e.weight) }))
      .sort((a, b) => b.absWeight - a.absWeight)
      .slice(0, MAX_EDGES);

    const out: ArcData[] = [];
    for (const { edge, absWeight } of sorted) {
      const src = stockMap.get(edge.source);
      const tgt = stockMap.get(edge.target);
      if (src && tgt) out.push({ edge, source: src, target: tgt, absWeight });
    }
    return out;
  }, [correlationEdges, stockMap]);

  // Pre-compute interlocked candy-cane geometry pairs
  const entries = useMemo<InterlockEntry[]>(() => {
    return topEdges.map(({ edge, source, target, absWeight }) => {
      const sPos = new Vector3(
        source.city_position.x,
        source.city_position.y,
        source.city_position.z,
      );
      const tPos = new Vector3(
        target.city_position.x,
        target.city_position.y,
        target.city_position.z,
      );

      const dir = new Vector3().subVectors(tPos, sPos);
      const dist = dir.length();
      dir.normalize();

      const [pA, pB] = perps(dir);

      const hookR = Math.max(0.35, Math.min(dist * 0.1, 2.0));
      const tubeR = Math.max(0.03, absWeight * 0.065);

      // Midpoint with a small vertical lift so canes arc above ground
      const mid = new Vector3().addVectors(sPos, tPos).multiplyScalar(0.5);
      mid.y += hookR * 0.3;

      // Hook origins slightly offset from midpoint along the connection axis
      const hookA = mid.clone().addScaledVector(dir, -hookR * 0.35);
      const hookB = mid.clone().addScaledVector(dir, hookR * 0.35);

      // Cane A hooks in pA plane, cane B hooks in pB plane
      // (perpendicular planes → visually interlocked)
      const curveA = new CatmullRomCurve3(
        canePoints(sPos, hookA, dir, pA, hookR),
      );
      const curveB = new CatmullRomCurve3(
        canePoints(tPos, hookB, dir.clone().negate(), pB, hookR),
      );

      const geoA = new TubeGeometry(curveA, TUBE_SEG, tubeR, RAD_SEG, false);
      const geoB = new TubeGeometry(curveB, TUBE_SEG, tubeR, RAD_SEG, false);

      // Stripe colour: classic red for positive correlation, green for negative
      const stripeA = (edge.weight >= 0
        ? new Color(0xcc0000)
        : new Color(0x22aa44)
      ).lerp(new Color(source.brand_color), 0.25);

      const stripeB = (edge.weight >= 0
        ? new Color(0xcc0000)
        : new Color(0x22aa44)
      ).lerp(new Color(target.brand_color), 0.25);

      const white = new Color(0xffffff);
      paintStripes(geoA, stripeA, white);
      paintStripes(geoB, stripeB, white);

      return { geoA, geoB, key: `${edge.source}-${edge.target}`, edge };
    });
  }, [topEdges]);

  if (!showCorrelations || entries.length === 0) return null;

  return (
    <group ref={groupRef}>
      {entries.map(({ geoA, geoB, key, edge }) => {
        let opacity = 1.0;
        if (selectedStock) {
          const hit =
            edge.source === selectedStock.ticker ||
            edge.target === selectedStock.ticker;
          opacity = hit ? 1.0 : 0.1;
        }

        return (
          <group key={key}>
            <mesh geometry={geoA}>
              <meshStandardMaterial
                vertexColors
                transparent
                opacity={opacity}
                roughness={0.35}
                metalness={0.15}
              />
            </mesh>
            <mesh geometry={geoB}>
              <meshStandardMaterial
                vertexColors
                transparent
                opacity={opacity}
                roughness={0.35}
                metalness={0.15}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export const CandyCaneNetwork = React.memo(CandyCaneNetworkInner);
