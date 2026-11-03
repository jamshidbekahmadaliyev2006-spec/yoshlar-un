import { apiClient } from './client';
import { TODAY, TYPES, COL, pad } from '../utils/format';

export const statsApi = {
  getOverview: (selectedDate = TODAY) => {
    const events = apiClient.getEvents();
    const users = apiClient.getUsers();

    const [y, m, d] = selectedDate.split('-').map(Number);
    const prevDate = new Date(y, m - 1, d - 1);
    const yesterdayStr = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}-${pad(prevDate.getDate())}`;

    // Bugungi va kechagi kun tadbirlari soni
    const todayEvents = events.filter(e => e.date === selectedDate).length;
    const yesterdayEvents = events.filter(e => e.date === yesterdayStr).length;

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
    const eventsToDate = events.filter(e => e.date <= selectedDate).length;
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
    const weeks = [
      [1, 7],
      [8, 14],
      [15, 21],
      [22, 28]
    ];

    const monthPrefix = selectedDate.slice(0, 7);
    const monthIdx = parseInt(selectedDate.slice(5, 7), 10) - 1;
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

  getDonutData: (selectedDate = TODAY) => {
    const events = apiClient.getEvents();
    const monthPrefix = selectedDate.slice(0, 7);
    const monthEvents = events.filter(e => e.date.slice(0, 7) === monthPrefix);
    const pool = monthEvents.length > 0 ? monthEvents : events;
    const total = pool.length || 1;

    const items = TYPES.map((name, i) => {
      const count = pool.filter(e => e.t === i).length;
      return {
        name,
        count,
        color: COL[i],
        percent: Math.round((count / total) * 100)
      };
    });

    // Foizlar yig'indisi aniq 100% bo'lishini ta'minlash
    const pSum = items.reduce((s, it) => s + it.percent, 0);
    if (pSum !== 100 && items.length > 0) {
      items[0].percent += (100 - pSum);
    }

    return {
      total: pool.length,
      items
    };
  }
};
