import React from 'react';
import { statsApi } from '../../api/stats';
import { useDateFilter } from '../../store/dateFilterStore';

interface DonutProps {
  forceAllTime?: boolean;
}

export const Donut: React.FC<DonutProps> = ({ forceAllTime = false }) => {
  const { selectedDate, selectedPreset, startDate, endDate } = useDateFilter();
  const { total, items, isDayView, periodLabel } = statsApi.getDonutData(
    selectedDate,
    selectedPreset,
    startDate,
    endDate,
    forceAllTime
  );
  const R = 72;
  const C = 2 * Math.PI * R; // ~452.39
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', padding: '6px 0' }}>
      <svg
        className="dsv"
        viewBox="0 0 200 200"
        width="205"
        height="205"
        role="img"
        aria-label={`Tadbirlar turlari: ${periodLabel}, jami ${total} ta`}
        style={{ flexShrink: 0 }}
      >
        <g fill="none" strokeWidth="26" transform="rotate(-90 100 100)">
          {total === 0 ? (
            <circle
              cx="100"
              cy="100"
              r={R}
              stroke="var(--line)"
              strokeWidth="26"
              opacity="0.35"
            />
          ) : (
            items.map((item, idx) => {
              if (item.count === 0) return null;
              const length = (item.count / total) * C;
              const currentOffset = offset;
              offset += length;
              return (
                <circle
                  key={idx}
                  className="seg"
                  cx="100"
                  cy="100"
                  r={R}
                  stroke={item.color}
                  strokeDasharray={`${length} ${C}`}
                  strokeDashoffset={-currentOffset}
                  style={{ transition: 'all 0.3s ease' }}
                >
                  <title>{`${item.name}: ${item.count} ta (${item.percent}%)`}</title>
                </circle>
              );
            })
          )}
        </g>
        <text className="dt1" x="100" y="98" textAnchor="middle" style={{ fontSize: '32px', fontWeight: 800 }}>
          {total}
        </text>
        <text className="lt" x="100" y="120" textAnchor="middle" style={{ fontSize: '13px', fill: 'var(--mut)' }}>
          {total === 0 ? 'tadbir yo‘q' : isDayView ? 'kunlik tadbir' : 'jami tadbir'}
        </text>
      </svg>

      <div style={{ flex: 1, minWidth: '170px' }}>
        {items.filter(item => item.count > 0).length === 0 ? (
          <div style={{ color: 'var(--mut)', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>
            Ushbu davrda tadbirlar rejalashtirilmagan
          </div>
        ) : (
          items.filter(item => item.count > 0).map((item, idx) => (
            <div className="lgi" key={idx} style={{ fontSize: '13px', marginBottom: '8px' }}>
              <i className="dot" style={{ background: item.color, width: '10px', height: '10px' }} />
              <span style={{ color: 'var(--tx)', fontWeight: 500 }}>{item.name}</span>
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="sm" style={{ fontSize: '12px', opacity: 0.75 }}>
                  {item.count} ta
                </span>
                <b style={{ fontWeight: 700, color: 'var(--tx)', minWidth: '38px', textAlign: 'right' }}>
                  {item.percent}%
                </b>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
