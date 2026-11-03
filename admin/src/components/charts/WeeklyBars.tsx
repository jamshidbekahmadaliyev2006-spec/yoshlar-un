import React from 'react';
import { statsApi } from '../../api/stats';
import { nf } from '../../utils/format';
import { useDateFilter } from '../../store/dateFilterStore';

export const WeeklyBars: React.FC = () => {
  const { selectedDate } = useDateFilter();
  const { data, totalRegistered } = statsApi.getWeeklyBars(selectedDate);

  const maxVal = Math.max(...data.map(x => x.r), 1);
  const st = Math.ceil(maxVal / 4 / 500) * 500;
  const mx = st * 4;
  const getY = (v: number) => 200 - (v / mx) * 186;

  const gridLines = [0, 1, 2, 3, 4].map(k => {
    const y = getY(k * st);
    return (
      <g key={k}>
        <path className="gl" d={`M50 ${y}H540`} />
        <text className="lt" x="44" y={y + 4} textAnchor="end">
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
        aria-label="Haftalar bo‘yicha ro‘yxatdan o‘tgan yoshlar soni"
      >
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bar-top, #4f8bf9)" />
            <stop offset="100%" stopColor="var(--bar-bot, #2563eb)" />
          </linearGradient>
        </defs>
        {gridLines}
        {data.map((x, i) => {
          const cx = 50 + i * 122.5 + 61;
          const barWidth = 46;
          const barHeight = Math.max(4, 200 - getY(x.r));
          return (
            <g key={i}>
              <rect
                className="vb"
                style={{ animationDelay: `${i * 0.12}s` }}
                x={cx - barWidth / 2}
                y={getY(x.r)}
                width={barWidth}
                height={barHeight}
                rx="6"
                fill="url(#barGrad)"
              >
                <title>{`${x.l}: ${nf(x.r)} nafar yoshlar ro‘yxatdan o‘tgan`}</title>
              </rect>
              <text
                className="lt"
                x={cx}
                y={getY(x.r) - 8}
                textAnchor="middle"
                style={{ fontWeight: 700, fill: 'var(--tx)', fontSize: '13px' }}
              >
                {nf(x.r)}
              </text>
              <text className="lt" x={cx} y="220" textAnchor="middle" style={{ fontSize: '12px' }}>
                {x.l}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="sm" style={{ marginTop: '8px' }}>
        Oxirgi 4 hafta davomida jami <b>{nf(totalRegistered)}</b> nafar yoshlar tadbirlarga qatnashish uchun ro‘yxatdan o‘tgan.
      </div>
    </div>
  );
};
