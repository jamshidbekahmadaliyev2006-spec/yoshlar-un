import React from 'react';
import { statsApi } from '../../api/stats';
import { nf, MN } from '../../utils/format';
import { useDateFilter } from '../../store/dateFilterStore';

export const WeeklyBars: React.FC = () => {
  const { selectedDate, selectedPreset } = useDateFilter();
  const { data, totalRegistered } = statsApi.getWeeklyBars(selectedDate);

  const [yStr, mStr, dStr] = selectedDate.split('-');
  const year = parseInt(yStr, 10) || 2026;
  const month = parseInt(mStr, 10) || 11;
  const selectedDay = parseInt(dStr, 10) || 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthNameUz = MN[month - 1] ? MN[month - 1][0].toUpperCase() + MN[month - 1].slice(1) : '';

  const weekRanges = [
    [1, 7],
    [8, 14],
    [15, 21],
    [22, daysInMonth]
  ];

  const isDaySelected = selectedPreset !== 'month' && selectedPreset !== 'year';

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
          <linearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        {gridLines}
        {data.map((x, i) => {
          const cx = 50 + i * 122.5 + 61;
          const barWidth = 46;
          const barHeight = Math.max(4, 200 - getY(x.r));
          const isSelectedWeek =
            isDaySelected &&
            selectedDay >= weekRanges[i][0] &&
            selectedDay <= weekRanges[i][1];

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
                fill={isSelectedWeek ? 'url(#barGradActive)' : 'url(#barGrad)'}
                stroke={isSelectedWeek ? '#38bdf8' : 'none'}
                strokeWidth={isSelectedWeek ? '2' : '0'}
              >
                <title>{`${x.l}: ${nf(x.r)} nafar yoshlar ro‘yxatdan o‘tgan${
                  isSelectedWeek ? ` (Tanlangan kun: ${selectedDay}-${monthNameUz})` : ''
                }`}</title>
              </rect>
              <text
                className="lt"
                x={cx}
                y={getY(x.r) - 8}
                textAnchor="middle"
                style={{
                  fontWeight: 700,
                  fill: isSelectedWeek ? '#0284c7' : 'var(--tx)',
                  fontSize: '13px'
                }}
              >
                {nf(x.r)}
              </text>
              <text
                className="lt"
                x={cx}
                y="220"
                textAnchor="middle"
                style={{
                  fontSize: '12px',
                  fontWeight: isSelectedWeek ? 700 : 500,
                  fill: isSelectedWeek ? 'var(--pri)' : 'inherit'
                }}
              >
                {x.l}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="sm" style={{ marginTop: '8px' }}>
        {monthNameUz} oyining 4 haftasi davomida jami <b>{nf(totalRegistered)}</b> nafar yoshlar tadbirlarga qatnashish uchun ro‘yxatdan o‘tgan.
      </div>
    </div>
  );
};
