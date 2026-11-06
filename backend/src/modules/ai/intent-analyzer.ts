import { ParsedIntent, IntentType, SupportedLang, ChatMessage } from './types';

export class IntentAnalyzer {
  static detectLanguage(text: string): SupportedLang {
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
  }

  static extractDate(prompt: string): { dateStr: string; label: string } | null {
    const p = prompt.toLowerCase().trim();

    // ISO: YYYY-MM-DD
    const isoMatch = p.match(/\b(202\d)-(0[1-9]|1[0-2])-([0-2][0-9]|3[01])\b/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      const MN_UZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
      return { dateStr: `${y}-${m}-${d}`, label: `${+d}-${MN_UZ[+m - 1]}` };
    }

    // Dot notation: DD.MM.YYYY or DD.MM
    const dotMatch = p.match(/\b([0-2]?[0-9]|3[01])\.(0[1-9]|1[0-2])(?:\.(202\d))?\b/);
    if (dotMatch) {
      const [, d, m, y] = dotMatch;
      const year = y || '2026';
      const pad = (n: number | string) => String(n).padStart(2, '0');
      const MN_UZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
      return { dateStr: `${year}-${pad(m)}-${pad(d)}`, label: `${+d}-${MN_UZ[+m - 1]}` };
    }

    // Textual dates: 4-noyabr, 4 noyabr, 4 ноября, 4th november
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
          const pad = (n: number | string) => String(n).padStart(2, '0');
          const MN_UZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
          return { dateStr: `2026-${pad(num)}-${pad(day)}`, label: `${day}-${MN_UZ[num - 1]}` };
        }
      }
    }

    return null;
  }

  static parse(
    prompt: string,
    history: ChatMessage[] = [],
    context?: { selectedDate?: string; selectedPreset?: string; today?: string }
  ): ParsedIntent {
    // Har xil Unicode tutuq belgilari (‘, ’, `, ') ni bitta standart ' ga aylantirish
    const p = prompt.toLowerCase().replace(/[‘’`]/g, "'").trim();
    const lang = this.detectLanguage(prompt);

    const wantsExcel = p.includes('excel') || p.includes('эксел') || p.includes('xls') || p.includes('csv');
    const wantsWord = p.includes('word') || p.includes('ворд') || p.includes('doc') || p.includes('docx') || p.includes('форд');
    const wantsBoth = 
      (wantsExcel && wantsWord) || 
      p.includes('va excel') || 
      p.includes('hamda excel') || 
      p.includes('fayllar') || 
      p.includes('yuklab ol') || 
      p.includes('скачать');
    const wantsTable = p.includes('jadval') || p.includes('таблиц') || p.includes('table');

    // =========================================================================
    // 0. ANIQ HUJJAT VA EKSPORT TALABLARI (EXCEL & WORD YUKLAB OLISH) - [1–60]
    // =========================================================================
    const isExplicitExport = 
      wantsExcel || wantsWord || wantsBoth || 
      p.includes('yuklab') || p.includes('eksport') || p.includes('chiqarib ber') || 
      p.includes('fayl qilib') || p.includes('faylida') || p.includes('havola ber') ||
      p.includes('выгруз') || p.includes('скача') || p.includes('экспорт') || 
      p.includes('export') || p.includes('download');

    if (isExplicitExport) {
      // 0.1. Tadbirlarni eksport qilish
      if (p.includes('tadbir') || p.includes('reja') || p.includes('мероприят') || p.includes('event')) {
        const extractedDate = this.extractDate(prompt);
        if (extractedDate) {
          return {
            type: 'EVENT_TYPES_BREAKDOWN',
            targetScope: 'custom',
            targetDate: extractedDate.dateStr,
            selectedDateContext: context?.selectedDate,
            wantsExcel,
            wantsWord,
            wantsBoth,
            wantsTable,
            isFollowUp: false,
            lang
          };
        }
        if (p.includes('aprel') || p.includes('апрел') || p.includes('april')) {
          return { type: 'EVENT_TYPES_BREAKDOWN', targetScope: 'april', wantsExcel, wantsWord, wantsBoth, wantsTable, isFollowUp: false, lang };
        }
        if (p.includes('bugun') || p.includes('сегодня') || p.includes('today')) {
          return { type: 'EVENT_TYPES_BREAKDOWN', targetScope: 'today', targetDate: context?.today || '2026-11-06', selectedDateContext: context?.selectedDate, wantsExcel, wantsWord, wantsBoth, wantsTable, isFollowUp: false, lang };
        }
        if (p.includes('kecha') || p.includes('вчера') || p.includes('yesterday')) {
          return { type: 'EVENT_TYPES_BREAKDOWN', targetScope: 'yesterday', targetDate: '2026-11-05', selectedDateContext: context?.selectedDate, wantsExcel, wantsWord, wantsBoth, wantsTable, isFollowUp: false, lang };
        }
        if (p.includes('tanlangan') || p.includes('filtr') || p.includes('выбранн') || p.includes('selected')) {
          return { type: 'EVENT_TYPES_BREAKDOWN', targetScope: 'selected', targetDate: context?.selectedDate, selectedDateContext: context?.selectedDate, wantsExcel, wantsWord, wantsBoth, wantsTable, isFollowUp: false, lang };
        }
        if (p.includes('davomat') || p.includes('посещаем') || p.includes('attendance')) {
          return { type: 'AVERAGE_ATTENDANCE', wantsExcel, wantsWord, wantsBoth, wantsTable, isFollowUp: false, lang };
        }
        if (p.includes('top') || p.includes('eng ko\'p') || p.includes('ommabop')) {
          return { type: 'TOP_ATTENDED_EVENTS', limit: 10, wantsExcel, wantsWord, wantsBoth, wantsTable, isFollowUp: false, lang };
        }
        return { type: 'EVENT_TYPES_BREAKDOWN', targetScope: 'all', selectedDateContext: context?.selectedDate, wantsExcel, wantsWord, wantsBoth, wantsTable, isFollowUp: false, lang };
      }

      // 0.2. Mahallalar va davlat organlari umumiy hisobotlarini eksport qilish
      if (
        p.includes('mahalla') || p.includes('махалл') || p.includes('neighborhood') ||
        p.includes('hokimiyat') || p.includes('хокимият') || p.includes('agentlig') || 
        p.includes('rahbariyat') || p.includes('qamrov jadvali') || p.includes('balans')
      ) {
        return { type: 'MAHALLAS_LIST', wantsExcel, wantsWord, wantsBoth, wantsTable, isFollowUp: false, lang };
      }

      // 0.3. Yoshlar va foydalanuvchilar ro'yxatini eksport qilish
      if (p.includes('talaba') || p.includes('студент') || p.includes('student')) {
        return { type: 'STUDENTS_RATING', wantsExcel, wantsWord, wantsBoth, wantsTable, isFollowUp: false, lang };
      }
      if (p.includes('blok') || p.includes('заблок') || p.includes('blocked')) {
        return { type: 'BLOCKED_USERS', wantsExcel, wantsWord, wantsBoth, wantsTable, isFollowUp: false, lang };
      }
      if (p.includes('nofaol') || p.includes('неактивн') || p.includes('inactive')) {
        return { type: 'INACTIVE_USERS', wantsExcel, wantsWord, wantsBoth, wantsTable, isFollowUp: false, lang };
      }
      if (p.includes('faol') || p.includes('активн') || p.includes('active')) {
        return { type: 'ACTIVE_USERS', wantsExcel, wantsWord, wantsBoth, wantsTable, isFollowUp: false, lang };
      }
      if (p.includes('yangi') || p.includes('kecha') || p.includes('bugun') || p.includes('qo\'shilgan') || p.includes('qoshilgan')) {
        return { type: 'RECENT_USERS_LIST', wantsExcel, wantsWord, wantsBoth, wantsTable, isFollowUp: false, lang };
      }
      if (
        p.includes('volontyor') || p.includes('ish qidiruvchi') || p.includes('sportchi') || 
        p.includes('sms') || p.includes('telefon') || p.includes('ruxsat') || p.includes('волонтер')
      ) {
        return { type: 'YOUTH_ROLES_BREAKDOWN', wantsExcel, wantsWord, wantsBoth, wantsTable, isFollowUp: false, lang };
      }

      // 0.4. Umumiy foydalanuvchilar / to'liq eksport paketi
      return { type: 'TOTAL_USERS', wantsExcel, wantsWord, wantsBoth, wantsTable, isFollowUp: false, lang };
    }

    // 1.1. Tarixiy vaqt bo'yicha foydalanuvchilar soni (masalan: "10 kun oldi nechta bor edi", "5 oy oldin qancha foydalanuvchi bor edi")
    const historicalUserMatch = p.match(/(\d+)\s*(kun|oy|hafta|yil|дней|дня|месяц|месяцев|недел|day|days|week|month)\s*(?:oldin|oldi|oldingi|avval|ilgari|orqaga|burun|назад|ago)/i);
    const asksAboutUserCount = 
      p.includes('nechta') || p.includes('nechtab') || p.includes('qancha') || 
      p.includes('soni') || p.includes('sonini') || p.includes('bor edi') || 
      p.includes('foydalanuvchi') || p.includes('foydaliuvchi') || p.includes('yosh') || p.includes('yoshlar') ||
      p.includes('скольк') || p.includes('было') || p.includes('пользовател');

    if (historicalUserMatch && asksAboutUserCount) {
      const amount = parseInt(historicalUserMatch[1], 10);
      let unit: 'kun' | 'oy' | 'hafta' | 'yil' = 'kun';
      const uStr = historicalUserMatch[2].toLowerCase();
      if (uStr.startsWith('oy') || uStr.startsWith('мес') || uStr.startsWith('month')) unit = 'oy';
      else if (uStr.startsWith('hafta') || uStr.startsWith('нед') || uStr.startsWith('week')) unit = 'hafta';
      else if (uStr.startsWith('yil') || uStr.startsWith('год') || uStr.startsWith('year')) unit = 'yil';

      return {
        type: 'HISTORICAL_USER_COUNT',
        historicalAmount: amount,
        historicalUnit: unit,
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 1.15. 10 kunlik / davriy platforma holati va dinamikasi
    const isPeriodOverview = 
      (p.includes('10 kun') || p.includes('10 kunlik') || p.includes('davomida') || p.includes('oxirgi 10') || p.includes('10 дней')) &&
      (p.includes('holat') || p.includes('tahlil') || p.includes('statistika') || p.includes('dinamika') || p.includes('aniqlab') || p.includes('ayt') || p.includes('berchi') || p.includes('otchet') || p.includes('hisobot'));

    if (isPeriodOverview) {
      return {
        type: 'PERIOD_OVERVIEW',
        periodDays: 10,
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 1.2. Nisbiy davrlar (o'tgan oy, otgan oy, shu oy, o'tgan hafta, shu hafta)
    const isCompareMonths = 
      ((p.includes("o'tgan oy") || p.includes("otgan oy") || p.includes("oldingi oy") || p.includes("прошлый месяц") || p.includes("прошлом месяце")) &&
       (p.includes("shu oy") || p.includes("bu oy") || p.includes("joriy oy") || p.includes("этот месяц") || p.includes("в этом месяце"))) ||
      ((p.includes('taqqos') || p.includes('solishtir') || p.includes('qiyos') || p.includes('сравн')) && (p.includes('oy') || p.includes('месяц')));

    if (isCompareMonths) {
      return {
        type: 'COMPARE_MONTHS',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    const isLastMonth = 
      p.includes("o'tgan oy") || p.includes("otgan oy") || p.includes("oldingi oy") || p.includes("прошлый месяц") || p.includes("прошлом месяце") || p.includes("last month");
    const isThisMonth = 
      p.includes("shu oy") || p.includes("bu oy") || p.includes("joriy oy") || p.includes("noyabr oyida") || p.includes("этот месяц") || p.includes("в этом месяце") || p.includes("this month");
    const isLastWeek = 
      p.includes("o'tgan hafta") || p.includes("otgan hafta") || p.includes("oldingi hafta") || p.includes("прошлая неделя") || p.includes("на прошлой неделе") || p.includes("last week");
    const isThisWeek = 
      p.includes("shu hafta") || p.includes("bu hafta") || p.includes("joriy hafta") || p.includes("эта неделя") || p.includes("на этой неделе") || p.includes("this week");

    if (isLastMonth || isThisMonth || isLastWeek || isThisWeek) {
      let relativePeriod: 'last_month' | 'this_month' | 'last_week' | 'this_week' = 'last_month';
      if (isLastMonth) relativePeriod = 'last_month';
      else if (isThisMonth) relativePeriod = 'this_month';
      else if (isLastWeek) relativePeriod = 'last_week';
      else if (isThisWeek) relativePeriod = 'this_week';

      let relativeMetric: 'users' | 'events' | 'all' = 'all';
      if (p.includes('foydalanuvchi') || p.includes('yosh') || p.includes('qo\'shilgan') || p.includes('qoshilgan') || p.includes('ro\'yxat') || p.includes('a\'zo') || p.includes('пользовател')) {
        relativeMetric = 'users';
      } else if (p.includes('tadbir') || p.includes('musobaqa') || p.includes('мероприят')) {
        relativeMetric = 'events';
      }

      return {
        type: 'RELATIVE_PERIOD_STATS',
        relativePeriod,
        relativeMetric,
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 1. Follow-up (Avvalgi natijaga nisbatan o'sish qancha / keyingi savol)
    const isFollowUpGrowth = 
      p.includes('avvalgi natija') ||
      p.includes('oldingi natija') ||
      p.includes('avvalgi natijaga nisbatan') ||
      p.includes('oldingisiga qaraganda') ||
      p.includes('nisbatan o\'sish') ||
      p.includes('nisbatan osish') ||
      p.includes('o\'sish qancha') ||
      p.includes('osish qancha') ||
      p.includes('farqi qancha') ||
      p.includes('qaysi oyda eng ko\'p bo\'lgan') ||
      p.includes('qaysi oyda eng kop bolgan');

    if (isFollowUpGrowth) {
      if (p.includes('qaysi oyda eng')) {
        return {
          type: 'PEAK_REGISTRATION_MONTH',
          wantsExcel,
          wantsWord,
          wantsBoth,
          wantsTable,
          isFollowUp: true,
          lang
        };
      }
      return {
        type: 'FOLLOW_UP_GROWTH',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: true,
        lang
      };
    }

    // 2. Qaysi oyda eng ko'p yangi foydalanuvchilar ro'yxatdan o'tgan
    if (
      (p.includes('qaysi oy') || p.includes('qaysi oyda') || p.includes('в каком месяце')) &&
      (p.includes('eng ko\'p') || p.includes('eng kop') || p.includes('ko\'p') || p.includes('больше всего') || p.includes('maksimal'))
    ) {
      return {
        type: 'PEAK_REGISTRATION_MONTH',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 3. O'tgan oy va shu oyni taqqosla
    if (
      (p.includes('taqqosla') || p.includes('solishtir') || p.includes('qiyosla') || p.includes('сравни') || p.includes('compare')) &&
      (p.includes('oy') || p.includes('oyni') || p.includes('oy bilan') || p.includes('месяц'))
    ) {
      return {
        type: 'COMPARE_MONTHS',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 4. Oxirgi N oyda yangi ro'yxatdan o'tganlar (5 oy, 3 oy, N oy) yoki tarixiy taqqoslash
    const monthPeriodMatch = p.match(/(\d+)\s*(?:oy|oylik|oyda|oy oldin|oy avval|месяц|месяцев)/i);
    const hasPastPeriod = 
      p.includes('oyda') || 
      p.includes('oy oldin') || 
      p.includes('oy avval') || 
      p.includes('oylik') || 
      p.includes('oy davomida') || 
      p.includes('oy ichida') ||
      p.includes('месяцев');

    if (monthPeriodMatch && hasPastPeriod) {
      const monthsCount = parseInt(monthPeriodMatch[1], 10);
      return {
        type: 'USERS_BY_PERIOD',
        periodMonths: monthsCount,
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 4.9. Tadbirlar turlari, foizlari, yo'nalishlar taqsimoti va Donut diagrammasi (bugun, aprel, umumiy)
    const isEventTypesQuery = 
      (p.includes('turlari') || p.includes('turlar') || p.includes('turkum') || p.includes('taqsimot') || p.includes('donut') || p.includes('doiraviy') || p.includes('виды') || p.includes('соотношение') || p.includes('breakdown') || p.includes('categories')) &&
      (p.includes('tadbir') || p.includes('yo\'nalish') || p.includes('yonalish') || p.includes('foiz') || p.includes('процент') || p.includes('percent') || p.includes('мероприят') || p.includes('events'));

    const isDirectPercentageQuery = 
      (p.includes('foizlari') || p.includes('foizi') || p.includes('ulushi') || p.includes('ulush') || p.includes('процент') || p.includes('percentage')) &&
      (p.includes('tadbir') || p.includes('sport') || p.includes('madaniyat') || p.includes('yo\'nalish') || p.includes('kategoriya') || p.includes('bugungi') || p.includes('aprel'));

    // 4.98. Platforma boshqaruvi, sozlamalar, haftalik grafik va ma'muriy amallar (How-To)
    if (
      p.includes('qanday qilinadi') || p.includes('qanday qo\'shiladi') || p.includes('qanday qoshiladi') ||
      p.includes('qanday tahrirlayman') || p.includes('qanday bloklanadi') || p.includes('qanday blokdan') ||
      p.includes('qayerdan o\'zgartiriladi') || p.includes('dark mode') || p.includes('qorong\'i rejim') ||
      p.includes('kattalashtirish') || p.includes('nusxa olish') || p.includes('tarixni tozalash') ||
      p.includes('double click') || p.includes('2 marta bosish') || p.includes('faqat o\'sha kun') ||
      p.includes('nima sababdan 6-noyabr') || p.includes('5-noyabrdan keyingi') ||
      p.includes('barchasi tugmasi') || p.includes('sana bo\'yicha tugmasi') ||
      p.includes('haftalik trend') || p.includes('weekly') || p.includes('haftalar bo\'yicha') ||
      p.includes('ustunlar balandligi') || p.includes('ko\'k rang bilan') || p.includes('logout') ||
      p.includes('parol') || p.includes('mobil versiya') || p.includes('xavfsizlik') ||
      p.includes('qidiruv qanday ishlaydi') || p.includes('sahifalash') || p.includes('toast') ||
      p.includes('yetakchi vazifasi') || p.includes('vazifani belgilab ber') ||
      p.includes('как добавить') || p.includes('как изменить') || p.includes('как заблокировать') ||
      p.includes('почему нельзя') || p.includes('how to add') || p.includes('how to block')
    ) {
      return {
        type: 'PLATFORM_HOW_TO',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 4.99. Mahallalar statistikasi va reytingi (Mahallas)
    if (
      p.includes('mahalla') || p.includes('махалл') || p.includes('махолл') || p.includes('neighborhood') ||
      p.includes('tinchlik') || p.includes('shahriston') || p.includes('bodomzor') ||
      p.includes('chinor') || p.includes('bog\'ishamol') || p.includes('navbahor') ||
      p.includes('oqtepa') || p.includes('yangi hayot') || p.includes('bahor')
    ) {
      return {
        type: 'MAHALLAS_LIST',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 4.995. Yoshlar toifalari, rollari, roziliklari va demografiya
    if (
      p.includes('rollar') || p.includes('toifalar') || p.includes('toifasi') ||
      p.includes('volontyor') || p.includes('ish qidiruvchi') || p.includes('sportchi') ||
      p.includes('sms xabarnoma') || p.includes('rozilik') || p.includes('jins nisbati') ||
      p.includes('qizlar va yigitlar') || p.includes('волонтер') || p.includes('ищущие работу')
    ) {
      return {
        type: 'YOUTH_ROLES_BREAKDOWN',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    const isEventsCountQuery = 
      (p.includes('nechta tadbir') || p.includes('qancha tadbir') || p.includes('tadbirlar soni') || p.includes('tadbir bor') || p.includes('tadbirlar bor') || p.includes('o\'tkazilgan tadbirlar') || p.includes('otkazilgan tadbirlar') || p.includes('сколько мероприятий') || p.includes('how many events')) &&
      !p.includes('30 kun');

    const extractedDate = this.extractDate(prompt);
    const isDateEventsQuery = Boolean(
      (extractedDate || p.includes('bugun') || p.includes('сегодня') || p.includes('today') || p.includes('kecha') || p.includes('вчера') || p.includes('tanlangan') || p.includes('filtr')) &&
      (p.includes('tadbir') || p.includes('мероприят') || p.includes('event'))
    );

    if (isEventTypesQuery || isDirectPercentageQuery || isEventsCountQuery || isDateEventsQuery) {
      let targetScope: string = 'all';
      let targetDate: string | undefined = undefined;

      if (extractedDate) {
        targetScope = 'custom';
        targetDate = extractedDate.dateStr;
      } else if (p.includes('tanlangan') || p.includes('filtr') || p.includes('выбранн') || p.includes('selected date') || p.includes('shu kun')) {
        targetScope = 'selected';
        targetDate = context?.selectedDate;
      } else if (p.includes('bugun') || p.includes('сегодня') || p.includes('today')) {
        targetScope = 'today';
        targetDate = context?.today || '2026-11-06';
      } else if (p.includes('kecha') || p.includes('вчера') || p.includes('yesterday')) {
        targetScope = 'yesterday';
        targetDate = '2026-11-05';
      } else if (p.includes('aprel') || p.includes('апрел') || p.includes('april')) {
        targetScope = 'april';
      }

      return {
        type: 'EVENT_TYPES_BREAKDOWN',
        targetScope,
        targetDate,
        selectedDateContext: context?.selectedDate,
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 5. Eng ko'p tadbir qaysi yo'nalishda o'tkazilgan?
    if (
      (p.includes('eng ko\'p tadbir') || p.includes('eng kop tadbir') || p.includes('qaysi yo\'nalish') || p.includes('qaysi yonalish') || p.includes('eng yetakchi yo\'nalish') || p.includes('какое направление')) &&
      (p.includes('tadbir') || p.includes('yo\'nalish') || p.includes('yonalish') || p.includes('soha') || p.includes('направлен'))
    ) {
      return {
        type: 'TOP_CATEGORY',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 6. Muayyan yo'nalishda qancha yosh ishtirok etgan (Sport, IT, Madaniyat va h.k.)
    if (
      (p.includes('sport') || p.includes('madaniyat') || p.includes('san\'at') || p.includes('it ') || p.includes('ta\'lim') || p.includes('bandlik')) &&
      (p.includes('qancha yosh') || p.includes('nechta yosh') || p.includes('ishtirok etgan') || p.includes('qatnashgan') || p.includes('qatnashdi') || p.includes('qancha yoshlar') || p.includes('сколько участвовало'))
    ) {
      let cat = 'Sport';
      if (p.includes('sport')) {
        cat = 'Sport';
      } else if (p.includes('madaniyat') || p.includes('san\'at') || p.includes('sanat')) {
        cat = 'Madaniyat';
      } else if (p.includes('it') || p.includes('ta\'lim')) {
        cat = 'IT';
      } else if (p.includes('bandlik') || p.includes('ishga joylashish') || /\bish\b/i.test(p)) {
        cat = 'Bandlik';
      }

      return {
        type: 'CATEGORY_PARTICIPATION',
        category: cat,
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 7. Eng ko'p ishtirokchi qatnashgan 5 ta tadbir
    if (
      (p.includes('eng ko\'p ishtirokchi') || p.includes('eng kop ishtirokchi') || p.includes('eng ko\'p qatnashgan') || p.includes('eng ommabop') || p.includes('топ 5 мероприятий') || p.includes('самые популярные')) &&
      (p.includes('tadbir') || p.includes('мероприят'))
    ) {
      return {
        type: 'TOP_ATTENDED_EVENTS',
        limit: 5,
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 8. Oxirgi 30 kunda nechta tadbir o'tkazilgan?
    if (
      (p.includes('30 kun') || p.includes('bir oy') || p.includes('1 oy') || p.includes('oxirgi oy')) &&
      (p.includes('nechta tadbir') || p.includes('qancha tadbir') || p.includes('o\'tkazilgan') || p.includes('otkazilgan') || p.includes('сколько мероприятий'))
    ) {
      return {
        type: 'EVENTS_RECENT',
        periodDays: 30,
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 9. Tadbirlarning o'rtacha qatnashish (davomat) ko'rsatkichi
    if (
      p.includes('o\'rtacha qatnashish') || 
      p.includes('ortacha qatnashish') || 
      p.includes('o\'rtacha davomat') || 
      p.includes('ortacha davomat') || 
      p.includes('davomat ko\'rsatkichi') || 
      p.includes('davomat qancha') || 
      p.includes('kelish ko\'rsatkichi') ||
      p.includes('qatnashish ko\'rsatkichi') ||
      p.includes('qatnashish korsatkichi') ||
      p.includes('средняя посещаемость') ||
      p.includes('average attendance')
    ) {
      return {
        type: 'AVERAGE_ATTENDANCE',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 10. Faol foydalanuvchilar soni qancha?
    if (
      (p.includes('faol') || p.includes('активн') || p.includes('active')) &&
      (p.includes('foydalanuvchi') || p.includes('yosh') || p.includes('soni') || p.includes('qancha') || p.includes('nechta') || p.includes('сколько')) &&
      !p.includes('eng faol mahalla') && !p.includes('faol talaba')
    ) {
      return {
        type: 'ACTIVE_USERS',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 11. Hozir platformada jami nechta yosh bor? (Total users)
    if (
      (p.includes('jami nechta') || p.includes('jami qancha') || p.includes('nechta yosh bor') || p.includes('yoshlar soni') || p.includes('foydalanuvchilar soni') || p.includes('foydalanuvchi soni') || p.includes('umumiy yoshlar') || p.includes('сколько всего пользователей') || p.includes('всего молодежи')) ||
      (p.includes('hozir') && (p.includes('qancha') || p.includes('nechta') || p.includes('soni')) && (p.includes('yosh') || p.includes('foydalanuvchi'))) ||
      (p.includes('total users') || p.includes('how many total') || (p.includes('how many') && p.includes('users')) || (p.includes('users') && p.includes('registered')))
    ) {
      return {
        type: 'TOTAL_USERS',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 12. Eng yaxshi talabalar
    if (p.includes('talaba') || p.includes('студент') || p.includes('student')) {
      return {
        type: 'STUDENTS_RATING',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 13. Kech / yangi qo'shilgan foydalanuvchilarning ism-familiyalari
    if (
      (p.includes('ism') || p.includes('familya') || p.includes('familiya') || p.includes('kimlar') || p.includes('ismlari')) &&
      (p.includes('kech') || p.includes('kecha') || p.includes('yangi') || p.includes('oxirgi') || p.includes('qoshilgan') || p.includes('qo\'shilgan'))
    ) {
      return {
        type: 'RECENT_USERS_LIST',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 14. Nofaol foydalanuvchilar
    if (p.includes('nofaol') || p.includes('неактивн')) {
      return {
        type: 'INACTIVE_USERS',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 15. Bloklangan foydalanuvchilar
    if (p.includes('blok') || p.includes('заблок')) {
      return {
        type: 'BLOCKED_USERS',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 15.1. Yoshlar toifalari, rollari, roziliklari va demografiya
    if (
      p.includes('rollar') || p.includes('toifalar') || p.includes('toifasi') ||
      p.includes('volontyor') || p.includes('ish qidiruvchi') || p.includes('sportchi') ||
      p.includes('sms xabarnoma') || p.includes('rozilik') || p.includes('jins nisbati') ||
      p.includes('qizlar va yigitlar') || p.includes('волонтер') || p.includes('ищущие работу')
    ) {
      return {
        type: 'YOUTH_ROLES_BREAKDOWN',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 15.2. Mahallalar statistikasi va reytingi
    if (
      p.includes('mahalla') || p.includes('махалл') || p.includes('махолл') ||
      p.includes('tinchlik') || p.includes('shahriston') || p.includes('bodomzor') ||
      p.includes('chinor') || p.includes('bog\'ishamol') || p.includes('navbahor') ||
      p.includes('oqtepa') || p.includes('yangi hayot') || p.includes('bahor')
    ) {
      return {
        type: 'MAHALLAS_LIST',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 15.3. Xarita, lokatsiyalar va o'tkazilish joylari
    if (
      p.includes('lokatsiya') || p.includes('xarita') || p.includes('xaritadagi') ||
      p.includes('qayerda joylashgan') || p.includes('sport maydoni') || p.includes('yoshlar markazi') ||
      p.includes('kutubxona') || p.includes('istirohat bog\'i') || p.includes('lokatsiyalar') ||
      p.includes('локаци') || p.includes('карта') || p.includes('map')
    ) {
      return {
        type: 'LOCATION_STATS',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 15.4. Platforma boshqaruvi, sozlamalar, haftalik grafik va ma'muriy amallar
    if (
      p.includes('qanday qilinadi') || p.includes('qanday qo\'shiladi') || p.includes('qanday qoshiladi') ||
      p.includes('qanday tahrirlayman') || p.includes('qanday bloklanadi') || p.includes('qanday blokdan') ||
      p.includes('qayerdan o\'zgartiriladi') || p.includes('dark mode') || p.includes('qorong\'i rejim') ||
      p.includes('kattalashtirish') || p.includes('nusxa olish') || p.includes('tarixni tozalash') ||
      p.includes('double click') || p.includes('2 marta bosish') || p.includes('faqat o\'sha kun') ||
      p.includes('nima sababdan 6-noyabr') || p.includes('5-noyabrdan keyingi') ||
      p.includes('barchasi tugmasi') || p.includes('sana bo\'yicha tugmasi') ||
      p.includes('haftalik trend') || p.includes('weekly') || p.includes('haftalar bo\'yicha') ||
      p.includes('ustunlar balandligi') || p.includes('ko\'k rang bilan') || p.includes('logout') ||
      p.includes('parol') || p.includes('mobil versiya') || p.includes('xavfsizlik') ||
      p.includes('qidiruv qanday ishlaydi') || p.includes('sahifalash') || p.includes('toast') ||
      p.includes('yetakchi vazifasi') || p.includes('vazifani belgilab ber') ||
      p.includes('как добавить') || p.includes('как изменить') || p.includes('как заблокировать') ||
      p.includes('почему нельзя') || p.includes('how to add') || p.includes('how to block')
    ) {
      return {
        type: 'PLATFORM_HOW_TO',
        wantsExcel,
        wantsWord,
        wantsBoth,
        wantsTable,
        isFollowUp: false,
        lang
      };
    }

    // 16. Salomlashish
    if (
      /^(qalesan|qalaysiz|qaleysiz|ishlar qalay|salom|assalomu alaykum|yaxshimisiz|hello|hi|привет|здравствуйте)\b/i.test(p) ||
      p === 'qalesan' || p === 'salom'
    ) {
      return {
        type: 'GREETINGS',
        wantsExcel: false,
        wantsWord: false,
        wantsBoth: false,
        wantsTable: false,
        isFollowUp: false,
        lang
      };
    }

    return {
      type: 'GENERAL_QUERY',
      wantsExcel,
      wantsWord,
      wantsBoth,
      wantsTable,
      isFollowUp: false,
      lang
    };
  }
}
