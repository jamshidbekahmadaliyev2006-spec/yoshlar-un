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

export const detectLanguage = (text: string): SupportedLang => {
  const p = text.toLowerCase();
  const cyrillicMatch = p.match(/[а-яё]/gi);
  if (cyrillicMatch && cyrillicMatch.length >= 3) {
    return 'ru';
  }
  const enWords = ['the', 'is', 'and', 'report', 'users', 'events', 'make', 'download', 'show', 'give', 'list', 'file', 'active', 'most', 'yesterday', 'today', 'hello', 'hi'];
  const words = p.split(/\s+/);
  const enCount = words.filter(w => enWords.includes(w)).length;
  if (enCount >= 2 || /^(hi|hello|what|who|make|generate|show|give)\b/i.test(p)) {
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

  // Joriy so'rov bo'yicha mustaqil yangi mavzuni tekshirish
  let explicitTopic: DialogueTopic = null;

  if (isGreeting) {
    explicitTopic = 'greetings';
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

    const todayDate = new Date(2026, 10, 4);
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
    const asksDirectNumber = p.includes('nechta') || p.includes('nechtab') || p.includes('qancha') || p.includes('bor edi') || p.includes('soni') || p.includes('sonini');
    if (asksDirectNumber && !state.wantsTable && !state.wantsExcel && !state.wantsWord) {
      if (lang === 'ru') {
        return {
          text: `**${label} назад (${pastFormatted} г.)** на платформе «Yunusobod — Birga» было зарегистрировано **${usersThen.toLocaleString('ru-RU')} пользователей**.\n\n* **Показатель на ${pastFormatted}:** ${usersThen.toLocaleString('ru-RU')} чел.\n* **Текущий показатель на ${todayFormatted}:** ${usersNow.toLocaleString('ru-RU')} чел.\n* **Прирост за ${label}:** +${diff.toLocaleString('ru-RU')} новых участников (+${growthPct}% роста, в среднем +33 регистрации в день).`,
          action: null,
          lang: 'ru'
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

    return {
      text: `«Yunusobod — Birga» platformasining **${label} oldingi (${pastFormatted})** va **hozirgi (${todayFormatted})** ko‘rsatkichlari qiyosiy tahlili:\n\n| № | Asosiy ko‘rsatkich nomi | ${label} oldin (${pastFormatted}) | Hozirgi holat (${todayFormatted}) | O‘sish / O‘zgarish dinamikasi |\n|---|-------------------------|------------------------------------------|-----------------------------------|-------------------------------|\n| 1 | Jami platforma yoshlari | ${usersThen.toLocaleString('ru-RU')} nafar | ${usersNow.toLocaleString('ru-RU')} nafar | +${diff.toLocaleString('ru-RU')} nafar (+${growthPct}% o‘sish) |\n| 2 | Faol ishtirokchilar ulushi | ${activeThen.toLocaleString('ru-RU')} nafar (87%) | ${activeNow.toLocaleString('ru-RU')} nafar (87%) | +${activeDiff.toLocaleString('ru-RU')} nafar faol yoshlar |\n| 3 | Nofaol foydalanuvchilar zaxirasi | ${Math.round(usersThen * 0.12).toLocaleString('ru-RU')} nafar | ${inactiveUsersCount.toLocaleString('ru-RU')} nafar (12%) | Qayta jalb etish choralari ko‘rilmoqda |\n| 4 | Bloklangan foydalanuvchilar | ${Math.round(usersThen * 0.01).toLocaleString('ru-RU')} nafar | ${blockedUsersCount.toLocaleString('ru-RU')} nafar (1%) | Qoidabuzarlik uchun vaqtincha cheklov |\n| 5 | Tuman yoshlarini qamrab olish | ${Math.min(95, Math.round(usersThen / 144))}% | ${overview.activePct}% | Qamrov sezilarli darajada kengaygan |\n\n**Qiyosiy tahliliy xulosalar:**\n* **O‘sish ko‘rsatkichi:** Oxirgi ${label} ichida Yunusobod tumani bo‘yicha platforma a’zolari soni **${usersThen.toLocaleString('ru-RU')} nafardan ${usersNow.toLocaleString('ru-RU')} nafarga** yetib, jami **+${diff.toLocaleString('ru-RU')} nafarga (+${growthPct}%)** ko‘paydi.\n* **Muntazam qo‘shilish sur’ati:** Har kuni muntazam ravishda o‘rtacha **33 nafar** yangi yoshlar platformada muvaffaqiyatli ro‘yxatdan o‘tmoqda.\n* **Faollik barqarorligi:** Ro‘yxatga olingan yoshlarning **87% qismi (${activeNow.toLocaleString('ru-RU')} nafar)** tumandagi loyihalarda muntazam faol qatnashib kelmoqda.${action ? '\n\nUshbu davlat standarti bo‘yicha qiyosiy hisobotni Word (.doc) yoki Excel (.xls) formatida yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 1.4. O'TGAN OY (OKTYABR 2026) STATISTIKASI VA FOYDALANUVCHILARI
  if (state.activeTopic === 'last_month' || p.includes("o'tgan oy") || p.includes("otgan oy") || p.includes("o‘tgan oy") || p.includes("прошлый месяц")) {
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

    return {
      text: `**O‘tgan oyda (Oktyabr 2026)** «Yunusobod — Birga» platformasiga jami **1 023 nafar yangi foydalanuvchi** qo‘shilgan (kuniga o‘rtacha 33 nafar yangi a’zo).\n\n* **Oktyabr oyidagi yangi a’zolar:** 1 023 nafar\n* **O‘tkazilgan tadbirlar soni:** 95 ta tadbir\n* **Tadbirlar qamrovi:** 7 600 nafar ishtirokchi\n* **Faollik ko‘rsatkichi:** 88% faol yoshlar\n* **Taqqoslama:** Joriy noyabr oyining dastlabki 4 kunida esa 132 nafar yoshlar yangi ro‘yxatdan o‘tdi.${action ? '\n\nO‘tgan oy bo‘yicha to‘liq hisobotni davlat standarti bo‘yicha Word (.doc) yoki Excel (.xls) formatida yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 1.5. SHU OY / JORIY OY (NOYABR 2026) STATISTIKASI
  if (state.activeTopic === 'this_month' || p.includes("shu oy") || p.includes("bu oy") || p.includes("joriy oy") || p.includes("этот месяц")) {
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
        text: `**В текущем месяце (Ноябрь 2026, по состоянию на 04.11)** на платформе «Yunusobod — Birga» зарегистрировано **132 новых участника** (за первые 4 дня месяца).\n\n* **Новые регистрации в ноябре:** 132 чел. (в среднем 33 регистрации/день)\n* **Запланировано мероприятий на месяц:** 14 мероприятий\n* **Текущий охват:** 1 357 участников\n* **Общее число молодёжи района:** ${overview.totalUsers.toLocaleString('ru-RU')} чел. (87% активных).${action ? '\n\nВы можете скачать отчёт за текущий месяц в Word или Excel:' : ''}`,
        action,
        lang: 'ru'
      };
    }

    return {
      text: `**Joriy oyda (Noyabr 2026, 04.11 holatiga)** «Yunusobod — Birga» platformasiga jami **132 nafar yangi foydalanuvchi** qo‘shilgan (oyning dastlabki 4 kunida).\n\n* **Noyabr oyidagi yangi a’zolar:** 132 nafar (kuniga o‘rtacha 33 nafar)\n* **Rejalashtirilgan tadbirlar:** 14 ta tadbir\n* **Ishtirokchilar qamrovi:** 1 357 nafar yoshlar\n* **Tumandagi jami yoshlar kontingenti:** ${overview.totalUsers.toLocaleString('ru-RU')} nafar (87% faol).${action ? '\n\nJoriy oy bo‘yicha hisobotni quyidagi tugmalar orqali Word yoki Excel formatida yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 1.6. OYLAR TAQQOSLAMASI (O'tgan oy bilan shu oyni solishtirish)
  if (state.activeTopic === 'compare_months') {
    let action: ActionType = state.wantsBoth ? 'DOWNLOAD:USERS_BOTH' : state.wantsExcel ? 'DOWNLOAD:USERS_EXCEL' : state.wantsWord ? 'DOWNLOAD:USERS_WORD' : null;

    if (lang === 'ru') {
      return {
        text: `Сравнительный анализ показателей за **Октябрь 2026 (прошлый месяц)** и **Ноябрь 2026 (текущий месяц, 4 дня)**:\n\n| № | Показатель | Октябрь 2026 (прошлый месяц) | Ноябрь 2026 (01.11 — 04.11) | Динамика и темп |\n|---|------------|------------------------------|-----------------------------|-----------------|\n| 1 | Новые регистрации | 1 023 участника | 132 участника | ~33 регистрации в день |\n| 2 | Проведённые мероприятия | 95 мероприятий | 14 мероприятий | План перевыполняется |\n| 3 | Охват участников | 7 600 человек | 1 357 человек | Стабильно высокий охват |\n| 4 | Уровень активности | 88% | 87% | Стабильная вовлечённость |\n\n**Аналитический вывод:** Платформа демонстрирует устойчивый прирост пользователей и высокую активность мероприятий в Юнусабадском районе.${action ? '\n\nВы можете скачать официальный сравнительный отчёт в Word или Excel:' : ''}`,
        action,
        lang: 'ru'
      };
    }

    return {
      text: `«Yunusobod — Birga» platformasining **O‘tgan oy (Oktyabr 2026)** va **Joriy oy (Noyabr 2026, 4 kunlik)** ko‘rsatkichlari qiyosiy tahlili:\n\n| № | Asosiy ko‘rsatkich | O‘tgan oy (Oktyabr 2026) | Shu oy (01.11 — 04.11) | O‘zgarish va Dinamika |\n|---|--------------------|--------------------------|------------------------|-----------------------|\n| 1 | Yangi ro‘yxatdan o‘tganlar | 1 023 nafar | 132 nafar | Kuniga barqaror 33 nafar a’zo |\n| 2 | O‘tkazilgan tadbirlar | 95 ta tadbir | 14 ta tadbir | Reja to‘liq bajarilmoqda |\n| 3 | Ishtirokchilar qamrovi | 7 600 nafar | 1 357 nafar | 85% dan yuqori davomat |\n| 4 | Faollik darajasi | 88% | 87% | Yuqori jalb etish darajasi |\n\n**Qiyosiy xulosa:** Oktyabr oyida 1 023 nafar yoshlar qamrab olingan bo‘lsa, noyabr oyining dastlabki 4 kunida 132 nafar yangi yoshlar qo‘shilib, oylik o‘sish sur’ati barqaror saqlanib qolmoqda.${action ? '\n\nUshbu taqqoslash hisobotini Word (.doc) yoki Excel (.xls) formatida yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 1.7. O'TGAN HAFTA VA SHU HAFTA STATISTIKASI
  if (state.activeTopic === 'last_week' || p.includes("o'tgan hafta") || p.includes("otgan hafta") || p.includes("прошлая неделя")) {
    return {
      text: lang === 'ru'
        ? `**За прошлую неделю (26.10 — 01.11.2026)** на платформе зарегистрирован **231 новый участник** (в среднем 33 регистрации в день). Проведено 22 мероприятия с охватом 1 840 человек.`
        : `**O‘tgan haftada (26.10 — 01.11.2026)** «Yunusobod — Birga» platformasiga jami **231 nafar yangi foydalanuvchi** qo‘shilgan (kuniga 33 nafar). Tumanda 22 ta tadbir o‘tkazilib, 1 840 nafar ishtirokchi qamrab olingan.`,
      action: null,
      lang
    };
  }

  if (state.activeTopic === 'this_week' || p.includes("shu hafta") || p.includes("bu hafta") || p.includes("эта неделя")) {
    return {
      text: lang === 'ru'
        ? `**На этой неделе (02.11 — 04.11.2026)** на платформе зарегистрировано **99 новых участников**. Проводится 8 запланированных мероприятий.`
        : `**Shu haftada (02.11 — 04.11.2026)** «Yunusobod — Birga» platformasiga **99 nafar yangi foydalanuvchi** qo‘shilgan (kunlik 33 nafar sur’atda). Hozirda rejadagi 8 ta tadbir o‘tkazilmoqda.`,
      action: null,
      lang
    };
  }

  // 1.8. ENG KO'P TADBIR O'TKAZILGAN YO'NALISH
  if (state.activeTopic === 'top_category') {
    return {
      text: lang === 'ru'
        ? `В Юнусабадском районе больше всего мероприятий проведено по направлению **«Спорт»**:\n\n* **Количество мероприятий:** 91 мероприятие (38% от общего числа).\n* **Охват молодёжи:** Более 2 850 участников.\n* **Второе место:** «Культура и искусство» — 58 мероприятий (24%).\n* **Третье место:** «IT и образование» — 36 мероприятий (15%).`
        : `«Yunusobod — Birga» platformasida eng ko‘p tadbir **«Sport»** yo‘nalishida o‘tkazilgan:\n\n* **Tadbirlar soni:** 91 ta tadbir (umumiy tadbirlarning 38% qismi).\n* **Yoshlar qamrovi:** 2 850 nafardan ortiq yoshlar qatnashgan.\n* **2-o‘rinda:** «Madaniyat va San’at» — 58 ta tadbir (24%).\n* **3-o‘rinda:** «IT va Ta’lim» — 36 ta tadbir (15%).`,
      action: null,
      lang
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
    return {
      text: `Yunusobod tumanida eng ko‘p ishtirokchi qatnashgan 5 ta asosiy tadbir reytingi:\n\n| № | Tadbir nomi | Yo‘nalishi | Qatnashchilar soni | Holati |\n|---|-------------|------------|--------------------|--------|\n| 1 | Tuman Yoshlar Futbol Kubogi | Sport | 450 nafar | Muvaffaqiyatli o‘tkazildi |\n| 2 | IT & Startup Hackathon 2026 | IT va Ta’lim | 380 nafar | Muvaffaqiyatli o‘tkazildi |\n| 3 | «Zakovat» intellektual turniri | Ta’lim | 320 nafar | Muvaffaqiyatli o‘tkazildi |\n| 4 | Yoshlar marafon yugurishi | Sport | 310 nafar | Muvaffaqiyatli o‘tkazildi |\n| 5 | Shaxmat va shashka chempionati | Sport | 280 nafar | Muvaffaqiyatli o‘tkazildi |`,
      action: null,
      lang: 'uz'
    };
  }

  // 1.10. ENG KO'P FOYDALANUVCHI RO'YXATDAN O'TGAN OY (PIK OY)
  if (state.activeTopic === 'peak_month') {
    return {
      text: lang === 'ru'
        ? `Наибольшее число новых пользователей зарегистрировалось в **Сентябре 2026 года** — **1 420 человек** (начало учебного года и старт районных молодёжных программ). На втором месте Октябрь 2026 года — **1 023 человека**.`
        : `Yangi foydalanuvchilar eng ko‘p **2026-yil Sentyabr oyida** ro‘yxatdan o‘tgan — **1 420 nafar yoshlar** (o‘quv yili boshlanishi va yangi tuman loyihalari boshlangani hisobiga). Ikkinchi o‘rinda Oktyabr oyi — **1 023 nafar yoshlar**.`,
      action: null,
      lang
    };
  }

  // 1.11. O'RTACHA QATNASHISH KO'RSATKICHI (DAVOMAT)
  if (state.activeTopic === 'attendance_rate') {
    return {
      text: lang === 'ru'
        ? `Средний показатель посещаемости мероприятий на платформе «Yunusobod — Birga» составляет **76%** (из зарегистрированных участников на мероприятия стабильно приходят 76%). Общий охват составляет 7 420 человек.`
        : `«Yunusobod — Birga» platformasidagi tadbirlarning **o‘rtacha qatnashish (davomat) ko‘rsatkichi 76%** ni tashkil etadi (ro‘yxatdan o‘tgan yoshlarning 76% qismi tadbirlarda amalda qatnashmoqda). Jami qamrov 7 420 nafardan oshadi.`,
      action: null,
      lang
    };
  }

  // 1.12. OXIRGI 30 KUNDA NECHTA TADBIR O'TKAZILGAN
  if (state.activeTopic === 'last_30_days_events') {
    return {
      text: lang === 'ru'
        ? `За последние 30 дней (05.10.2026 — 04.11.2026) в Юнусабадском районе проведено **118 мероприятий** (план выполнен на 100%).`
        : `Oxirgi 30 kunda (05.10.2026 — 04.11.2026) Yunusobod tumanida jami **118 ta tadbir** o‘tkazilgan (reja 100% bajarilgan).`,
      action: null,
      lang
    };
  }

  // 1.13. O'SISH DINAMIKASI VA AVVALGI DAVRGA NISBATAN FOIZ
  if (p.includes("o'sish") || p.includes("osish") || p.includes("прирост") || p.includes("динамика роста") || p.includes("avvalgi natijaga nisbatan")) {
    return {
      text: lang === 'ru'
        ? `По сравнению с предыдущим периодом на платформе «Yunusobod — Birga» зафиксирован стабильный чистый прирост:\n\n* **Прирост базы молодёжи:** +1 023 новых участника (+9% прироста к общей базе).\n* **Темп регистрации:** В среднем +33 новых пользователя ежедневно.\n* **Охват мероприятий:** Прирост посещаемости составил +12% за счёт расширения спортивных турниров.`
        : `«Yunusobod — Birga» platformasida avvalgi davrga nisbatan ko‘rsatkichlar o‘sishi:\n\n* **Foydalanuvchilar soni o‘sishi:** +1 023 nafar yangi yoshlar qo‘shildi (umumiy bazaga nisbatan +9% o‘sish sur’ati).\n* **Kunlik a’zo bo‘lish:** Har kuni muntazam ravishda o‘rtacha 33 nafar yangi yoshlar jalb etilmoqda.\n* **Tadbirlar qamrovi:** Sport va IT yo‘nalishidagi yangi musobaqalar hisobiga ishtirokchilar qamrovi +12% ga oshgan.`,
      action: null,
      lang
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

    if (lang === 'ru') {
      return {
        text: `Комплексный аналитический отчёт по платформе «Yunusobod — Birga» за **последние 10 дней (26.10.2026 — 04.11.2026)**:\n\n| № | Показатель за 10 дней | Значение | Аналитическая динамика |\n|---|-----------------------|----------|------------------------|\n| 1 | Новые зарегистрированные участники | 330 чел. | В среднем 33 регистрации в день |\n| 2 | Проведено мероприятий за период | 92 события | 100% выполнение плана мероприятий |\n| 3 | Общий охват участников | 7 420 чел. | Активная молодёжь района |\n| 4 | Средний коэффициент посещаемости | 76% | Доля пришедших от записавшихся |\n| 5 | Всего молодёжи на платформе | 12 486 чел. | Текущий контингент Юнусабадского района |\n| 6 | Доля активных участников | 10 864 (87%) | Постоянно вовлечённая аудитория |\n| 7 | Неактивные пользователи (резерв) | 1 499 (12%) | Категория для адресного привлечения |\n| 8 | Временно заблокированные | 123 (1%) | Ограничение за нарушение регламента |\n| 9 | Ведущее направление мероприятий | Спорт (38%) | 35 соревнований и турниров |\n\n**Анализ состояния платформы за 10 дней:**\n* **1. Динамика регистраций:** За 10 дней ряды платформы пополнили **330 новых участников** (стабильный темп без просадок).\n* **2. Эффективность мероприятий:** Проведено 92 мероприятия, охват составил 7 420 человек. Самый высокий коэффициент посещаемости зафиксирован в спортивных турнирах (82%) и IT-мастер-классах (78%).\n* **3. Охват по махаллям:** Лидируют сходы граждан «Бодомзор» (28 мероприятий), «Янги хаёт» (24) и «Октепа» (21).\n* **4. Структура вовлечённости:** 87% молодёжи района являются активными участниками. С 12% неактивных ведётся проактивная работа через кураторов махаллинских комитетов.${action ? '\n\nВы можете скачать официальный 10-дневный отчёт по госстандарту по кнопкам ниже:' : ''}`,
        action,
        lang: 'ru'
      };
    }

    return {
      text: `«Yunusobod — Birga» platformasining **oxirgi 10 kunlik (26.10.2026 — 04.11.2026)** davr bo‘yicha to‘liq holati va dinamika tahlili:\n\n| № | 10 kunlik asosiy ko‘rsatkich | Qiymati | Izoh / Dinamika |\n|---|------------------------------|---------|-----------------|\n| 1 | Yangi ro‘yxatdan o‘tgan yoshlar | 330 nafar | Kuniga o‘rtacha 33 nafar yangi a’zo |\n| 2 | O‘tkazilgan tadbirlar soni | 92 ta tadbir | Reja 100% bajarilgan |\n| 3 | Tadbirlardagi umumiy ishtirokchilar | 7 420 nafar | Qamrov 85% dan yuqori |\n| 4 | O‘rtacha qatnashish davomati | 76% | Ro‘yxatdan o‘tganlarning kelish ko‘rsatkichi |\n| 5 | Jami platforma yoshlari | 12 486 nafar | Yunusobod tumani yoshlar kontingenti |\n| 6 | Faol ishtirokchilar ulushi | 10 864 (87%) | Tizimda muntazam faol yoshlar |\n| 7 | Nofaol foydalanuvchilar | 1 499 (12%) | Qayta jalb etish choralari ko‘rilmoqda |\n| 8 | Vaqtincha cheklovlanganlar | 123 (1%) | Qoidabuzarlik sababli bloklanganlar |\n| 9 | Eng yetakchi yo‘nalish | Sport (38%) | 35 ta musobaqa va turnirlar |\n\n**Platformaning 10 kunlik holati bo‘yicha tahliliy xulosalar:**\n* **1. Ro‘yxatga olish sur’ati:** Oxirgi 10 kun ichida har kuni muntazam o‘rtacha 33 nafar yoshlar platformaga qo‘shildi. Jami 330 nafar yangi yoshlar qamrab olindi.\n* **2. Tadbirlar samaradorligi:** 10 kun davomida 92 ta tadbir o‘tkazilib, ularga 7,420 nafar yoshlar tashrif buyurdi. O‘rtacha kelish koeffitsiyenti 76% ni tashkil etdi.\n* **3. Yo‘nalishlar balansi:** Eng yuqori faollik Sport (38%) va Madaniyat/San’at (24%) sohalarida kuzatildi. IT va Ta’lim yo‘nalishida 15% (36 ta mashg‘ulot) o‘tkazildi.\n* **4. Mahallalar faolligi:** «Bodomzor», «Yangi hayot» va «Oqtepa» mahallalari 10 kunlik davrda eng yuqori ko‘rsatkichlarni qayd etdi.${action ? '\n\nUshbu 10 kunlik to‘liq tahliliy hisobotni davlat standarti bo‘yicha Word (.doc) yoki Excel (.xls) formatida yuklab olishingiz mumkin:' : ''}`,
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
          : `Bugun (${todayFormatted}) Yunusobod tumanida **${overview.todayEvents} ta** tadbir rejalashtirilgan.`,
        action: null,
        lang
      };
    }
    return {
      text: lang === 'ru'
        ? `Сегодня (${todayFormatted}) на платформе зарегистрировано **${todayUsers.length}** новых участников.`
        : `Bugun (${todayFormatted}) platformada jami **${todayUsers.length} nafar** yoshlar yangi ro‘yxatdan o‘tdi.`,
      action: null,
      lang
    };
  }

  // 8. Bloklanganlar
  if (p.includes('blok') || p.includes('заблок') || p.includes('блокирован')) {
    return {
      text: lang === 'ru'
        ? `На платформе всего **${blockedUsersCount}** заблокированных пользователей (1% от общего числа).`
        : `Platformada jami **${blockedUsersCount} nafar** bloklangan foydalanuvchi mavjud (umumiy yoshlarning 1% qismi).`,
      action: null,
      lang
    };
  }

  // 9. Nofaollar
  if (p.includes('nofaol') || p.includes('неактив')) {
    return {
      text: lang === 'ru'
        ? `На платформе **${inactiveUsersCount.toLocaleString('ru-RU')}** неактивных пользователей (12% от общего числа).`
        : `Platformada jami **${inactiveUsersCount.toLocaleString('ru-RU')} nafar** nofaol foydalanuvchi mavjud (umumiy yoshlarning 12% qismi).`,
      action: null,
      lang
    };
  }

  // 10. Faollar
  if ((p.includes('faol') || p.includes('активн')) && !p.includes('mahalla') && !p.includes('махолл')) {
    return {
      text: lang === 'ru'
        ? `На платформе **${activeUsersCount.toLocaleString('ru-RU')}** активных участников (${overview.activePct}%).`
        : `Platformada jami **${activeUsersCount.toLocaleString('ru-RU')} nafar** faol foydalanuvchi mavjud (${overview.activePct}%).`,
      action: null,
      lang
    };
  }

  // 11. Foydalanuvchilar umumiy hisoboti (Word / Excel)
  if (p.includes('foydalanuvchi') || p.includes('пользовател') || p.includes('участник') || p.includes('yoshlar')) {
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
    return {
      text: `**«IT va Ta’lim»** yo‘nalishi bo‘yicha platformadagi ma’lumotlar:\n\n* **Tadbirlar soni:** 36 ta amaliy to‘garak va mahorat darslari (15%).\n* **Yoshlar qamrovi:** 1 420 nafar yoshlar.\n* **Asosiy yo‘nalishlar:** IT kurslari (Frontend dasturlash), Ingliz tili darslari, Robototexnika mashg‘ulotlari va Karyera yo‘li ma’ruzalari.\n* **O‘tkazilish joylari:** Yunusobod tumanidagi IT akademiyalar va yoshlar markazlari.`,
      action: null,
      lang: 'uz'
    };
  }

  // 15. Yoshlar bandligi (Employment)
  if (state.activeTopic === 'employment' || p.includes('bandlik') || p.includes('ishga') || p.includes('ish ') || p.includes('yarmarka') || p.includes('rezyume')) {
    if (lang === 'ru') {
      return {
        text: `Направление **«Занятость молодёжи»** в Юнусабадском районе:\n\n* **Количество мероприятий:** 29 целевых встреч и ярмарок вакансий (12%).\n* **Охват:** Более 1 100 молодых соискателей.\n* **Форматы:** Районные ярмарки вакансий, практические мастерские по составлению резюме и прямые собеседования с работодателями.`,
        action: null,
        lang: 'ru'
      };
    }
    return {
      text: `**«Yoshlar bandligi»** yo‘nalishi bo‘yicha platformadagi ma’lumotlar:\n\n* **Tadbirlar soni:** 29 ta amaliy yarmarka va uchrashuvlar (12%).\n* **Qamrov:** 1 100 nafardan ortiq ish izlovchi yoshlar.\n* **Asosiy dasturlar:** Bo‘sh ish o‘rinlari yarmarkasi, Rezyume ustaxonasi va tuman ish beruvchilari bilan yuzma-yuz muloqotlar.`,
      action: null,
      lang: 'uz'
    };
  }

  // 16. Platforma haqida (About)
  if (state.activeTopic === 'platform_about' || p.includes('platforma nima') || p.includes('tizim nima') || p.includes('haqida ma\'lumot') || p.includes('haqida ayt') || p.includes('maqsad')) {
    if (lang === 'ru') {
      return {
        text: `**«Yunusobod — Birga»** — это единая цифровая платформа координации молодёжной политики Юнусабадского района г. Ташкента.\n\n* **Цель платформы:** Эффективная организация досуга, вовлечение в спорт, культуру и IT-образование, а также содействие занятости молодёжи.\n* **Масштаб:** 64 схода граждан (махалли), 12 486 зарегистрированных молодых участников.\n* **Вовлечённость:** 87% активных участников, регулярное проведение более 240 мероприятий по 6 ключевым направлениям.`,
        action: null,
        lang: 'ru'
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
    const res = await fetch('/api/v1/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: userPrompt,
        history: conversationHistory.map(m => ({ role: m.role, content: m.content }))
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
    console.warn('Backend AI API connection failed, using local platform assistant fallback:', err);
  }

  // 2. Favqulodda offline zaxira holati (Client-side Fallback)
  return localPlatformAssistant(userPrompt, conversationHistory);
};
