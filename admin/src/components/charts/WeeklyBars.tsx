import React, { useState } from 'react';
import { statsApi } from '../../api/stats';
import { nf, MN, pad } from '../../utils/format';
import { useDateFilter, dateFilterStore } from '../../store/dateFilterStore';

export const WeeklyBars: React.FC = () => {
  const { selectedDate, selectedPreset } = useDateFilter();
  const { data, totalRegistered } = statsApi.getWeeklyBars(selectedDate);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  const isDaySelected = selectedPreset !== 'month' && selectedPreset !== 'year' && selectedPreset !== 'all';

  const maxVal = Math.max(...data.map(x => x.r), 1);
  const st = Math.ceil(maxVal / 4 / 500) * 500;
  const mx = st * 4;
  const getY = (v: number) => 200 - (v / mx) * 186;

  const handleSelectWeek = (weekIdx: number) => {
    const targetDay = weekRanges[weekIdx][0];
    dateFilterStore.setDate(`${year}-${pad(month)}-${pad(targetDay)}`, undefined, 'custom');
  };

  const gridLines = [0, 1, 2, 3, 4].map(k => {
    const y = getY(k * st);
    return (
      <g key={k}>
        <path className="gl" d={`M50 ${y}H540`} strokeDasharray={k > 0 ? "4 4" : "none"} opacity={k > 0 ? 0.6 : 1} />
        <text className="lt" x="44" y={y + 4} textAnchor="end" style={{ fontSize: '11px', fill: 'var(--mut)' }}>
          {nf(k * st)}
        </text>
      </g>
    );
  });

  return (
    <div>
      <svg
        viewBox="0 0 560 236"
        width="100%"
        role="img"
        aria-label="Haftalar bo‘yicha ro‘yxatdan o‘tgan yoshlar soni"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* 1. Tanlangan faol hafta uchun nurlangan yetakchi gradient */}
          <linearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bar-active-top, #3b82f6)" />
            <stop offset="100%" stopColor="var(--bar-active-bot, #1d4ed8)" />
          </linearGradient>

          {/* 2. Tanlanmagan haftalar uchun sokin va estetik pastel gradient */}
          <linearGradient id="barGradMuted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bar-muted-top, #e0e7ff)" />
            <stop offset="100%" stopColor="var(--bar-muted-bot, #c7d2fe)" />
          </linearGradient>

          {/* 3. Butun oy ko'rilganda (kun tanlanmaganda) barcha ustunlar uchun yagona uyg'un gradient */}
          <linearGradient id="barGradDefault" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bar-top, #4f8bf9)" />
            <stop offset="100%" stopColor="var(--bar-bot, #2563eb)" />
          </linearGradient>

          {/* Faol ustun uchun zamonaviy nozik soya */}
          <filter id="barShadowActive" x="-20%" y="-10%" width="140%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1d4ed8" floodOpacity="0.28" />
          </filter>
        </defs>

        {gridLines}

        {data.map((x, i) => {
          const cx = 50 + i * 122.5 + 61;
          const barWidth = 44;
          const barHeight = Math.max(6, 200 - getY(x.r));
          const isSelectedWeek =
            isDaySelected &&
            selectedDay >= weekRanges[i][0] &&
            selectedDay <= weekRanges[i][1];
          const isHovered = hoveredIndex === i;

          // Rang tanlash mantiqi:
          // Agar biror kun tanlangan bo'lsa:
          //   - faol hafta = barGradActive (ko'k yetakchi gradient)
          //   - nofaol haftalar = barGradMuted (yumshoq sokin pastel)
          // Agar kun tanlanmagan bo'lsa (butun oy rejimi):
          //   - barcha haftalar = barGradDefault (toza uyg'un gradient)
          const barFill = isDaySelected
            ? (isSelectedWeek ? 'url(#barGradActive)' : 'url(#barGradMuted)')
            : 'url(#barGradDefault)';

          return (
            <g
              key={i}
              onClick={() => handleSelectWeek(i)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              {/* Ustun foni / hover zone */}
              <rect
                x={cx - barWidth / 2 - 8}
                y={20}
                width={barWidth + 16}
                height={190}
                fill="transparent"
              />

              {/* Asosiy Bar ustuni */}
              <rect
                className="vb"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  transition: 'all 0.25s cubic-bezier(0.2, 0.7, 0.2, 1)',
                  transform: isHovered ? 'translateY(-3px)' : 'none',
                  filter: isSelectedWeek
                    ? 'url(#barShadowActive)'
                    : isHovered
                    ? 'brightness(1.08)'
                    : 'none'
                }}
                x={cx - barWidth / 2}
                y={getY(x.r)}
                width={barWidth}
                height={barHeight}
                rx="8"
                fill={barFill}
                stroke={isSelectedWeek ? '#3b82f6' : isDaySelected ? 'rgba(99, 102, 241, 0.25)' : 'none'}
                strokeWidth={isSelectedWeek ? '2' : isDaySelected ? '1' : '0'}
              >
                <title>{`${x.l}: ${nf(x.r)} nafar yoshlar ro‘yxatdan o‘tgan${
                  isSelectedWeek ? ` (Tanlangan kun: ${selectedDay}-${monthNameUz})` : ' (Tanlash uchun bosing)'
                }`}</title>
              </rect>

              {/* Tanlangan ustun ustidagi yaltiroq chegara chizig'i (3D/glass effect) */}
              {isSelectedWeek && (
                <rect
                  x={cx - barWidth / 2 + 3}
                  y={getY(x.r) + 2}
                  width={barWidth - 6}
                  height="2.5"
                  rx="1.5"
                  fill="rgba(255, 255, 255, 0.6)"
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Ustun tepasidagi son */}
              {isSelectedWeek && (
                <rect
                  x={cx - 27}
                  y={getY(x.r) - 24}
                  width="54"
                  height="19"
                  rx="6"
                  fill="var(--soft)"
                  stroke="var(--pri)"
                  strokeWidth="1"
                  strokeOpacity="0.3"
                />
              )}
              <text
                className="lt"
                x={cx}
                y={getY(x.r) - (isSelectedWeek ? 10 : 8)}
                textAnchor="middle"
                style={{
                  fontWeight: isSelectedWeek ? 800 : isHovered ? 700 : 600,
                  fill: isSelectedWeek ? 'var(--pri)' : isDaySelected ? 'var(--mut)' : 'var(--tx)',
                  fontSize: isSelectedWeek ? '13px' : '12px',
                  transition: 'fill 0.2s ease'
                }}
              >
                {nf(x.r)}
              </text>

              {/* Hafta oraliq yozuvi (pastda) */}
              <text
                className="lt"
                x={cx}
                y="220"
                textAnchor="middle"
                style={{
                  fontSize: isSelectedWeek ? '12.5px' : '12px',
                  fontWeight: isSelectedWeek ? 700 : 500,
                  fill: isSelectedWeek ? 'var(--pri)' : 'var(--tx)'
                }}
              >
                {x.l}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="sm" style={{ marginTop: '8px' }}>
        {monthNameUz} oyining 4 haftasi davomida jami <b>{nf(totalRegistered)}</b> nafar yoshlar ro‘yxatdan o‘tgan.
      </div>
    </div>
  );
};
