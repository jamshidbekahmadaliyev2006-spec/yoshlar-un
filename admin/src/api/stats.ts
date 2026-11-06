import { apiClient } from './client';
import { TODAY, TYPES, COL, pad, MN, fd } from '../utils/format';

export const statsApi = {
  getOverview: (selectedDate = TODAY, selectedPreset = 'today') => {
    const events = apiClient.getEvents();
    const users = apiClient.getUsers();

    const [y, m, d] = selectedDate.split('-').map(Number);
    const prevDate = new Date(y, m - 1, d - 1);
    const yesterdayStr = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}-${pad(prevDate.getDate())}`;

    const isMonth = selectedPreset === 'month';
    const monthPrefix = selectedDate.slice(0, 7);
    const prevMonthDate = new Date(y, m - 2, 1);
    const prevMonthPrefix = `${prevMonthDate.getFullYear()}-${pad(prevMonthDate.getMonth() + 1)}`;

    // Bugungi va kechagi kun (yoki oylik tanlangan bo'lsa bu oy va o'tgan oy) tadbirlari soni
    const todayEvents = isMonth
      ? events.filter(e => e.date.slice(0, 7) === monthPrefix).length
      : events.filter(e => e.date === selectedDate).length;

    const yesterdayEvents = isMonth
      ? events.filter(e => e.date.slice(0, 7) === prevMonthPrefix).length
      : events.filter(e => e.date === yesterdayStr).length;

    let diffPct = 0;
    if (yesterdayEvents > 0) {
      diffPct = Math.round(((todayEvents - yesterdayEvents) / yesterdayEvents) * 100);
    } else if (todayEvents > 0) {
      diffPct = 100;
    }

    // Real faol foydalanuvchilar (s === 0)
    const activeParticipants = users.filter(u => u.s === 0).length;
    const activePct = users.length > 0 ? Math.round((activeParticipants / users.length) * 100) : 0;

    // Real o'tgan oyga nisbatan o'sish foizi (oxirgi 30 kunlik registratsiyalar)
    const oneMonthAgo = new Date(y, m - 2, d);
    const usersOneMonthAgo = users.filter(u => {
      const [ud, um, uy] = u.d.split('.').map(Number);
      return new Date(uy, um - 1, ud) <= oneMonthAgo;
    }).length;
    const usersGrowthPct = usersOneMonthAgo > 0
      ? Math.round(((users.length - usersOneMonthAgo) / usersOneMonthAgo) * 100)
      : 0;

    // Tanlangan sanagacha o'tkazilgan tadbirlar ulushi
    const eventsToDate = isMonth
      ? events.filter(e => e.date.slice(0, 7) <= monthPrefix).length
      : events.filter(e => e.date <= selectedDate).length;

    const eventsProgressPct = events.length > 0
      ? Math.round((eventsToDate / events.length) * 100)
      : 0;

    return {
      totalUsers: users.length,
      usersGrowthPct,
      totalEvents: events.length,
      eventsToDate,
      eventsProgressPct,
      activeParticipants,
      activePct,
      todayEvents,
      yesterdayEvents,
      diffPct
    };
  },

  getWeeklyBars: (selectedDate = TODAY) => {
    const events = apiClient.getEvents();
    const [yStr, mStr] = selectedDate.split('-');
    const year = parseInt(yStr, 10) || 2026;
    const month = parseInt(mStr, 10) || 11;
    const daysInMonth = new Date(year, month, 0).getDate();

    const weeks = [
      [1, 7],
      [8, 14],
      [15, 21],
      [22, daysInMonth]
    ];

    const monthPrefix = selectedDate.slice(0, 7);
    const monthIdx = month - 1;
    const monthName = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek'][monthIdx] || 'noy';

    const data = weeks.map(([a, b]) => {
      let r = 0;
      events.forEach(e => {
        const d = +e.date.slice(8);
        if (e.date.slice(0, 7) === monthPrefix && d >= a && d <= b) {
          r += e.going || 0;
        }
      });
      return {
        l: `${a}–${b} ${monthName}`,
        r
      };
    });

    const totalRegistered = data.reduce((acc, x) => acc + x.r, 0);

    return { data, totalRegistered };
  },

  getDonutData: (
    selectedDate = TODAY,
    selectedPreset: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom' = 'month',
    startDate?: string,
    endDate?: string,
    forceAllTime = false
  ) => {
    const events = apiClient.getEvents();
    const [yStr, mStr] = selectedDate.split('-');
    const year = parseInt(yStr, 10) || 2026;
    const month = parseInt(mStr, 10) || 11;
    const monthPrefix = selectedDate.slice(0, 7);
    const monthIdx = month - 1;
    const monthNameUz = MN[monthIdx] ? MN[monthIdx][0].toUpperCase() + MN[monthIdx].slice(1) : '';

    let pool: typeof events = [];
    let isDayView = false;
    let periodLabel = '';

    if (forceAllTime || selectedPreset === 'all') {
      // Platforma ishga tushgandan beri jami tadbirlar
      pool = events;
      isDayView = false;
      periodLabel = 'Platforma ishga tushgandan beri';
    } else if (selectedPreset === 'month') {
      // Butun oy bo'yicha umumiy ko'rsatish
      pool = events.filter(e => e.date.slice(0, 7) === monthPrefix);
      isDayView = false;
      periodLabel = `${monthNameUz} oyi`;
    } else if (selectedPreset === 'year') {
      // Butun yil bo'yicha umumiy ko'rsatish
      pool = events.filter(e => e.date.startsWith(String(year)));
      isDayView = false;
      periodLabel = `${year} yil`;
    } else if (selectedPreset === 'week' && startDate && endDate) {
      // Hafta oralig'i bo'yicha
      pool = events.filter(e => e.date >= startDate && e.date <= endDate);
      isDayView = false;
      periodLabel = 'Haftalik';
    } else {
      // Aniq kun tanlangan holat (kun bosilganda, custom, today, yesterday)
      pool = events.filter(e => e.date === selectedDate);
      isDayView = true;
      periodLabel = `${fd(selectedDate)}`;
    }

    const total = pool.length;

    const items = TYPES.map((name, i) => {
      const count = pool.filter(e => e.t === i).length;
      return {
        name,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
        color: COL[i % COL.length]
      };
    });

    return {
      total,
      items,
      isDayView,
      periodLabel
    };
  }
};
