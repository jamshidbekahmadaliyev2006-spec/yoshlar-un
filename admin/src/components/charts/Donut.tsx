import React from 'react';
import { statsApi } from '../../api/stats';
import { useDateFilter } from '../../store/dateFilterStore';

export const Donut: React.FC = () => {
  const { selectedDate } = useDateFilter();
  const { total, items } = statsApi.getDonutData(selectedDate);
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
        aria-label={`Tadbirlar turlari, jami ${total} ta`}
        style={{ flexShrink: 0 }}
      >
        <g fill="none" strokeWidth="26" transform="rotate(-90 100 100)">
          {items.map((item, idx) => {
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
              >
                <title>{`${item.name}: ${item.count} ta (${item.percent}%)`}</title>
              </circle>
            );
          })}
        </g>
        <text className="dt1" x="100" y="98" textAnchor="middle" style={{ fontSize: '32px', fontWeight: 800 }}>
          {total}
        </text>
        <text className="lt" x="100" y="120" textAnchor="middle" style={{ fontSize: '13px', fill: 'var(--mut)' }}>
          jami tadbir
        </text>
      </svg>

      <div style={{ flex: 1, minWidth: '170px' }}>
        {items.map((item, idx) => (
          <div className="lgi" key={idx} style={{ fontSize: '13px', marginBottom: '10px' }}>
            <i className="dot" style={{ background: item.color, width: '10px', height: '10px' }} />
            <span style={{ color: 'var(--tx)', fontWeight: 500 }}>{item.name}</span>
            <b style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--tx)' }}>{item.percent}%</b>
          </div>
        ))}
      </div>
    </div>
  );
};
