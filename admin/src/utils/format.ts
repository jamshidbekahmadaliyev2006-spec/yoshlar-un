export const pad = (n: number | string) => String(n).padStart(2, '0');

export const MN = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'
];

export const fd = (s: string, withYear = false) => {
  if (!s) return '';
  const parts = s.split('-');
  if (parts.length < 3) return s;
  const [a, b, c] = parts;
  return `${+c}-${MN[+b - 1]}${withYear ? `, ${a}` : ''}`;
};

export const nf = (n: number) => {
  if (typeof n !== 'number') return '0';
  return n.toLocaleString('ru-RU');
};

export const TYPES = [
  'Sport',
  'Madaniy',
  'Ta’lim',
  'Ishga joylashish',
  'Volontyorlik',
  'Boshqa'
];

export const COL = [
  '#8b5cf6',
  '#f97316',
  '#22d3ee',
  '#22c9a0',
  '#facc15',
  '#94a3b8'
];

export const LOCS = [
  { id: 1, n: 'Tinchlik mahallasi sport maydoni', x: 60, y: 75 },
  { id: 2, n: 'Madaniyat markazi', x: 150, y: 55 },
  { id: 3, n: 'Yoshlar markazi', x: 235, y: 95 },
  { id: 4, n: 'Tuman kutubxonasi', x: 95, y: 150 },
  { id: 5, n: 'Sport majmuasi', x: 205, y: 165 },
  { id: 6, n: 'Istirohat bog‘i', x: 40, y: 165 },
  { id: 7, n: 'Tuman hokimiyati', x: 150, y: 112 }
];

export const MH = [
  'Tinchlik',
  'Navbahor',
  'Bodomzor',
  'Yangi hayot',
  'Oqtepa',
  'Chinor',
  'Bahor'
];

export const RL = [
  'Yoshlar',
  'Talaba',
  'Sportchi',
  'Volontyor',
  'Ish qidiruvchi'
];

export const SN = ['Faol', 'Nofaol', 'Bloklangan'];

const _now = new Date();
export const TODAY = `${_now.getFullYear()}-${pad(_now.getMonth() + 1)}-${pad(_now.getDate())}`;

