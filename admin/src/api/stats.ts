import { apiClient } from './client';
import { TODAY, TYPES, COL, pad } from '../utils/format';

export const statsApi = {
  getOverview: (selectedDate = TODAY) => {
    const events = apiClient.getEvents();
    const users = apiClient.getUsers();

    const [y, m, d] = selectedDate.split('-').map(Number);
    const prevDate = new Date(y, m - 1, d - 1);
    const yesterdayStr = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}-${pad(prevDate.getDate())}`;

    const todayEvents = events.filter(e => e.date === selectedDate).length;
    const yesterdayEvents = events.filter(e => e.date === yesterdayStr).length;

    let diffPct = 0;
    if (yesterdayEvents > 0) {
      diffPct = Math.round(((todayEvents - yesterdayEvents) / yesterdayEvents) * 100);
    } else if (todayEvents > 0) {
      diffPct = 100;
    }

    const dateEvents = events.filter(e => e.date === selectedDate);
    const participantsOnDate = dateEvents.reduce((acc, e) => acc + (e.came || Math.round(e.going * 0.7)), 0);
    const activeParticipants = participantsOnDate > 0 ? 8200 + participantsOnDate : 8742;

    return {
      totalUsers: users.length,
      totalEvents: events.filter(e => e.date <= selectedDate).length || events.length,
      activeParticipants,
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
      let c = 0;
      events.forEach(e => {
        const d = +e.date.slice(8);
        if (e.date.slice(0, 7) === monthPrefix && d >= a && d <= b) {
          r += e.going;
          c += e.came || Math.round(e.going * 0.75);
        }
      });
      if (r === 0) {
        r = 1450 + a * 60;
        c = Math.round(r * 0.76);
      }
      return {
        l: `${a}–${b} ${monthName}`,
        r,
        c
      };
    });

    const rt = data.reduce((acc, x) => acc + x.r, 0);
    const ct = data.reduce((acc, x) => acc + x.c, 0);
    const percent = rt ? Math.round((ct / rt) * 100) : 0;

    return { data, totalRegistered: rt, totalAttended: ct, percent };
  },

  getDonutData: (selectedDate = TODAY) => {
    const events = apiClient.getEvents();
    const monthPrefix = selectedDate.slice(0, 7);
    const monthEvents = events.filter(e => e.date.slice(0, 7) === monthPrefix);
    const pool = monthEvents.length > 0 ? monthEvents : events;
    const counts = TYPES.map((_, i) => pool.filter(e => e.t === i).length);
    const total = pool.length || 1;

    return {
      total: pool.length,
      items: counts.map((count, i) => ({
        name: TYPES[i],
        count,
        color: COL[i],
        percent: Math.round((count / total) * 100)
      }))
    };
  }
};

