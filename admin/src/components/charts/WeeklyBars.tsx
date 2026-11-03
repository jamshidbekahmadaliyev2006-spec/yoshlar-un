import React from 'react';
import { statsApi } from '../../api/stats';
import { nf } from '../../utils/format';
import { useDateFilter } from '../../store/dateFilterStore';

export const WeeklyBars: React.FC = () => {
  const { selectedDate } = useDateFilter();
  const { data, percent } = statsApi.getWeeklyBars(selectedDate);

  const maxVal = Math.max(...data.map(x => x.r), 1);
  const st = Math.ceil(maxVal / 4 / 500) * 500;
  const mx = st * 4;
  const getY = (v: number) => 200 - (v / mx) * 186;

  const gridLines = [0, 1, 2, 3, 4].map(k => {
    const y = getY(k * st);
    return (
      <g key={k}>
        <path className="gl" d={`M50 ${y}H540`} />
        <text className="lt" x="44" y={y + 4} text-anchor="end">
          {nf(k * st)}
        </text>
      </g>
    );
  });

  return (
    <div>
      <svg
        viewBox="0 0 560 232"
        width="100%"
        role="img"
        aria-label="Haftalar bo‘yicha ro‘yxatdan o‘tganlar va haqiqatda kelganlar soni"
      >
        {gridLines}
        {data.map((x, i) => {
          const cx = 50 + i * 122.5 + 61;
          const p = x.r ? Math.round((x.c / x.r) * 100) : 0;
          return (
            <g key={i}>
              <rect
                className="vb"
                style={{ animationDelay: `${i * 0.12}s` }}
                x={cx - 40}
                y={getY(x.r)}
                width="36"
                height={200 - getY(x.r)}
                rx="4"
                fill="#8b5cf6"
              >
                <title>{`${x.l}: ${nf(x.r)} kishi ro‘yxatdan o‘tgan`}</title>
              </rect>
              <rect
                className="vb"
                style={{ animationDelay: `${i * 0.12 + 0.06}s` }}
                x={cx + 4}
                y={getY(x.c)}
                width="36"
                height={200 - getY(x.c)}
                rx="4"
                fill="#22c9a0"
              >
                <title>{`${x.l}: ${nf(x.c)} kishi kelgan`}</title>
              </rect>
              <text
                className="lt"
                x={cx}
                y={getY(x.r) - 6}
                textAnchor="middle"
                style={{ fontWeight: 600, fill: 'var(--tx)' }}
              >
                {p}%
              </text>
              <text className="lt" x={cx} y="220" textAnchor="middle">
                {x.l}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="sm" style={{ marginTop: '6px' }}>
        Oxirgi 4 hafta: ro‘yxatdan o‘tganlarning <b>{percent}%</b> i haqiqatda kelgan. Ustun ustidagi foiz — shu haftadagi kelish ko‘rsatkichi.
      </div>
    </div>
  );
};

