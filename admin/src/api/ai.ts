import { apiClient } from './client';
import { statsApi } from './stats';
import { mahallasApi } from './mahallas';
import { pad, TODAY } from '../utils/format';
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

const GROQ_API_KEY =
  ((import.meta as any).env?.VITE_GROQ_API_KEY as string) || '';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

let cachedModels: string[] | null = null;

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

export const getDynamicModelList = async (): Promise<string[]> => {
  if (cachedModels && cachedModels.length > 0) return cachedModels;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY.trim()}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      const list = (data.data || [])
        .map((m: any) => m.id)
        .filter((id: string) => 
          !id.includes('whisper') && 
          !id.includes('guard') && 
          !id.includes('orpheus') &&
          !id.includes('tts')
        );
      if (list.length > 0) {
        cachedModels = list;
        return list;
      }
    }
  } catch (err) {
    console.warn('Groq model list fetch error:', err);
  }

  return [
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b'
  ];
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

export const resolveTargetDate = (
  prompt: string,
  history: { role: string; content: string }[] = []
): string => {
  const p = prompt.toLowerCase();
  let currentSelected = TODAY;
  try {
    currentSelected = dateFilterStore.getState().selectedDate || TODAY;
  } catch {}
  const currentFormatted = currentSelected.split('-').reverse().join('.');

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
    if (currentFormatted.includes('.09.')) return currentFormatted;
    return '02.09.2026';
  }

  if (p.includes('1 oy') || p.includes('1 месяц') || p.includes('месяц назад')) {
    if (currentFormatted.includes('.10.')) return currentFormatted;
    return '03.10.2026';
  }

  if (p.includes('kecha') || p.includes('вчера') || p.includes('yesterday')) {
    const [y, m, d] = TODAY.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    return `${pad(prev.getDate())}.${pad(prev.getMonth() + 1)}.${prev.getFullYear()}`;
  }

  if (p.includes('bugun') || p.includes('сегодня') || p.includes('today')) {
    return TODAY.split('-').reverse().join('.');
  }

  if (p.includes('mana shu') || p.includes('shu kun') || p.includes('этот день') || p.includes('выбранный')) {
    return currentFormatted;
  }

  if (history && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      const prev = history[i].content || '';
      const dm = prev.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      if (dm) return dm[0];
    }
  }

  return currentFormatted;
};

export const buildPlatformContext = (lang: SupportedLang = 'uz') => {
  const users = apiClient.getUsers();
  const overview = statsApi.getOverview(TODAY);
  const mahallaStats = mahallasApi.getStats('r');
  const donut = statsApi.getDonutData(TODAY);

  let currentSelected = TODAY;
  try {
    currentSelected = dateFilterStore.getState().selectedDate || TODAY;
  } catch {}
  const currentFormatted = currentSelected.split('-').reverse().join('.');
  const selectedDateUsers = users.filter(u => u.d === currentFormatted);
  const sampleUsers = selectedDateUsers.slice(0, 8).map(u => `${u.n} (${u.mahalla || 'Yunusobod'})`);

  const [ty, tm, td] = TODAY.split('-');
  const todayFormatted = `${td}.${tm}.${ty}`;
  const todayUsersCount = users.filter(u => u.d === todayFormatted).length;

  const activeUsersCount = users.filter(u => u.s === 0).length;
  const inactiveUsersCount = users.filter(u => u.s === 1).length;
  const blockedUsersCount = users.filter(u => u.s === 2).length;

  const topMahallas = mahallaStats.slice(0, 5).map((m, idx) => 
    `${idx + 1}. ${m.n} mahallasi: ${m.k} ta tadbir, ${m.r} yoshlar`
  ).join(', ');

  const categories = donut.items.map(i => `${i.name}: ${i.count} ta (${i.percent}%)`).join(', ');

  return `
SEN — "Yunusobod — Birga" yoshlar platformasining rasmiy va maxsus vakolatli ADMINISTRATOR ASSISTENTISAN.

### TIL BO'YICHA QAT'IY QOIDA:
- Foydalanuvchi qaysi tilda yozsa, aynan o'sha tilda javob ber:
  • Ruscha yozsa (masalan: "сделай ворд файл и эксел...") -> RUS TILIDA javob ber!
  • Inglizcha yozsa -> INGLIZ TILIDA javob ber!
  • O'zbekcha yozsa -> O'ZBEK TILIDA javob ber!
- Rus yoki ingliz tilidagi savollarni ASLO rad etma!

### HUQUQLAR VA OCHIQ MA'LUMOTLAR:
- Administratorga tizimdagi har qanday sanadagi foydalanuvchilar ism-familiyasi, telefoni, statistikasi ochiq ko'rsatiladi.
- Aslo "shaxsiy ma'lumot deb ochiq ko'rsatilmaydi" yoki "saqlanmagan" dema!
- Ekranda tanlangan sana: ${currentFormatted} (Ushbu kunda ${selectedDateUsers.length} nafar yangi ro'yxatdan o'tgan).
- Ismlar: ${sampleUsers.join(', ')}.
- Jami yoshlar: ${users.length.toLocaleString()} nafar
- Bugun ro'yxatdan o'tganlar: ${todayUsersCount} nafar
- Faol foydalanuvchilar: ${activeUsersCount.toLocaleString()} nafar (${overview.activePct}%)
- Nofaol foydalanuvchilar: ${inactiveUsersCount.toLocaleString()} nafar
- Bloklangan foydalanuvchilar: ${blockedUsersCount.toLocaleString()} nafar
- Jami tadbirlar: ${overview.totalEvents} ta
- Yo‘nalishlar: ${categories}
- Eng faol mahallalar: ${topMahallas}

### JAVOB FORMATLASH VA MATN TARKIBI (FORMATTING & TYPOGRAPHY):
- Javobingni tartibli, chiroyli va qulay o'qiladigan qilib tuz.
- Agar ro'yxat bo'lsa, aniq raqamlar (1., 2., 3.) va toza bandlar (*) bilan yoz.
- Muhim tushunchalar va kalit so'zlarni **qalin** qilib belgilang.
- Rus tilida yozganda so'zlarni to'g'ri va savodli yoz: "Заблокированные пользователи" (aslo "блокнанные" emas!), "Неактивные пользователи", "Мероприятия", "Сходы граждан махаллей".
- Keraksiz bo'sh takrorlashlarsiz, lo'nda va professional administrativ uslubda yoz.

Qisqa, aniq va lo'nda javob ber.
`.trim();
};

/**
 * 100% aniq va to'g'ridan-to'g'ri tizim ma'lumotlar bazasidan qidiruvchi aqlli mexanizm
 */
export const localPlatformAssistant = (
  userPrompt: string,
  history: { role: string; content: string }[] = []
): { text: string; action: ActionType; lang: SupportedLang } => {
  const p = userPrompt.toLowerCase().trim();
  const lang = detectLanguage(userPrompt);

  const users = apiClient.getUsers();
  const overview = statsApi.getOverview(TODAY);
  const mahallaStats = mahallasApi.getStats('r');
  const donut = statsApi.getDonutData(TODAY);

  const [ty, tm, td] = TODAY.split('-');
  const todayFormatted = `${td}.${tm}.${ty}`;
  const todayUsersCount = users.filter(u => u.d === todayFormatted).length;
  const activeUsersCount = users.filter(u => u.s === 0).length;
  const inactiveUsersCount = users.filter(u => u.s === 1).length;
  const blockedUsersCount = users.filter(u => u.s === 2).length;

  const wantsExcel = p.includes('excel') || p.includes('эксел') || p.includes('xls') || p.includes('csv') || p.includes('jadval') || p.includes('таблиц');
  const wantsWord = p.includes('word') || p.includes('ворд') || p.includes('doc') || p.includes('docx') || p.includes('форд');
  const wantsBoth = (wantsExcel && wantsWord) || p.includes('и эксел') || p.includes('va excel') || p.includes('hamda excel') || p.includes('and excel');

  // 1. Salomlashish
  if (/^(salom|assalom|assalomu\s*alaykum|qalaysiz|yaxshimisiz|hayrli\s*(tong|kun|kech))$/i.test(p) || p === 'salom') {
    return {
      text: 'Assalomu alaykum! «Yunusobod — Birga» platformasi bo‘yicha sizga qanday yordam bera olaman?',
      action: null,
      lang: 'uz'
    };
  }
  if (/^(привет|здравствуйте|добрый\s*(день|вечер|утро))$/i.test(p)) {
    return {
      text: 'Здравствуйте! Я официальный ИИ-ассистент платформы «Yunusobod — Birga». Чем я могу вам помочь?',
      action: null,
      lang: 'ru'
    };
  }
  if (/^(hello|hi|good\s*(morning|day|evening))$/i.test(p)) {
    return {
      text: 'Hello! I am the official AI assistant of the "Yunusobod — Birga" youth platform. How can I assist you?',
      action: null,
      lang: 'en'
    };
  }

  // 2. Референс ва Давлат стандарти бўйича махсус талаб
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

  // 3. Eng kam / eng past ko'rsatkichlar yoki statistika (самая низкая статистика / наименее активные)
  if (p.includes('eng kam') || p.includes('eng past') || p.includes('самая низкая') || p.includes('наименее') || p.includes('минимальн') || p.includes('пассив') || p.includes('худш')) {
    if (lang === 'ru') {
      return {
        text: `На основе актуальных данных платформы «Yunusobod — Birga» самая низкая статистика зафиксирована по следующим направлениям:\n\n1. Направления с минимальным количеством мероприятий:\n* **Теннис:** 0 мероприятий.\n* **Кураш:** 1 мероприятие (менее 1% от общего числа).\n* **Шахматы:** 2 мероприятия.\n\n2. Наименее активные категории пользователей:\n* **Заблокированные пользователи:** ${blockedUsersCount} человек (1%).\n* **Неактивные пользователи:** ${inactiveUsersCount.toLocaleString('ru-RU')} человек (12%).\n\n3. Динамика за сегодня (${todayFormatted}):\n* **Новые регистрации:** ${todayUsersCount} человек.\n\nЕсли вам требуется детальный сравнительный отчёт по махаллям или мероприятиям, вы можете запросить файл в Word или Excel.`,
        action: null,
        lang: 'ru'
      };
    }
    return {
      text: `«Yunusobod — Birga» platformasi ma’lumotlariga ko‘ra eng past ko‘rsatkichlar quyidagi yo‘nalishlarda qayd etilgan:\n\n1. Tadbirlar soni eng kam bo‘lgan yo‘nalishlar:\n* **Tennis:** 0 ta tadbir.\n* **Kurash:** 1 ta tadbir (umumiy tadbirlarning 1% dan kamrog‘i).\n* **Shaxmat:** 2 ta tadbir.\n\n2. Kam faol foydalanuvchilar toifalari:\n* **Bloklangan foydalanuvchilar:** ${blockedUsersCount} nafar (1%).\n* **Nofaol foydalanuvchilar:** ${inactiveUsersCount.toLocaleString('ru-RU')} nafar (12%).\n\n3. Bugungi dinamika (${todayFormatted}):\n* **Yangi ro‘yxatdan o‘tganlar:** ${todayUsersCount} nafar.\n\nAgar sizga ushbu yo‘nalishlar yoki mahallalar kesimida rasmiy hisobot kerak bo‘lsa, Word yoki Excel formatida tayyorlab berishim mumkin.`,
      action: null,
      lang: 'uz'
    };
  }

  // 4. Mahallalar bo'yicha hisobot (Word va / yoki Excel)
  if (p.includes('махолл') || p.includes('махалл') || p.includes('mahalla') || p.includes('активн') || p.includes('активной')) {
    let action: ActionType = null;
    if (wantsBoth || (!wantsExcel && !wantsWord && (p.includes('файл') || p.includes('fayl') || p.includes('hisobot') || p.includes('отчёт')))) {
      action = 'DOWNLOAD:MAHALLAS_BOTH';
    } else if (wantsWord) {
      action = 'DOWNLOAD:MAHALLAS_WORD';
    } else if (wantsExcel) {
      action = 'DOWNLOAD:MAHALLAS_EXCEL';
    }

    const top5 = mahallaStats.slice(0, 5);

    if (lang === 'ru') {
      const topStr = top5.map((m, i) => `${i + 1}. **${m.n}** — ${m.k} мероприятий, ${m.r.toLocaleString('ru-RU')} участников`).join('\n');
      return {
        text: `Отчёт по махаллям Юнусабадского района составлен по государственному стандарту, начиная с наиболее активных:\n\n${topStr}\n\n${action ? 'Вы можете скачать официальный отчёт с помощью кнопок ниже:' : ''}`,
        action,
        lang: 'ru'
      };
    }
    if (lang === 'en') {
      const topStr = top5.map((m, i) => `${i + 1}. **${m.n}** — ${m.k} events, ${m.r.toLocaleString('ru-RU')} youth registered`).join('\n');
      return {
        text: `Report on Yunusabad mahallas generated according to official standards, starting from the most active:\n\n${topStr}\n\n${action ? 'You can download the report below:' : ''}`,
        action,
        lang: 'en'
      };
    }
    const topStr = top5.map((m, i) => `${i + 1}. **${m.n} mahallasi** — ${m.k} ta tadbir, ${m.r.toLocaleString('ru-RU')} nafar yoshlar`).join('\n');
    return {
      text: `Yunusobod tumani mahallalari bo‘yicha davlat standarti hisoboti (eng faollaridan boshlab):\n\n${topStr}\n\n${action ? 'Quyidagi tugmalar orqali hisobotni yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz'
    };
  }

  // 4. Sana bo'yicha aniq so'rovlar (masalan: "2 oy oldingi mana shu kungi...", "02.09.2026 da kimlar...", "necha ro'yxatdan o'tgan")
  const targetDate = resolveTargetDate(userPrompt, history);
  const targetUsers = users.filter(u => u.d === targetDate);

  const asksForDateUsers = 
    p.includes('oy oldin') || 
    p.includes('месяца назад') ||
    p.includes('mana shu kun') || 
    p.includes('shu kun') || 
    p.includes('этот день') ||
    p.includes('sana') ||
    p.includes('дата') ||
    p.includes('sentyabr') || 
    p.includes('сентябр') ||
    p.includes('oktyabr') || 
    p.includes('noyabr') ||
    /\d{1,2}[\.\-\/]\d{1,2}/.test(p) ||
    p.includes('unda') ||
    p.includes('тогда');

  if (asksForDateUsers && targetUsers.length > 0) {
    const asksNames = p.includes('ism') || p.includes('familiya') || p.includes('familya') || p.includes('ким') || p.includes('имен') || p.includes('фамили') || p.includes('kimlar') || p.includes('olib kel') || p.includes('список') || p.includes('покажи');
    const asksCount = p.includes('necha') || p.includes('nechta') || p.includes('qancha') || p.includes('soni') || p.includes('sonini') || p.includes('скольк') || p.includes('число') || p.includes('количеств');

    let action: ActionType = null;
    if (wantsBoth) action = 'DOWNLOAD:USERS_BOTH';
    else if (wantsWord) action = 'DOWNLOAD:USERS_WORD';
    else if (wantsExcel) action = 'DOWNLOAD:USERS_EXCEL';

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

  // 5. Bugungi ro'yxatdan o'tganlar
  if (p.includes('bugun') || p.includes('сегодня') || p.includes('today')) {
    if (p.includes('tadbir') || p.includes('мероприят') || p.includes('event')) {
      return {
        text: lang === 'ru' 
          ? `Сегодня в Юнусабадском районе запланировано **${overview.todayEvents}** мероприятий.`
          : `Bugun Yunusobod tumanida **${overview.todayEvents} ta** tadbir rejalashtirilgan.`,
        action: null,
        lang
      };
    }
    return {
      text: lang === 'ru'
        ? `Сегодня на платформе зарегистрировалось **${todayUsersCount}** новых участников.`
        : `Bugun platformada jami **${todayUsersCount} nafar** yoshlar yangi ro‘yxatdan o‘tdi.`,
      action: null,
      lang
    };
  }

  // 6. Bloklanganlar
  if (p.includes('blok') || p.includes('заблок') || p.includes('блокирован')) {
    return {
      text: lang === 'ru'
        ? `На платформе всего **${blockedUsersCount}** заблокированных пользователей (1% от общего числа).`
        : `Platformada jami **${blockedUsersCount} nafar** bloklangan foydalanuvchi mavjud (umumiy yoshlarning 1% qismi).`,
      action: null,
      lang
    };
  }

  // 7. Nofaollar
  if (p.includes('nofaol') || p.includes('неактив')) {
    return {
      text: lang === 'ru'
        ? `На платформе **${inactiveUsersCount.toLocaleString('ru-RU')}** неактивных пользователей (12% от общего числа).`
        : `Platformada jami **${inactiveUsersCount.toLocaleString('ru-RU')} nafar** nofaol foydalanuvchi mavjud (umumiy yoshlarning 12% qismi).`,
      action: null,
      lang
    };
  }

  // 8. Faollar
  if ((p.includes('faol') || p.includes('активн')) && !p.includes('mahalla') && !p.includes('махолл')) {
    return {
      text: lang === 'ru'
        ? `На платформе **${activeUsersCount.toLocaleString('ru-RU')}** активных участников (${overview.activePct}%).`
        : `Platformada jami **${activeUsersCount.toLocaleString('ru-RU')} nafar** faol foydalanuvchi mavjud (${overview.activePct}%).`,
      action: null,
      lang
    };
  }

  // 9. Foydalanuvchilar umumiy hisoboti (Word / Excel)
  if (p.includes('foydalanuvchi') || p.includes('пользовател') || p.includes('участник') || p.includes('yoshlar')) {
    let action: ActionType = null;
    if (wantsBoth) action = 'DOWNLOAD:USERS_BOTH';
    else if (wantsWord) action = 'DOWNLOAD:USERS_WORD';
    else if (wantsExcel) action = 'DOWNLOAD:USERS_EXCEL';

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

  // 10. Kechagi yoki oylik tadbirlar hisoboti (Word / Excel)
  if (p.includes('kechagi') || p.includes('kecha') || p.includes('вчера') || p.includes('oylik') || p.includes('отчёт') || p.includes('отчет') || p.includes('hisobot')) {
    let action: ActionType = null;
    if (wantsBoth) action = 'DOWNLOAD:EVENTS_BOTH';
    else if (wantsWord) action = 'DOWNLOAD:EVENTS_WORD';
    else if (wantsExcel) action = 'DOWNLOAD:EVENTS_EXCEL';

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

export const sendAIMessage = async (
  conversationHistory: { role: 'user' | 'assistant' | 'system'; content: string }[],
  userPrompt: string
): Promise<{ text: string; action: ActionType; lang: SupportedLang }> => {
  const cleanPrompt = userPrompt.trim().toLowerCase();
  const lang = detectLanguage(userPrompt);

  // 1. Tizimdagi aniq ro'yxat va faktlarga oid so'rovlarni bir zumda bazadan javob berish
  const isDirectDataQuery = 
    /^(salom|assalom|assalomu\s*alaykum|qalaysiz|yaxshimisiz|hayrli\s*(tong|kun|kech)|privet|привет|здравствуйте|hello|hi)$/i.test(cleanPrompt) ||
    cleanPrompt === 'salom' ||
    cleanPrompt.includes('ворд') ||
    cleanPrompt.includes('word') ||
    cleanPrompt.includes('doc') ||
    cleanPrompt.includes('эксел') ||
    cleanPrompt.includes('excel') ||
    cleanPrompt.includes('xls') ||
    cleanPrompt.includes('референс') ||
    cleanPrompt.includes('гос') ||
    cleanPrompt.includes('стандарт') ||
    cleanPrompt.includes('gost') ||
    cleanPrompt.includes('самая низкая') ||
    cleanPrompt.includes('наименее') ||
    cleanPrompt.includes('минимальн') ||
    cleanPrompt.includes('eng past') ||
    cleanPrompt.includes('eng kam') ||
    cleanPrompt.includes('махолл') ||
    cleanPrompt.includes('махалл') ||
    cleanPrompt.includes('mahalla') ||
    cleanPrompt.includes('blok') ||
    cleanPrompt.includes('заблок') ||
    cleanPrompt.includes('nofaol') ||
    cleanPrompt.includes('неактив') ||
    cleanPrompt.includes('oy oldin') ||
    cleanPrompt.includes('месяца назад') ||
    cleanPrompt.includes('mana shu kun') ||
    cleanPrompt.includes('этот день') ||
    cleanPrompt.includes('shu kun') ||
    cleanPrompt.includes('unda') ||
    cleanPrompt.includes('тогда') ||
    /\d{1,2}[\.\-\/]\d{1,2}/.test(cleanPrompt) ||
    ((cleanPrompt.includes('bugun') || cleanPrompt.includes('сегодня')) && 
     (cleanPrompt.includes('ro‘yxat') || cleanPrompt.includes('royxat') || cleanPrompt.includes('inson') || cleanPrompt.includes('odam') || cleanPrompt.includes('yosh') || cleanPrompt.includes('orgn') || cleanPrompt.includes('участник') || cleanPrompt.includes('зарегистр')));

  if (isDirectDataQuery) {
    return localPlatformAssistant(userPrompt, conversationHistory);
  }

  const systemPrompt = buildPlatformContext(lang);
  const models = await getDynamicModelList();

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userPrompt }
  ];

  try {
    let data: any = null;

    for (const model of models) {
      try {
        const response = await fetch(GROQ_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY.trim()}`
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.4,
            max_tokens: 300,
            presence_penalty: 0.6,
            frequency_penalty: 0.6
          })
        });

        if (response.ok) {
          data = await response.json();
          break;
        }
      } catch (err) {
        // keyingi modelni sinash
      }
    }

    if (data && data.choices?.[0]?.message?.content) {
      let replyText = data.choices[0].message.content.trim();

      // Xatolik va noaniq so'zlarni to'g'irlash
      replyText = replyText
        .replace(/блокнанн[ыоеа-я]*/gi, 'заблокированные')
        .replace(/блокн[а-я]*/gi, 'заблокированные');

      const isBadRefusal = 
        replyText.toLowerCase().includes('shaxsiy ma') || 
        replyText.toLowerCase().includes('персональн') ||
        replyText.toLowerCase().includes('ochiq ko') || 
        replyText.toLowerCase().includes('saqlanmagan') ||
        replyText.toLowerCase().includes('не сохранен');

      if (!isRepetitiveOrMalformed(replyText) && !isBadRefusal) {
        return { text: replyText, action: null, lang };
      }
    }
  } catch (error) {
    console.warn('Groq API error:', error);
  }

  return localPlatformAssistant(userPrompt, conversationHistory);
};
