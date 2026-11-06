import { LS } from '../utils/storage';
import { EventItem, UserItem, MahallaStat, SettingsConfig } from '../types';
import { pad, TODAY, LOCS, MH, RL, TYPES } from '../utils/format';

const POOL = [
  ['Futbol musobaqasi', 'Voleybol turniri', 'Shaxmat turniri', 'Yugurish marafoni', 'Stol tennisi musobaqasi'],
  ['Musiqa festivali', 'Ko‘rgazma ochilishi', 'Teatr kechasi', 'She’riyat kechasi'],
  ['IT kurslari (Frontend)', 'Ingliz tili darsi', 'Karyera yo‘li ma’ruzasi', 'Robototexnika mashg‘uloti'],
  ['Ishga joylashish yarmarkasi', 'Rezyume ustaxonasi', 'Ish beruvchilar bilan uchrashuv'],
  ['Volontyorlik aksiyasi', 'Ko‘chat ekish aksiyasi', 'Hududni tozalash aksiyasi'],
  ['Yoshlar uchrashuvi', 'Muhokama klubi']
];

const DESC = [
  'Yunusobod tumanidagi yoshlar uchun musobaqa. Faol ishtirok etgan barcha ishtirokchilar diplom va esdalik sovg‘alari bilan taqdirlanadi.',
  'Madaniy dastur, ijodiy chiqishlar va yoshlar uchun ochiq tadbir.',
  'Amaliy mashg‘ulotlar va yangi ko‘nikmalarni o‘rganish imkoniyati.',
  'Ish beruvchilar bilan yuzma-yuz uchrashuv va bo‘sh ish o‘rinlari bilan tanishish.',
  'Hudud obodonligi uchun birgalikda amalga oshiriladigan ijtimoiy aksiya.',
  'Yoshlar uchun ochiq muloqot va tanishuv tadbiri.'
];

const CNT = [6, 8, 12, 9, 6, 3, 4, 9, 8, 11, 9, 6, 3, 5, 10, 8, 14, 9, 7, 4, 5, 11, 9, 10, 8, 7, 5, 18, 7, 11];

const typeOf = (i: number) => {
  const r = (i * 37) % 100;
  return r < 38 ? 0 : r < 62 ? 1 : r < 77 ? 2 : r < 89 ? 3 : r < 96 ? 4 : 5;
};

// Generate initial baseline events strictly up to TODAY (2026-11-05)
// Dates after TODAY are future dates and have no historical data
const [curYearToday, curMonthToday, curDayToday] = TODAY.split('-').map(Number);
const INITIAL_EVENTS: EventItem[] = [];
let n0 = 1;

for (let month = 1; month <= curMonthToday; month++) {
  const daysInMonth = new Date(curYearToday, month, 0).getDate();
  const maxDay = (month === curMonthToday) ? curDayToday : daysInMonth;
  for (let day = 1; day <= maxDay; day++) {
    const dateStr = `${curYearToday}-${pad(month)}-${pad(day)}`;
    if (dateStr > TODAY) continue;

    // 1 to 3 events per day with varied categories
    const count = 1 + ((day * 7 + month * 13) % 3);
    for (let k = 0; k < count; k++, n0++) {
      const t = (typeOf(n0 * 7 + day + month) + k * 2) % TYPES.length;
      const p = POOL[t] || POOL[0];
      const going = 35 + ((n0 * 19 + month * 7) % 180);
      const rate = 0.65 + ((n0 * 11 + month * 3) % 25) / 100;
      const came = Math.round(going * rate);
      INITIAL_EVENTS.push({
        id: n0,
        t,
        title: p[(n0 + day + month) % p.length],
        loc: (n0 * 3 + day + month) % LOCS.length,
        date: dateStr,
        time: `${pad(9 + ((k * 3 + day + month) % 10))}:00`,
        ages: `${15 + (n0 % 3) * 2}–${25 + (n0 % 2) * 5} yosh`,
        going,
        came,
        desc: DESC[t]
      });
    }
  }
}

// Generate initial 12,486 users
const MF = ['Azizbek', 'Dilshodbek', 'Sardor', 'Bekzod', 'Javlonbek', 'Otabek', 'Jasur', 'Sherzod'];
const ML = ['Karimov', 'Nurmatov', 'Tursunov', 'Jo‘raev', 'Abdullayev', 'Yusupov', 'Ergashev', 'Qodirov'];
const FF = ['Nilufar', 'Shahlo', 'Madina', 'Sabrina', 'Malika', 'Dilnoza', 'Zilola', 'Gulnora'];
const FL = ['Abdullayeva', 'Raxmatova', 'Qodirova', 'Raximova', 'Aliyeva', 'Karimova', 'Yusupova', 'Tursunova'];

const INITIAL_USERS: UserItem[] = Array.from({ length: 12486 }, (_, i) => {
  const f = i % 2;
  const k = i >> 1;
  const baseDate = new Date(2026, 10, 3);
  const dd = new Date(baseDate.getTime() - Math.floor(i / 33) * 864e5);
  return {
    id: i + 1,
    n: f ? `${FF[k % 8]} ${FL[(k * 5 + (k >> 3)) % 8]}` : `${MF[k % 8]} ${ML[(k * 3 + (k >> 3)) % 8]}`,
    p: `+998 9${i % 10} ${100 + ((i * 37) % 900)} ${pad(10 + ((i * 13) % 90))} ${pad(10 + ((i * 29) % 90))}`,
    r: RL[(i * 3) % 5],
    d: `${pad(dd.getDate())}.${pad(dd.getMonth() + 1)}.${dd.getFullYear()}`,
    s: i % 100 === 7 && i < 12400 ? 2 : i % 8 === 3 ? 1 : 0,
    mahalla: MH[i % MH.length],
    allowEvents: i % 10 !== 0,
    smsNotifications: i % 4 !== 0
  };
});

// Local in-memory / localStorage storage
let localEvents: EventItem[] = [...INITIAL_EVENTS, ...LS.g<EventItem[]>('added', [])];
let localUsers: UserItem[] = LS.g<UserItem[]>('custom_users', INITIAL_USERS);
let localRegs: number[] = LS.g<number[]>('reg', []);
let localCfg: SettingsConfig = LS.g<SettingsConfig>('cfg', {
  tuman: 'Yunusobod tumani',
  sys: 'Yoshlar bandligi platformasi',
  email: 'info@yunusobod.uz',
  tel: '+998 71 123 45 67',
  login: 'admin',
  n: [1, 1, 1]
});

export const apiClient = {
  // Events
  getEvents: () => localEvents,
  getEventById: (id: number) => localEvents.find(e => e.id === id),
  addEvent: (event: Omit<EventItem, 'id' | 'going' | 'came'>) => {
    const newId = Math.max(...localEvents.map(e => e.id), 0) + 1;
    const newEvent: EventItem = {
      ...event,
      id: newId,
      going: 0,
      came: 0
    };
    localEvents.push(newEvent);
    const added = LS.g<EventItem[]>('added', []);
    added.push(newEvent);
    LS.s('added', added);
    return newEvent;
  },

  // Registrations
  getRegistrations: () => localRegs,
  toggleRegistration: (eventId: number) => {
    const ev = localEvents.find(e => e.id === eventId);
    let isReg = false;
    if (localRegs.includes(eventId)) {
      localRegs = localRegs.filter(id => id !== eventId);
      if (ev && ev.going > 0) ev.going -= 1;
      isReg = false;
    } else {
      localRegs = [...localRegs, eventId];
      if (ev) ev.going += 1;
      isReg = true;
    }
    LS.s('reg', localRegs);
    return isReg;
  },

  // Users
  getUsers: () => localUsers,
  toggleUserStatus: (userId: number) => {
    const user = localUsers.find(u => u.id === userId);
    if (user) {
      user.s = user.s === 2 ? 0 : 2;
      LS.s('custom_users', localUsers);
      return user.s;
    }
    return 0;
  },
  updateUser: (userId: number, data: Partial<UserItem>) => {
    const user = localUsers.find(u => u.id === userId);
    if (user) {
      Object.assign(user, data);
      LS.s('custom_users', localUsers);
      return user;
    }
    return null;
  },

  // Settings
  getConfig: () => localCfg,
  saveConfig: (newCfg: Partial<SettingsConfig>) => {
    localCfg = { ...localCfg, ...newCfg };
    LS.s('cfg', localCfg);
    return localCfg;
  }
};

