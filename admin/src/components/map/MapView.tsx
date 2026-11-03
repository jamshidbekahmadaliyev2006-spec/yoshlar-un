import React, { useState } from 'react';
import { LOCS, COL } from '../../utils/format';

interface MapViewProps {
  selectedPin?: number;
  onlyPin?: number;
  onSelectPin?: (pinIndex: number) => void;
  showZoomControls?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  selectedPin = -1,
  onlyPin,
  onSelectPin,
  showZoomControls = true
}) => {
  const [zoom, setZoom] = useState(1);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(2.5, Math.max(1, prev + delta * 0.5)));
  };

  const transform = `translate(150 110) scale(${zoom}) translate(-150 -110)`;

  return (
    <div className="mapw">
      <svg
        viewBox="0 0 300 220"
        preserveAspectRatio="xMidYMid slice"
        role="group"
        aria-label="Yunusobod tumani xaritasi"
        onClick={() => onSelectPin && onSelectPin(-1)}
        style={{ cursor: 'pointer' }}
      >
        <rect className="mb" width="300" height="220" />
        <g transform={transform}>
          <rect className="mpk" x="20" y="130" width="90" height="60" />
          <rect className="mpk" x="190" y="15" width="80" height="45" />
          <g className="mrd" strokeWidth="7" fill="none" strokeLinecap="round">
            <path d="M0 55L300 105M0 160L300 140M70 0L110 220M200 0L170 220M0 20L300 190" />
          </g>

          {LOCS.map((loc, i) => {
            if (onlyPin !== undefined && onlyPin !== i) return null;
            const isSelected = i === selectedPin;
            return (
              <g
                key={i}
                className="pn"
                aria-label={loc.n}
                tabIndex={0}
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectPin) onSelectPin(isSelected ? -1 : i);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onSelectPin) onSelectPin(isSelected ? -1 : i);
                  }
                }}
              >
                {isSelected && (
                  <circle
                    className="ping"
                    cx={loc.x}
                    cy={loc.y}
                    r="9"
                    fill="none"
                    stroke="#fde047"
                    strokeWidth="2"
                  />
                )}
                <circle
                  cx={loc.x}
                  cy={loc.y}
                  r={isSelected ? 11 : 8}
                  fill={COL[i % 6]}
                  stroke={isSelected ? '#fde047' : '#fff'}
                  strokeWidth="2.5"
                />
                <circle cx={loc.x} cy={loc.y} r="3" fill="#fff" />
              </g>
            );
          })}
        </g>
      </svg>

      {showZoomControls && (
        <div className="zb">
          <button
            className="ib"
            onClick={() => handleZoom(1)}
            aria-label="Kattalashtirish"
          >
            +
          </button>
          <button
            className="ib"
            onClick={() => handleZoom(-1)}
            aria-label="Kichraytirish"
          >
            −
          </button>
        </div>
      )}
    </div>
  );
};

