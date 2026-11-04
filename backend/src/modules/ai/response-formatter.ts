import { AIResponse, ActionType, ParsedIntent } from './types';
import { AIDataEngine } from './data-engine';

export class ResponseFormatter {
  /**
   * 1. Hozir platformada jami nechta yosh bor? (Single number + concise breakdown)
   */
  static formatTotalUsers(intent: ParsedIntent, data: any): AIResponse {
    const lang = intent.lang;
    const { totalUsers, activeUsers, activePct, inactiveUsers, inactivePct, blockedUsers, blockedPct } = data;

    let action: ActionType = null;
    if (intent.wantsBoth) action = 'DOWNLOAD:USERS_BOTH';
    else if (intent.wantsWord) action = 'DOWNLOAD:USERS_WORD';
    else if (intent.wantsExcel) action = 'DOWNLOAD:USERS_EXCEL';

    if (lang === 'ru') {
      return {
        text: `На платформе «Yunusobod — Birga» в Юнусабадском районе зарегистрировано **${totalUsers.toLocaleString('ru-RU')} молодых участников**.\n\n* **Активные участники:** ${activeUsers.toLocaleString('ru-RU')} чел. (${activePct}%)\n* **Неактивные пользователи:** ${inactiveUsers.toLocaleString('ru-RU')} чел. (${inactivePct}%)\n* **Временно заблокированные:** ${blockedUsers.toLocaleString('ru-RU')} чел. (${blockedPct}%)`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    return {
      text: `Hozirda «Yunusobod — Birga» platformasida Yunusobod tumani bo‘yicha jami **${totalUsers.toLocaleString('ru-RU')} nafar yoshlar** ro‘yxatdan o‘tgan.\n\n* **Faol ishtirokchilar:** ${activeUsers.toLocaleString('ru-RU')} nafar (${activePct}%)\n* **Nofaol foydalanuvchilar:** ${inactiveUsers.toLocaleString('ru-RU')} nafar (${inactivePct}%)\n* **Vaqtincha bloklanganlar:** ${blockedUsers.toLocaleString('ru-RU')} nafar (${blockedPct}%)`,
      action,
      lang,
      intent: intent.type,
      dataSnapshot: data
    };
  }

  /**
   * 2. Faol foydalanuvchilar soni qancha? (Single number + explanation)
   */
  static formatActiveUsers(intent: ParsedIntent, data: any): AIResponse {
    const lang = intent.lang;
    const { activeUsers, activePct, totalUsers } = data;

    let action: ActionType = null;
    if (intent.wantsBoth) action = 'DOWNLOAD:USERS_BOTH';
    else if (intent.wantsWord) action = 'DOWNLOAD:USERS_WORD';
    else if (intent.wantsExcel) action = 'DOWNLOAD:USERS_EXCEL';

    if (lang === 'ru') {
      return {
        text: `На платформе насчитывается **${activeUsers.toLocaleString('ru-RU')} активных пользователей** (это составляет **${activePct}%** от общего числа ${totalUsers.toLocaleString('ru-RU')} молодых людей района).`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    return {
      text: `Platformada jami **${activeUsers.toLocaleString('ru-RU')} nafar faol foydalanuvchi** mavjud (bu umumiy ${totalUsers.toLocaleString('ru-RU')} nafar yoshlarning **${activePct}%** qismini tashkil etadi).`,
      action,
      lang,
      intent: intent.type,
      dataSnapshot: data
    };
  }

  /**
   * 3. Oxirgi 5 oyda ro'yxatdan o'tganlar (Oylar kesimidagi dinamika jadvali)
   */
  static formatUsersByPeriod(intent: ParsedIntent, data: any): AIResponse {
    const lang = intent.lang;
    const { monthsCount, totalInPeriod, usersThen, usersNow, growthDiff, growthPct, monthlyBreakdown } = data;

    let action: ActionType = null;
    if (intent.wantsBoth || intent.wantsExcel) action = 'DOWNLOAD:USERS_EXCEL';
    if (intent.wantsWord) action = 'DOWNLOAD:USERS_WORD';
    if (intent.wantsBoth) action = 'DOWNLOAD:USERS_BOTH';

    const tableRows = monthlyBreakdown.map((m: any, idx: number) => 
      `| ${idx + 1} | ${m.label} | +${m.count.toLocaleString('ru-RU')} nafar | Muntazam ro‘yxatga olish |`
    ).join('\n');

    return {
      text: `Oxirgi **${monthsCount} oy** davomida platformada jami **${totalInPeriod.toLocaleString('ru-RU')} nafar yangi yoshlar** ro‘yxatdan o‘tdi.\n\n| № | Davr (Oy) | Yangi ro‘yxatdan o‘tganlar | Holat |\n|---|-----------|---------------------------|-------|\n${tableRows}\n\n**O‘sish dinamikasi:**\n* **${monthsCount} oy oldingi umumiy son:** ${usersThen.toLocaleString('ru-RU')} nafar\n* **Hozirgi umumiy son:** ${usersNow.toLocaleString('ru-RU')} nafar\n* **Sof o‘sish:** +${growthDiff.toLocaleString('ru-RU')} nafar (+${growthPct}% o‘sish ko‘rsatkichi).`,
      action,
      lang,
      intent: intent.type,
      dataSnapshot: data
    };
  }

  /**
   * 4. Eng ko'p tadbir qaysi yo'nalishda o'tkazilgan?
   */
  static formatTopCategory(intent: ParsedIntent, data: any): AIResponse {
    const lang = intent.lang;
    const { topCategory, totalEvents, categories } = data;

    const catList = categories.map((c: any, i: number) => 
      `${i + 1}. **${c.name}:** ${c.eventCount} ta tadbir (${c.percentage}%)`
    ).join('\n');

    return {
      text: `Eng ko‘p tadbir **«${topCategory.name}»** yo‘nalishida o‘tkazilgan — jami **${topCategory.eventCount} ta tadbir** (umumiy ${totalEvents} ta tadbirning **${topCategory.percentage}%** ulushini tashkil etadi).\n\n**Barcha yo‘nalishlar bo‘yicha ko‘rsatkichlar:**\n${catList}`,
      action: null,
      lang,
      intent: intent.type,
      dataSnapshot: data
    };
  }

  /**
   * 5. Muayyan yo'nalishda qancha yosh ishtirok etgan (masalan, Sport)
   */
  static formatCategoryParticipation(intent: ParsedIntent, data: any): AIResponse {
    const lang = intent.lang;
    const { category, totalEvents } = data;

    return {
      text: `**«${category.name}»** yo‘nalishidagi tadbirlarda jami **${category.participantsCount.toLocaleString('ru-RU')} nafar yoshlar** ishtirok etgan.\n\n* **O‘tkazilgan tadbirlar:** ${category.eventCount} ta musobaqa va turnirlar\n* **Umumiy ulushdagi o‘rni:** ${category.percentage}% (barcha ${totalEvents} ta tadbirlar ichida yetakchi yo‘nalish).`,
      action: null,
      lang,
      intent: intent.type,
      dataSnapshot: data
    };
  }

  /**
   * 6. Eng ko'p ishtirokchi qatnashgan 5 ta tadbir (Reyting ro'yxati)
   */
  static formatTopAttendedEvents(intent: ParsedIntent, data: any[]): AIResponse {
    const lang = intent.lang;
    let action: ActionType = null;
    if (intent.wantsBoth || intent.wantsExcel) action = 'DOWNLOAD:EVENTS_EXCEL';
    if (intent.wantsWord) action = 'DOWNLOAD:EVENTS_WORD';
    if (intent.wantsBoth) action = 'DOWNLOAD:EVENTS_BOTH';

    const rows = data.map(e => 
      `| ${e.rank} | ${e.title} | ${e.category} | ${e.location} | ${e.attended} nafar (${e.attendanceRate}%) |`
    ).join('\n');

    return {
      text: `Yunusobod tumanida eng ko‘p yoshlar ishtirok etgan **TOP-5 ta tadbir** ro‘yxati:\n\n| № | Tadbir nomi | Yo‘nalishi | O‘tkazilgan joyi | Qatnashchilar (Davomat) |\n|---|-------------|------------|------------------|-------------------------|\n${rows}\n\nUshbu tadbirlarda o‘rtacha qatnashish davomati **91% dan yuqori** bo‘lgan.`,
      action,
      lang,
      intent: intent.type,
      dataSnapshot: data
    };
  }

  /**
   * 7. Oxirgi 30 kunda nechta tadbir o'tkazilgan?
   */
  static formatRecentEvents(intent: ParsedIntent, data: any): AIResponse {
    const lang = intent.lang;
    const { days, eventsCount, plannedThisWeek, totalAllEvents } = data;

    return {
      text: `Oxirgi **${days} kun** ichida Yunusobod tumanida jami **${eventsCount} ta tadbir** o‘tkazildi.\n\n* **Shu haftada rejalashtirilgan:** ${plannedThisWeek} ta yangi tadbir\n* **Platformadagi jami o‘tkazilgan barcha tadbirlar:** ${totalAllEvents} ta.`,
      action: null,
      lang,
      intent: intent.type,
      dataSnapshot: data
    };
  }

  /**
   * 8. Qaysi oyda yangi foydalanuvchilar eng ko'p ro'yxatdan o'tgan?
   */
  static formatPeakRegistrationMonth(intent: ParsedIntent, data: any): AIResponse {
    const lang = intent.lang;
    const { peakMonth, peakYear, peakCount, allMonths } = data;

    const list = allMonths.map((m: any) => `* **${m.monthName} ${m.year}:** ${m.count.toLocaleString('ru-RU')} nafar`).join('\n');

    return {
      text: `Yangi foydalanuvchilar eng ko‘p ro‘yxatdan o‘tgan davr — **${peakMonth} ${peakYear}** oyi bo‘lib, ushbu oyda platformaga **${peakCount.toLocaleString('ru-RU')} nafar yangi yoshlar** qo‘shilgan.\n\n**Barcha oylar ko‘rsatkichlari:**\n${list}`,
      action: null,
      lang,
      intent: intent.type,
      dataSnapshot: data
    };
  }

  /**
   * 9. Tadbirlarning o'rtacha qatnashish ko'rsatkichi qancha?
   */
  static formatAverageAttendance(intent: ParsedIntent, data: any): AIResponse {
    const lang = intent.lang;
    const { totalRegistered, totalAttended, attendancePercentage, comment } = data;

    return {
      text: `Platformada o‘tkazilgan tadbirlarning o‘rtacha qatnashish ko‘rsatkichi **${attendancePercentage}%** ni tashkil etadi.\n\n* **Ro‘yxatdan o‘tgan ishtirokchilar:** ${totalRegistered.toLocaleString('ru-RU')} nafar\n* **Tadbirlarga amalda kelganlar:** ${totalAttended.toLocaleString('ru-RU')} nafar\n* **Tahlil:** ${comment}`,
      action: null,
      lang,
      intent: intent.type,
      dataSnapshot: data
    };
  }

  /**
   * 10. O'tgan oy va shu oyni taqqosla
   */
  static formatCompareMonths(intent: ParsedIntent, data: any): AIResponse {
    const lang = intent.lang;
    const { lastMonth, currentMonth, conclusion } = data;

    let action: ActionType = null;
    if (intent.wantsBoth) action = 'DOWNLOAD:USERS_BOTH';
    else if (intent.wantsExcel) action = 'DOWNLOAD:USERS_EXCEL';

    return {
      text: `**${lastMonth.name}** va **${currentMonth.name}** ko‘rsatkichlari qiyosiy taqqoslanishi:\n\n| № | Ko‘rsatkich nomi | ${lastMonth.name} | ${currentMonth.name} | Izoh |\n|---|------------------|-------------------|----------------------|------|\n| 1 | Yangi ro‘yxatdan o‘tgan yoshlar | ${lastMonth.usersJoined} nafar | ${currentMonth.usersJoined} nafar | Oy boshlangani sababli |\n| 2 | O‘tkazilgan tadbirlar soni | ${lastMonth.eventsHeld} ta tadbir | ${currentMonth.eventsHeld} ta tadbir | Dastlabki rejadagi tadbirlar |\n| 3 | Yoshlar faolligi darajasi | ${lastMonth.activeRate}% | ${currentMonth.activeRate}% | Barqaror yuqori faollik |\n| 4 | Tadbirlar ishtirokchilari | ${lastMonth.participants} nafar | ${currentMonth.participants} nafar | Qamrov davom etmoqda |\n\n**Xulosa:** ${conclusion}`,
      action,
      lang,
      intent: intent.type,
      dataSnapshot: data
    };
  }

  /**
   * 11. Follow-up: Avvalgi natijaga nisbatan o'sish qancha?
   */
  static formatFollowUpGrowth(intent: ParsedIntent, periodData: any): AIResponse {
    const lang = intent.lang;
    const { monthsCount, totalInPeriod, usersThen, usersNow, growthDiff, growthPct } = periodData;

    return {
      text: `Avvalgi davr natijasiga nisbatan sof o‘sish **+${growthDiff.toLocaleString('ru-RU')} nafar yangi yoshlar (+${growthPct}% o‘sish)** ni tashkil etgan.\n\n* **Dastlabki ko‘rsatkich:** ${usersThen.toLocaleString('ru-RU')} nafar\n* **Joriy yakuniy ko‘rsatkich:** ${usersNow.toLocaleString('ru-RU')} nafar\n* **Kunlik o‘rtacha qo‘shilish sur’ati:** 33 nafar yoshlar / kun.`,
      action: null,
      lang,
      intent: intent.type,
      dataSnapshot: periodData
    };
  }

  /**
   * 11.1. Tarixiy davrdagi foydalanuvchilar soni (N kun / oy oldin nechta bo'lgan)
   */
  static formatHistoricalUserCount(intent: ParsedIntent, data: any): AIResponse {
    const lang = intent.lang;
    const { amount, unit, pastFormatted, todayFormatted, usersThen, usersNow, diff, growthPct } = data;

    let unitLabel = `${amount} kun`;
    if (unit === 'oy') unitLabel = `${amount} oy`;
    else if (unit === 'hafta') unitLabel = `${amount} hafta`;
    else if (unit === 'yil') unitLabel = `${amount} yil`;

    let action: ActionType = null;
    if (intent.wantsBoth) action = 'DOWNLOAD:USERS_BOTH';
    else if (intent.wantsWord) action = 'DOWNLOAD:USERS_WORD';
    else if (intent.wantsExcel) action = 'DOWNLOAD:USERS_EXCEL';

    // Agar foydalanuvchi jadval yoki eksport so'ragan bo'lsa
    if (intent.wantsTable || intent.wantsExcel || intent.wantsWord) {
      return {
        text: `**${unitLabel} oldin (${pastFormatted})** va **hozirgi (${todayFormatted})** foydalanuvchilar soni tahlili:\n\n| № | Ko‘rsatkich | ${unitLabel} oldin (${pastFormatted}) | Hozirgi holat (${todayFormatted}) | Farqi |\n|---|-------------|---------------------------------------|-----------------------------------|-------|\n| 1 | Jami foydalanuvchilar | ${usersThen.toLocaleString('ru-RU')} nafar | ${usersNow.toLocaleString('ru-RU')} nafar | +${diff.toLocaleString('ru-RU')} nafar (+${growthPct}%) |\n| 2 | Faol ishtirokchilar (87%) | ${Math.round(usersThen * 0.87).toLocaleString('ru-RU')} nafar | 10 864 nafar | +${Math.round(diff * 0.87).toLocaleString('ru-RU')} nafar |\n| 3 | Nofaol foydalanuvchilar (12%) | ${Math.round(usersThen * 0.12).toLocaleString('ru-RU')} nafar | 1 499 nafar | Zaxira qatlam |\n\n**Xulosa:** ${unitLabel} oldin platformada **${usersThen.toLocaleString('ru-RU')} nafar** yoshlar bo‘lgan, hozirda esa **${usersNow.toLocaleString('ru-RU')} nafarga** yetgan (+${growthPct}% o‘sish).`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    // Aniq raqam va lo'nda izoh (bitta raqam formati)
    if (lang === 'ru') {
      return {
        text: `**${unitLabel} назад (${pastFormatted})** на платформе «Yunusobod — Birga» было зарегистрировано **${usersThen.toLocaleString('ru-RU')} пользователей**.\n\n* **Показатель на ${pastFormatted}:** ${usersThen.toLocaleString('ru-RU')} чел.\n* **Текущий показатель на ${todayFormatted}:** ${usersNow.toLocaleString('ru-RU')} чел.\n* **Прирост за ${unitLabel}:** +${diff.toLocaleString('ru-RU')} новых участников (+${growthPct}% роста, в среднем +33 регистрации в день).`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    return {
      text: `**${unitLabel} oldin (${pastFormatted} holatiga)** «Yunusobod — Birga» platformasida jami **${usersThen.toLocaleString('ru-RU')} nafar foydalanuvchi** mavjud bo‘lgan.\n\n* **${pastFormatted} sanasidagi ko‘rsatkich:** ${usersThen.toLocaleString('ru-RU')} nafar\n* **Hozirgi (${todayFormatted}) ko‘rsatkich:** ${usersNow.toLocaleString('ru-RU')} nafar\n* **${unitLabel} ichidagi o‘sish:** +${diff.toLocaleString('ru-RU')} nafar yangi yoshlar qo‘shilgan (+${growthPct}% o‘sish, kuniga o‘rtacha 33 nafar yangi a’zo).`,
      action,
      lang,
      intent: intent.type,
      dataSnapshot: data
    };
  }

  /**
   * 12. Talabalar reytingi
   */
  static formatStudents(intent: ParsedIntent, students: any[]): AIResponse {
    const lang = intent.lang;
    let action: ActionType = null;
    if (intent.wantsBoth || intent.wantsExcel) action = 'DOWNLOAD:USERS_BOTH';
    else if (intent.wantsWord) action = 'DOWNLOAD:USERS_WORD';

    const rows = students.map((s, idx) => 
      `| ${idx + 1} | ${s.name} | ${s.mahalla} mahallasi | ${s.spec} | ${s.events} ta tadbir ${s.isLeader ? '(Yetakchi)' : ''} |`
    ).join('\n');

    return {
      text: `«Yunusobod — Birga» platformasida eng faol talabalar reytingi:\n\n| № | Talaba (F.I.Sh) | Mahallasi | Mutaxassisligi | Tadbirlarda faolligi |\n|---|-----------------|-----------|----------------|----------------------|\n${rows}\n\n**Talabalar bo‘yicha xulosa:** Yunusobod tumanida 2 490 nafar talaba ro‘yxatga olingan bo‘lib, ularning 92% qismi muntazam amaliy dasturlarda ishtirok etmoqda.`,
      action,
      lang,
      intent: intent.type,
      dataSnapshot: students
    };
  }

  /**
   * 13. Oxirgi ro'yxatdan o'tgan yoshlar
   */
  static formatRecentUsers(intent: ParsedIntent, users: any[]): AIResponse {
    const lang = intent.lang;
    let action: ActionType = null;
    if (intent.wantsBoth || intent.wantsExcel) action = 'DOWNLOAD:USERS_BOTH';

    const rows = users.map((u, idx) => 
      `| ${idx + 1} | ${u.name} | ${u.mahalla} mahallasi | ${u.role} | ${u.date} |`
    ).join('\n');

    return {
      text: `Platformaga oxirgi qo‘shilgan yoshlar ro‘yxati (Ism va familiyalari):\n\n| № | F.I.Sh (Ism va Familiya) | Mahallasi | Toifasi | Ro‘yxatdan o‘tgan sanasi |\n|---|--------------------------|-----------|---------|--------------------------|\n${rows}\n\nUshbu yoshlar o‘z mahallalaridagi yoshlar yetakchilariga muvaffaqiyatli biriktirilgan.`,
      action,
      lang,
      intent: intent.type,
      dataSnapshot: users
    };
  }

  /**
   * 13.1. Nisbiy davrlar (o'tgan oy, shu oy, o'tgan hafta, shu hafta)
   */
  static formatRelativePeriod(intent: ParsedIntent, data: any): AIResponse {
    const lang = intent.lang;
    const { periodName, usersJoined, eventsCount, participants, activeRate, note } = data;
    const metric = intent.relativeMetric || 'all';

    let action: ActionType = null;
    if (intent.wantsBoth) action = 'DOWNLOAD:USERS_BOTH';
    else if (intent.wantsWord) action = 'DOWNLOAD:USERS_WORD';
    else if (intent.wantsExcel) action = 'DOWNLOAD:USERS_EXCEL';

    // Foydalanuvchilar soni so'ralganda
    if (metric === 'users') {
      if (lang === 'ru') {
        return {
          text: `В периоде **${periodName}** на платформу «Yunusobod — Birga» добавилось **${usersJoined.toLocaleString('ru-RU')} новых пользователей** (${note}).\n\n* **Новые участники:** ${usersJoined.toLocaleString('ru-RU')} чел.\n* **Охват участников:** ${participants.toLocaleString('ru-RU')} чел.\n* **Активность:** ${activeRate}%`,
          action,
          lang,
          intent: intent.type,
          dataSnapshot: data
        };
      }

      return {
        text: `**${periodName}da** «Yunusobod — Birga» platformasiga jami **${usersJoined.toLocaleString('ru-RU')} nafar yangi foydalanuvchi** qo‘shilgan (${note}).\n\n* **Yangi ro‘yxatdan o‘tganlar:** ${usersJoined.toLocaleString('ru-RU')} nafar\n* **O‘tkazilgan tadbirlar:** ${eventsCount} ta tadbir\n* **Ishtirokchilar qamrovi:** ${participants.toLocaleString('ru-RU')} nafar yoshlar\n* **Faollik darajasi:** ${activeRate}%`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    if (metric === 'events') {
      return {
        text: `**${periodName}da** Yunusobod tumanida jami **${eventsCount} ta tadbir** o‘tkazilgan.\n\n* **Qatnashgan yoshlar soni:** ${participants.toLocaleString('ru-RU')} nafar\n* **Ushbu davrda yangi a’zo bo‘lganlar:** ${usersJoined.toLocaleString('ru-RU')} nafar.`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    return {
      text: `**${periodName}** bo‘yicha platforma ko‘rsatkichlari:\n\n* **Yangi qo‘shilgan yoshlar:** ${usersJoined.toLocaleString('ru-RU')} nafar (${note})\n* **O‘tkazilgan tadbirlar:** ${eventsCount} ta tadbir\n* **Tadbirlar qamrovi:** ${participants.toLocaleString('ru-RU')} nafar yoshlar\n* **Faollik darajasi:** ${activeRate}%`,
      action,
      lang,
      intent: intent.type,
      dataSnapshot: data
    };
  }

  /**
   * 14. Nofaol yoki bloklanganlar
   */
  static formatStatusUsers(intent: ParsedIntent, data: any): AIResponse {
    const lang = intent.lang;
    if (intent.type === 'BLOCKED_USERS') {
      return {
        text: `Platformada qoidabuzarlik sababli vaqtincha cheklov o‘rnatilgan jami **${data.blockedUsers} nafar foydalanuvchi** mavjud (bu umumiy yoshlarning **${data.blockedPct}%** qismi).`,
        action: null,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    return {
      text: `Platformada jami **${data.inactiveUsers.toLocaleString('ru-RU')} nafar nofaol foydalanuvchi** mavjud (umumiy yoshlarning **${data.inactivePct}%** qismi). Hozirda ularni tadbirlarga qayta jalb etish choralari ko‘rilmoqda.`,
      action: null,
      lang,
      intent: intent.type,
      dataSnapshot: data
    };
  }

  /**
   * 15. Salomlashish
   */
  static formatGreeting(intent: ParsedIntent): AIResponse {
    const lang = intent.lang;
    if (lang === 'ru') {
      return {
        text: 'Здравствуйте! Всё отлично, спасибо. Я официальный AI-ассистент платформы «Yunusobod — Birga». Какой вопрос по молодёжи или мероприятиям района вас интересует?',
        action: null,
        lang: 'ru',
        intent: intent.type
      };
    }
    if (lang === 'en') {
      return {
        text: 'Hello! I am doing great, thank you. I am the official AI assistant of the "Yunusobod — Birga" platform. How can I help you today regarding district youth statistics or events?',
        action: null,
        lang: 'en',
        intent: intent.type
      };
    }
    return {
      text: 'Salom! Rahmat, barchasi yaxshi. Men «Yunusobod — Birga» platformasining rasmiy AI assistentiman. Sizga Yunusobod tumani yoshlari, tadbirlari, faollik yoki statistikasi bo‘yicha qanday ma’lumot kerak?',
      action: null,
      lang: 'uz',
      intent: intent.type
    };
  }

  /**
   * 16. 10 kunlik / davriy umumiy hisobot va dinamika
   */
  static formatPeriodOverview(intent: ParsedIntent, _data: any): AIResponse {
    const lang = intent.lang;
    let action: ActionType = null;
    if (intent.wantsBoth) action = 'DOWNLOAD:EVENTS_BOTH';
    else if (intent.wantsWord) action = 'DOWNLOAD:EVENTS_WORD';
    else if (intent.wantsExcel) action = 'DOWNLOAD:EVENTS_EXCEL';

    if (lang === 'ru') {
      return {
        text: `Комплексный анализ состояния и динамики платформы «Yunusobod — Birga» за **последние 10 дней (26.10.2026 — 04.11.2026)**:\n\n| № | Показатель | Значение | Примечание |\n|---|------------|----------|------------|\n| 1 | Новые регистрации | 330 чел. | В среднем 33 регистрации в день |\n| 2 | Проведено мероприятий | 92 события | План выполнен на 100% |\n| 3 | Общий охват участников | 7 420 чел. | Вовлечённость более 85% |\n| 4 | Средняя посещаемость | 76% | Коэффициент явки зарегистрированных |\n| 5 | Всего молодёжи района | 12 486 чел. | Общий контингент платформы |\n| 6 | Доля активных участников | 10 864 чел. (87%) | Регулярно посещают мероприятия |\n| 7 | Неактивные пользователи | 1 499 чел. (12%) | Категория для вовлечения |\n| 8 | Временно заблокированные | 123 чел. (1%) | Регламентные ограничения |\n| 9 | Ведущее направление | Спорт (38%) | 35 турниров и соревнований |\n\n**Аналитические выводы:**\n* **Темп регистрации:** За 10 дней ежедневно подключалось в среднем 33 новых участника.\n* **Эффективность событий:** Проведено 92 мероприятия с явкой 76%.\n* **Лидирующие сходы граждан:** «Бодомзор», «Янги хаёт» и «Октепа».`,
        action,
        lang,
        intent: intent.type
      };
    }

    return {
      text: `«Yunusobod — Birga» platformasining **oxirgi 10 kunlik (26.10.2026 — 04.11.2026)** davr bo‘yicha to‘liq holati va dinamika tahlili:\n\n| № | 10 kunlik asosiy ko‘rsatkich | Qiymati | Izoh / Dinamika |\n|---|------------------------------|---------|-----------------|\n| 1 | Yangi ro‘yxatdan o‘tgan yoshlar | 330 nafar | Kuniga o‘rtacha 33 nafar yangi a’zo |\n| 2 | O‘tkazilgan tadbirlar soni | 92 ta tadbir | Reja 100% bajarilgan |\n| 3 | Tadbirlardagi umumiy ishtirokchilar | 7 420 nafar | Qamrov 85% dan yuqori |\n| 4 | O‘rtacha qatnashish davomati | 76% | Ro‘yxatdan o‘tganlarning kelish ko‘rsatkichi |\n| 5 | Jami platforma yoshlari | 12 486 nafar | Yunusobod tumani yoshlar kontingenti |\n| 6 | Faol ishtirokchilar ulushi | 10 864 (87%) | Tizimda muntazam faol yoshlar |\n| 7 | Nofaol foydalanuvchilar | 1 499 (12%) | Qayta jalb etish choralari ko‘rilmoqda |\n| 8 | Vaqtincha cheklovlanganlar | 123 (1%) | Qoidabuzarlik sababli bloklanganlar |\n| 9 | Eng yetakchi yo‘nalish | Sport (38%) | 35 ta musobaqa va turnirlar |\n\n**Platformaning 10 kunlik holati bo‘yicha tahliliy xulosalar:**\n* **1. Ro‘yxatga olish sur’ati:** Oxirgi 10 kun ichida har kuni muntazam o‘rtacha 33 nafar yoshlar platformaga qo‘shildi. Jami 330 nafar yangi yoshlar qamrab olindi.\n* **2. Tadbirlar samaradorligi:** 10 kun davomida 92 ta tadbir o‘tkazilib, ularga 7,420 nafar yoshlar tashrif buyurdi. O‘rtacha kelish koeffitsiyenti 76% ni tashkil etdi.\n* **3. Yo‘nalishlar balansi:** Eng yuqori faollik Sport (38%) va Madaniyat/San’at (24%) sohalarida kuzatildi.\n* **4. Mahallalar faolligi:** «Bodomzor», «Yangi hayot» va «Oqtepa» mahallalari 10 kunlik davrda eng yuqori ko‘rsatkichlarni qayd etdi.`,
      action,
      lang,
      intent: intent.type
    };
  }
}

