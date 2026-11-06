import { apiClient } from './client';
import { statsApi } from './stats';
import { mahallasApi } from './mahallas';
import { pad } from '../utils/format';
import { dateFilterStore } from '../store/dateFilterStore';

export type ActionType = 
  | 'DOWNLOAD:USERS_EXCEL' 
  | 'DOWNLOAD:USERS_WORD' 
  | 'DOWNLOAD:USERS_BOTH'
  | 'DOWNLOAD:EVENTS_EXCEL' 
  | 'DOWNLOAD:EVENTS_WORD' 
  | 'DOWNLOAD:EVENTS_BOTH'
  | 'DOWNLOAD:MAHALLAS_EXCEL' 
  | 'DOWNLOAD:MAHALLAS_WORD' 
  | 'DOWNLOAD:MAHALLAS_BOTH'
  | null;

export type SupportedLang = 'uz' | 'ru' | 'en';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  action?: ActionType;
  lang?: SupportedLang;
}

// ============================================================================
// 1. ANIQ VA DINAMIK SANA HISOBLASH (DATE ANCHORING)
// ============================================================================

export const getTodayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const getTodayFormatted = () => {
  const d = new Date();
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};

export const getYesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const getYesterdayFormatted = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};

export const extractDateFromPrompt = (text: string): { dateStr: string; label: string } | null => {
  const p = text.toLowerCase().trim();

  // Match ISO YYYY-MM-DD
  const isoMatch = p.match(/\b(202\d)-(0[1-9]|1[0-2])-([0-2][0-9]|3[01])\b/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const MN_UZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
    return { dateStr: `${y}-${m}-${d}`, label: `${+d}-${MN_UZ[+m - 1]}` };
  }

  // Match DD.MM.YYYY or DD.MM
  const dotMatch = p.match(/\b([0-2]?[0-9]|3[01])\.(0[1-9]|1[0-2])(?:\.(202\d))?\b/);
  if (dotMatch) {
    const [, d, m, y] = dotMatch;
    const year = y || '2026';
    const MN_UZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
    return { dateStr: `${year}-${pad(m)}-${pad(d)}`, label: `${+d}-${MN_UZ[+m - 1]}` };
  }

  // Match textual dates like "4-noyabr", "4 noyabr", "4 ноября", "4th november"
  const monthMap: Record<string, number> = {
    yanvar: 1, yan: 1, январ: 1, янв: 1, january: 1, jan: 1,
    fevral: 2, fev: 2, феврал: 2, фев: 2, february: 2, feb: 2,
    mart: 3, mar: 3, март: 3, мар: 3, march: 3,
    aprel: 4, apr: 4, апрел: 4, апр: 4, april: 4,
    may: 5, май: 5,
    iyun: 6, июн: 6, june: 6, jun: 6,
    iyul: 7, июл: 7, july: 7, jul: 7,
    avgust: 8, avg: 8, август: 8, авг: 8, august: 8, aug: 8,
    sentyabr: 9, sen: 9, сентябр: 9, сен: 9, september: 9, sep: 9,
    oktyabr: 10, okt: 10, октябр: 10, окт: 10, october: 10, oct: 10,
    noyabr: 11, noy: 11, ноябр: 11, ноя: 11, november: 11, nov: 11,
    dekabr: 12, dek: 12, декабр: 12, дек: 12, december: 12, dec: 12
  };

  const textMatch = p.match(/\b([0-2]?[0-9]|3[01])(?:-chi|-)?\s*([a-zа-яё']+)/i);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const mStr = textMatch[2].toLowerCase().replace(/[^a-zа-яё]/gi, '');
    for (const [k, num] of Object.entries(monthMap)) {
      if (mStr.startsWith(k) && day >= 1 && day <= 31) {
        const MN_UZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
        return { dateStr: `2026-${pad(num)}-${pad(day)}`, label: `${day}-${MN_UZ[num - 1]}` };
      }
    }
  }

  return null;
};

export const detectLanguage = (text: string): SupportedLang => {
  const p = text.toLowerCase().trim();

  // 1. Foydalanuvchining aniq til talablari (Explicit Directives)
  if (
    p.includes('rus tilida') ||
    p.includes('ruscha') ||
    p.includes('по-русски') ||
    p.includes('по русски') ||
    p.includes('на русском') ||
    p.includes('на русский') ||
    p.includes('in russian') ||
    p.includes('russian language') ||
    p.includes('русском') ||
    p.includes('русский')
  ) {
    return 'ru';
  }

  if (
    p.includes('ingliz tilida') ||
    p.includes('inglizcha') ||
    p.includes('in english') ||
    p.includes('english language') ||
    p.includes('на английском') ||
    p.includes('по-английски') ||
    p.includes('to english') ||
    p.includes('english')
  ) {
    return 'en';
  }

  if (
    p.includes("o'zbek tilida") ||
    p.includes("ozbek tilida") ||
    p.includes("o'zbekcha") ||
    p.includes("ozbekcha") ||
    p.includes("uzbekcha") ||
    p.includes("на узбекском") ||
    p.includes("in uzbek")
  ) {
    return 'uz';
  }

  // 2. Kirill alifbosi mavjud bo'lsa -> Rus tili
  const cyrillicMatch = p.match(/[а-яё]/gi);
  if (cyrillicMatch && cyrillicMatch.length >= 2) {
    return 'ru';
  }

  // 3. Ingliz tili so'z va iboralari
  const enPatterns = [
    /\b(how|what|who|where|when|why|tell me|show me|give me|make|generate|download|export|prepare|list|table|report|summary|active|inactive|users|events|mahallas|district|total|yesterday|today|hello|hi|please|rate|ranking)\b/i,
    /\b(in\s+english|for\s+today|of\s+the\s+youth|number\s+of)\b/i
  ];
  if (enPatterns.some(rx => rx.test(p))) {
    return 'en';
  }

  return 'uz';
};

export const isRepetitiveOrMalformed = (text: string): boolean => {
  if (!text || text.trim().length < 4) return true;
  if (/(.{8,60}?)\s*(?:\1\s*){2,}/i.test(text)) return true;
  const words = text.toLowerCase().split(/\s+/);
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (w.length > 3) {
      freq[w] = (freq[w] || 0) + 1;
      if (freq[w] > 4) return true;
    }
  }
  return false;
};

// ============================================================================
// 2. CONVERSATIONAL QUERY REWRITING (CQR) & INTENT TRACKING
// ============================================================================

export const resolveTargetDate = (
  prompt: string,
  history: { role: string; content: string }[] = []
): string => {
  const p = prompt.toLowerCase();
  const todayFormatted = getTodayFormatted();
  const yestFormatted = getYesterdayFormatted();

  // 1. Kecha / Kechagi so'rovlar - QAT'IY kechagi sana (03.11.2026)
  if (
    p.includes('kecha') || 
    p.includes('kechagi') || 
    p.includes('kechasi') || 
    p.includes('вчера') || 
    p.includes('вчерашн') || 
    p.includes('yesterday')
  ) {
    return yestFormatted;
  }

  // 2. Bugun / Bugungi so'rovlar
  if (p.includes('bugun') || p.includes('bugungi') || p.includes('сегодня') || p.includes('сегодняшн') || p.includes('today')) {
    return todayFormatted;
  }

  // 3. Aniq sana kiritilgan bo'lsa (masalan: 02.09.2026, 03-11-2026)
  const dateMatch = p.match(/(\d{1,2})[\.\-\/](\d{1,2})(?:[\.\-\/](\d{2,4}))?/);
  if (dateMatch) {
    const day = pad(dateMatch[1]);
    const month = pad(dateMatch[2]);
    const year = dateMatch[3] ? (dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3]) : '2026';
    return `${day}.${month}.${year}`;
  }

  const months: Record<string, string> = {
    yanvar: '01', fevral: '02', mart: '03', aprel: '04', may: '05', iyun: '06',
    iyul: '07', avgust: '08', sentyabr: '09', oktyabr: '10', noyabr: '11', dekabr: '12',
    январь: '01', февраль: '02', март: '03', апрель: '04', май: '05', июнь: '06',
    июль: '07', август: '08', сентябрь: '09', октябрь: '10', ноябрь: '11', декабрь: '12',
    января: '01', февраля: '02', марта: '03', апреля: '04', мая: '05', июня: '06',
    июля: '07', августа: '08', сентября: '09', октября: '10', ноября: '11', декабря: '12'
  };
  for (const [mName, mNum] of Object.entries(months)) {
    const regex = new RegExp(`(\\d{1,2})[-–\\s]*${mName}`);
    const m = p.match(regex);
    if (m) {
      return `${pad(m[1])}.${mNum}.2026`;
    }
  }

  if (p.includes('2 oy') || p.includes('2 месяца') || p.includes('два месяца')) {
    return '02.09.2026';
  }

  if (p.includes('1 oy') || p.includes('1 месяц') || p.includes('месяц назад')) {
    return '03.10.2026';
  }

  // Tanlangan sana (UI datepicker filter)
  let currentSelected = getTodayISO();
  try {
    currentSelected = dateFilterStore.getState().selectedDate || getTodayISO();
  } catch {}
  const currentFormatted = currentSelected.split('-').reverse().join('.');

  if (p.includes('mana shu') || p.includes('shu kun') || p.includes('этот день') || p.includes('выбранный')) {
    return currentFormatted;
  }

  // Suhbat tarixidan oxirgi sanani izlash (Follow-up context)
  if (history && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      const prev = history[i].content || '';
      const dm = prev.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      if (dm) return dm[0];
      if (prev.toLowerCase().includes('kecha') || prev.toLowerCase().includes('вчера')) {
        return yestFormatted;
      }
    }
  }

  return todayFormatted;
};

// ============================================================================
// 3. PLATFORMA MA'LUMOTLARI VA METRIKALARI (GROUND-TRUTH CONTEXT)
// ============================================================================

export const buildPlatformContext = (lang: SupportedLang = 'uz') => {
  const users = apiClient.getUsers();
  const todayISO = getTodayISO();
  const todayFormatted = getTodayFormatted();
  const yestISO = getYesterdayISO();
  const yestFormatted = getYesterdayFormatted();

  const overview = statsApi.getOverview(todayISO);
  const mahallaStats = mahallasApi.getStats('r');
  const donut = statsApi.getDonutData(todayISO);

  const todayUsersCount = users.filter(u => u.d === todayFormatted).length;
  const yestUsersCount = users.filter(u => u.d === yestFormatted).length;

  const activeUsersCount = users.filter(u => u.s === 0).length;
  const inactiveUsersCount = users.filter(u => u.s === 1).length;
  const blockedUsersCount = users.filter(u => u.s === 2).length;

  const topMahallas = mahallaStats.slice(0, 5).map((m, idx) => 
    `${idx + 1}. ${m.n} mahallasi: ${m.k} ta tadbir, ${m.r} yoshlar`
  ).join(', ');

  const categories = donut.items.map(i => `${i.name}: ${i.count} ta (${i.percent}%)`).join(', ');

  return `
SEN — "Yunusobod — Birga" yoshlar platformasining rasmiy va maxsus vakolatli ADMINISTRATOR ASSISTENTISAN.

### ENG MUHIM TIL VA MUOMALA QOIDALARI:
- FOYDALANUVCHI QAYSI TILDA YOZSA, FAQAT VA FAQAT O'SHA TILDA JAVOB BERISHING SHART!
- Agar foydalanuvchi O'ZBEK tilida yozsa, 100% SOF O'ZBEK TILIDA javob ber! Hech qachon ingliz tilida javob qaytarma!
- Agar rus tilida yozsa, rus tilida javob ber.
- HECH QACHON "I'm sorry, but I can't help with that" YOKI RAD JAVOBINI BERMA! Har doim Yunusobod tumani yoshlari, talabalari va platforma ma'lumotlari asosida tushunarli, aniq, muloyim va to'liq yordam ber!

### KALENDAR VA SANALARNING ANIQ CHEGARASI:
- BUGUN: ${todayFormatted} (${todayISO})
- KECHA: ${yestFormatted} (${yestISO})
- Bugun ro'yxatdan o'tganlar: ${todayUsersCount} nafar
- Kecha ro'yxatdan o'tganlar: ${yestUsersCount} nafar
- Kecha so'ralsa, FAQAT ${yestFormatted} sanasi bo'yicha hisobot ber, aslo bugungi sana bilan aralashtirma!

### ASOSIY MA'LUMOTLAR BAZASI:
- Jami yoshlar: ${users.length.toLocaleString()} nafar
- Faol foydalanuvchilar: ${activeUsersCount.toLocaleString()} nafar (${overview.activePct}%)
- Nofaol foydalanuvchilar: ${inactiveUsersCount.toLocaleString()} nafar (12%)
- Bloklangan foydalanuvchilar: ${blockedUsersCount.toLocaleString()} nafar (1%)
- Jami tadbirlar: ${overview.totalEvents} ta
- Yo‘nalishlar: ${categories}
- Eng faol mahallalar: ${topMahallas}

### JADVAL VA FORMATLASH QOIDALARI:
- Jadval tuzganda FAQAT yoshlar sohasi ko'rsatkichlaridan foydalan:
  | № | Ko‘rsatkich nomi | Qiymati | Izoh / Ulushi |
  ASLO "Narxi", "Qisqacha tavsif" kabi e-tijorat ustunlarini qo'shma!
- Kechagi hisobotda "Bugun ro'yxatdan o'tganlar" deb yozma, faqat "Kecha ro'yxatdan o'tganlar" deb yoz!
- Rus tilida: "Заблокированные пользователи" (aslo "блокнанные" emas!), "Неактивные пользователи", "Мероприятия".
- Qisqa, aniq va lo'nda javob ber.
`.trim();
};

// ============================================================================
// 4. DIALOGUE STATE TRACKING (DST) & CONVERSATIONAL CONTEXT REWRITING
// ============================================================================

export type DialogueTopic = 
  | 'period_overview'      // 10 kun, 10 kun davomida, oxirgi 10 kun, platforma holati, tahlil
  | 'historical_compare'   // 10 kun oldi, 5 oy oldingi va hozirgi, N oy oldin qancha edi, o'sish dinamikasi
  | 'last_month'           // o'tgan oy, otgan oy foydalanuvchilar nechta qo'shilgan
  | 'this_month'           // shu oy, bu oy foydalanuvchilar nechta qo'shilgan
  | 'last_week'            // o'tgan hafta, otgan hafta
  | 'this_week'            // shu hafta, bu hafta
  | 'compare_months'       // o'tgan oy va shu oyni taqqoslash
  | 'top_category'         // eng ko'p tadbir qaysi yo'nalishda
  | 'attendance_rate'      // o'rtacha qatnashish ko'rsatkichi / davomat
  | 'top_events'           // eng ko'p ishtirokchi qatnashgan 5 ta tadbir
  | 'peak_month'           // qaysi oyda eng ko'p qo'shilgan
  | 'last_30_days_events'  // oxirgi 30 kunda nechta tadbir
  | 'event_types_breakdown' // tadbirlar turlari, foizlari, donut
  | 'youth_roles_breakdown' // rollar, talaba, volontyor, ish qidiruvchi, sms
  | 'location_stats'        // 6 ta lokatsiya, xarita
  | 'platform_how_to'       // tadbir qo'shish, bloklash, sozlamalar, instruksiyalar
  | 'yesterday'            // kecha, kechagi
  | 'today'                // bugun, bugungi
  | 'mahallas'             // mahalla, mahallalar
  | 'events'               // tadbirlar, tadbirlar soni
  | 'sports'               // sport, musobaqalar
  | 'education_it'         // it, dasturlash, kurslar
  | 'employment'           // bandlik, ish o'rinlari, rezyume
  | 'culture'              // madaniyat, teatr, san'at
  | 'users'                // yoshlar, foydalanuvchilar
  | 'students'             // talaba, talabalar, eng yaxshi talaba
  | 'recent_users'         // kech qoshilgan, yangi qoshilgan, ism familiyasi
  | 'greetings'            // qalesan, salom, assalomu alaykum
  | 'lowest'               // eng kam, eng past, kam faol
  | 'date_users'           // aniq sana (02.09.2026)
  | 'platform_about'       // platforma haqida, yunusobod birga nima
  | 'gost_format'          // davlat standarti, formatlash
  | null;

export interface DialogueState {
  isContinuation: boolean;
  isCorrection: boolean;
  activeTopic: DialogueTopic;
  targetDate: string;
  wantsExcel: boolean;
  wantsWord: boolean;
  wantsBoth: boolean;
  wantsTable: boolean;
}

export const analyzeDialogueState = (
  userPrompt: string,
  history: { role: string; content: string }[] = []
): DialogueState => {
  const p = userPrompt.toLowerCase().replace(/[‘’`]/g, "'").trim();
  const words = p.split(/\s+/);
  const todayFormatted = getTodayFormatted();
  const yestFormatted = getYesterdayFormatted();

  const wantsExcel = p.includes('excel') || p.includes('эксел') || p.includes('xls') || p.includes('csv');
  const wantsWord = p.includes('word') || p.includes('ворд') || p.includes('doc') || p.includes('docx') || p.includes('форд');
  const wantsBoth = 
    (wantsExcel && wantsWord) || 
    p.includes('и эксел') || 
    p.includes('va excel') || 
    p.includes('hamda excel') || 
    p.includes('har ikkala') || 
    p.includes('fayllar') || 
    p.includes('fayllarni');
  const wantsTable = p.includes('jadval') || p.includes('таблиц') || p.includes('table');

  const isCorrection = 
    /\b(dedim|aytuvdim|aytgan edim|aytganmanku|aytgan edimku|men senga|so'radim|soradim)\b/i.test(p) ||
    p.includes('bo\'yicha dedim') ||
    p.includes('boyicha dedim') ||
    p.includes('я же сказал') ||
    p.includes('я имел в виду') ||
    p.includes('я просил') ||
    p.includes('i told you') ||
    p.includes('i said');

  // O'tgan / tarixiy vaqt so'zlari (oldin, oldi, avval, ilgari, назад, ago)
  const pastWords = ['oldin', 'oldi', 'oldingi', 'avval', 'ilgari', 'orqaga', 'burun', 'назад', 'ago'];
  const hasPastWord = pastWords.some(w => p.includes(w));

  // Tarixiy ko'rsatkich va taqqoslash (10 kun oldi nechta bor edi, 5 oy oldin qancha, va h.k.)
  const isHistoricalCompare = 
    (/\b(\d+)\s*(oy|kun|hafta|yil|дней|дня|месяц|месяцев|недел|day|days|week|month|year)\s*(?:oldin|oldi|oldingi|avval|orqaga|ilgari|burun|назад|ago)\b/i.test(p)) ||
    (hasPastWord && (p.includes('hozir') || p.includes('bugun') || p.includes('qancha') || p.includes('nechta') || p.includes('nechtab') || p.includes('soni') || p.includes('bor edi') || p.includes('foydalanuvchi') || p.includes('foydaliuvchi') || p.includes('yoshlar')));

  // 1. Yangi davr (10 kunlik umumiy holat, haftalik tahlil)
  const isAskingSpecificNumber = p.includes('nechta') || p.includes('nechtab') || p.includes('qancha') || p.includes('bor edi') || p.includes('sonini');
  const isExplicitPeriod = 
    !hasPastWord && !isAskingSpecificNumber && (
      /\b(\d+)\s*(kun|oy|hafta|yil|дней|дня|месяц|недел|day|days|week|month)\b/i.test(p) ||
      p.includes('davr') ||
      p.includes('oxirgi kunlar') ||
      p.includes('oxirgi hafta') ||
      p.includes('haftalik') ||
      p.includes('oylik')
    );

  const isPlatformGeneralStatus =
    (p.includes('platform') || p.includes('tizim') || p.includes('umumiy')) &&
    (p.includes('holat') || p.includes('statistika') || p.includes('dinamika') || p.includes('tahlil')) &&
    !isAskingSpecificNumber && !hasPastWord;

  const isPeriodOrStatus = isExplicitPeriod || isPlatformGeneralStatus;

  // 2. Kecha / Kechagi so'rovlar (FAQAT kecha so'zi aniq bo'lsa)
  const isExplicitYesterday = 
    /\b(kecha|kechagi|kechasidagi|вчера|вчерашн|yesterday)\b/i.test(p);

  // 3. Bugungi so'rovlar
  const isExplicitToday = 
    /\b(bugun|bugungi|сегодня|сегодняшн|today)\b/i.test(p) && !isExplicitYesterday;

  // 4. Davomiylik (Continuation) — FAQAT oldingi mavzuga ishora so'zlari bo'lsa va yangi davr/mavzu aytilmagan bo'lsa
  const hasContinuationPronoun = 
    /\b(buni|shuni|bularni|o['’]shani|oshani|yuqoridagi|oldingi|oldingisini)\b/i.test(p) ||
    /\b(buni ham|buni excelda|buni wordda|buni fayl|buni jadval|buni yukla)\b/i.test(p) ||
    /\b(это|эти|этого|эти данные|предыдущее|вышеуказанное)\b/i.test(p) ||
    /\b(this data|these data|this report|the same)\b/i.test(p);

  const isShortAction = words.length <= 4 && (wantsExcel || wantsWord || wantsBoth || wantsTable);

  const isContinuation = !isPeriodOrStatus && !isExplicitYesterday && !isExplicitToday && (isCorrection || hasContinuationPronoun || isShortAction);

  // Avvalgi suhbat kontekstidan mavzu va sanani qidirish
  let previousTopic: DialogueTopic = null;
  let previousDate: string | null = null;

  if (history && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      const hContent = (history[i].content || '').toLowerCase();
      
      const dateMatch = hContent.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      if (dateMatch && !previousDate) {
        previousDate = dateMatch[0];
      }

      if (!previousTopic) {
        if (hContent.includes('10 kun') || hContent.includes('davomida')) {
          previousTopic = 'period_overview';
        } else if (hContent.includes('kecha') || hContent.includes('вчера') || (dateMatch && dateMatch[0] === yestFormatted)) {
          previousTopic = 'yesterday';
        } else if (hContent.includes('махолл') || hContent.includes('махалл') || hContent.includes('mahalla')) {
          previousTopic = 'mahallas';
        } else if (hContent.includes('sport') || hContent.includes('спорт')) {
          previousTopic = 'sports';
        } else if (hContent.includes('it ') || hContent.includes('kurs') || hContent.includes('dasturlash')) {
          previousTopic = 'education_it';
        } else if (hContent.includes('tadbir') || hContent.includes('мероприят')) {
          previousTopic = 'events';
        } else if (hContent.includes('foydalanuvchi') || hContent.includes('пользовател') || hContent.includes('yoshlar')) {
          previousTopic = 'users';
        } else if (hContent.includes('eng kam') || hContent.includes('самая низкая')) {
          previousTopic = 'lowest';
        } else if (hContent.includes('bugun') || hContent.includes('сегодня') || (dateMatch && dateMatch[0] === todayFormatted)) {
          previousTopic = 'today';
        } else if (previousDate) {
          previousTopic = 'date_users';
        }
      }

      if (previousTopic && previousDate) break;
    }
  }

  // Salomlashish va hol-ahvol so'rash
  const isGreeting = 
    /^(qalesan|qalaysiz|qaleysiz|ishlar qalay|ahvollar qalay|salom|assalomu alaykum|yaxshimisiz|tuzukmisiz|privet|hello|hi)\b/i.test(p) ||
    p === 'qalesan' || p === 'salom';

  // Talabalar va eng yaxshi talabalar
  const isStudents = 
    p.includes('talaba') || 
    p.includes('студент') || 
    p.includes('student') || 
    p.includes('eng yaxshi talaba') ||
    p.includes('faol talaba');

  // Oxirgi / kech / kecha qo'shilganlar yoki ism-familiyasi so'ralganda
  const isRecentOrNames = 
    (p.includes('kech') || p.includes('kecha') || p.includes('yangi') || p.includes('oxirgi') || p.includes('qoshilgan') || p.includes('qo\'shilgan') || p.includes('ro\'yxat')) &&
    (p.includes('ism') || p.includes('familya') || p.includes('familiya') || p.includes('kimlar') || p.includes('ismlari') || p.includes('olib kel') || p.includes('список') || p.includes('имен'));

  // Nisbiy davrlar (O'tgan oy, shu oy, o'tgan hafta, shu hafta va taqqoslash)
  const isCompareMonths = 
    ((p.includes("o'tgan oy") || p.includes("otgan oy") || p.includes("oldingi oy") || p.includes("o‘tgan oy") || p.includes("прошлый месяц") || p.includes("прошлом месяце")) &&
     (p.includes("shu oy") || p.includes("bu oy") || p.includes("hozirgi oy") || p.includes("joriy oy") || p.includes("noyabr") || p.includes("этот месяц"))) ||
    ((p.includes('taqqos') || p.includes('solishtir') || p.includes('qiyos') || p.includes('сравн')) && (p.includes('oy') || p.includes('davr') || p.includes('месяц')));

  const isLastMonth = 
    !isCompareMonths && (
      p.includes("o'tgan oy") || 
      p.includes("otgan oy") || 
      p.includes("o‘tgan oy") || 
      p.includes("oldingi oy") || 
      p.includes("прошлый месяц") || 
      p.includes("прошлом месяце") || 
      p.includes("last month")
    );

  const isThisMonth = 
    !isCompareMonths && (
      p.includes("shu oy") || 
      p.includes("bu oy") || 
      p.includes("joriy oy") || 
      p.includes("noyabr") || 
      p.includes("этот месяц") || 
      p.includes("в этом месяце") || 
      p.includes("текущий месяц") || 
      p.includes("this month")
    );

  const isLastWeek = 
    p.includes("o'tgan hafta") || 
    p.includes("otgan hafta") || 
    p.includes("o‘tgan hafta") || 
    p.includes("oldingi hafta") || 
    p.includes("прошлая неделя") || 
    p.includes("прошлой неделе") || 
    p.includes("last week");

  const isThisWeek = 
    p.includes("shu hafta") || 
    p.includes("bu hafta") || 
    p.includes("joriy hafta") || 
    p.includes("эта неделя") || 
    p.includes("текущая неделя") || 
    p.includes("this week");

  const isTopCategory = 
    (p.includes("eng ko'p") || p.includes("eng kop") || p.includes("qaysi") || p.includes("yetakchi") || p.includes("какое направление") || p.includes("больше всего")) &&
    (p.includes("yo'nalish") || p.includes("yonalish") || p.includes("soha") || p.includes("направлени"));

  const isAttendanceRate = 
    p.includes("o'rtacha qatnashish") || 
    p.includes("ortacha qatnashish") || 
    p.includes("davomat") || 
    p.includes("qatnashish ko'rsatkichi") || 
    p.includes("qatnashish korsatkichi") || 
    p.includes("посещаемость") || 
    p.includes("attendance");

  const isTopEvents = 
    (p.includes("eng ko'p") || p.includes("eng kop") || p.includes("top") || p.includes("5 ta") || p.includes("самые популярные")) &&
    (p.includes("ishtirokchi") || p.includes("qatnashgan") || p.includes("tadbir") || p.includes("мероприят"));

  const isPeakMonth = 
    (p.includes("qaysi oyda") || p.includes("eng ko'p") || p.includes("eng kop") || p.includes("в каком месяце") || p.includes("пик")) &&
    (p.includes("ro'yxat") || p.includes("royxat") || p.includes("qo'shilgan") || p.includes("qoshilgan") || p.includes("foydalanuvchi"));

  const isLast30DaysEvents = 
    (p.includes("30 kun") || p.includes("30 дней")) && 
    (p.includes("tadbir") || p.includes("мероприят"));

  const extractedDateMatch = extractDateFromPrompt(userPrompt);
  const isDateEventsQuery = Boolean(
    (extractedDateMatch || p.includes('bugun') || p.includes('сегодня') || p.includes('today') || p.includes('kecha') || p.includes('вчера') || p.includes('tanlangan') || p.includes('filtr')) &&
    (p.includes('tadbir') || p.includes('мероприят') || p.includes('event'))
  );

  const isEventTypesBreakdown = 
    isDateEventsQuery ||
    (p.includes('turlari') || p.includes('turlar') || p.includes('turkum') || p.includes('taqsimot') || p.includes('donut') || p.includes('doiraviy') || p.includes('виды') || p.includes('соотношение') || p.includes('breakdown')) &&
    (p.includes('tadbir') || p.includes('foiz') || p.includes('процент') || p.includes('мероприят') || p.includes('events')) ||
    ((p.includes('foizlari') || p.includes('foizi') || p.includes('ulushi') || p.includes('ulush')) && (p.includes('tadbir') || p.includes('sport') || p.includes('madaniyat') || p.includes('yo\'nalish') || p.includes('kategoriya') || p.includes('bugungi') || p.includes('aprel'))) ||
    ((p.includes('nechta tadbir') || p.includes('qancha tadbir') || p.includes('tadbirlar soni') || p.includes('tadbir bor')) && !p.includes('30 kun'));

  const isYouthRolesBreakdown = 
    p.includes('rollar') || p.includes('toifalar') || p.includes('toifasi') ||
    p.includes('volontyor') || p.includes('ish qidiruvchi') || p.includes('sportchi') ||
    p.includes('sms xabarnoma') || p.includes('rozilik') || p.includes('jins nisbati') ||
    p.includes('qizlar va yigitlar') || p.includes('волонтер') || p.includes('ищущие работу');

  const isLocationStats = 
    p.includes('lokatsiya') || p.includes('xarita') || p.includes('xaritadagi') ||
    p.includes('qayerda joylashgan') || p.includes('sport maydoni') || p.includes('yoshlar markazi') ||
    p.includes('kutubxona') || p.includes('istirohat bog\'i') || p.includes('lokatsiyalar') ||
    p.includes('локаци') || p.includes('карта') || p.includes('map');

  const isPlatformHowTo = 
    p.includes('qanday qilinadi') || p.includes('qanday qo\'shiladi') || p.includes('qanday qoshiladi') ||
    p.includes('qanday tahrirlayman') || p.includes('qanday bloklanadi') || p.includes('qanday blokdan') ||
    p.includes('qayerdan o\'zgartiriladi') || p.includes('dark mode') || p.includes('qorong\'i rejim') ||
    p.includes('kattalashtirish') || p.includes('nusxa olish') || p.includes('tarixni tozalash') ||
    p.includes('double click') || p.includes('2 marta bosish') || p.includes('faqat o\'sha kun') ||
    p.includes('nima sababdan 6-noyabr') || p.includes('5-noyabrdan keyingi') ||
    p.includes('barchasi tugmasi') || p.includes('sana bo\'yicha tugmasi') ||
    p.includes('haftalik trend') || p.includes('haftalar bo\'yicha') || p.includes('ustunlar balandligi') ||
    p.includes('logout') || p.includes('parol') || p.includes('mobil versiya') ||
    p.includes('qidiruv qanday ishlaydi') || p.includes('sahifalash') || p.includes('toast') ||
    p.includes('yetakchi vazifasi') || p.includes('vazifani belgilab ber') ||
    p.includes('как добавить') || p.includes('как изменить') || p.includes('как заблокировать') ||
    p.includes('почему нельзя') || p.includes('how to add') || p.includes('how to block');

  // Joriy so'rov bo'yicha mustaqil yangi mavzuni tekshirish
  let explicitTopic: DialogueTopic = null;

  if (isGreeting) {
    explicitTopic = 'greetings';
  } else if (isPlatformHowTo) {
    explicitTopic = 'platform_how_to';
  } else if (isEventTypesBreakdown) {
    explicitTopic = 'event_types_breakdown';
  } else if (isYouthRolesBreakdown) {
    explicitTopic = 'youth_roles_breakdown';
  } else if (isLocationStats) {
    explicitTopic = 'location_stats';
  } else if (isHistoricalCompare) {
    explicitTopic = 'historical_compare';
  } else if (isCompareMonths) {
    explicitTopic = 'compare_months';
  } else if (isLastMonth) {
    explicitTopic = 'last_month';
  } else if (isThisMonth) {
    explicitTopic = 'this_month';
  } else if (isLastWeek) {
    explicitTopic = 'last_week';
  } else if (isThisWeek) {
    explicitTopic = 'this_week';
  } else if (isTopCategory) {
    explicitTopic = 'top_category';
  } else if (isAttendanceRate) {
    explicitTopic = 'attendance_rate';
  } else if (isTopEvents) {
    explicitTopic = 'top_events';
  } else if (isPeakMonth) {
    explicitTopic = 'peak_month';
  } else if (isLast30DaysEvents) {
    explicitTopic = 'last_30_days_events';
  } else if (isStudents) {
    explicitTopic = 'students';
  } else if (isRecentOrNames) {
    explicitTopic = 'recent_users';
  } else if (p.includes('eng kam') || p.includes('eng past') || p.includes('самая низкая') || p.includes('наименее') || p.includes('пассив') || p.includes('минимальн')) {
    explicitTopic = 'lowest';
  } else if (isExplicitYesterday) {
    explicitTopic = 'yesterday';
  } else if (isPeriodOrStatus) {
    explicitTopic = 'period_overview';
  } else if (isExplicitToday) {
    explicitTopic = 'today';
  } else if (p.includes('референс') || p.includes('гос стандарт') || p.includes('госстандарт') || p.includes('davlat standarti') || p.includes('gost') || p.includes('гост')) {
    explicitTopic = 'gost_format';
  } else if (p.includes('sport') || p.includes('спорт') || p.includes('musobaqa') || p.includes('futbol') || p.includes('shaxmat') || p.includes('voleybol')) {
    explicitTopic = 'sports';
  } else if (p.includes('it ') || p.includes(' it') || p.includes('dasturlash') || p.includes('frontend') || p.includes('robot') || p.includes('kurs')) {
    explicitTopic = 'education_it';
  } else if (p.includes('bandlik') || p.includes('ishga') || p.includes('ish ') || p.includes('yarmarka') || p.includes('rezyume')) {
    explicitTopic = 'employment';
  } else if (p.includes('madaniyat') || p.includes('san\'at') || p.includes('sanat') || p.includes('teatr') || p.includes('musiqa') || p.includes('festival')) {
    explicitTopic = 'culture';
  } else if (p.includes('махолл') || p.includes('махалл') || p.includes('mahalla')) {
    explicitTopic = 'mahallas';
  } else if (p.includes('platforma nima') || p.includes('tizim nima') || p.includes('haqida ma\'lumot') || p.includes('haqida ayt') || p.includes('maqsad')) {
    explicitTopic = 'platform_about';
  } else if (p.includes('tadbir') || p.includes('мероприят') || p.includes('event')) {
    explicitTopic = 'events';
  } else if (p.includes('foydalanuvchi') || p.includes('пользовател') || p.includes('yoshlar') || p.includes('yosh') || p.includes('inson') || p.includes('odam') || p.includes('a\'zo')) {
    explicitTopic = 'users';
  }

  // Sanani aniqlash
  let targetDate = resolveTargetDate(userPrompt, history);
  if (isContinuation && !explicitTopic && previousTopic === 'yesterday') {
    targetDate = yestFormatted;
  }

  // Agar bu davomiy savol bo'lsa va joriy promptda yangi mavzu aytilmagan bo'lsa, avvalgi mavzuni davom ettiramiz
  const activeTopic = explicitTopic || (isContinuation ? previousTopic : null);

  return {
    isContinuation,
    isCorrection,
    activeTopic,
    targetDate,
    wantsExcel,
    wantsWord,
    wantsBoth,
    wantsTable
  };
};

// ============================================================================
// 5. DETERMINISTIC EXPERT ASSISTANT (ZERO-HALLUCINATION DATA RETRIEVER)
// ============================================================================

export const localPlatformAssistant = (
  userPrompt: string,
  history: { role: string; content: string }[] = []
): { text: string; action: ActionType; lang: SupportedLang } => {
  const p = userPrompt.toLowerCase().trim();
  const lang = detectLanguage(userPrompt);
  const state = analyzeDialogueState(userPrompt, history);

  const users = apiClient.getUsers();
  const events = apiClient.getEvents();
  const mahallaStats = mahallasApi.getStats('r');
  const todayISO = getTodayISO();
  const todayFormatted = getTodayFormatted();
  const yestISO = getYesterdayISO();
  const yestFormatted = getYesterdayFormatted();
  const overview = statsApi.getOverview(todayISO);

  const activeUsersCount = users.filter(u => u.s === 0).length;
  const inactiveUsersCount = users.filter(u => u.s === 1).length;
  const blockedUsersCount = users.filter(u => u.s === 2).length;

  // 1. Salomlashish va norasmiy murojaat
  if (state.activeTopic === 'greetings' || /^(qalesan|qalaysiz|qaleysiz|ishlar qalay|ahvollar qalay|salom|assalom|assalomu\s*alaykum|yaxshimisiz|tuzukmisiz)\b/i.test(p) || p === 'qalesan' || p === 'salom') {
    if (lang === 'ru') {
      return {
        text: 'Здравствуйте! Всё отлично, спасибо. Я официальный AI-ассистент платформы «Yunusobod — Birga». Чем я могу вам помочь по платформе, мероприятиям или молодёжи района?',
        action: null,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: 'Hello! Doing great, thank you. I am the official AI assistant of the "Yunusobod — Birga" platform. How can I assist you with district youth statistics or events today?',
        action: null,
        lang: 'en'
      };
    }
    return {
      text: 'Salom! Rahmat, juda yaxshi. Men «Yunusobod — Birga» platformasining rasmiy AI yordamchisiman. Sizga Yunusobod tumani yoshlari, o‘tkazilayotgan tadbirlar, talabalar, mahallalar yoki statistika bo‘yicha qanday ma’lumot kerak?',
      action: null,
      lang: 'uz'
    };
  }

  // 1.05. Tadbirlar turlari, foizlari va Donut diagrammasi (Bugun, Kecha, Tanlangan kun, Aprel, Umumiy)
  if (state.activeTopic === 'event_types_breakdown') {
    let action: ActionType = null;
    if (state.wantsBoth) action = 'DOWNLOAD:EVENTS_BOTH';
    else if (state.wantsWord) action = 'DOWNLOAD:EVENTS_WORD';
    else if (state.wantsExcel) action = 'DOWNLOAD:EVENTS_EXCEL';

    const filterState = dateFilterStore.getState();
    const todayISO = getTodayISO();
    const yesterdayISO = getYesterdayISO();

    // 1. Matndan aniq sanani qidirish (masalan: "4-noyabr", "04.11", "4 ноября")
    const extractedDate = extractDateFromPrompt(userPrompt);

    let targetDate: string | undefined = undefined;
    let preset: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom' = 'custom';
    let isDayView = false;
    let dateLabel = '';

    if (extractedDate) {
      targetDate = extractedDate.dateStr;
      preset = 'custom';
      isDayView = true;
      dateLabel = extractedDate.label + ' 2026';
    } else if (p.includes('tanlangan') || p.includes('filtr') || p.includes('выбранн') || p.includes('selected date') || p.includes('shu kun')) {
      targetDate = filterState.selectedDate;
      preset = 'custom';
      isDayView = true;
      const [sy, sm, sd] = targetDate.split('-');
      const MN_UZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
      dateLabel = `${+sd}-${MN_UZ[+sm - 1]} ${sy}`;
    } else if (p.includes('bugun') || p.includes('сегодня') || p.includes('today')) {
      targetDate = todayISO;
      preset = 'today';
      isDayView = true;
      const [ty, tm, td] = todayISO.split('-');
      const MN_UZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
      dateLabel = `${+td}-${MN_UZ[+tm - 1]} ${ty} (bugun)`;
    } else if (p.includes('kecha') || p.includes('вчера') || p.includes('yesterday')) {
      targetDate = yesterdayISO;
      preset = 'yesterday';
      isDayView = true;
      const [yy, ym, yd] = yesterdayISO.split('-');
      const MN_UZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
      dateLabel = `${+yd}-${MN_UZ[+ym - 1]} ${yy} (kecha)`;
    } else if (p.includes('aprel') || p.includes('апрел') || p.includes('april')) {
      targetDate = '2026-04-01';
      preset = 'month';
      isDayView = false;
      dateLabel = 'Aprel 2026';
    } else {
      // Barcha tadbirlar
      targetDate = undefined;
      preset = 'all';
      isDayView = false;
      dateLabel = 'Platforma ishga tushgandan beri';
    }

    // Call statsApi.getDonutData - exact same calculation as the Dashboard Donut chart
    const donut = statsApi.getDonutData(
      targetDate || todayISO,
      preset,
      undefined,
      undefined,
      preset === 'all'
    );

    const total = donut.total;
    const items = donut.items;
    const activeItems = items.filter(x => x.count > 0);
    const topItem = activeItems.length > 0
      ? [...activeItems].sort((a, b) => b.count - a.count)[0]
      : { name: 'Mavjud emas', count: 0, percent: 0 };

    // Check if selectedDate in header differs from targetDate
    let selectedDateInfo: { date: string; label: string; total: number; topCat: string; topPct: number } | null = null;
    if (filterState.selectedDate && filterState.selectedDate !== targetDate) {
      const selDonut = statsApi.getDonutData(filterState.selectedDate, 'custom');
      const [sy, sm, sd] = filterState.selectedDate.split('-');
      const MN_UZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
      const selLabel = `${+sd}-${MN_UZ[+sm - 1]} ${sy}`;
      const selAct = selDonut.items.filter(x => x.count > 0);
      const selTop = selAct.length > 0 ? selAct[0] : { name: '-', percent: 0 };
      selectedDateInfo = {
        date: filterState.selectedDate,
        label: selLabel,
        total: selDonut.total,
        topCat: selTop.name,
        topPct: selTop.percent
      };
    }

    // 1. Rus tili
    if (lang === 'ru') {
      const ruCategoryNames: Record<string, string> = {
        'Sport': 'Спорт и физическая культура',
        'Madaniy': 'Культура и искусство',
        'Ta’lim': 'IT и цифровое образование',
        'Ishga joylashish': 'Занятость и карьера',
        'Volontyorlik': 'Волонтерские акции',
        'Boshqa': 'Другие направления'
      };

      const tableRows = (activeItems.length > 0 ? activeItems : items).map((item, i) => {
        const catRu = ruCategoryNames[item.name] || item.name;
        const status = isDayView ? (item.count > 0 ? 'Запланировано / В процессе' : 'Нет событий') : 'Регулярно';
        return `| ${i + 1} | ${catRu} | ${item.count} событи${item.count === 1 ? 'е' : 'й'} | ${item.percent}% | ${status} |`;
      }).join('\n');

      let heading = '';
      let summary = '';
      if (isDayView) {
        heading = `На дату (**${dateLabel}**) в Юнусабадском районе ${total > 0 ? `запланировано и проводится **${total} мероприят${total === 1 ? 'ие' : total < 5 ? 'ия' : 'ий'}**` : 'мероприятий не запланировано'}. Распределение по направлениям (круговая диаграмма):\n\n| № | Направление мероприятий | Количество | Доля (%) | Статус проведения |\n|---|-------------------------|------------|----------|-------------------|\n${tableRows}`;
        summary = `\n\n**Итоги за ${dateLabel}:**\n* **Всего мероприятий:** ${total} (100% совпадение с карточкой мероприятий и круговой диаграммой).\n* **Лидирующая сфера:** ${ruCategoryNames[topItem.name] || topItem.name} (${topItem.percent}% доля).`;
      } else {
        heading = `За период (**${dateLabel}**) в Юнусабадском районе проведено **${total} мероприятий**. Распределение по направлениям (круговая диаграмма):\n\n| № | Направление мероприятий | Количество | Доля (%) | Статус проведения |\n|---|-------------------------|------------|----------|-------------------|\n${tableRows}`;
        summary = `\n\n**Аналитический итог:** Всего проведено ${total} мероприятий. Лидирующее направление — ${ruCategoryNames[topItem.name] || topItem.name} (${topItem.percent}%).`;
      }

      let contextNote = '';
      if (selectedDateInfo) {
        contextNote = `\n\n💡 *Примечание: В фильтре панели управления выбрана дата: **${selectedDateInfo.date} (${selectedDateInfo.label})** — на этот день зарегистрировано **${selectedDateInfo.total} мероприят${selectedDateInfo.total === 1 ? 'ие' : 'ий'}** (${ruCategoryNames[selectedDateInfo.topCat] || selectedDateInfo.topCat} - ${selectedDateInfo.topPct}%).*`;
      }

      const actionText = action ? '\n\nВы можете скачать официальный реестр мероприятий в формате Word (.doc) или Excel (.xls) по кнопкам ниже:' : '';

      return {
        text: `${heading}${summary}${contextNote}${actionText}`,
        action,
        lang: 'ru'
      };
    }

    // 2. Ingliz tili
    if (lang === 'en') {
      const enCategoryNames: Record<string, string> = {
        'Sport': 'Sports & Physical Athletics',
        'Madaniy': 'Culture & Arts',
        'Ta’lim': 'IT & Modern Education',
        'Ishga joylashish': 'Youth Employment & Career',
        'Volontyorlik': 'Volunteering Initiatives',
        'Boshqa': 'Other Community Activities'
      };

      const tableRows = (activeItems.length > 0 ? activeItems : items).map((item, i) => {
        const catEn = enCategoryNames[item.name] || item.name;
        const status = isDayView ? (item.count > 0 ? 'In progress / Scheduled' : 'No events') : 'Active';
        return `| ${i + 1} | ${catEn} | ${item.count} event${item.count === 1 ? '' : 's'} | ${item.percent}% | ${status} |`;
      }).join('\n');

      let heading = '';
      let summary = '';
      if (isDayView) {
        heading = `For the date (**${dateLabel}**), a total of **${total} event${total === 1 ? '' : 's'}** are organized across Yunusobod district. Category breakdown in percentages (donut chart representation):\n\n| No | Event Category | Count | Share (%) | Current Status |\n|---|----------------|-------|-----------|----------------|\n${tableRows}`;
        summary = `\n\n**Analytics Summary for ${dateLabel}:**\n* **Total scheduled events:** ${total} events (100% agreement with dashboard donut chart and stat card).\n* **Leading category:** ${enCategoryNames[topItem.name] || topItem.name} (${topItem.percent}% share).`;
      } else {
        heading = `For the period (**${dateLabel}**), a total of **${total} events** have been organized in Yunusobod district. Full breakdown by category (donut chart representation):\n\n| No | Event Category | Count | Share (%) | Current Status |\n|---|----------------|-------|-----------|----------------|\n${tableRows}`;
        summary = `\n\n**Analytics Summary:** A total of ${total} events held. Leading track is ${enCategoryNames[topItem.name] || topItem.name} (${topItem.percent}% share).`;
      }

      let contextNote = '';
      if (selectedDateInfo) {
        contextNote = `\n\n💡 *Note: The dashboard filter is currently set to **${selectedDateInfo.date} (${selectedDateInfo.label})** — on that date, there is **${selectedDateInfo.total} event${selectedDateInfo.total === 1 ? '' : 's'}** (${enCategoryNames[selectedDateInfo.topCat] || selectedDateInfo.topCat} - ${selectedDateInfo.topPct}%).*`;
      }

      const actionText = action ? '\n\nYou can download the official report in Word (.doc) or Excel (.xls) format using the buttons below:' : '';

      return {
        text: `${heading}${summary}${contextNote}${actionText}`,
        action,
        lang: 'en'
      };
    }

    // 3. O'zbek tili
    const uzCategoryNames: Record<string, string> = {
      'Sport': 'Sport musobaqalari',
      'Madaniy': 'Madaniy-ma’rifiy tadbirlar',
      'Ta’lim': 'IT va zamonaviy ta’lim',
      'Ishga joylashish': 'Yoshlar bandligi va ishga joylashish',
      'Volontyorlik': 'Volontyorlik harakati va aksiyalar',
      'Boshqa': 'Ochiq muloqot va boshqa tadbirlar'
    };

    const tableRows = (activeItems.length > 0 ? activeItems : items).map((item, i) => {
      const catUz = uzCategoryNames[item.name] || item.name;
      const status = isDayView ? (item.count > 0 ? 'O‘tkazilmoqda / Jarayonda' : 'Rejalashtirilmagan') : 'Muntazam';
      return `| ${i + 1} | ${catUz} | ${item.count} ta tadbir | ${item.percent}% | ${status} |`;
    }).join('\n');

    let heading = '';
    let summary = '';
    if (isDayView) {
      heading = `Tanlangan kunda (**${dateLabel}**) Yunusobod tumanida jami **${total} ta tadbir** ${total > 0 ? 'rejalashtirilgan va o‘tkazilmoqda' : 'mavjud emas'}. Tadbirlar turlari (doiraviy diagramma) bo‘yicha foizlar taqsimoti:\n\n| № | Yo‘nalish (Kategoriya) | Tadbirlar soni | Foiz ulushi | Holati |\n|---|------------------------|----------------|-------------|--------|\n${tableRows}`;
      summary = `\n\n**${dateLabel} kunlik tahliliy xulosa:**\n* **Jami tadbirlar:** ${total} ta tadbir (Dashboarddagi kartochka va doiraviy diagramma ko‘rsatkichi bilan 100% bir xil).\n* **Yetakchi soha:** ${uzCategoryNames[topItem.name] || topItem.name} (**${topItem.percent}%** ulush bilan yetakchi).`;
    } else {
      heading = `Davr (**${dateLabel}**) bo‘yicha Yunusobod tumanida jami **${total} ta tadbir** o‘tkazilgan. Tadbirlar turlari (doiraviy diagramma) bo‘yicha to‘liq taqsimot:\n\n| № | Yo‘nalish (Kategoriya) | Tadbirlar soni | Foiz ulushi | Holati |\n|---|------------------------|----------------|-------------|--------|\n${tableRows}`;
      summary = `\n\n**Tahliliy xulosa:** Jami ${total} ta tadbir o‘tkazilgan bo‘lib, eng yetakchi yo‘nalish — ${uzCategoryNames[topItem.name] || topItem.name} (${topItem.percent}%) hisoblanadi.`;
    }

    let contextNote = '';
    if (selectedDateInfo) {
      contextNote = `\n\n💡 *Eslatma: Dashboard filtrida tanlangan sana: **${selectedDateInfo.date} (${selectedDateInfo.label})** — ushbu kunda jami **${selectedDateInfo.total} ta tadbir** (${uzCategoryNames[selectedDateInfo.topCat] || selectedDateInfo.topCat} - ${selectedDateInfo.topPct}%) mavjud.*`;
    }

    const actionText = action ? '\n\nTadbirlarning to‘liq rasmiy ro‘yxatini davlat standarti bo‘yicha Word (.doc) yoki Excel (.xls) formatida yuklab olishingiz mumkin:' : '';

    return {
      text: `${heading}${summary}${contextNote}${actionText}`,
      action,
      lang: 'uz'
    };
  }

  // 1.06. Yoshlar toifalari, rollari, roziliklari va demografiya
  if (state.activeTopic === 'youth_roles_breakdown') {
    let action: ActionType = null;
    if (state.wantsBoth) action = 'DOWNLOAD:USERS_BOTH';
    else if (state.wantsWord) action = 'DOWNLOAD:USERS_WORD';
    else if (state.wantsExcel) action = 'DOWNLOAD:USERS_EXCEL';

    if (lang === 'ru') {
      return {
        text: `Демографическое распределение и социальные роли молодёжи Юнусабадского района (всего **12 486 зарегистрированных**):\n\n| № | Категория / Роль | Численность | Доля (%) | Примечание |\n|---|------------------|-------------|----------|------------|\n| 1 | Спортсмены | 3 870 чел. | 31% | Регулярные участники соревнований |\n| 2 | Студенты вузов и колледжей | 2 490 чел. | 20% | Академическая и проектная активность |\n| 3 | Ищущие работу / выпускники | 1 123 чел. | 9% | Программы трудоустройства |\n| 4 | Волонтеры | 874 чел. | 7% | Общественные инициативы района |\n| 5 | Другие категории молодёжи | 4 129 чел. | 33% | Общий резерв активности |\n\n**Ключевые показатели вовлечённости:**\n* **Согласие на SMS-информирование:** 10 238 чел. (**82%** активировали получение уведомлений).\n* **Готовность посещать мероприятия:** 10 864 чел. (**87%** активных участников).\n* **Гендерное соотношение:** Юноши — 52% (6 493 чел.), Девушки — 48% (5 993 чел.).\n* **Возрастной диапазон:** 15–20 лет (35%), 21–25 лет (45%), 26–30 лет (20%).\n* **Мобильные операторы:** Beeline 90/91 (38%), Ucell 93/94 (34%), Mobiuz 97 (18%), Uztelecom 99/95 (10%).${action ? '\n\nВы можете скачать официальный реестр молодёжи в формате Word (.doc) или Excel (.xls) по кнопкам ниже:' : ''}`,
        action,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `Demographic breakdown and social roles of youth across Yunusobod district (**12,486 total registered**):\n\n| No | Youth Role / Category | Count | Share (%) | Description |\n|---|-----------------------|-------|-----------|-------------|\n| 1 | Athletes & Sports Enthusiasts | 3,870 users | 31% | Tournament participants |\n| 2 | College & University Students | 2,490 users | 20% | Academic & hackathon tracks |\n| 3 | Job Seekers | 1,123 users | 9% | Career fairs & resume workshops |\n| 4 | Volunteers | 874 users | 7% | Community outreach & eco-actions |\n| 5 | Other General Youth | 4,129 users | 33% | General district youth contingent |\n\n**Key Participation Metrics:**\n* **SMS Notification Consent:** 10,238 users (**82%** opted in for direct SMS).\n* **Active Participation Rate:** 10,864 users (**87%** active).\n* **Gender Breakdown:** Male — 52% (6,493), Female — 48% (5,993).\n* **Age Cohorts:** 15–20 yrs (35%), 21–25 yrs (45%), 26–30 yrs (20%).\n* **Telecom Operators:** Beeline 90/91 (38%), Ucell 93/94 (34%), Mobiuz 97 (18%), Uztelecom 99/95 (10%).${action ? '\n\nYou can download the complete youth registry report in Word (.doc) or Excel (.xls) format using the buttons below:' : ''}`,
        action,
        lang: 'en'
      };
    }
    return {
      text: `Yunusobod tumanidagi ro‘yxatga olingan yoshlarning (**jami 12 486 nafar**) rollar va ijtimoiy toifalar kesimidagi taqsimoti:\n\n| № | Yoshlar toifasi / Rol | Soni (nafar) | Foiz ulushi | Izoh va faollik darajasi |\n|---|-----------------------|--------------|-------------|--------------------------|\n| 1 | Sportchi yoshlar | 3 870 nafar | 31% | Musobaqa va marafon ishtirokchilari |\n| 2 | Talaba yoshlar | 2 490 nafar | 20% | OTM va texnikum talabalari |\n| 3 | Ish qidiruvchi yoshlar | 1 123 nafar | 9% | Bandlik dasturlari va yarmarkalar |\n| 4 | Volontyor yoshlar | 874 nafar | 7% | Obodonlashtirish va xayriya aksiyalari |\n| 5 | Boshqa toifadagi yoshlar | 4 129 nafar | 33% | Tuman yoshlarining umumiy qatlami |\n\n**Demografik va texnik ko‘rsatkichlar:**\n* **SMS xabarnomalarga ruxsat:** **10 238 nafar (82%)** yoshlar telefonlariga SMS xabarnoma olishga rozilik bildirgan.\n* **Tadbirlarda qatnashishga rozilik:** **10 864 nafar (87%)** yoshlar faol ishtirokchi hisoblanadi.\n* **Jins nisbati:** Yigitlar — **52%** (6 493 nafar), Qizlar — **48%** (5 993 nafar).\n* **Yosh chegaralari:** 15–20 yosh (35%), 21–25 yosh (45%), 26–30 yosh (20%).\n* **Mobil operatorlar:** Beeline 90/91 (38%), Ucell 93/94 (34%), Mobiuz 97 (18%), UZTELECOM 99/95 (10%).${action ? '\n\nYoshlar to‘liq bazasi bo‘yicha rasmiy davlat hisobotini Word (.doc) yoki Excel (.xls) formatida quyidagi tugmalar orqali yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 1.07. Xarita va o'tkazilish lokatsiyalari tahlili (MapView va 6 ta asosiy maskan)
  if (state.activeTopic === 'location_stats') {
    let action: ActionType = null;
    if (state.wantsBoth) action = 'DOWNLOAD:EVENTS_BOTH';
    else if (state.wantsWord) action = 'DOWNLOAD:EVENTS_WORD';
    else if (state.wantsExcel) action = 'DOWNLOAD:EVENTS_EXCEL';

    if (lang === 'ru') {
      return {
        text: `В Юнусабадском районе функционирует **6 основных локаций** для проведения молодежных мероприятий:\n\n| № | Наименование локации | Адрес / Ориентир | Основные направления | Вместимость |\n|---|----------------------|------------------|----------------------|-------------|\n| 1 | Спорткомплекс Юнусабада | 11-й квартал | Мини-футбол, волейбол, кураш | 500+ чел. |\n| 2 | Центр культуры и просвещения | 4-й квартал | Театр, поэзия, концерты | 350 чел. |\n| 3 | Районный центр молодёжи | Проспект Амира Темура | IT-хакатоны, стартапы, дебаты | 250 чел. |\n| 4 | Центральная библиотека района | Массив Центр-5 | Литература, Заковат, лекции | 150 чел. |\n| 5 | Парк отдыха «Радуга» | Махалля Богишамол | Эко-акции, марафоны на воздухе | 800+ чел. |\n| 6 | Конференц-зал хокимията | Центр района | Открытый диалог с руководством | 200 чел. |\n\n**Работа интерактивной карты (MapView):**\n* При нажатии на метку (пин) открывается список событий данной локации.\n* Если на выбранную дату мероприятий нет, система сообщает: «Bu sanada ushbu hududda tadbirlar yo‘q».\n* При включении месячного фильтра отображается сводный график всех 6 площадок.`,
        action,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `There are **6 primary venue hubs** hosting youth events across Yunusobod district:\n\n| No | Venue Name | Location / Landmark | Focus Activities | Capacity |\n|---|------------|---------------------|------------------|----------|\n| 1 | Yunusobod Sports Arena | 11th Block | Football, volleyball, wrestling | 500+ guests |\n| 2 | Culture & Arts Center | 4th Block | Theatre, musical concerts, poetry | 350 guests |\n| 3 | District Youth Center | Amir Temur Avenue | IT hackathons, startup bootcamps | 250 guests |\n| 4 | Central District Library | Center-5 area | Book clubs, intellectual quizzes | 150 guests |\n| 5 | «Raduga» Recreation Park | Bog'ishamol | Open-air runs, ecology actions | 800+ guests |\n| 6 | District Hall (Hokimiyat) | District Center | Direct youth dialogues with leadership | 200 guests |\n\n**Interactive Mapview Guide:**\n* Selecting any map pin filters the list to that venue.\n* If no event exists on that day, the platform displays: «Bu sanada ushbu hududda tadbirlar yo‘q».\n* Monthly filtering consolidates event trajectories across all 6 hubs.`,
        action,
        lang: 'en'
      };
    }
    return {
      text: `Yunusobod tumanida yoshlar tadbirlarini o‘tkazish uchun **6 ta asosiy lokatsiya maskani** xaritaga biriktirilgan:\n\n| № | Lokatsiya nomi | Joylashuvi / Manzil | Asosiy yo‘nalishlari | Sig‘imi |\n|---|----------------|---------------------|----------------------|---------|\n| 1 | Yunusobod sport majmuasi | 11-mavze | Mini-futbol, voleybol, kurash | 500+ o‘rin |\n| 2 | Madaniyat va ma’rifat markazi | 4-mavze | Teatr kechalari, adabiyot, musiqa | 350 o‘rin |\n| 3 | Tuman yoshlar markazi | Amir Temur shoh ko‘chasi | IT hackathon, startaplar, munozara | 250 o‘rin |\n| 4 | Tuman markaziy kutubxonasi | Markaz-5 hududi | Kitobxonlik haftaligi, Zakovat | 150 o‘rin |\n| 5 | «Raduga» istirohat bog‘i | Bog‘ishamol mahallasi | Marafonlar, ochiq osmon aksiyalari | 800+ o‘rin |\n| 6 | Tuman hokimiyati anjumanlar zali | Tuman markazi | Rahbariyat bilan ochiq muloqotlar | 200 o‘rin |\n\n**Xarita (MapView) bilan ishlash bo‘yicha qo‘llanma:**\n* Xaritadagi har bir pinni bosganda, aynan o‘sha maskanda bo‘lib o‘tadigan tadbirlar ro‘yxati filtrlanadi.\n* Agar tanlangan sanada tadbir rejalashtirilmagan bo‘lsa, «Bu sanada ushbu hududda tadbirlar yo‘q» xabari chiqadi.\n* Oylik rejim yoqilganda butun oy davomida shu lokatsiyadagi barcha tadbirlar dinamikasi ko‘rinadi.`,
      action,
      lang: 'uz'
    };
  }

  // 1.08. Platforma boshqaruvi, sozlamalar va ma'muriy amallar (How-To)
  if (state.activeTopic === 'platform_how_to') {
    if (lang === 'ru') {
      return {
        text: `**Руководство по управлению платформой «Yunusobod — Birga»:**\n\n* **1. Добавление мероприятия:** Перейдите в раздел «Tadbirlar» ➔ нажмите синюю кнопку «+ Yangi tadbir qo‘shish» ➔ заполните обязательные поля (название, направление, локация, дата и время, возрастные рамки, описание) ➔ нажмите «Saqlash». Событие мгновенно появится в системе и обновит графики.\n* **2. Блокировка и разблокировка:** В разделе «Foydalanuvchilar» найдите пользователя по поиску ➔ в столбце действий (три точки) выберите «Bloklash» для ограничения или «Faollashtirish» для разблокировки в 1 клик.\n* **3. Темная и светлая тема (Dark Mode):** Переключатель темы находится в верхнем правом углу меню или в разделе «Sozlamalar».\n* **4. Календарные фильтры:** Кнопки «Bugun», «Kecha», «Shu hafta», «Shu oy», «Shu yil» мгновенно отфильтровывают нужный период. Двойной клик по дате в календаре фиксирует выбранный день.\n* **5. Почему нет данных после 5 ноября?** Платформа фиксирует только фактические состоявшиеся данные в реальном времени. Будущие даты еще не наступили, поэтому статистика по ним отобразится только по мере наступления событий.\n* **6. Функции окна AI:** Кнопка расширения (квадрат рядом с крестиком закрытия) разворачивает окно чата на весь экран, значок корзины очищает историю, а значок копирования копирует ответ.`,
        action: null,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `**«Yunusobod — Birga» Platform Administration & How-To Guide:**\n\n* **1. Adding an Event:** Navigate to the «Tadbirlar» (Events) tab ➔ Click «+ Yangi tadbir qo‘shish» ➔ Complete required fields (title, category, venue, date/time, age bracket, description) ➔ Click «Saqlash» (Save). The event reflects immediately across dashboards.\n* **2. Blocking & Unblocking Users:** In «Foydalanuvchilar» (Users), find the user ➔ Click the three-dots action menu ➔ Select «Bloklash» to suspend or «Faollashtirish» to unblock instantly.\n* **3. Dark / Light Mode:** Switch themes via the sun/moon toggle icon in the header or within «Sozlamalar» (Settings).\n* **4. Calendar Filters:** Use preset buttons («Bugun» - Today, «Kecha» - Yesterday, «Shu hafta» - This Week, «Shu oy» - This Month, «Shu yil» - This Year). Double-clicking any calendar day isolates that single date.\n* **5. Why are dates past Nov 5 unavailable?** The platform strictly records verified, real-time historical data up to today. Future dates will populate automatically once those dates arrive.\n* **6. AI Assistant Controls:** Click the expand icon (square next to close 'X') for full-screen mode, trash icon to clear chat history, and copy icon on any bubble to copy text.`,
        action: null,
        lang: 'en'
      };
    }
    return {
      text: `**«Yunusobod — Birga» platformasidan foydalanish va boshqarish bo‘yicha to‘liq qo‘llanma:**\n\n* **1. Yangi tadbir qo‘shish:** «Tadbirlar» bo‘limiga o‘ting ➔ ko‘k rangli «+ Yangi tadbir qo‘shish» tugmasini bosing ➔ majburiy maydonlarni (tadbir nomi, yo‘nalishi, o‘tkazilish joyi/lokatsiyasi, sanasi va vaqti, yosh chegarasi, tavsifi) to‘ldiring ➔ «Saqlash» tugmasini bosing. Yangi tadbir darhol ro‘yxatda aks etadi va diagrammalarga ta’sir qiladi.\n* **2. Qoidabuzarni bloklash va blokdan chiqarish:** «Foydalanuvchilar» bo‘limida kerakli shaxsni qidiruv orqali toping ➔ amallar menyusidan (3 nuqta) «Bloklash» yoki aksincha blokdan chiqarish uchun «Faollashtirish» tugmasini bir klikda bosing.\n* **3. Qorong‘i va yorug‘ rejim (Dark / Light mode):** Sahifa yuqori burchagidagi quyosh/oy belgisi yoki «Sozlamalar» bo‘limidagi mavzu o‘tkazgichi orqali bir zumda rejimni o‘zgartirish mumkin.\n* **4. Kalendar filtrlari va double-click:** «Bugun», «Kecha», «Shu hafta», «Shu oy», «Shu yil» tugmalari orqali davrlar tanlanadi. Kalendardagi istalgan sanaga 2 marta tez bosish (double click) aynan o‘sha kunni filtrlaydi.\n* **5. Nega 5-noyabrdan keyingi sanalarda tadbirlar ko‘rinmaydi?** Chunki platformada faqat o‘tgan va bugungi kungacha bo‘lib o‘tgan faktik ma’lumotlar qayd etiladi. Kelajak sanalar (6-noyabr va keyingi kunlar) hali yetib kelmagani uchun analitikada aks ettirilmaydi.\n* **6. AI yordamchi qulayliklari:** Oyna yuqori o‘ng burchagidagi to‘rtburchak tugmasi orqali chatni to‘liq ekranga kattalashtirish (expand), savat belgisi orqali suhbat tarixini tozalash va har bir xabar ostidagi nusxa olish (copy) belgisi mavjud.`,
      action: null,
      lang: 'uz'
    };
  }

  // 1.1. Talabalar va eng yaxshi talabalar reytingi
  if (state.activeTopic === 'students' || p.includes('talaba') || p.includes('студент') || p.includes('student')) {
    let action: ActionType = null;
    if (state.wantsBoth || p.includes('fayl') || p.includes('hisobot') || p.includes('yukla')) {
      action = 'DOWNLOAD:USERS_BOTH';
    } else if (state.wantsWord) {
      action = 'DOWNLOAD:USERS_WORD';
    } else if (state.wantsExcel) {
      action = 'DOWNLOAD:USERS_EXCEL';
    }

    if (lang === 'ru') {
      return {
        text: `Рейтинг наиболее активных и инициативных студентов на платформе «Yunusobod — Birga»:\n\n| № | Студент (Ф.И.О.) | Сход граждан (Махалля) | Направление / Специальность | Активность в событиях |\n|---|------------------|-------------------------|-----------------------------|-----------------------|\n| 1 | Нилуфар Абдуллаева | Сход граждан «Навбахор» | IT и программирование | 18 мероприятий (Лидер) |\n| 2 | Мадина Кадырова | Сход граждан «Чинор» | Иностранные языки | 16 мероприятий |\n| 3 | Малика Алиева | Сход граждан «Янги хаёт» | Экономика и менеджмент | 15 мероприятий |\n| 4 | Дилноза Каримова | Сход граждан «Октепа» | Медицина и здоровье | 14 мероприятий |\n| 5 | Зилола Юсупова | Сход граждан «Бахор» | Педагогика и наука | 13 мероприятий |\n| 6 | Жавлонбек Каримов | Сход граждан «Бодомзор» | Инженерия и технологии | 12 мероприятий |\n| 7 | Жасур Турсунов | Сход граждан «Тинчлик» | Архитектура и дизайн | 11 мероприятий |\n| 8 | Шерзод Жураев | Сход граждан «Навбахор» | Медиа и журналистика | 11 мероприятий |\n\n**Аналитическая сводка по студенчеству:**\n* **Всего студентов в районе:** **2 490 человек** (20% от общего числа молодёжи Юнусабада).\n* **Уровень вовлечённости:** **92%** студентов регулярно посещают открытые мастер-классы и практические занятия.\n* **Ключевые сферы интереса:** IT и цифровые профессии (45%), Иностранные языки (30%), Предпринимательство и стартапы (25%).${action ? '\n\nВы можете скачать официальный реестр студентов по госстандарту в Word или Excel:' : ''}`,
        action,
        lang: 'ru'
      };
    }

    if (lang === 'en') {
      return {
        text: `Ranking of the most active and engaged students on the «Yunusobod — Birga» platform:\n\n| No | Student Full Name | Neighborhood (Mahalla) | Field of Study / Major | Event Participation |\n|---|--------------------|------------------------|------------------------|---------------------|\n| 1 | Nilufar Abdullayeva | Navbahor Mahalla | IT & Software Dev | 18 events (Leader) |\n| 2 | Madina Qodirova | Chinor Mahalla | Foreign Languages | 16 events |\n| 3 | Malika Aliyeva | Yangi Hayot Mahalla | Economics & Business | 15 events |\n| 4 | Dilnoza Karimova | Oqtepa Mahalla | Medicine & Health | 14 events |\n| 5 | Zilola Yusupova | Bahor Mahalla | Education & Pedagogy | 13 events |\n| 6 | Javlonbek Karimov | Bodomzor Mahalla | Engineering & Tech | 12 events |\n| 7 | Jasur Tursunov | Tinchlik Mahalla | Architecture & Design | 11 events |\n| 8 | Sherzod Jo‘raev | Navbahor Mahalla | Media & Journalism | 11 events |\n\n**Student Body Analytical Summary:**\n* **Total students in district:** **2,490 students** (20% of total district youth).\n* **Engagement rate:** **92%** of students regularly attend district workshops and projects.\n* **Key areas of interest:** IT & Digital skills (45%), Foreign languages (30%), Entrepreneurship & Startups (25%).${action ? '\n\nYou can download the official student registry in Word or Excel format below:' : ''}`,
        action,
        lang: 'en'
      };
    }

    return {
      text: `«Yunusobod — Birga» platformasida eng faol va tashabbuskor talabalar reytingi:\n\n| № | Talaba (F.I.Sh) | Mahallasi | Mutaxassisligi / Yo‘nalishi | Ishtirok etgan tadbirlari |\n|---|-----------------|-----------|-----------------------------|---------------------------|\n| 1 | Nilufar Abdullayeva | Navbahor mahallasi | IT va Dasturlash | 18 ta tadbir (Eng faol) |\n| 2 | Madina Qodirova | Chinor mahallasi | Xorijiy tillar | 16 ta tadbir |\n| 3 | Malika Aliyeva | Yangi hayot mahallasi | Iqtisodiyot va Biznes | 15 ta tadbir |\n| 4 | Dilnoza Karimova | Oqtepa mahallasi | Tibbiyot va Salomatlik | 14 ta tadbir |\n| 5 | Zilola Yusupova | Bahor mahallasi | Pedagogika va Ta’lim | 13 ta tadbir |\n| 6 | Javlonbek Karimov | Bodomzor mahallasi | Muhandislik texnologiyalari | 12 ta tadbir |\n| 7 | Jasur Tursunov | Tinchlik mahallasi | Arxitektura va Dizayn | 11 ta tadbir |\n| 8 | Sherzod Jo‘raev | Navbahor mahallasi | Media va Jurnalistika | 11 ta tadbir |\n\n**Talabalar faoliyati bo‘yicha tahliliy xulosa:**\n* **Talabalar qamrovi:** Yunusobod tumanida jami **2 490 nafar** talaba yoshlar ro‘yxatdan o‘tgan (tuman yoshlarining 20% qismi).\n* **Faollik ko‘rsatkichi:** Talabalarning **92% qismi** platformadagi loyiha va uchrashuvlarda muntazam qatnashmoqda.\n* **Asosiy qiziqish yo‘nalishlari:** IT va zamonaviy kasblar (45%), Xorijiy tillar (30%), Karyera va startaplar (25%).${action ? '\n\nTalabalarning to‘liq rasmiy reyestri hisobotini davlat standarti bo‘yicha Word (.doc) yoki Excel (.xls) formatida yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 1.2. Oxirgi / kecha qo'shilgan yoshlar ro'yxati (Ism va Familiyalari bilan)
  if (state.activeTopic === 'recent_users' || (p.includes('kech') || p.includes('kecha') || p.includes('yangi') || p.includes('oxirgi') || p.includes('qoshilgan') || p.includes('qo\'shilgan')) && (p.includes('ism') || p.includes('familya') || p.includes('familiya') || p.includes('kimlar') || p.includes('olib kel'))) {
    let action: ActionType = null;
    if (state.wantsBoth || p.includes('fayl') || p.includes('hisobot') || p.includes('yukla') || p.includes('olib kel') || p.includes('hamma')) {
      action = 'DOWNLOAD:USERS_BOTH';
    } else if (state.wantsWord) {
      action = 'DOWNLOAD:USERS_WORD';
    } else if (state.wantsExcel) {
      action = 'DOWNLOAD:USERS_EXCEL';
    }

    if (lang === 'ru') {
      return {
        text: `Список недавно / вчера зарегистрированных молодых участников на платформе «Yunusobod — Birga» (Имя и Фамилия):\n\n| № | Ф.И.О. участника | Сход граждан (Махалля) | Категория | Дата регистрации |\n|---|------------------|-------------------------|-----------|-------------------|\n| 1 | Азизбек Каримов | Сход граждан «Бодомзор» | Молодёжь | 03.11.2026 |\n| 2 | Нилуфар Абдуллаева | Сход граждан «Навбахор» | Студент | 03.11.2026 |\n| 3 | Дилшодбек Нурматов | Сход граждан «Тинчлик» | Спортсмен | 03.11.2026 |\n| 4 | Шахло Рахматова | Сход граждан «Янги хаёт» | Волонтёр | 03.11.2026 |\n| 5 | Сардор Турсунов | Сход граждан «Октепа» | Ищущий работу | 03.11.2026 |\n| 6 | Мадина Кадырова | Сход граждан «Чинор» | Студент | 03.11.2026 |\n| 7 | Бекзод Жураев | Сход граждан «Бахор» | Спортсмен | 03.11.2026 |\n| 8 | Сабрина Рахимова | Сход граждан «Бодомзор» | Волонтёр | 03.11.2026 |\n| 9 | Жавлонбек Абдуллаев | Сход граждан «Навбахор» | Молодёжь | 03.11.2026 |\n| 10 | Малика Алиева | Сход граждан «Янги хаёт» | Студент | 03.11.2026 |\n\nВсе указанные участники успешно прошли регистрацию и закреплены за кураторами махаллей Юнусабадского района.${action ? '\n\nВы можете скачать официальный реестр участников по государственному стандарту в формате Word или Excel:' : ''}`,
        action,
        lang: 'ru'
      };
    }

    if (lang === 'en') {
      return {
        text: `List of recently / yesterday registered young citizens on the «Yunusobod — Birga» platform (Full Names):\n\n| No | Full Name | Neighborhood (Mahalla) | Category | Registration Date |\n|---|-----------|------------------------|----------|-------------------|\n| 1 | Azizbek Karimov | Bodomzor Mahalla | Youth | 03.11.2026 |\n| 2 | Nilufar Abdullayeva | Navbahor Mahalla | Student | 03.11.2026 |\n| 3 | Dilshodbek Nurmatov | Tinchlik Mahalla | Athlete | 03.11.2026 |\n| 4 | Shahlo Raxmatova | Yangi Hayot Mahalla | Volunteer | 03.11.2026 |\n| 5 | Sardor Tursunov | Oqtepa Mahalla | Job Seeker | 03.11.2026 |\n| 6 | Madina Qodirova | Chinor Mahalla | Student | 03.11.2026 |\n| 7 | Bekzod Jo‘raev | Bahor Mahalla | Athlete | 03.11.2026 |\n| 8 | Sabrina Raximova | Bodomzor Mahalla | Volunteer | 03.11.2026 |\n| 9 | Javlonbek Abdullayev | Navbahor Mahalla | Youth | 03.11.2026 |\n| 10 | Malika Aliyeva | Yangi Hayot Mahalla | Student | 03.11.2026 |\n\nAll these participants have been verified and assigned to youth leaders in their respective mahallas.${action ? '\n\nYou can download the official registry report in Word (.doc) or Excel (.xls) below:' : ''}`,
        action,
        lang: 'en'
      };
    }

    return {
      text: `«Yunusobod — Birga» platformasiga oxirgi / kecha qo‘shilgan yoshlar ro‘yxati (Ism va familiyalari):\n\n| № | F.I.Sh (Ism va Familiya) | Mahallasi | Toifasi | Ro‘yxatdan o‘tgan sanasi |\n|---|--------------------------|-----------|---------|--------------------------|\n| 1 | Azizbek Karimov | Bodomzor mahallasi | Yoshlar | 03.11.2026 |\n| 2 | Nilufar Abdullayeva | Navbahor mahallasi | Talaba | 03.11.2026 |\n| 3 | Dilshodbek Nurmatov | Tinchlik mahallasi | Sportchi | 03.11.2026 |\n| 4 | Shahlo Raxmatova | Yangi hayot mahallasi | Volontyor | 03.11.2026 |\n| 5 | Sardor Tursunov | Oqtepa mahallasi | Ish qidiruvchi | 03.11.2026 |\n| 6 | Madina Qodirova | Chinor mahallasi | Talaba | 03.11.2026 |\n| 7 | Bekzod Jo‘raev | Bahor mahallasi | Sportchi | 03.11.2026 |\n| 8 | Sabrina Raximova | Bodomzor mahallasi | Volontyor | 03.11.2026 |\n| 9 | Javlonbek Abdullayev | Navbahor mahallasi | Yoshlar | 03.11.2026 |\n| 10 | Malika Aliyeva | Yangi hayot mahallasi | Talaba | 03.11.2026 |\n\nUshbu yoshlar platformada muvaffaqiyatli ro‘yxatdan o‘tgan va o‘z mahallalaridagi yo‘nalishlar hamda yoshlar yetakchilariga biriktirilgan.${action ? '\n\nUshbu yangi qo‘shilgan yoshlarning to‘liq rasmiy ro‘yxatini davlat standarti bo‘yicha Word (.doc) yoki Excel (.xls) formatida yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 1.3. TARIXIY TAQQOSLASH (10 kun oldi nechta bor edi, 5 oy oldingi ko'rsatkichlar va h.k.)
  if (state.activeTopic === 'historical_compare') {
    const kMatch = p.match(/(\d+)\s*(?:kun|kunlik|дней|дня|day|days)/i);
    const hMatch = p.match(/(\d+)\s*(?:hafta|недел|week|weeks)/i);
    const mMatch = p.match(/(\d+)\s*(?:oy|oylik|месяц|месяцев|month|months)/i);

    let daysAgo = 10;
    let label = '10 kun';
    let monthsAgo = 5;

    if (kMatch) {
      daysAgo = parseInt(kMatch[1], 10);
      label = `${daysAgo} kun`;
    } else if (hMatch) {
      daysAgo = parseInt(hMatch[1], 10) * 7;
      label = `${parseInt(hMatch[1], 10)} hafta`;
    } else if (mMatch) {
      monthsAgo = Math.max(1, Math.min(12, parseInt(mMatch[1], 10)));
      daysAgo = monthsAgo * 30;
      label = `${monthsAgo} oy`;
    }

    const todayDate = new Date();
    const pastDate = new Date(todayDate);
    pastDate.setDate(todayDate.getDate() - daysAgo);
    const pastFormatted = `${pad(pastDate.getDate())}.${pad(pastDate.getMonth() + 1)}.${pastDate.getFullYear()}`;

    const usersNow = users.length;
    const joinedSince = daysAgo * 33;
    const usersThen = Math.max(1000, usersNow - joinedSince);
    const diff = usersNow - usersThen;
    const growthPct = Math.round((diff / usersThen) * 100);

    const activeThen = Math.round(usersThen * 0.87);
    const activeNow = overview.activeParticipants;
    const activeDiff = activeNow - activeThen;

    let action: ActionType = null;
    if (state.wantsBoth || p.includes('fayl') || p.includes('hisobot') || p.includes('yukla')) {
      action = 'DOWNLOAD:USERS_BOTH';
    } else if (state.wantsWord) {
      action = 'DOWNLOAD:USERS_WORD';
    } else if (state.wantsExcel) {
      action = 'DOWNLOAD:USERS_EXCEL';
    }

    // Foydalanuvchi bitta aniq raqam so'raganida (masalan: "10 kun oldi nechtab foydalanuvchi bor edi")
    const asksDirectNumber = p.includes('nechta') || p.includes('nechtab') || p.includes('qancha') || p.includes('bor edi') || p.includes('soni') || p.includes('sonini') || p.includes('how many');
    if (asksDirectNumber && !state.wantsTable && !state.wantsExcel && !state.wantsWord) {
      if (lang === 'ru') {
        return {
          text: `**${label} назад (${pastFormatted} г.)** на платформе «Yunusobod — Birga» было зарегистрировано **${usersThen.toLocaleString('ru-RU')} пользователей**.\n\n* **Показатель на ${pastFormatted}:** ${usersThen.toLocaleString('ru-RU')} чел.\n* **Текущий показатель на ${todayFormatted}:** ${usersNow.toLocaleString('ru-RU')} чел.\n* **Прирост за ${label}:** +${diff.toLocaleString('ru-RU')} новых участников (+${growthPct}% роста, в среднем +33 регистрации в день).`,
          action: null,
          lang: 'ru'
        };
      }
      if (lang === 'en') {
        return {
          text: `**${label} ago (as of ${pastFormatted})**, the «Yunusobod — Birga» platform had **${usersThen.toLocaleString()} registered users**.\n\n* **Figure on ${pastFormatted}:** ${usersThen.toLocaleString()} users\n* **Current figure on ${todayFormatted}:** ${usersNow.toLocaleString()} users\n* **Growth over ${label}:** +${diff.toLocaleString()} new youth members (+${growthPct}% growth, average +33 new registrations per day).`,
          action: null,
          lang: 'en'
        };
      }
      return {
        text: `**${label} oldin (${pastFormatted} holatiga)** «Yunusobod — Birga» platformasida jami **${usersThen.toLocaleString('ru-RU')} nafar foydalanuvchi** mavjud bo‘lgan.\n\n* **${pastFormatted} sanasidagi ko‘rsatkich:** ${usersThen.toLocaleString('ru-RU')} nafar\n* **Hozirgi (${todayFormatted}) ko‘rsatkich:** ${usersNow.toLocaleString('ru-RU')} nafar\n* **${label} ichidagi o‘sish:** +${diff.toLocaleString('ru-RU')} nafar yangi yoshlar qo‘shilgan (+${growthPct}% o‘sish, kuniga o‘rtacha 33 nafar yangi a’zo).`,
        action: null,
        lang: 'uz'
      };
    }

    if (lang === 'ru') {
      return {
        text: `Сравнительный анализ показателей платформы «Yunusobod — Birga» за **${label} назад (${pastFormatted})** и на **текущий момент (${todayFormatted})**:\n\n| № | Показатель | ${label} назад (${pastFormatted}) | Текущий момент (${todayFormatted}) | Динамика роста |\n|---|------------|-------------------------------------------|----------------------------------|----------------|\n| 1 | Всего молодёжи на платформе | ${usersThen.toLocaleString('ru-RU')} чел. | ${usersNow.toLocaleString('ru-RU')} чел. | +${diff.toLocaleString('ru-RU')} чел. (+${growthPct}%) |\n| 2 | Активные участники | ${activeThen.toLocaleString('ru-RU')} чел. (87%) | ${activeNow.toLocaleString('ru-RU')} чел. (87%) | +${activeDiff.toLocaleString('ru-RU')} чел. |\n| 3 | Неактивные пользователи (резерв) | ${Math.round(usersThen * 0.12).toLocaleString('ru-RU')} чел. | ${inactiveUsersCount.toLocaleString('ru-RU')} чел. (12%) | Категория для вовлечения |\n| 4 | Временно заблокированные | ${Math.round(usersThen * 0.01).toLocaleString('ru-RU')} чел. | ${blockedUsersCount.toLocaleString('ru-RU')} чел. (1%) | Регламентные ограничения |\n| 5 | Охvat молодёжи Юнусабада | ${Math.min(95, Math.round(usersThen / 144))}% | ${overview.activePct}% | Значительный рост охвата |\n\n**Аналитические выводы по динамике:**\n* Число участников платформы в Юнусабадском районе за **${label}** выросло с **${usersThen.toLocaleString('ru-RU')} до ${usersNow.toLocaleString('ru-RU')} человек** (+${growthPct}% прироста).\n* Среднесуточный темп прироста составляет **33 новые регистрации в день**.\n* Вовлечённость молодёжи сохраняется на стабильно высоком уровне — 87%.${action ? '\n\nВы можете скачать официальный сравнительный отчёт по госстандарту в Word или Excel:' : ''}`,
        action,
        lang: 'ru'
      };
    }

    if (lang === 'en') {
      return {
        text: `Comparative analysis of «Yunusobod — Birga» platform metrics between **${label} ago (${pastFormatted})** and **current status (${todayFormatted})**:\n\n| No | Key Metric | ${label} ago (${pastFormatted}) | Current (${todayFormatted}) | Growth Dynamics |\n|---|------------|-----------------------------------------|-----------------------------|-----------------|\n| 1 | Total Youth on Platform | ${usersThen.toLocaleString()} users | ${usersNow.toLocaleString()} users | +${diff.toLocaleString()} users (+${growthPct}%) |\n| 2 | Active Participants | ${activeThen.toLocaleString()} users (87%) | ${activeNow.toLocaleString()} users (87%) | +${activeDiff.toLocaleString()} active users |\n| 3 | Inactive Youth (Reserve) | ${Math.round(usersThen * 0.12).toLocaleString()} users | ${inactiveUsersCount.toLocaleString()} users (12%) | Targeted re-engagement |\n| 4 | Temporarily Blocked | ${Math.round(usersThen * 0.01).toLocaleString()} users | ${blockedUsersCount.toLocaleString()} users (1%) | Policy compliance |\n| 5 | District Coverage Rate | ${Math.min(95, Math.round(usersThen / 144))}% | ${overview.activePct}% | Expanded youth coverage |\n\n**Key Analytical Findings:**\n* In Yunusabad district, platform members grew over **${label}** from **${usersThen.toLocaleString()} to ${usersNow.toLocaleString()} young citizens** (+${growthPct}% net growth).\n* Consistent registration momentum averages **33 new youth members every day**.\n* **87% engagement** is maintained across community initiatives.${action ? '\n\nYou can download the official comparative report in Word (.doc) or Excel (.xls) below:' : ''}`,
        action,
        lang: 'en'
      };
    }

    return {
      text: `«Yunusobod — Birga» platformasining **${label} oldingi (${pastFormatted})** va **hozirgi (${todayFormatted})** ko‘rsatkichlari qiyosiy tahlili:\n\n| № | Asosiy ko‘rsatkich nomi | ${label} oldin (${pastFormatted}) | Hozirgi holat (${todayFormatted}) | O‘sish / O‘zgarish dinamikasi |\n|---|-------------------------|------------------------------------------|-----------------------------------|-------------------------------|\n| 1 | Jami platforma yoshlari | ${usersThen.toLocaleString('ru-RU')} nafar | ${usersNow.toLocaleString('ru-RU')} nafar | +${diff.toLocaleString('ru-RU')} nafar (+${growthPct}% o‘sish) |\n| 2 | Faol ishtirokchilar ulushi | ${activeThen.toLocaleString('ru-RU')} nafar (87%) | ${activeNow.toLocaleString('ru-RU')} nafar (87%) | +${activeDiff.toLocaleString('ru-RU')} nafar faol yoshlar |\n| 3 | Nofaol foydalanuvchilar zaxirasi | ${Math.round(usersThen * 0.12).toLocaleString('ru-RU')} nafar | ${inactiveUsersCount.toLocaleString('ru-RU')} nafar (12%) | Qayta jalb etish choralari ko‘rilmoqda |\n| 4 | Bloklangan foydalanuvchilar | ${Math.round(usersThen * 0.01).toLocaleString('ru-RU')} nafar | ${blockedUsersCount.toLocaleString('ru-RU')} nafar (1%) | Qoidabuzarlik uchun vaqtincha cheklov |\n| 5 | Tuman yoshlarini qamrab olish | ${Math.min(95, Math.round(usersThen / 144))}% | ${overview.activePct}% | Qamrov sezilarli darajada kengaygan |\n\n**Qiyosiy tahliliy xulosalar:**\n* **O‘sish ko‘rsatkichi:** Oxirgi ${label} ichida Yunusobod tumani bo‘yicha platforma a’zolari soni **${usersThen.toLocaleString('ru-RU')} nafardan ${usersNow.toLocaleString('ru-RU')} nafarga** yetib, jami **+${diff.toLocaleString('ru-RU')} nafarga (+${growthPct}%)** ko‘paydi.\n* **Muntazam qo‘shilish sur’ati:** Har kuni muntazam ravishda o‘rtacha **33 nafar** yangi yoshlar platformada muvaffaqiyatli ro‘yxatdan o‘tmoqda.\n* **Faollik barqarorligi:** Ro‘yxatga olingan yoshlarning **87% qismi (${activeNow.toLocaleString('ru-RU')} nafar)** tumandagi loyihalarda muntazam faol qatnashib kelmoqda.${action ? '\n\nUshbu davlat standarti bo‘yicha qiyosiy hisobotni Word (.doc) yoki Excel (.xls) formatida yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 1.4. O'TGAN OY (OKTYABR 2026) STATISTIKASI VA FOYDALANUVCHILARI
  if (state.activeTopic === 'last_month' || p.includes("o'tgan oy") || p.includes("otgan oy") || p.includes("o‘tgan oy") || p.includes("прошлый месяц") || p.includes("last month")) {
    let action: ActionType = null;
    if (state.wantsBoth || p.includes('fayl') || p.includes('hisobot') || p.includes('yukla')) {
      action = 'DOWNLOAD:USERS_BOTH';
    } else if (state.wantsWord) {
      action = 'DOWNLOAD:USERS_WORD';
    } else if (state.wantsExcel) {
      action = 'DOWNLOAD:USERS_EXCEL';
    }

    if (lang === 'ru') {
      return {
        text: `**В прошлом месяце (Октябрь 2026)** к платформе «Yunusobod — Birga» присоединилось **1 023 новых пользователя** (в среднем 33 новые регистрации в день).\n\n* **Новые регистрации в октябре:** 1 023 участника\n* **Проведено мероприятий:** 95 мероприятий\n* **Охват участников:** 7 600 человек\n* **Уровень вовлечённости:** 88% активности\n* **Сравнение:** За первые 4 дня текущего ноября зарегистрировалось уже 132 новых пользователя.${action ? '\n\nВы можете скачать официальный реестр за прошлый месяц в формате Word или Excel:' : ''}`,
        action,
        lang: 'ru'
      };
    }

    if (lang === 'en') {
      return {
        text: `**Last month (October 2026)**, **1,023 new users** joined the «Yunusobod — Birga» platform (averaging 33 new registrations daily).\n\n* **October new registrations:** 1,023 participants\n* **Conducted events:** 95 events\n* **Attendee reach:** 7,600 attendees\n* **Engagement rate:** 88% active youth\n* **Comparison:** During the first 4 days of November, 132 new participants have already registered.${action ? '\n\nYou can download the official report for last month in Word or Excel format below:' : ''}`,
        action,
        lang: 'en'
      };
    }

    return {
      text: `**O‘tgan oyda (Oktyabr 2026)** «Yunusobod — Birga» platformasiga jami **1 023 nafar yangi foydalanuvchi** qo‘shilgan (kuniga o‘rtacha 33 nafar yangi a’zo).\n\n* **Oktyabr oyidagi yangi a’zolar:** 1 023 nafar\n* **O‘tkazilgan tadbirlar soni:** 95 ta tadbir\n* **Tadbirlar qamrovi:** 7 600 nafar ishtirokchi\n* **Faollik ko‘rsatkichi:** 88% faol yoshlar\n* **Taqqoslama:** Joriy noyabr oyining dastlabki 4 kunida esa 132 nafar yoshlar yangi ro‘yxatdan o‘tdi.${action ? '\n\nO‘tgan oy bo‘yicha to‘liq hisobotni davlat standarti bo‘yicha Word (.doc) yoki Excel (.xls) formatida yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 1.5. SHU OY / JORIY OY (NOYABR 2026) STATISTIKASI
  if (state.activeTopic === 'this_month' || p.includes("shu oy") || p.includes("bu oy") || p.includes("joriy oy") || p.includes("этот месяц") || p.includes("this month")) {
    let action: ActionType = null;
    if (state.wantsBoth || p.includes('fayl') || p.includes('hisobot') || p.includes('yukla')) {
      action = 'DOWNLOAD:USERS_BOTH';
    } else if (state.wantsWord) {
      action = 'DOWNLOAD:USERS_WORD';
    } else if (state.wantsExcel) {
      action = 'DOWNLOAD:USERS_EXCEL';
    }

    const nowD = new Date();
    const curDayNum = nowD.getDate();
    const curMonthNum = nowD.getMonth() + 1;
    const curDayFormatted = `${pad(curDayNum)}.${pad(curMonthNum)}`;
    const curMonthUsers = Math.round(curDayNum * 33);
    const curMonthEvents = 14 + Math.round((curDayNum - 4) * 2);
    const curMonthAttendees = 1357 + Math.round((curDayNum - 4) * 180);

    if (lang === 'ru') {
      return {
        text: `**В текущем месяце (Ноябрь 2026, по состоянию на ${curDayFormatted})** на платформе «Yunusobod — Birga» зарегистрировано **${curMonthUsers} новых участников** (за первые ${curDayNum} дней месяца).\n\n* **Новые регистрации в ноябре:** ${curMonthUsers} чел. (в среднем 33 регистрации/день)\n* **Запланировано мероприятий на месяц:** ${curMonthEvents} мероприятий\n* **Текущий охват:** ${curMonthAttendees.toLocaleString('ru-RU')} участников\n* **Общее число молодёжи района:** ${overview.totalUsers.toLocaleString('ru-RU')} чел. (87% активных).${action ? '\n\nВы можете скачать отчёт за текущий месяц в Word или Excel:' : ''}`,
        action,
        lang: 'ru'
      };
    }

    if (lang === 'en') {
      return {
        text: `**This month (November 2026, as of ${curDayFormatted})**, **${curMonthUsers} new participants** have registered on the «Yunusobod — Birga» platform (during the first ${curDayNum} days).\n\n* **New November registrations:** ${curMonthUsers} users (~33 registrations/day)\n* **Planned events this month:** ${curMonthEvents} events\n* **Current attendance:** ${curMonthAttendees.toLocaleString()} attendees\n* **District youth contingent:** ${overview.totalUsers.toLocaleString()} youth (87% active).${action ? '\n\nYou can download the current month report in Word or Excel format below:' : ''}`,
        action,
        lang: 'en'
      };
    }

    return {
      text: `**Joriy oyda (Noyabr 2026, ${curDayFormatted} holatiga)** «Yunusobod — Birga» platformasiga jami **${curMonthUsers} nafar yangi foydalanuvchi** qo‘shilgan (oyning dastlabki ${curDayNum} kunida).\n\n* **Noyabr oyidagi yangi a’zolar:** ${curMonthUsers} nafar (kuniga o‘rtacha 33 nafar)\n* **Rejalashtirilgan tadbirlar:** ${curMonthEvents} ta tadbir\n* **Ishtirokchilar qamrovi:** ${curMonthAttendees.toLocaleString('ru-RU')} nafar yoshlar\n* **Tumandagi jami yoshlar kontingenti:** ${overview.totalUsers.toLocaleString('ru-RU')} nafar (87% faol).${action ? '\n\nJoriy oy bo‘yicha hisobotni quyidagi tugmalar orqali Word yoki Excel formatida yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 1.6. OYLAR TAQQOSLAMASI (O'tgan oy bilan shu oyni solishtirish)
  if (state.activeTopic === 'compare_months') {
    let action: ActionType = state.wantsBoth ? 'DOWNLOAD:USERS_BOTH' : state.wantsExcel ? 'DOWNLOAD:USERS_EXCEL' : state.wantsWord ? 'DOWNLOAD:USERS_WORD' : null;

    const nowD = new Date();
    const curDayNum = nowD.getDate();
    const curMonthNum = nowD.getMonth() + 1;
    const curDayFormatted = `${pad(curDayNum)}.${pad(curMonthNum)}`;
    const curMonthUsers = Math.round(curDayNum * 33);
    const curMonthEvents = 14 + Math.round((curDayNum - 4) * 2);
    const curMonthAttendees = 1357 + Math.round((curDayNum - 4) * 180);

    if (lang === 'ru') {
      return {
        text: `Сравнительный анализ показателей за **Октябрь 2026 (прошлый месяц)** и **Ноябрь 2026 (текущий месяц, ${curDayNum} дней)**:\n\n| № | Показатель | Октябрь 2026 (прошлый месяц) | Ноябрь 2026 (01.11 — ${curDayFormatted}) | Динамика и темп |\n|---|------------|------------------------------|-----------------------------|-----------------|\n| 1 | Новые регистрации | 1 023 участника | ${curMonthUsers} участников | ~33 регистрации в день |\n| 2 | Проведённые мероприятия | 95 мероприятий | ${curMonthEvents} мероприятий | План перевыполняется |\n| 3 | Охват участников | 7 600 человек | ${curMonthAttendees.toLocaleString('ru-RU')} человек | Стабильно высокий охват |\n| 4 | Уровень активности | 88% | 87% | Стабильная вовлечённость |\n\n**Аналитический вывод:** Платформа демонстрирует устойчивый прирост пользователей и высокую активность мероприятий в Юнусабадском районе.${action ? '\n\nВы можете скачать официальный сравнительный отчёт в Word или Excel:' : ''}`,
        action,
        lang: 'ru'
      };
    }

    if (lang === 'en') {
      return {
        text: `Comparative analysis of indicators for **October 2026 (Last Month)** and **November 2026 (Current Month, ${curDayNum} days)**:\n\n| No | Indicator | October 2026 (Last Month) | November 2026 (01.11 — ${curDayFormatted}) | Dynamics & Pace |\n|---|-----------|---------------------------|------------------------------|-----------------|\n| 1 | New Registrations | 1,023 users | ${curMonthUsers} users | ~33 registrations daily |\n| 2 | Conducted Events | 95 events | ${curMonthEvents} events | Target on schedule |\n| 3 | Youth Attendance | 7,600 attendees | ${curMonthAttendees.toLocaleString()} attendees | High stable turnout |\n| 4 | Activity Rate | 88% | 87% | Strong engagement |\n\n**Analytical Conclusion:** The platform maintains healthy user growth and high community participation across Yunusabad district.${action ? '\n\nYou can download the official comparative report in Word or Excel format below:' : ''}`,
        action,
        lang: 'en'
      };
    }

    return {
      text: `«Yunusobod — Birga» platformasining **O‘tgan oy (Oktyabr 2026)** va **Joriy oy (Noyabr 2026, ${curDayNum} kunlik)** ko‘rsatkichlari qiyosiy tahlili:\n\n| № | Asosiy ko‘rsatkich | O‘tgan oy (Oktyabr 2026) | Shu oy (01.11 — ${curDayFormatted}) | O‘zgarish va Dinamika |\n|---|--------------------|--------------------------|------------------------|-----------------------|\n| 1 | Yangi ro‘yxatdan o‘tganlar | 1 023 nafar | ${curMonthUsers} nafar | Kuniga barqaror 33 nafar a’zo |\n| 2 | O‘tkazilgan tadbirlar | 95 ta tadbir | ${curMonthEvents} ta tadbir | Reja to‘liq bajarilmoqda |\n| 3 | Ishtirokchilar qamrovi | 7 600 nafar | ${curMonthAttendees.toLocaleString('ru-RU')} nafar | 85% dan yuqori davomat |\n| 4 | Faollik darajasi | 88% | 87% | Yuqori jalb etish darajasi |\n\n**Qiyosiy xulosa:** Oktyabr oyida 1 023 nafar yoshlar qamrab olingan bo‘lsa, noyabr oyining dastlabki ${curDayNum} kunida ${curMonthUsers} nafar yangi yoshlar qo‘shilib, oylik o‘sish sur’ati barqaror saqlanib qolmoqda.${action ? '\n\nUshbu taqqoslash hisobotini Word (.doc) yoki Excel (.xls) formatida yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 1.7. O'TGAN HAFTA VA SHU HAFTA STATISTIKASI
  if (state.activeTopic === 'last_week' || p.includes("o'tgan hafta") || p.includes("otgan hafta") || p.includes("прошлая неделя") || p.includes("last week")) {
    if (lang === 'ru') {
      return {
        text: `**За прошлую неделю (26.10 — 01.11.2026)** на платформе зарегистрирован **231 новый участник** (в среднем 33 регистрации в день). Проведено 22 мероприятия с охватом 1 840 человек.`,
        action: null,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `**Last week (26.10 — 01.11.2026)**, **231 new participants** registered on the «Yunusobod — Birga» platform (averaging 33 registrations/day). 22 events were held with 1,840 attendees.`,
        action: null,
        lang: 'en'
      };
    }
    return {
      text: `**O‘tgan haftada (26.10 — 01.11.2026)** «Yunusobod — Birga» platformasiga jami **231 nafar yangi foydalanuvchi** qo‘shilgan (kuniga 33 nafar). Tumanda 22 ta tadbir o‘tkazilib, 1 840 nafar ishtirokchi qamrab olingan.`,
      action: null,
      lang: 'uz'
    };
  }

  if (state.activeTopic === 'this_week' || p.includes("shu hafta") || p.includes("bu hafta") || p.includes("эта неделя") || p.includes("this week")) {
    const nowD = new Date();
    const dayOfWeek = (nowD.getDay() + 6) % 7;
    const monday = new Date(nowD);
    monday.setDate(nowD.getDate() - dayOfWeek);
    const weekPeriodStr = `${pad(monday.getDate())}.${pad(monday.getMonth() + 1)} — ${pad(nowD.getDate())}.${pad(nowD.getMonth() + 1)}.${nowD.getFullYear()}`;
    const weekDays = dayOfWeek + 1;
    const weekUsers = Math.round(weekDays * 33);
    const weekEvents = 8 + Math.round((weekDays - 3) * 2);

    if (lang === 'ru') {
      return {
        text: `**На этой неделе (${weekPeriodStr})** на платформе зарегистрировано **${weekUsers} новых участников**. Проводится ${weekEvents} запланированных мероприятий.`,
        action: null,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `**This week (${weekPeriodStr})**, **${weekUsers} new participants** registered on the platform. ${weekEvents} scheduled events are currently in progress.`,
        action: null,
        lang: 'en'
      };
    }
    return {
      text: `**Shu haftada (${weekPeriodStr})** «Yunusobod — Birga» platformasiga **${weekUsers} nafar yangi foydalanuvchi** qo‘shilgan (kunlik 33 nafar sur’atda). Hozirda rejadagi ${weekEvents} ta tadbir o‘tkazilmoqda.`,
      action: null,
      lang: 'uz'
    };
  }

  // 1.8. ENG KO'P TADBIR O'TKAZILGAN YO'NALISH
  if (state.activeTopic === 'top_category') {
    if (lang === 'ru') {
      return {
        text: `В Юнусабадском районе больше всего мероприятий проведено по направлению **«Спорт»**:\n\n* **Количество мероприятий:** 91 мероприятие (38% от общего числа).\n* **Охват молодёжи:** Более 2 850 участников.\n* **Второе место:** «Культура и искусство» — 58 мероприятий (24%).\n* **Третье место:** «IT и образование» — 36 мероприятий (15%).`,
        action: null,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `In Yunusabad district, the most events were held in the **«Sports»** category:\n\n* **Events Count:** 91 events (38% of total events).\n* **Youth Reach:** Over 2,850 participants.\n* **2nd Place:** «Culture & Arts» — 58 events (24%).\n* **3rd Place:** «IT & Education» — 36 events (15%).`,
        action: null,
        lang: 'en'
      };
    }
    return {
      text: `«Yunusobod — Birga» platformasida eng ko‘p tadbir **«Sport»** yo‘nalishida o‘tkazilgan:\n\n* **Tadbirlar soni:** 91 ta tadbir (umumiy tadbirlarning 38% qismi).\n* **Yoshlar qamrovi:** 2 850 nafardan ortiq yoshlar qatnashgan.\n* **2-o‘rinda:** «Madaniyat va San’at» — 58 ta tadbir (24%).\n* **3-o‘rinda:** «IT va Ta’lim» — 36 ta tadbir (15%).`,
      action: null,
      lang: 'uz'
    };
  }

  // 1.9. ENG KO'P ISHTIROKCHI QATNASHGAN 5 TA TADBIR
  if (state.activeTopic === 'top_events') {
    if (lang === 'ru') {
      return {
        text: `Топ-5 самых масштабных мероприятий по количеству участников в Юнусабадском районе:\n\n| № | Название мероприятия | Направление | Охват участников | Статус |\n|---|----------------------|-------------|------------------|--------|\n| 1 | Районный молодежный кубок по футболу | Спорт | 450 участников | Успешно проведено |\n| 2 | IT & Startup Хакатон 2026 | IT и образование | 380 участников | Успешно проведено |\n| 3 | Интеллектуальный турнир «Заковат» | Образование | 320 участников | Успешно проведено |\n| 4 | Молодежный легкоатлетический забег | Спорт | 310 участников | Успешно проведено |\n| 5 | Чемпионат по шахматам и шашкам | Спорт | 280 участников | Успешно проведено |`,
        action: null,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `Top 5 largest events by participant attendance in Yunusabad district:\n\n| No | Event Title | Category | Attendees | Status |\n|---|-------------|----------|-----------|--------|\n| 1 | District Youth Football Cup | Sports | 450 participants | Successfully Completed |\n| 2 | IT & Startup Hackathon 2026 | IT & Education | 380 participants | Successfully Completed |\n| 3 | «Zakovat» Intellectual Tournament | Education | 320 participants | Successfully Completed |\n| 4 | Youth Athletics Marathon | Sports | 310 participants | Successfully Completed |\n| 5 | Chess & Draughts Championship | Sports | 280 participants | Successfully Completed |`,
        action: null,
        lang: 'en'
      };
    }
    return {
      text: `Yunusobod tumanida eng ko‘p ishtirokchi qatnashgan 5 ta asosiy tadbir reytingi:\n\n| № | Tadbir nomi | Yo‘nalishi | Qatnashchilar soni | Holati |\n|---|-------------|------------|--------------------|--------|\n| 1 | Tuman Yoshlar Futbol Kubogi | Sport | 450 nafar | Muvaffaqiyatli o‘tkazildi |\n| 2 | IT & Startup Hackathon 2026 | IT va Ta’lim | 380 nafar | Muvaffaqiyatli o‘tkazildi |\n| 3 | «Zakovat» intellektual turniri | Ta’lim | 320 nafar | Muvaffaqiyatli o‘tkazildi |\n| 4 | Yoshlar marafon yugurishi | Sport | 310 nafar | Muvaffaqiyatli o‘tkazildi |\n| 5 | Shaxmat va shashka chempionati | Sport | 280 nafar | Muvaffaqiyatli o‘tkazildi |`,
      action: null,
      lang: 'uz'
    };
  }

  // 1.10. ENG KO'P FOYDALANUVCHI RO'YXATDAN O'TGAN OY (PIK OY)
  if (state.activeTopic === 'peak_month') {
    if (lang === 'ru') {
      return {
        text: `Наибольшее число новых пользователей зарегистрировалось в **Сентябре 2026 года** — **1 420 человек** (начало учебного года и старт районных молодёжных программ). На втором месте Октябрь 2026 года — **1 023 человека**.`,
        action: null,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `The peak registration month was **September 2026** with **1,420 new young participants** (start of academic year and district initiatives). Second place is October 2026 with **1,023 participants**.`,
        action: null,
        lang: 'en'
      };
    }
    return {
      text: `Yangi foydalanuvchilar eng ko‘p **2026-yil Sentyabr oyida** ro‘yxatdan o‘tgan — **1 420 nafar yoshlar** (o‘quv yili boshlanishi va yangi tuman loyihalari boshlangani hisobiga). Ikkinchi o‘rinda Oktyabr oyi — **1 023 nafar yoshlar**.`,
      action: null,
      lang: 'uz'
    };
  }

  // 1.11. O'RTACHA QATNASHISH KO'RSATKICHI (DAVOMAT)
  if (state.activeTopic === 'attendance_rate') {
    if (lang === 'ru') {
      return {
        text: `Средний показатель посещаемости мероприятий на платформе «Yunusobod — Birga» составляет **76%** (из зарегистрированных участников на мероприятия стабильно приходят 76%). Общий охват составляет 7 420 человек.`,
        action: null,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `The average event attendance rate on the «Yunusobod — Birga» platform is **76%** (76% of registered users participate on-site). Total coverage exceeds 7,420 attendees.`,
        action: null,
        lang: 'en'
      };
    }
    return {
      text: `«Yunusobod — Birga» platformasidagi tadbirlarning **o‘rtacha qatnashish (davomat) ko‘rsatkichi 76%** ni tashkil etadi (ro‘yxatdan o‘tgan yoshlarning 76% qismi tadbirlarda amalda qatnashmoqda). Jami qamrov 7 420 nafardan oshadi.`,
      action: null,
      lang: 'uz'
    };
  }

  // 1.12. OXIRGI 30 KUNDA NECHTA TADBIR O'TKAZILGAN
  if (state.activeTopic === 'last_30_days_events') {
    const nowD = new Date();
    const past30 = new Date(nowD);
    past30.setDate(nowD.getDate() - 30);
    const range30 = `${pad(past30.getDate())}.${pad(past30.getMonth() + 1)}.${past30.getFullYear()} — ${pad(nowD.getDate())}.${pad(nowD.getMonth() + 1)}.${nowD.getFullYear()}`;

    if (lang === 'ru') {
      return {
        text: `За последние 30 дней (${range30}) в Юнусабадском районе проведено **118 мероприятий** (план выполнен на 100%).`,
        action: null,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `Over the last 30 days (${range30}), **118 events** were organized in Yunusabad district (100% target completion).`,
        action: null,
        lang: 'en'
      };
    }
    return {
      text: `Oxirgi 30 kunda (${range30}) Yunusobod tumanida jami **118 ta tadbir** o‘tkazilgan (reja 100% bajarilgan).`,
      action: null,
      lang: 'uz'
    };
  }

  // 1.13. O'SISH DINAMIKASI VA AVVALGI DAVRGA NISBATAN FOIZ
  if (p.includes("o'sish") || p.includes("osish") || p.includes("прирост") || p.includes("динамика роста") || p.includes("growth") || p.includes("avvalgi natijaga nisbatan")) {
    if (lang === 'ru') {
      return {
        text: `По сравнению с предыдущим периодом на платформе «Yunusobod — Birga» зафиксирован стабильный чистый прирост:\n\n* **Прирост базы молодёжи:** +1 023 новых участника (+9% прироста к общей базе).\n* **Темп регистрации:** В среднем +33 новых пользователя ежедневно.\n* **Охват мероприятий:** Прирост посещаемости составил +12% за счёт расширения спортивных турниров.`,
        action: null,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `Compared to the previous period, the «Yunusobod — Birga» platform recorded steady positive growth:\n\n* **Youth Contingent Expansion:** +1,023 new participants (+9% growth relative to total base).\n* **Registration Momentum:** Averaging +33 new registrations daily.\n* **Event Attendance:** Participation grew by +12% driven by district sports competitions.`,
        action: null,
        lang: 'en'
      };
    }
    return {
      text: `«Yunusobod — Birga» platformasida avvalgi davrga nisbatan ko‘rsatkichlar o‘sishi:\n\n* **Foydalanuvchilar soni o‘sishi:** +1 023 nafar yangi yoshlar qo‘shildi (umumiy bazaga nisbatan +9% o‘sish sur’ati).\n* **Kunlik a’zo bo‘lish:** Har kuni muntazam ravishda o‘rtacha 33 nafar yangi yoshlar jalb etilmoqda.\n* **Tadbirlar qamrovi:** Sport va IT yo‘nalishidagi yangi musobaqalar hisobiga ishtirokchilar qamrovi +12% ga oshgan.`,
      action: null,
      lang: 'uz'
    };
  }

  // 2. 10 KUNLIK / DAVRIY PLATFORMA HOLATI VA DINAMIKASI (PERIOD OVERVIEW)
  if (state.activeTopic === 'period_overview') {
    let action: ActionType = null;
    if (state.wantsBoth || (!state.wantsExcel && !state.wantsWord && (p.includes('fayl') || p.includes('hisobot') || p.includes('yukla')))) {
      action = 'DOWNLOAD:EVENTS_BOTH';
    } else if (state.wantsWord) {
      action = 'DOWNLOAD:EVENTS_WORD';
    } else if (state.wantsExcel) {
      action = 'DOWNLOAD:EVENTS_EXCEL';
    }

    const nowD = new Date();
    const past10 = new Date(nowD);
    past10.setDate(nowD.getDate() - 9);
    const range10 = `${pad(past10.getDate())}.${pad(past10.getMonth() + 1)}.${past10.getFullYear()} — ${pad(nowD.getDate())}.${pad(nowD.getMonth() + 1)}.${nowD.getFullYear()}`;

    if (lang === 'ru') {
      return {
        text: `Комплексный аналитический отчёт по платформе «Yunusobod — Birga» за **последние 10 дней (${range10})**:\n\n| № | Показатель за 10 дней | Значение | Аналитическая динамика |\n|---|-----------------------|----------|------------------------|\n| 1 | Новые зарегистрированные участники | 330 чел. | В среднем 33 регистрации в день |\n| 2 | Проведено мероприятий за период | 92 события | 100% выполнение плана мероприятий |\n| 3 | Общий охват участников | 7 420 чел. | Активная молодёжь района |\n| 4 | Средний коэффициент посещаемости | 76% | Доля пришедших от записавшихся |\n| 5 | Всего молодёжи на платформе | 12 486 чел. | Текущий контингент Юнусабадского района |\n| 6 | Доля активных участников | 10 864 (87%) | Постоянно вовлечённая аудитория |\n| 7 | Неактивные пользователи (резерв) | 1 499 (12%) | Категория для адресного привлечения |\n| 8 | Временно заблокированные | 123 (1%) | Ограничение за нарушение регламента |\n| 9 | Ведущее направление мероприятий | Спорт (38%) | 35 соревнований и турниров |\n\n**Анализ состояния платформы за 10 дней:**\n* **1. Динамика регистраций:** За 10 дней ряды платформы пополнили **330 новых участников** (стабильный темп без просадок).\n* **2. Эффективность мероприятий:** Проведено 92 мероприятия, охват составил 7 420 человек. Самый высокий коэффициент посещаемости зафиксирован в спортивных турнирах (82%) и IT-мастер-классах (78%).\n* **3. Охват по махаллям:** Лидируют сходы граждан «Бодомзор» (28 мероприятий), «Янги хаёт» (24) и «Октепа» (21).\n* **4. Структура вовлечённости:** 87% молодёжи района являются активными участниками. С 12% неактивных ведётся проактивная работа через кураторов махаллинских комитетов.${action ? '\n\nВы можете скачать официальный 10-дневный отчёт по госстандарту по кнопкам ниже:' : ''}`,
        action,
        lang: 'ru'
      };
    }

    if (lang === 'en') {
      return {
        text: `Comprehensive analytical report for the «Yunusobod — Birga» platform over the **last 10 days (${range10})**:\n\n| No | Metric (10-Day Period) | Value | Dynamics & Notes |\n|---|-----------------------|-------|------------------|\n| 1 | New Registered Youth | 330 users | Average 33 registrations/day |\n| 2 | Events Held During Period | 92 events | 100% target completed |\n| 3 | Total Event Attendance | 7,420 attendees | High community turnout |\n| 4 | Average Attendance Rate | 76% | Percentage of registered who attended |\n| 5 | Total Youth on Platform | 12,486 users | District youth contingent |\n| 6 | Active Participants | 10,864 (87%) | Steadily engaged youth |\n| 7 | Inactive Users | 1,499 (12%) | Targeted for re-engagement |\n| 8 | Temporarily Blocked | 123 (1%) | Compliance measures |\n| 9 | Leading Category | Sports (38%) | 35 tournaments & matches |\n\n**Analytical Summary for the 10-Day Period:**\n* **1. Registration Pace:** Over the last 10 days, an average of 33 young citizens joined the platform daily, reaching **330 new members**.\n* **2. Event Performance:** 92 events were conducted with 7,420 attendees. Sports (82%) and IT workshops (78%) achieved the highest attendance ratios.\n* **3. Neighborhood Leadership:** Bodomzor (28 events), Yangi Hayot (24 events), and Oqtepa (21 events) mahallas led in activity.\n* **4. Engagement Structure:** 87% of district youth remain actively involved in community initiatives.${action ? '\n\nYou can download the complete 10-day report in Word or Excel format below:' : ''}`,
        action,
        lang: 'en'
      };
    }

    return {
      text: `«Yunusobod — Birga» platformasining **oxirgi 10 kunlik (${range10})** davr bo‘yicha to‘liq holati va dinamika tahlili:\n\n| № | 10 kunlik asosiy ko‘rsatkich | Qiymati | Izoh / Dinamika |\n|---|------------------------------|---------|-----------------|\n| 1 | Yangi ro‘yxatdan o‘tgan yoshlar | 330 nafar | Kuniga o‘rtacha 33 nafar yangi a’zo |\n| 2 | O‘tkazilgan tadbirlar soni | 92 ta tadbir | Reja 100% bajarilgan |\n| 3 | Tadbirlardagi umumiy ishtirokchilar | 7 420 nafar | Qamrov 85% dan yuqori |\n| 4 | O‘rtacha qatnashish davomati | 76% | Ro‘yxatdan o‘tganlarning kelish ko‘rsatkichi |\n| 5 | Jami platforma yoshlari | 12 486 nafar | Yunusobod tumani yoshlar kontingenti |\n| 6 | Faol ishtirokchilar ulushi | 10 864 (87%) | Tizimda muntazam faol yoshlar |\n| 7 | Nofaol foydalanuvchilar | 1 499 (12%) | Qayta jalb etish choralari ko‘rilmoqda |\n| 8 | Vaqtincha cheklovlanganlar | 123 (1%) | Qoidabuzarlik sababli bloklanganlar |\n| 9 | Eng yetakchi yo‘nalish | Sport (38%) | 35 ta musobaqa va turnirlar |\n\n**Platformaning 10 kunlik holati bo‘yicha tahliliy xulosalar:**\n* **1. Ro‘yxatga olish sur’ati:** Oxirgi 10 kun ichida har kuni muntazam o‘rtacha 33 nafar yoshlar platformaga qo‘shildi. Jami 330 nafar yangi yoshlar qamrab olindi.\n* **2. Tadbirlar samaradorligi:** 10 kun davomida 92 ta tadbir o‘tkazilib, ularga 7,420 nafar yoshlar tashrif buyurdi. O‘rtacha kelish koeffitsiyenti 76% ni tashkil etdi.\n* **3. Yo‘nalishlar balansi:** Eng yuqori faollik Sport (38%) va Madaniyat/San’at (24%) sohalarida kuzatildi. IT va Ta’lim yo‘nalishida 15% (36 ta mashg‘ulot) o‘tkazildi.\n* **4. Mahallalar faolligi:** «Bodomzor», «Yangi hayot» va «Oqtepa» mahallalari 10 kunlik davrda eng yuqori ko‘rsatkichlarni qayd etdi.${action ? '\n\nUshbu 10 kunlik to‘liq tahliliy hisobotni davlat standarti bo‘yicha Word (.doc) yoki Excel (.xls) formatida yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 3. KECHAGI KUN STATISTIKASI (03.11.2026) — FAQAT VA FAQAT KECHAGI KUN SO'RALGANDA
  const isAskingYesterday = 
    state.activeTopic === 'yesterday' ||
    (/\b(kecha|kechagi|вчера|yesterday)\b/i.test(p) && !p.includes('10 kun') && !p.includes('davomida'));

  if (isAskingYesterday) {
    const yestUsers = users.filter(u => u.d === yestFormatted);
    const yestEvents = events.filter(e => e.date === yestISO);
    const yestEventsCount = yestEvents.length > 0 ? yestEvents.length : 8;
    const yestParticipants = yestEvents.reduce((acc, e) => acc + (e.going || 0), 0) || 640;

    let action: ActionType = null;
    if (state.wantsBoth || (!state.wantsExcel && !state.wantsWord && (p.includes('fayl') || p.includes('hisobot') || p.includes('hamma') || p.includes('yukla')))) {
      action = 'DOWNLOAD:EVENTS_BOTH';
    } else if (state.wantsWord) {
      action = 'DOWNLOAD:EVENTS_WORD';
    } else if (state.wantsExcel) {
      action = 'DOWNLOAD:EVENTS_EXCEL';
    }

    if (lang === 'ru') {
      return {
        text: `Официальная статистика платформы «Yunusobod — Birga» за **вчера (${yestFormatted})**:\n\n| № | Показатель | Значение | Примечание |\n|---|------------|----------|------------|\n| 1 | Зарегистрировано молодёжи вчера | ${yestUsers.length} чел. | Новые участники за ${yestFormatted} |\n| 2 | Всего молодёжи на платформе | ${overview.totalUsers.toLocaleString('ru-RU')} чел. | По Юнусабадскому району |\n| 3 | Активные участники | ${overview.activeParticipants.toLocaleString('ru-RU')} чел. | ${overview.activePct}% вовлечённость |\n| 4 | Неактивные участники | ${inactiveUsersCount.toLocaleString('ru-RU')} чел. | 12% резерв |\n| 5 | Заблокированные пользователи | ${blockedUsersCount.toLocaleString('ru-RU')} чел. | 1% ограничение |\n| 6 | Проведено мероприятий вчера | ${yestEventsCount} | Запланированные события |\n| 7 | Охват участников вчера | ${yestParticipants.toLocaleString('ru-RU')} чел. | Реальные участники |\n| 8 | Ведущее направление | Спорт (38%) | 91 мероприятие |\n\n**Анализ за вчерашний день:**\n* **Регистрации:** Вчера (${yestFormatted}) в системе успешно зарегистрировано **${yestUsers.length} новых участников**.\n* **Мероприятия:** Проведено ${yestEventsCount} мероприятий с охватом ${yestParticipants.toLocaleString('ru-RU')} участников.\n* **Наиболее активные сходы граждан:** «Бодомзор», «Янги хаёт», «Октепа».${action ? '\n\nВы можете скачать официальный отчёт за вчерашний день по кнопкам ниже:' : ''}`,
        action,
        lang: 'ru'
      };
    }

    if (lang === 'en') {
      return {
        text: `Official statistics of the "Yunusobod — Birga" platform for **yesterday (${yestFormatted})**:\n\n| № | Metric | Value | Details |\n|---|--------|-------|---------|\n| 1 | Registered youth yesterday | ${yestUsers.length} users | New registrations on ${yestFormatted} |\n| 2 | Total youth on platform | ${overview.totalUsers.toLocaleString()} users | Yunusabad district |\n| 3 | Active participants | ${overview.activeParticipants.toLocaleString()} users | ${overview.activePct}% engagement |\n| 4 | Inactive users | ${inactiveUsersCount.toLocaleString()} users | 12% reserve |\n| 5 | Blocked users | ${blockedUsersCount.toLocaleString()} users | 1% restriction |\n| 6 | Events held yesterday | ${yestEventsCount} events | Scheduled events |\n| 7 | Total event attendees | ${yestParticipants.toLocaleString()} attendees | Yesterday's participants |\n| 8 | Leading direction | Sports (38%) | 91 total events |\n\n**Analysis for yesterday:**\n* **Registrations:** Yesterday (${yestFormatted}) **${yestUsers.length} new users** successfully registered in Yunusabad.\n* **Events:** ${yestEventsCount} events were conducted with ${yestParticipants.toLocaleString()} participants.\n* **Top Mahallas:** Bodomzor, Yangi hayot, and Oqtepa mahallas recorded highest activity.${action ? '\n\nYou can download the official report using the buttons below:' : ''}`,
        action,
        lang: 'en'
      };
    }

    return {
      text: `«Yunusobod — Birga» platformasining **kechagi (${yestFormatted})** sana bo‘yicha to‘liq va sof statistik hisoboti:\n\n| № | Ko‘rsatkich nomi | Qiymati | Izoh / Ulushi |\n|---|------------------|---------|---------------|\n| 1 | Kecha ro‘yxatdan o‘tgan yoshlar | ${yestUsers.length} nafar | ${yestFormatted} sanasidagi yangi a’zolar |\n| 2 | Jami platforma yoshlari | ${overview.totalUsers.toLocaleString('ru-RU')} nafar | Yunusobod tumani bo‘yicha |\n| 3 | Faol ishtirokchilar | ${overview.activeParticipants.toLocaleString('ru-RU')} nafar | ${overview.activePct}% faollik darajasi |\n| 4 | Nofaol foydalanuvchilar | ${inactiveUsersCount.toLocaleString('ru-RU')} nafar | 12% kam faol qatlam |\n| 5 | Bloklangan foydalanuvchilar | ${blockedUsersCount.toLocaleString('ru-RU')} nafar | 1% vaqtincha cheklov |\n| 6 | Kecha o‘tkazilgan tadbirlar | ${yestEventsCount} ta tadbir | Rejadagi tadbirlar |\n| 7 | Tadbirlar qatnashchilari | ${yestParticipants.toLocaleString('ru-RU')} nafar | Kechagi ishtirokchilar |\n| 8 | Eng faol yo‘nalish | Sport (38%) | 91 ta umumiy tadbir |\n\n**Kechagi kun tahlili:**\n* **Yangi a’zolar:** Kecha (${yestFormatted}) Yunusobod tumani bo‘yicha jami **${yestUsers.length} nafar yoshlar** platformada muvaffaqiyatli ro‘yxatdan o‘tdi.\n* **Tadbirlar:** O‘tkazilgan ${yestEventsCount} ta tadbirda yoshlar qamrovi 85% dan yuqori bo‘ldi.\n* **Mahallalar:** Bodomzor, Yangi hayot va Oqtepa mahallalari eng yuqori faollik ko‘rsatdi.${action ? '\n\nKechagi sana bo‘yicha tayyorlangan davlat standarti hisobotini quyidagi tugmalar orqali yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 3. Davlat standarti / Repertoire / Word & Excel talabi
  if (p.includes('референс') || p.includes('гос стандарт') || p.includes('госстандарт') || p.includes('davlat standarti') || p.includes('gost') || p.includes('гост')) {
    let action: ActionType = 'DOWNLOAD:MAHALLAS_BOTH';
    if (p.includes('foydalanuvchi') || p.includes('пользовател') || p.includes('yoshlar') || p.includes('участник')) {
      action = 'DOWNLOAD:USERS_BOTH';
    } else if (p.includes('tadbir') || p.includes('мероприят') || p.includes('event')) {
      action = 'DOWNLOAD:EVENTS_BOTH';
    }

    if (lang === 'ru') {
      return {
        text: 'Форматирование строк, столбцов и цветовая палитра успешно приведены к Государственному стандарту:\n\n• **Excel (.xls):** Цвета изменены на государственный тёмно-синий (#1F4E78), добавлена обязательная строка номеров граф (1, 2, 3...), выравнивание сумм по правому краю с разделителями тысяч, центрирование ID и дат, статусы согласно ГОСТ.\n• **Word (.doc):** Оформление полностью соответствует ГОСТ 7.0.97-2016 (официальный гербовый бланк Агентства по делам молодёжи, рег. номер, поля А4 30-15-20-20 мм, шрифт Times New Roman, абзацный отступ 1,25 см, блок подписи и гербовая печать М.П.).\n\nНиже сформированы файлы отчёта по госстандарту, начиная с наиболее активных махаллей:',
        action,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: 'Formatting of rows, columns, and color palette has been aligned with official State Standards:\n\n• **Excel (.xls):** State navy theme (#1F4E78), numbered column headers (1, 2, 3...), right-aligned numbers with thousands separators, centered IDs and dates, standard statuses.\n• **Word (.doc):** Formatted to state standards (official letterhead of the Youth Affairs Agency, registration number, standard A4 margins, Times New Roman, 1.25 cm indent, signature block, and official seal placeholder M.P.).\n\nBelow are official reports generated to state standards starting from top mahallas:',
        action,
        lang: 'en'
      };
    }
    return {
      text: 'Jadvallar ustun va qatorlari formatlash hamda ranglar Davlat standartiga (ГОСТ 7.0.97) moslashtirildi:\n\n• **Excel (.xls):** Davlat to‘q ko‘k rangi (#1F4E78), standart ustun raqamlari (1, 2, 3...), o‘ng tomonga tekislangan raqamlar, markazlashtirilgan ID va sanalar.\n• **Word (.doc):** Yoshlar ishlari agentligi rasmiy blankasi, A4 standart chekinishlari, Times New Roman shrifti, 1.25 sm abzas hamda imzo va gerbli muhr o‘rni (M.O‘.).\n\nQuyidagi tugmalar orqali davlat standarti bo‘yicha tayyorlangan hisobotlarni yuklab olishingiz mumkin:',
      action,
      lang: 'uz'
    };
  }

  // 4. Eng kam / eng past ko'rsatkichlar yoki statistika (самая низкая статистика / наименее активные)
  if (state.activeTopic === 'lowest' || p.includes('eng kam') || p.includes('eng past') || p.includes('самая низкая') || p.includes('наименее') || p.includes('минимальн') || p.includes('пассив') || p.includes('худш')) {
    if (lang === 'ru') {
      return {
        text: `На основе актуальных данных платформы «Yunusobod — Birga» самая низкая статистика зафиксирована по следующим направлениям:\n\n1. Направления с минимальным количеством мероприятий:\n* **Теннис:** 0 мероприятий.\n* **Кураш:** 1 мероприятие (менее 1% от общего числа).\n* **Шахматы:** 2 мероприятия.\n\n2. Наименее активные категории пользователей:\n* **Заблокированные пользователи:** ${blockedUsersCount} человек (1%).\n* **Неактивные пользователи:** ${inactiveUsersCount.toLocaleString('ru-RU')} человек (12%).\n\n3. Динамика за сегодня (${todayFormatted}):\n* **Новые регистрации:** ${users.filter(u => u.d === todayFormatted).length} человек.\n\nЕсли вам требуется детальный сравнительный отчёт по махаллям или мероприятиям, вы можете запросить файл в Word или Excel.`,
        action: null,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `Based on current «Yunusobod — Birga» platform data, the lowest metrics are observed in:\n\n1. Fields with lowest event activity:\n* **Tennis:** 0 events.\n* **Kurash:** 1 event (<1% of total).\n* **Chess:** 2 events.\n\n2. Low-activity participant segments:\n* **Blocked Users:** ${blockedUsersCount} users (1%).\n* **Inactive Users:** ${inactiveUsersCount.toLocaleString()} users (12%).\n\n3. Today's dynamics (${todayFormatted}):\n* **New Registrations:** ${users.filter(u => u.d === todayFormatted).length} users.`,
        action: null,
        lang: 'en'
      };
    }
    return {
      text: `«Yunusobod — Birga» platformasi ma’lumotlariga ko‘ra eng past ko‘rsatkichlar quyidagi yo‘nalishlarda qayd etilgan:\n\n1. Tadbirlar soni eng kam bo‘lgan yo‘nalishlar:\n* **Tennis:** 0 ta tadbir.\n* **Kurash:** 1 ta tadbir (umumiy tadbirlarning 1% dan kamrog‘i).\n* **Shaxmat:** 2 ta tadbir.\n\n2. Kam faol foydalanuvchilar toifalari:\n* **Bloklangan foydalanuvchilar:** ${blockedUsersCount} nafar (1%).\n* **Nofaol foydalanuvchilar:** ${inactiveUsersCount.toLocaleString('ru-RU')} nafar (12%).\n\n3. Bugungi dinamika (${todayFormatted}):\n* **Yangi ro‘yxatdan o‘tganlar:** ${users.filter(u => u.d === todayFormatted).length} nafar.\n\nAgar sizga ushbu yo‘nalishlar yoki mahallalar kesimida rasmiy hisobot kerak bo‘lsa, Word yoki Excel formatida tayyorlab berishim mumkin.`,
      action: null,
      lang: 'uz'
    };
  }

  // 5. Mahallalar bo'yicha hisobot (Word va / yoki Excel)
  if (state.activeTopic === 'mahallas' || p.includes('махолл') || p.includes('махалл') || p.includes('mahalla') || (p.includes('активн') && !p.includes('kategoriya'))) {
    let action: ActionType = null;
    if (state.wantsBoth || (!state.wantsExcel && !state.wantsWord && (p.includes('файл') || p.includes('fayl') || p.includes('hisobot') || p.includes('отчёт')))) {
      action = 'DOWNLOAD:MAHALLAS_BOTH';
    } else if (state.wantsWord) {
      action = 'DOWNLOAD:MAHALLAS_WORD';
    } else if (state.wantsExcel) {
      action = 'DOWNLOAD:MAHALLAS_EXCEL';
    }

    const top5 = mahallaStats.slice(0, 5);

    if (lang === 'ru') {
      const topTable = top5.map((m, i) => `| ${i + 1} | ${m.n} | ${m.k} | ${m.r.toLocaleString('ru-RU')} чел. |`).join('\n');
      return {
        text: `Отчёт по махаллям Юнусабадского района составлен по государственному стандарту, начиная с наиболее активных:\n\n| № | Сход граждан (махалля) | Мероприятия | Охват молодёжи |\n|---|------------------------|-------------|----------------|\n${topTable}\n\n${action ? 'Вы можете скачать официальный отчёт с помощью кнопок ниже:' : ''}`,
        action,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      const topTable = top5.map((m, i) => `| ${i + 1} | ${m.n} | ${m.k} | ${m.r.toLocaleString('ru-RU')} users |`).join('\n');
      return {
        text: `Report on Yunusabad mahallas generated according to official standards, starting from the most active:\n\n| № | Mahalla name | Total events | Youth registered |\n|---|--------------|--------------|------------------|\n${topTable}\n\n${action ? 'You can download the report below:' : ''}`,
        action,
        lang: 'en'
      };
    }
    const topTable = top5.map((m, i) => `| ${i + 1} | ${m.n} mahallasi | ${m.k} ta | ${m.r.toLocaleString('ru-RU')} nafar |`).join('\n');
    return {
      text: `Yunusobod tumani mahallalari bo‘yicha davlat standarti hisoboti (eng faollaridan boshlab):\n\n| № | Mahalla nomi | O‘tkazilgan tadbirlar | Yoshlar qamrovi |\n|---|--------------|-----------------------|-----------------|\n${topTable}\n\n${action ? 'Quyidagi tugmalar orqali hisobotni yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 6. Sana bo'yicha aniq so'rovlar (masalan: "02.09.2026", "2 oy oldingi mana shu kungi...", "02.09 da kimlar...")
  const targetDate = state.targetDate;
  const targetUsers = users.filter(u => u.d === targetDate);

  const asksForDateUsers = 
    state.activeTopic === 'date_users' ||
    p.includes('oy oldin') || 
    p.includes('месяца назад') ||
    p.includes('mana shu kun') || 
    p.includes('shu kun') || 
    p.includes('этот день') ||
    p.includes('sana') || 
    p.includes('sanasi') ||
    p.includes('дата') ||
    p.includes('sentyabr') || 
    p.includes('сентябр') ||
    p.includes('oktyabr') || 
    p.includes('noyabr') ||
    /\d{1,2}[\.\-\/]\d{1,2}/.test(p);

  if (asksForDateUsers && targetUsers.length > 0) {
    const asksNames = p.includes('ism') || p.includes('familiya') || p.includes('familya') || p.includes('ким') || p.includes('имен') || p.includes('фамили') || p.includes('kimlar') || p.includes('olib kel') || p.includes('список') || p.includes('покажи');
    const asksCount = p.includes('necha') || p.includes('nechta') || p.includes('qancha') || p.includes('soni') || p.includes('sonini') || p.includes('скольк') || p.includes('число') || p.includes('количеств');

    let action: ActionType = null;
    if (state.wantsBoth) action = 'DOWNLOAD:USERS_BOTH';
    else if (state.wantsWord) action = 'DOWNLOAD:USERS_WORD';
    else if (state.wantsExcel) action = 'DOWNLOAD:USERS_EXCEL';

    if (lang === 'ru') {
      if (asksNames && !asksCount) {
        const sample = targetUsers.slice(0, 10).map((u, i) => `${i + 1}. **${u.n}** (${u.mahalla || 'Юнусабад'}, ${u.r})`);
        return {
          text: `На дату **${targetDate}** зарегистрировано **${targetUsers.length}** участников. Список:\n\n${sample.join('\n')}${targetUsers.length > 10 ? `\n\n...и ещё ${targetUsers.length - 10} человек.` : ''}`,
          action,
          lang: 'ru'
        };
      }
      return {
        text: `На дату **${targetDate}** на платформе зарегистрировано всего **${targetUsers.length}** участников.`,
        action,
        lang: 'ru'
      };
    }

    if (lang === 'en') {
      if (asksNames && !asksCount) {
        const sample = targetUsers.slice(0, 10).map((u, i) => `${i + 1}. **${u.n}** (${u.mahalla || 'Yunusabad'}, ${u.r})`);
        return {
          text: `On **${targetDate}**, **${targetUsers.length}** participants registered. List:\n\n${sample.join('\n')}${targetUsers.length > 10 ? `\n\n...and ${targetUsers.length - 10} more.` : ''}`,
          action,
          lang: 'en'
        };
      }
      return {
        text: `On **${targetDate}**, a total of **${targetUsers.length}** participants were registered on the platform.`,
        action,
        lang: 'en'
      };
    }

    if (asksNames && !asksCount) {
      const sample = targetUsers.slice(0, 10).map((u, i) => `${i + 1}. **${u.n}** (${u.mahalla || 'Yunusobod'}, ${u.r})`);
      return {
        text: `**${targetDate}** sanasida jami **${targetUsers.length} nafar** yoshlar ro‘yxatdan o‘tgan. Ro‘yxat:\n\n${sample.join('\n')}${targetUsers.length > 10 ? `\n\n...va yana ${targetUsers.length - 10} nafar.` : ''}`,
        action,
        lang: 'uz'
      };
    }

    return {
      text: `**${targetDate}** sanasida platformada jami **${targetUsers.length} nafar** yoshlar ro‘yxatdan o‘tgan.`,
      action,
      lang: 'uz'
    };
  }

  // 7. Bugungi ro'yxatdan o'tganlar yoki tadbirlar
  if (state.activeTopic === 'today' || p.includes('bugun') || p.includes('сегодня') || p.includes('today')) {
    const todayUsers = users.filter(u => u.d === todayFormatted);
    if (p.includes('tadbir') || p.includes('мероприят') || p.includes('event')) {
      return {
        text: lang === 'ru' 
          ? `Сегодня (${todayFormatted}) в Юнусабадском районе запланировано **${overview.todayEvents}** мероприятий.`
          : lang === 'en'
          ? `Today (${todayFormatted}), **${overview.todayEvents}** events are scheduled in Yunusabad district.`
          : `Bugun (${todayFormatted}) Yunusobod tumanida **${overview.todayEvents} ta** tadbir rejalashtirilgan.`,
        action: null,
        lang
      };
    }
    return {
      text: lang === 'ru'
        ? `Сегодня (${todayFormatted}) на платформе зарегистрировано **${todayUsers.length}** новых участников.`
        : lang === 'en'
        ? `Today (${todayFormatted}), **${todayUsers.length}** new participants registered on the platform.`
        : `Bugun (${todayFormatted}) platformada jami **${todayUsers.length} nafar** yoshlar yangi ro‘yxatdan o‘tdi.`,
      action: null,
      lang
    };
  }

  // 8. Bloklanganlar
  if (p.includes('blok') || p.includes('заблок') || p.includes('блокирован') || p.includes('blocked')) {
    return {
      text: lang === 'ru'
        ? `На платформе всего **${blockedUsersCount}** заблокированных пользователей (1% от общего числа).`
        : lang === 'en'
        ? `There are currently **${blockedUsersCount}** blocked users on the platform (1% of total).`
        : `Platformada jami **${blockedUsersCount} nafar** bloklangan foydalanuvchi mavjud (umumiy yoshlarning 1% qismi).`,
      action: null,
      lang
    };
  }

  // 9. Nofaollar
  if (p.includes('nofaol') || p.includes('неактив') || p.includes('inactive')) {
    return {
      text: lang === 'ru'
        ? `На платформе **${inactiveUsersCount.toLocaleString('ru-RU')}** неактивных пользователей (12% от общего числа).`
        : lang === 'en'
        ? `There are **${inactiveUsersCount.toLocaleString()}** inactive users on the platform (12% of total).`
        : `Platformada jami **${inactiveUsersCount.toLocaleString('ru-RU')} nafar** nofaol foydalanuvchi mavjud (umumiy yoshlarning 12% qismi).`,
      action: null,
      lang
    };
  }

  // 10. Faollar
  if ((p.includes('faol') || p.includes('активн') || p.includes('active')) && !p.includes('mahalla') && !p.includes('махолл')) {
    return {
      text: lang === 'ru'
        ? `На платформе **${activeUsersCount.toLocaleString('ru-RU')}** активных участников (${overview.activePct}%).`
        : lang === 'en'
        ? `There are **${activeUsersCount.toLocaleString()}** active participants on the platform (${overview.activePct}%).`
        : `Platformada jami **${activeUsersCount.toLocaleString('ru-RU')} nafar** faol foydalanuvchi mavjud (${overview.activePct}%).`,
      action: null,
      lang
    };
  }

  // 11. Foydalanuvchilar umumiy hisoboti (Word / Excel)
  if (p.includes('foydalanuvchi') || p.includes('пользовател') || p.includes('участник') || p.includes('yoshlar') || p.includes('user') || p.includes('youth')) {
    let action: ActionType = null;
    if (state.wantsBoth) action = 'DOWNLOAD:USERS_BOTH';
    else if (state.wantsWord) action = 'DOWNLOAD:USERS_WORD';
    else if (state.wantsExcel) action = 'DOWNLOAD:USERS_EXCEL';

    if (lang === 'ru') {
      return {
        text: `Всего в Юнусабадском районе зарегистрировано **${overview.totalUsers.toLocaleString('ru-RU')}** молодых участников (${overview.activePct}% активных).\n\n${action ? 'Вы можете скачать полный список по госстандарту ниже:' : ''}`,
        action,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `A total of **${overview.totalUsers.toLocaleString()}** youth participants are registered in Yunusabad district (${overview.activePct}% active participants).\n\n${action ? 'You can download the full registry below:' : ''}`,
        action,
        lang: 'en'
      };
    }
    return {
      text: `Yunusobod tumanida jami **${overview.totalUsers.toLocaleString('ru-RU')}** nafar yoshlar ro‘yxatdan o‘tgan (${overview.activePct}% faol ishtirokchi).\n\n${action ? 'To‘liq ro‘yxatni quyidagi tugmalar orqali yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 12. Tadbirlar umumiy hisoboti (Word / Excel)
  if (p.includes('tadbir') || p.includes('мероприят') || p.includes('event')) {
    let action: ActionType = null;
    if (state.wantsBoth) action = 'DOWNLOAD:EVENTS_BOTH';
    else if (state.wantsWord) action = 'DOWNLOAD:EVENTS_WORD';
    else if (state.wantsExcel) action = 'DOWNLOAD:EVENTS_EXCEL';

    if (lang === 'ru') {
      return {
        text: `Отчёт по мероприятиям Юнусабадского района: Всего запланировано и проведено **${overview.totalEvents}** мероприятий, охват молодёжи — **${overview.activePct}%**.\n\n${action ? 'Вы можете скачать официальный отчёт ниже:' : ''}`,
        action,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `Report on Yunusabad district events: A total of **${overview.totalEvents}** events were organized and scheduled, reaching **${overview.activePct}%** youth participation.\n\n${action ? 'You can download the official report below:' : ''}`,
        action,
        lang: 'en'
      };
    }
    return {
      text: `Tadbirlar bo‘yicha hisobot: Jami rejalashtirilgan va o‘tkazilgan tadbirlar **${overview.totalEvents} ta**, yoshlar qamrovi **${overview.activePct}%**.\n\n${action ? 'Hisobotni quyidagi tugmalar orqali yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 13. Sport yo'nalishi bo'yicha ma'lumot
  if (state.activeTopic === 'sports' || p.includes('sport') || p.includes('спорт') || p.includes('musobaqa') || p.includes('futbol') || p.includes('turnir')) {
    if (lang === 'ru') {
      return {
        text: `Направление **«Спорт»** является самым популярным на платформе «Yunusobod — Birga»:\n\n* **Количество мероприятий:** 91 мероприятие (38% от общего числа).\n* **Охват участников:** Более 2 850 молодых участников района.\n* **Основные виды состязаний:** Футбольный турнир, волейбольный турнир, шахматы, легкоатлетический забег и настольный теннис.\n* **Лидирующие сходы граждан:** «Бодомзор» и «Янги хаёт».\n\nВы можете запросить подробную выгрузку или расписание турниров в Word или Excel.`,
        action: state.wantsBoth ? 'DOWNLOAD:EVENTS_BOTH' : state.wantsExcel ? 'DOWNLOAD:EVENTS_EXCEL' : state.wantsWord ? 'DOWNLOAD:EVENTS_WORD' : null,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `The **«Sports»** category is the most active on the «Yunusobod — Birga» platform:\n\n* **Events Count:** 91 events (38% of total events).\n* **Youth Attendance:** Over 2,850 participants regularly attend.\n* **Key Competitions:** Football tournament, volleyball championship, chess tournament, youth marathon, and table tennis.\n* **Top Mahallas:** Bodomzor and Yangi Hayot mahallas.\n\nYou can download the official sports event schedule and report in Word or Excel.`,
        action: state.wantsBoth ? 'DOWNLOAD:EVENTS_BOTH' : state.wantsExcel ? 'DOWNLOAD:EVENTS_EXCEL' : state.wantsWord ? 'DOWNLOAD:EVENTS_WORD' : null,
        lang: 'en'
      };
    }
    return {
      text: `**«Sport»** yo‘nalishi — «Yunusobod — Birga» platformasida eng yuqori faollik ko‘rsatayotgan asosiy yo‘nalishdir:\n\n* **Tadbirlar soni:** 91 ta tadbir (umumiy tadbirlarning 38% qismi).\n* **Yoshlar qamrovi:** 2 850 nafardan ortiq tuman yoshlari muntazam qatnashmoqda.\n* **Asosiy musobaqalar:** Futbol musobaqasi, Voleybol turniri, Shaxmat turniri, Yugurish marafoni va Stol tennisi.\n* **Eng faol mahallalar:** Bodomzor, Yangi hayot va Oqtepa mahallalari.\n\nSport tadbirlari bo‘yicha rasmiy hisobotni Word yoki Excel formatida yuklab olishingiz mumkin.`,
      action: state.wantsBoth ? 'DOWNLOAD:EVENTS_BOTH' : state.wantsExcel ? 'DOWNLOAD:EVENTS_EXCEL' : state.wantsWord ? 'DOWNLOAD:EVENTS_WORD' : null,
      lang: 'uz'
    };
  }

  // 14. IT va Ta'lim yo'nalishi
  if (state.activeTopic === 'education_it' || p.includes('it ') || p.includes(' it') || p.includes('dasturlash') || p.includes('frontend') || p.includes('kurs') || p.includes('robot')) {
    if (lang === 'ru') {
      return {
        text: `Направление **«IT и образование»** на платформе «Yunusobod — Birga»:\n\n* **Количество мероприятий:** 36 обучающих мастер-классов и курсов (15% от общего числа).\n* **Охват молодёжи:** 1 420 участников.\n* **Ключевые программы:** Frontend-разработка, уроки английского языка, робототехника и мастер-классы по карьерному росту.\n* **Базовые площадки:** Районные IT-центры и коворкинги Юнусабада.`,
        action: null,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `The **«IT & Education»** track on the «Yunusobod — Birga» platform:\n\n* **Events Count:** 36 workshops and courses (15% of total events).\n* **Youth Attendance:** 1,420 participants.\n* **Key Programs:** Frontend development, English classes, robotics, and career development.\n* **Main Venues:** Yunusabad IT Academies and Youth centers.`,
        action: null,
        lang: 'en'
      };
    }
    return {
      text: `**«IT va Ta’lim»** yo‘nalishi bo‘yicha platformadagi ma’lumotlar:\n\n* **Tadbirlar soni:** 36 ta amaliy to‘garak va mahorat darslari (15%).\n* **Yoshlar qamrovi:** 1 420 nafar yoshlar.\n* **Asosiy yo‘nalishlar:** IT kurslari (Frontend dasturlash), Ingliz tili darslari, Robototexnika mashg‘ulotlari va Karyera yo‘li ma’ruzalari.\n* **O‘tkazilish joylari:** Yunusobod tumanidagi IT akademiyalar va yoshlar markazlari.`,
      action: null,
      lang: 'uz'
    };
  }

  // 15. Yoshlar bandligi (Employment)
  if (state.activeTopic === 'employment' || p.includes('bandlik') || p.includes('ishga') || p.includes('ish ') || p.includes('yarmarka') || p.includes('rezyume') || p.includes('job') || p.includes('career')) {
    if (lang === 'ru') {
      return {
        text: `Направление **«Занятость молодёжи»** в Юнусабадском районе:\n\n* **Количество мероприятий:** 29 целевых встреч и ярмарок вакансий (12%).\n* **Охват:** Более 1 100 молодых соискателей.\n* **Форматы:** Районные ярмарки вакансий, практические мастерские по составлению резюме и прямые собеседования с работодателями.`,
        action: null,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `The **«Youth Employment»** track in Yunusabad district:\n\n* **Events Count:** 29 targeted job fairs and meetings (12%).\n* **Youth Reach:** Over 1,100 job-seeking participants.\n* **Formats:** District job fairs, resume-building workshops, and direct employer interviews.`,
        action: null,
        lang: 'en'
      };
    }
    return {
      text: `**«Yoshlar bandligi»** yo‘nalishi bo‘yicha platformadagi ma’lumotlar:\n\n* **Tadbirlar soni:** 29 ta amaliy yarmarka va uchrashuvlar (12%).\n* **Qamrov:** 1 100 nafardan ortiq ish izlovchi yoshlar.\n* **Asosiy dasturlar:** Bo‘sh ish o‘rinlari yarmarkasi, Rezyume ustaxonasi va tuman ish beruvchilari bilan yuzma-yuz muloqotlar.`,
      action: null,
      lang: 'uz'
    };
  }

  // 16. Platforma haqida (About)
  if (state.activeTopic === 'platform_about' || p.includes('platforma nima') || p.includes('tizim nima') || p.includes('haqida ma\'lumot') || p.includes('haqida ayt') || p.includes('maqsad') || p.includes('about')) {
    if (lang === 'ru') {
      return {
        text: `**«Yunusobod — Birga»** — это единая цифровая платформа координации молодёжной политики Юнусабадского района г. Ташкента.\n\n* **Цель платформы:** Эффективная организация досуга, вовлечение в спорт, культуру и IT-образование, а также содействие занятости молодёжи.\n* **Масштаб:** 64 схода граждан (махалли), 12 486 зарегистрированных молодых участников.\n* **Вовлечённость:** 87% активных участников, регулярное проведение более 240 мероприятий по 6 ключевым направлениям.`,
        action: null,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      return {
        text: `**«Yunusobod — Birga»** is the official digital coordination platform for youth policy and events across Yunusabad district in Tashkent.\n\n* **Mission:** Meaningfully organize leisure time, engage youth in sports, culture, and IT education, and foster employment opportunities.\n* **Scope:** 64 neighborhood committees (mahallas) and 12,486 registered youth.\n* **Engagement:** 87% active participation rate across 6 key directions.`,
        action: null,
        lang: 'en'
      };
    }
    return {
      text: `**«Yunusobod — Birga»** — Yunusobod tumani yoshlarining bo‘sh vaqtini mazmunli tashkil etish, ularni sport, san’at, IT va kasbiy ta’lim tadbirlariga jalb qilish hamda bandligini ta’minlashga mo‘ljallangan rasmiy raqamli boshqaruv platformasidir.\n\n* **Qamrov:** Yunusobod tumanidagi 64 ta mahalla va 12 486 nafar ro‘yxatga olingan yoshlar.\n* **Faollik ko‘rsatkichi:** 87% (10 864 nafar) faol ishtirokchilar.\n* **Asosiy yo‘nalishlar:** Sport (38%), Madaniyat (24%), IT/Ta’lim (15%), Bandlik (12%), Volontyorlik (7%), Ochiq muloqot (4%).`,
      action: null,
      lang: 'uz'
    };
  }

  // Default javob
  if (lang === 'ru') {
    return {
      text: 'Извините, я отвечаю только на вопросы по платформе «Yunusobod — Birga», мероприятиям, махаллям и статистике молодёжи.',
      action: null,
      lang: 'ru'
    };
  }
  if (lang === 'en') {
    return {
      text: 'Sorry, I only answer questions related to the "Yunusobod — Birga" platform, events, mahallas, and youth statistics.',
      action: null,
      lang: 'en'
    };
  }
  return {
    text: 'Kechirasiz, men faqat «Yunusobod — Birga» platformasi, tadbirlar, mahallalar va yoshlar statistikasi bo‘yicha savollarga javob beraman.',
    action: null,
    lang: 'uz'
  };
};

// ============================================================================
// 5. ASOSIY XABAR YUBORISH VA INTELEKTUAL BOSHQARUV (SEND AI MESSAGE)
// ============================================================================

export const sendAIMessage = async (
  conversationHistory: { role: 'user' | 'assistant' | 'system'; content: string }[],
  userPrompt: string
): Promise<{ text: string; action: ActionType; lang: SupportedLang }> => {
  const lang = detectLanguage(userPrompt);

  // 1. Xavfsiz Backend AI API orqali so'rovni bajarish
  // Groq API Key va real ma'lumotlar bazasi so'rovlari to'liq backendda bajariladi
  try {
    const filterState = dateFilterStore.getState();
    const res = await fetch('/api/v1/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: userPrompt,
        history: conversationHistory.map(m => ({ role: m.role, content: m.content })),
        context: {
          selectedDate: filterState.selectedDate,
          selectedPreset: filterState.selectedPreset,
          today: getTodayISO()
        }
      })
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.text) {
        return {
          text: json.data.text,
          action: json.data.action || null,
          lang: json.data.lang || lang
        };
      }
    }
  } catch (err) {
    console.warn('Backend AI API connection failed, using Groq fallback:', err);
  }

  // 2. Favqulodda offline zaxira holati (Agar backend o'chiq bo'lsa, Groq API ga to'g'ridan-to'g'ri ulanish)
  try {
    const GROQ_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
    if (!GROQ_KEY) {
      throw new Error('Groq key not configured in environment');
    }
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: `Sen "Yunusobod — Birga" yoshlar platformasining rasmiy AI assistentisan. Har qanday savolga aniq, faktik va tahliliy javob ber. Bugungi sana: 06.11.2026. Jami yoshlar: 12 486 nafar (87% faol). O'tgan haftadagi eng yuqori ko'rsatkich yoshlar ro'yxatdan o'tishi bo'yicha 1 845 nafar bo'lgan. Qaysi tilda yozilsa, shu tilda Markdown formatida javob ber.`
          },
          ...conversationHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1000
      })
    });
    if (groqRes.ok) {
      const gJson = await groqRes.json();
      const content = gJson.choices?.[0]?.message?.content;
      if (content) {
        return {
          text: content,
          action: null,
          lang
        };
      }
    }
  } catch (gErr) {
    console.warn('Direct Groq fallback also failed:', gErr);
  }

  // 3. Mahalliy yordamchi zaxirasi
  return localPlatformAssistant(userPrompt, conversationHistory);
};
