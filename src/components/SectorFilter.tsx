// ============================================================
// SweetReturns — Sector Filter Dropdown
// Collapsible dropdown listing all 11 sectors with colored indicators
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { SECTORS } from '../data/stockData';

export const SectorFilter: React.FC = () => {
  const selectedSector = useStore((s) => s.selectedSector);
  const selectSector = useStore((s) => s.selectSector);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const activeSector = SECTORS.find((s) => s.name === selectedSector);

  return (
    <div ref={containerRef} style={{ position: 'relative', zIndex: 900 }}>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          borderRadius: 8,
          border: '1px solid rgba(255, 105, 180, 0.3)',
          background: 'rgba(26, 26, 46, 0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#FF69B4',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          letterSpacing: 0.5,
          transition: 'all 0.15s',
          boxShadow: open ? '0 0 12px rgba(255,105,180,0.2)' : 'none',
        }}
      >
        {activeSector ? (
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: activeSector.color, flexShrink: 0,
          }} />
        ) : (
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF69B4, #FFD700, #9370DB)', flexShrink: 0,
          }} />
        )}
        {selectedSector || 'Sectors'}
        <span style={{
          fontSize: 10,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          display: 'inline-block',
        }}>
          {'\u25BC'}
        </span>
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div style={dropdownStyle}>
          {/* All Sectors button */}
          <button
            style={{
              ...itemStyle,
              borderColor: selectedSector === null ? '#FF69B4' : 'rgba(255,255,255,0.08)',
              background: selectedSector === null ? 'rgba(255,105,180,0.12)' : 'transparent',
            }}
            onClick={() => { selectSector(null); setOpen(false); }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF69B4, #FFD700, #9370DB)', flexShrink: 0,
            }} />
            <div style={sectorNameStyle}>All Sectors</div>
          </button>

          {/* Individual sectors */}
          {SECTORS.map((sector) => {
            const isActive = selectedSector === sector.name;
            return (
              <button
                key={sector.name}
                style={{
                  ...itemStyle,
                  borderColor: isActive ? sector.color : 'rgba(255,255,255,0.08)',
                  background: isActive ? `${sector.color}18` : 'transparent',
                }}
                onClick={() => { selectSector(sector.name); setOpen(false); }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: sector.color, flexShrink: 0,
                  boxShadow: isActive ? `0 0 6px ${sector.color}` : 'none',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={sectorNameStyle}>{sector.name}</div>
                  <div style={districtNameStyle}>{sector.district}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --------------- Styles ---------------

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: 4,
  width: 220,
  maxHeight: 420,
  overflowY: 'auto',
  background: 'rgba(26, 26, 46, 0.95)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 105, 180, 0.2)',
  borderRadius: 10,
  padding: '6px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.08)',
  cursor: 'pointer',
  background: 'transparent',
  textAlign: 'left',
  transition: 'all 0.15s ease',
  width: '100%',
};

const sectorNameStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#eee',
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const districtNameStyle: React.CSSProperties = {
  fontSize: 9,
  color: '#999',
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export default SectorFilter;
