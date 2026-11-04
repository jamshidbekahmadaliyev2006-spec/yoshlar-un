import { ParsedIntent, IntentType, SupportedLang, ChatMessage } from './types';

export class IntentAnalyzer {
  static detectLanguage(text: string): SupportedLang {
    const p = text.toLowerCase();
    // Rus tili harflari va so'zlari
    if (/[а-яё]/i.test(p)) {
      if (
        p.includes('привет') || p.includes('здравствуй') || p.includes('сколько') ||
        p.includes('пользовател') || p.includes('мероприят') || p.includes('махалл') ||
        p.includes('студент') || p.includes('сравни') || p.includes('покажи')
      ) {
        return 'ru';
      }
    }
    // Ingliz tili
    if (
      /\b(how many|what is|tell me|show me|events|users|statistics|compare|hello|hi)\b/i.test(p)
    ) {
      return 'en';
    }
    return 'uz';
  }

  static parse(prompt: string, history: ChatMessage[] = []): ParsedIntent {
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
      (p.includes('hozir') && (p.includes('qancha') || p.includes('nechta') || p.includes('soni')) && (p.includes('yosh') || p.includes('foydalanuvchi')))
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
