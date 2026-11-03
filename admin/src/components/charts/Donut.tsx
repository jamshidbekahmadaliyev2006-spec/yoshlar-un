import React from 'react';
import { statsApi } from '../../api/stats';
import { useDateFilter } from '../../store/dateFilterStore';

export const Donut: React.FC = () => {
  const { selectedDate } = useDateFilter();
  const { total, items } = statsApi.getDonutData(selectedDate);
  const C = 314.16;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg
        className="dsv"
        viewBox="0 0 140 140"
        width="150"
        height="150"
        role="img"
        aria-label={`Tadbirlar turlari, jami ${total} ta`}
      >
        <g fill="none" strokeWidth="20" transform="rotate(-90 70 70)">
          {items.map((item, idx) => {
            const length = (item.count / total) * C;
            const currentOffset = offset;
            offset += length;
            return (
              <circle
                key={idx}
                className="seg"
                cx="70"
                cy="70"
                r="50"
                stroke={item.color}
                strokeDasharray={`${length} ${C}`}
                strokeDashoffset={-currentOffset}
              >
                <title>{`${item.name}: ${item.count} ta`}</title>
              </circle>
            );
          })}
        </g>
        <text className="dt1" x="70" y="68" textAnchor="middle">
          {total}
        </text>
        <text className="lt" x="70" y="84" textAnchor="middle">
          jami tadbir
        </text>
      </svg>

      <div style={{ flex: 1, minWidth: '150px' }}>
        {items.map((item, idx) => (
          <div className="lgi" key={idx}>
            <i className="dot" style={{ background: item.color }} />
            {item.name}
            <b>{item.percent}%</b>
          </div>
        ))}
      </div>
    </div>
  );
};

