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

    if (lang === 'en') {
      return {
        text: `There are currently **${totalUsers.toLocaleString()} registered young participants** on the «Yunusobod — Birga» platform in Yunusobod district.\n\n* **Active participants:** ${activeUsers.toLocaleString()} users (${activePct}%)\n* **Inactive users:** ${inactiveUsers.toLocaleString()} users (${inactivePct}%)\n* **Temporarily blocked:** ${blockedUsers.toLocaleString()} users (${blockedPct}%)`,
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

    if (lang === 'en') {
      return {
        text: `There are **${activeUsers.toLocaleString()} active users** on the platform (representing **${activePct}%** of the total ${totalUsers.toLocaleString()} youth in the district).`,
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

    if (lang === 'ru') {
      const tableRowsRu = monthlyBreakdown.map((m: any, idx: number) => 
        `| ${idx + 1} | ${m.label} | +${m.count.toLocaleString('ru-RU')} чел. | Регулярная регистрация |`
      ).join('\n');
      return {
        text: `За последние **${monthsCount} месяцев** на платформе зарегистрировалось **${totalInPeriod.toLocaleString('ru-RU')} новых участников**.\n\n| № | Период (Месяц) | Новые участники | Статус |\n|---|----------------|-----------------|--------|\n${tableRowsRu}\n\n**Динамика роста:**\n* **Общее число ${monthsCount} месяцев назад:** ${usersThen.toLocaleString('ru-RU')} чел.\n* **Текущее общее число:** ${usersNow.toLocaleString('ru-RU')} чел.\n* **Чистый прирост:** +${growthDiff.toLocaleString('ru-RU')} чел. (+${growthPct}% роста).`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    if (lang === 'en') {
      const tableRowsEn = monthlyBreakdown.map((m: any, idx: number) => 
        `| ${idx + 1} | ${m.label} | +${m.count.toLocaleString()} users | Regular registration |`
      ).join('\n');
      return {
        text: `Over the past **${monthsCount} months**, a total of **${totalInPeriod.toLocaleString()} new youth** registered on the platform.\n\n| No | Period (Month) | New Registrations | Status |\n|---|----------------|-------------------|--------|\n${tableRowsEn}\n\n**Growth Dynamics:**\n* **Total count ${monthsCount} months ago:** ${usersThen.toLocaleString()} users\n* **Current total count:** ${usersNow.toLocaleString()} users\n* **Net growth:** +${growthDiff.toLocaleString()} users (+${growthPct}% growth rate).`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

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

    if (lang === 'ru') {
      const catListRu = categories.map((c: any, i: number) => 
        `${i + 1}. **${c.name}:** ${c.eventCount} мероприятий (${c.percentage}%)`
      ).join('\n');
      return {
        text: `Больше всего мероприятий проведено по направлению **«${topCategory.name}»** — всего **${topCategory.eventCount} мероприятий** (${topCategory.percentage}% от общего числа ${totalEvents} мероприятий района).\n\n**Показатели по всем направлениям:**\n${catListRu}`,
        action: null,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    if (lang === 'en') {
      const catListEn = categories.map((c: any, i: number) => 
        `${i + 1}. **${c.name}:** ${c.eventCount} events (${c.percentage}%)`
      ).join('\n');
      return {
        text: `The highest number of events was held in the **«${topCategory.name}»** category — **${topCategory.eventCount} events** in total (${topCategory.percentage}% of all ${totalEvents} events in the district).\n\n**Breakdown by all categories:**\n${catListEn}`,
        action: null,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

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

    if (lang === 'ru') {
      return {
        text: `В мероприятиях по направлению **«${category.name}»** приняло участие **${category.participantsCount.toLocaleString('ru-RU')} молодых участников**.\n\n* **Проведено мероприятий:** ${category.eventCount} соревнований и турниров\n* **Доля в общем объёме:** ${category.percentage}% (ведущее направление среди всех ${totalEvents} мероприятий района).`,
        action: null,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    if (lang === 'en') {
      return {
        text: `A total of **${category.participantsCount.toLocaleString()} young citizens** participated in events under the **«${category.name}»** category.\n\n* **Conducted events:** ${category.eventCount} tournaments and competitions\n* **Share of total:** ${category.percentage}% (leading category across all ${totalEvents} events).`,
        action: null,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

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

    if (lang === 'ru') {
      const rowsRu = data.map(e => 
        `| ${e.rank} | ${e.title} | ${e.category} | ${e.location} | ${e.attended} чел. (${e.attendanceRate}%) |`
      ).join('\n');
      return {
        text: `Рейтинг **ТОП-5 самых посещаемых мероприятий** в Юнусабадском районе:\n\n| № | Мероприятие | Направление | Место проведения | Участники (Явка) |\n|---|-------------|-------------|------------------|------------------|\n${rowsRu}\n\nСредняя явка на данных событиях превысила **91%**.`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    if (lang === 'en') {
      const rowsEn = data.map(e => 
        `| ${e.rank} | ${e.title} | ${e.category} | ${e.location} | ${e.attended} attendees (${e.attendanceRate}%) |`
      ).join('\n');
      return {
        text: `Official **TOP-5 Most Attended Events** ranking in Yunusobod district:\n\n| No | Event Title | Category | Venue | Attendees (Turnout) |\n|---|-------------|----------|-------|---------------------|\n${rowsEn}\n\nAverage attendance on these flagship events exceeded **91%**.`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

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

    if (lang === 'ru') {
      return {
        text: `За последние **${days} дней** в Юнусабадском районе проведено **${eventsCount} мероприятий**.\n\n* **Запланировано на эту неделю:** ${plannedThisWeek} новых мероприятий\n* **Всего мероприятий на платформе:** ${totalAllEvents} мероприятий.`,
        action: null,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    if (lang === 'en') {
      return {
        text: `Over the last **${days} days**, a total of **${eventsCount} events** were conducted in Yunusobod district.\n\n* **Scheduled for this week:** ${plannedThisWeek} new events\n* **Total all-time events:** ${totalAllEvents} events.`,
        action: null,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

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

    if (lang === 'ru') {
      const listRu = allMonths.map((m: any) => `* **${m.monthName} ${m.year}:** ${m.count.toLocaleString('ru-RU')} чел.`).join('\n');
      return {
        text: `Пик регистраций новых пользователей зафиксирован в **${peakMonth} ${peakYear} года** — **${peakCount.toLocaleString('ru-RU')} новых участников**.\n\n**Показатели по всем месяцам:**\n${listRu}`,
        action: null,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    if (lang === 'en') {
      const listEn = allMonths.map((m: any) => `* **${m.monthName} ${m.year}:** ${m.count.toLocaleString()} users`).join('\n');
      return {
        text: `Peak registration occurred in **${peakMonth} ${peakYear}**, with **${peakCount.toLocaleString()} new youth members** joining the platform.\n\n**Monthly breakdown:**\n${listEn}`,
        action: null,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

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

    if (lang === 'ru') {
      return {
        text: `Средняя посещаемость мероприятий на платформе составляет **${attendancePercentage}%**.\n\n* **Записавшиеся участники:** ${totalRegistered.toLocaleString('ru-RU')} чел.\n* **Фактически посетившие:** ${totalAttended.toLocaleString('ru-RU')} чел.\n* **Анализ:** Высокая явка благодаря автоматическим напоминаниям и удобным локациям.`,
        action: null,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    if (lang === 'en') {
      return {
        text: `The average attendance rate for platform events is **${attendancePercentage}%**.\n\n* **Registered attendees:** ${totalRegistered.toLocaleString()} users\n* **Actual turnout:** ${totalAttended.toLocaleString()} attendees\n* **Analysis:** High engagement due to SMS notifications and neighborhood accessibility.`,
        action: null,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

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

    if (lang === 'ru') {
      return {
        text: `Сравнительный анализ показателей за **${lastMonth.name}** и **${currentMonth.name}**:\n\n| № | Показатель | ${lastMonth.name} | ${currentMonth.name} | Примечание |\n|---|------------|-------------------|----------------------|------------|\n| 1 | Новые регистрации | ${lastMonth.usersJoined} чел. | ${currentMonth.usersJoined} чел. | Старт месяца |\n| 2 | Количество мероприятий | ${lastMonth.eventsHeld} | ${currentMonth.eventsHeld} | Согласно плану |\n| 3 | Уровень активности | ${lastMonth.activeRate}% | ${currentMonth.activeRate}% | Стабильно высокий |\n| 4 | Охват участников | ${lastMonth.participants} чел. | ${currentMonth.participants} чел. | Мониторинг продолжается |\n\n**Вывод:** Устойчивый приток молодёжи и стабильная активность во всех махаллях.`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    if (lang === 'en') {
      return {
        text: `Comparative analysis between **${lastMonth.name}** and **${currentMonth.name}**:\n\n| No | Metric | ${lastMonth.name} | ${currentMonth.name} | Notes |\n|---|--------|-------------------|----------------------|-------|\n| 1 | New youth registered | ${lastMonth.usersJoined} users | ${currentMonth.usersJoined} users | Month in progress |\n| 2 | Events conducted | ${lastMonth.eventsHeld} events | ${currentMonth.eventsHeld} events | As per schedule |\n| 3 | Youth activity rate | ${lastMonth.activeRate}% | ${currentMonth.activeRate}% | Consistently high |\n| 4 | Total attendees | ${lastMonth.participants} users | ${currentMonth.participants} users | Active engagement |\n\n**Conclusion:** Stable growth rate and active community involvement across all mahallas.`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

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

    if (lang === 'ru') {
      return {
        text: `Чистый прирост по сравнению с предыдущим периодом составил **+${growthDiff.toLocaleString('ru-RU')} новых участников (+${growthPct}% роста)**.\n\n* **Начальный показатель:** ${usersThen.toLocaleString('ru-RU')} чел.\n* **Текущий показатель:** ${usersNow.toLocaleString('ru-RU')} чел.\n* **Среднесуточный темп прироста:** +33 новых пользователя в день.`,
        action: null,
        lang,
        intent: intent.type,
        dataSnapshot: periodData
      };
    }

    if (lang === 'en') {
      return {
        text: `Net growth compared to the baseline period is **+${growthDiff.toLocaleString()} new youth (+${growthPct}% growth)**.\n\n* **Initial baseline:** ${usersThen.toLocaleString()} users\n* **Current figure:** ${usersNow.toLocaleString()} users\n* **Daily average registration:** +33 new youth / day.`,
        action: null,
        lang,
        intent: intent.type,
        dataSnapshot: periodData
      };
    }

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
      if (lang === 'ru') {
        return {
          text: `Сравнительный анализ численности пользователей **${unitLabel} назад (${pastFormatted})** и на **текущий момент (${todayFormatted})**:\n\n| № | Показатель | ${unitLabel} назад (${pastFormatted}) | Текущий момент (${todayFormatted}) | Динамика |\n|---|------------|---------------------------------------|-----------------------------------|----------|\n| 1 | Всего молодёжи | ${usersThen.toLocaleString('ru-RU')} чел. | ${usersNow.toLocaleString('ru-RU')} чел. | +${diff.toLocaleString('ru-RU')} чел. (+${growthPct}%) |\n| 2 | Активные участники (87%) | ${Math.round(usersThen * 0.87).toLocaleString('ru-RU')} чел. | 10 864 чел. | +${Math.round(diff * 0.87).toLocaleString('ru-RU')} чел. |\n| 3 | Неактивные пользователи (12%) | ${Math.round(usersThen * 0.12).toLocaleString('ru-RU')} чел. | 1 499 чел. | Категория резерва |\n\n**Вывод:** ${unitLabel} назад на платформе было **${usersThen.toLocaleString('ru-RU')} человек**, на данный момент — **${usersNow.toLocaleString('ru-RU')} человек** (+${growthPct}% роста).`,
          action,
          lang,
          intent: intent.type,
          dataSnapshot: data
        };
      }

      if (lang === 'en') {
        return {
          text: `Comparative user count analysis **${unitLabel} ago (${pastFormatted})** vs **current (${todayFormatted})**:\n\n| No | Indicator | ${unitLabel} ago (${pastFormatted}) | Current Status (${todayFormatted}) | Growth |\n|---|-----------|-------------------------------------|-----------------------------------|--------|\n| 1 | Total Youth Registered | ${usersThen.toLocaleString()} users | ${usersNow.toLocaleString()} users | +${diff.toLocaleString()} (+${growthPct}%) |\n| 2 | Active Participants (87%) | ${Math.round(usersThen * 0.87).toLocaleString()} users | 10,864 users | +${Math.round(diff * 0.87).toLocaleString()} users |\n| 3 | Inactive Users (12%) | ${Math.round(usersThen * 0.12).toLocaleString()} users | 1,499 users | Engagement reserve |\n\n**Summary:** ${unitLabel} ago there were **${usersThen.toLocaleString()} users**, currently reaching **${usersNow.toLocaleString()} users** (+${growthPct}% growth).`,
          action,
          lang,
          intent: intent.type,
          dataSnapshot: data
        };
      }

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

    if (lang === 'en') {
      return {
        text: `**${unitLabel} ago (as of ${pastFormatted})**, there were **${usersThen.toLocaleString()} users** registered on the «Yunusobod — Birga» platform.\n\n* **Figure on ${pastFormatted}:** ${usersThen.toLocaleString()} users\n* **Current figure on ${todayFormatted}:** ${usersNow.toLocaleString()} users\n* **Growth over ${unitLabel}:** +${diff.toLocaleString()} new youth (+${growthPct}% growth, average +33 registrations daily).`,
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

    if (lang === 'ru') {
      const rowsRu = students.map((s, idx) => 
        `| ${idx + 1} | ${s.name} | Сход граждан «${s.mahalla}» | ${s.spec} | ${s.events} мероприятий ${s.isLeader ? '(Лидер)' : ''} |`
      ).join('\n');
      return {
        text: `Рейтинг наиболее активных студентов на платформе «Yunusobod — Birga»:\n\n| № | Студент (Ф.И.О.) | Махалля | Специальность | Активность в событиях |\n|---|------------------|---------|---------------|-----------------------|\n${rowsRu}\n\n**Сводка по студентам:** В Юнусабадском районе зарегистрировано 2 490 студентов, 92% из них регулярно посещают открытые мастер-классы и практические занятия.`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: students
      };
    }

    if (lang === 'en') {
      const rowsEn = students.map((s, idx) => 
        `| ${idx + 1} | ${s.name} | ${s.mahalla} Mahalla | ${s.spec} | ${s.events} events ${s.isLeader ? '(Leader)' : ''} |`
      ).join('\n');
      return {
        text: `Ranking of the most engaged students on the «Yunusobod — Birga» platform:\n\n| No | Student Full Name | Neighborhood | Field of Study | Event Participation |\n|---|--------------------|--------------|----------------|---------------------|\n${rowsEn}\n\n**Student Body Summary:** 2,490 students are registered across Yunusobod district, with an active participation rate of 92%.`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: students
      };
    }

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

    if (lang === 'ru') {
      const rowsRu = users.map((u, idx) => 
        `| ${idx + 1} | ${u.name} | Сход «${u.mahalla}» | ${u.role} | ${u.date} |`
      ).join('\n');
      return {
        text: `Список недавно зарегистрированных молодых участников (Имя и Фамилия):\n\n| № | Ф.И.О. участника | Махалля | Категория | Дата регистрации |\n|---|------------------|---------|-----------|------------------|\n${rowsRu}\n\nВсе участники успешно прошли регистрацию и закреплены за кураторами своих махаллей.`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: users
      };
    }

    if (lang === 'en') {
      const rowsEn = users.map((u, idx) => 
        `| ${idx + 1} | ${u.name} | ${u.mahalla} Mahalla | ${u.role} | ${u.date} |`
      ).join('\n');
      return {
        text: `List of recently registered young citizens (Full Names):\n\n| No | Full Name | Neighborhood | Category | Registration Date |\n|---|-----------|--------------|----------|-------------------|\n${rowsEn}\n\nAll listed members are verified and assigned to neighborhood youth coordinators.`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: users
      };
    }

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

      if (lang === 'en') {
        return {
          text: `During **${periodName}**, **${usersJoined.toLocaleString()} new youth** joined the «Yunusobod — Birga» platform (${note}).\n\n* **New youth registered:** ${usersJoined.toLocaleString()} users\n* **Attendees reached:** ${participants.toLocaleString()} users\n* **Activity rate:** ${activeRate}%`,
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
      if (lang === 'ru') {
        return {
          text: `В периоде **${periodName}** в Юнусабадском районе проведено **${eventsCount} мероприятий**.\n\n* **Охват участников:** ${participants.toLocaleString('ru-RU')} чел.\n* **Новые регистрации:** ${usersJoined.toLocaleString('ru-RU')} чел.`,
          action,
          lang,
          intent: intent.type,
          dataSnapshot: data
        };
      }

      if (lang === 'en') {
        return {
          text: `During **${periodName}**, a total of **${eventsCount} events** were conducted in Yunusobod district.\n\n* **Attendees reached:** ${participants.toLocaleString()} users\n* **New youth registered:** ${usersJoined.toLocaleString()} users.`,
          action,
          lang,
          intent: intent.type,
          dataSnapshot: data
        };
      }

      return {
        text: `**${periodName}da** Yunusobod tumanida jami **${eventsCount} ta tadbir** o‘tkazilgan.\n\n* **Qatnashgan yoshlar soni:** ${participants.toLocaleString('ru-RU')} nafar\n* **Ushbu davrda yangi a’zo bo‘lganlar:** ${usersJoined.toLocaleString('ru-RU')} nafar.`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    if (lang === 'ru') {
      return {
        text: `Показатели платформы за **${periodName}**:\n\n* **Новые участники:** ${usersJoined.toLocaleString('ru-RU')} чел. (${note})\n* **Проведено мероприятий:** ${eventsCount} событий\n* **Охват молодёжи:** ${participants.toLocaleString('ru-RU')} чел.\n* **Уровень активности:** ${activeRate}%`,
        action,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    if (lang === 'en') {
      return {
        text: `Platform indicators for **${periodName}**:\n\n* **New youth registered:** ${usersJoined.toLocaleString()} users (${note})\n* **Conducted events:** ${eventsCount} events\n* **Youth reached:** ${participants.toLocaleString()} users\n* **Activity rate:** ${activeRate}%`,
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
      if (lang === 'ru') {
        return {
          text: `На платформе временно заблокировано **${data.blockedUsers} пользователей** из-за нарушений регламента (это составляет **${data.blockedPct}%** от общего числа молодёжи).`,
          action: null,
          lang,
          intent: intent.type,
          dataSnapshot: data
        };
      }
      if (lang === 'en') {
        return {
          text: `There are currently **${data.blockedUsers} blocked users** on the platform due to policy guidelines (${data.blockedPct}% of all youth).`,
          action: null,
          lang,
          intent: intent.type,
          dataSnapshot: data
        };
      }
      return {
        text: `Platformada qoidabuzarlik sababli vaqtincha cheklov o‘rnatilgan jami **${data.blockedUsers} nafar foydalanuvchi** mavjud (bu umumiy yoshlarning **${data.blockedPct}%** qismi).`,
        action: null,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    if (lang === 'ru') {
      return {
        text: `На платформе насчитывается **${data.inactiveUsers.toLocaleString('ru-RU')} неактивных пользователей** (${data.inactivePct}% от общего числа). Ведётся индивидуальная работа по их вовлечению через лидеров махаллей.`,
        action: null,
        lang,
        intent: intent.type,
        dataSnapshot: data
      };
    }

    if (lang === 'en') {
      return {
        text: `There are currently **${data.inactiveUsers.toLocaleString()} inactive users** on the platform (${data.inactivePct}% of total youth). Proactive re-engagement efforts are underway.`,
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

    const d = AIDataEngine.CURRENT_DATE;
    const past10 = new Date(d);
    past10.setDate(d.getDate() - 9);
    const pad = (n: number | string) => String(n).padStart(2, '0');
    const periodStr = `${pad(past10.getDate())}.${pad(past10.getMonth() + 1)}.${past10.getFullYear()} — ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;

    if (lang === 'ru') {
      return {
        text: `Комплексный анализ состояния и динамики платформы «Yunusobod — Birga» за **последние 10 дней (${periodStr})**:\n\n| № | Показатель | Значение | Примечание |\n|---|------------|----------|------------|\n| 1 | Новые регистрации | 330 чел. | В среднем 33 регистрации в день |\n| 2 | Проведено мероприятий | 92 события | План выполнен на 100% |\n| 3 | Общий охват участников | 7 420 чел. | Вовлечённость более 85% |\n| 4 | Средняя посещаемость | 76% | Коэффициент явки зарегистрированных |\n| 5 | Всего молодёжи района | 12 486 чел. | Общий контингент платформы |\n| 6 | Доля активных участников | 10 864 чел. (87%) | Регулярно посещают мероприятия |\n| 7 | Неактивные пользователи | 1 499 чел. (12%) | Категория для вовлечения |\n| 8 | Временно заблокированные | 123 чел. (1%) | Регламентные ограничения |\n| 9 | Ведущее направление | Спорт (38%) | 35 турниров и соревнований |\n\n**Аналитические выводы:**\n* **Темп регистрации:** За 10 дней ежедневно подключалось в среднем 33 новых участника.\n* **Эффективность событий:** Проведено 92 мероприятия с явкой 76%.\n* **Лидирующие сходы граждан:** «Бодомзор», «Янги хаёт» и «Октепа».`,
        action,
        lang,
        intent: intent.type
      };
    }

    if (lang === 'en') {
      return {
        text: `Comprehensive 10-day analytical report for the «Yunusobod — Birga» platform **(${periodStr})**:\n\n| No | Key Indicator | Value | Analytical Notes |\n|---|---------------|-------|------------------|\n| 1 | New youth registered | 330 users | Average 33 registrations/day |\n| 2 | Events conducted | 92 events | 100% plan fulfillment |\n| 3 | Total attendees reached | 7,420 users | Over 85% coverage |\n| 4 | Average attendance rate | 76% | Turnout ratio |\n| 5 | Total registered youth | 12,486 users | District youth contingent |\n| 6 | Active participants | 10,864 users (87%) | Regularly active members |\n| 7 | Inactive users | 1,499 users (12%) | Pipeline for engagement |\n| 8 | Temporarily blocked | 123 users (1%) | Policy guidelines |\n| 9 | Leading category | Sports (38%) | 35 tournaments |\n\n**Key Findings:**\n* Steady daily inflow of 33 new members.\n* 92 events held with 76% turnout.\n* Top performing mahallas: Bodomzor, Yangi hayot, and Oqtepa.`,
        action,
        lang,
        intent: intent.type
      };
    }

    return {
      text: `«Yunusobod — Birga» platformasining **oxirgi 10 kunlik (${periodStr})** davr bo‘yicha to‘liq holati va dinamika tahlili:\n\n| № | 10 kunlik asosiy ko‘rsatkich | Qiymati | Izoh / Dinamika |\n|---|------------------------------|---------|-----------------|\n| 1 | Yangi ro‘yxatdan o‘tgan yoshlar | 330 nafar | Kuniga o‘rtacha 33 nafar yangi a’zo |\n| 2 | O‘tkazilgan tadbirlar soni | 92 ta tadbir | Reja 100% bajarilgan |\n| 3 | Tadbirlardagi umumiy ishtirokchilar | 7 420 nafar | Qamrov 85% dan yuqori |\n| 4 | O‘rtacha qatnashish davomati | 76% | Ro‘yxatdan o‘tganlarning kelish ko‘rsatkichi |\n| 5 | Jami platforma yoshlari | 12 486 nafar | Yunusobod tumani yoshlar kontingenti |\n| 6 | Faol ishtirokchilar ulushi | 10 864 (87%) | Tizimda muntazam faol yoshlar |\n| 7 | Nofaol foydalanuvchilar | 1 499 (12%) | Qayta jalb etish choralari ko‘rilmoqda |\n| 8 | Vaqtincha cheklovlanganlar | 123 (1%) | Qoidabuzarlik sababli bloklanganlar |\n| 9 | Eng yetakchi yo‘nalish | Sport (38%) | 35 ta musobaqa va turnirlar |\n\n**Platformaning 10 kunlik holati bo‘yicha tahliliy xulosalar:**\n* **1. Ro‘yxatga olish sur’ati:** Oxirgi 10 kun ichida har kuni muntazam o‘rtacha 33 nafar yoshlar platformaga qo‘shildi. Jami 330 nafar yangi yoshlar qamrab olindi.\n* **2. Tadbirlar samaradorligi:** 10 kun davomida 92 ta tadbir o‘tkazilib, ularga 7,420 nafar yoshlar tashrif buyurdi. O‘rtacha kelish koeffitsiyenti 76% ni tashkil etdi.\n* **3. Yo‘nalishlar balansi:** Eng yuqori faollik Sport (38%) va Madaniyat/San’at (24%) sohalarida kuzatildi.\n* **4. Mahallalar faolligi:** «Bodomzor», «Yangi hayot» va «Oqtepa» mahallalari 10 kunlik davrda eng yuqori ko‘rsatkichlarni qayd etdi.`,
      action,
      lang,
      intent: intent.type
    };
  }

  /**
   * 17. Tadbirlar turlari taqsimoti, foizlari va Donut diagrammasi (Bugun, Kecha, Tanlangan kun, Aprel, Umumiy)
   */
  static formatEventTypesBreakdown(intent: ParsedIntent, data?: any): AIResponse {
    const lang = intent.lang;
    let action: ActionType = null;
    if (intent.wantsBoth) action = 'DOWNLOAD:EVENTS_BOTH';
    else if (intent.wantsWord) action = 'DOWNLOAD:EVENTS_WORD';
    else if (intent.wantsExcel) action = 'DOWNLOAD:EVENTS_EXCEL';

    if (!data) {
      data = {
        total: 245,
        targetDate: undefined,
        isDayView: false,
        dateLabel: 'Platforma ishga tushgandan beri',
        categoryStats: [
          { name: 'Sport', count: 91, percent: 38, events: [] },
          { name: 'Madaniy', count: 58, percent: 24, events: [] },
          { name: 'Ta’lim', count: 39, percent: 15, events: [] },
          { name: 'Ishga joylashish', count: 29, percent: 12, events: [] },
          { name: 'Volontyorlik', count: 18, percent: 7, events: [] },
          { name: 'Boshqa', count: 10, percent: 4, events: [] }
        ],
        nonZeroCategories: [],
        topCategory: { name: 'Sport', percent: 38 }
      };
    }

    const { total, targetDate, isDayView, dateLabel, categoryStats, nonZeroCategories, topCategory, selectedDateInfo } = data;
    const activeCats = nonZeroCategories && nonZeroCategories.length > 0 ? nonZeroCategories : categoryStats.filter((c: any) => c.count > 0);

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

      const tableRows = (activeCats.length > 0 ? activeCats : categoryStats).map((cat: any, i: number) => {
        const catRu = ruCategoryNames[cat.name] || cat.name;
        const status = isDayView ? (cat.count > 0 ? 'Запланировано / В процессе' : 'Нет событий') : 'Регулярно';
        return `| ${i + 1} | ${catRu} | ${cat.count} событи${cat.count === 1 ? 'е' : 'й'} | ${cat.percent}% | ${status} |`;
      }).join('\n');

      let heading = '';
      let summary = '';
      if (isDayView) {
        heading = `На дату (**${dateLabel}**) в Юнусабадском районе ${total > 0 ? `запланировано и проводится **${total} мероприят${total === 1 ? 'ие' : total < 5 ? 'ия' : 'ий'}**` : 'мероприятий не запланировано'}. Распределение по направлениям (круговая диаграмма):\n\n| № | Направление мероприятий | Количество | Доля (%) | Статус проведения |\n|---|-------------------------|------------|----------|-------------------|\n${tableRows}`;
        summary = `\n\n**Итоги за ${dateLabel}:**\n* **Всего мероприятий:** ${total} (100% совпадение с карточкой мероприятий и круговой диаграммой).\n* **Лидирующая сфера:** ${ruCategoryNames[topCategory.name] || topCategory.name} (${topCategory.percent}% доля).`;
      } else {
        heading = `За период (**${dateLabel}**) в Юнусабадском районе проведено **${total} мероприятий**. Распределение по направлениям (круговая диаграмма):\n\n| № | Направление мероприятий | Количество | Доля (%) | Статус проведения |\n|---|-------------------------|------------|----------|-------------------|\n${tableRows}`;
        summary = `\n\n**Аналитический итог:** Всего проведено ${total} мероприятий. Лидирующее направление — ${ruCategoryNames[topCategory.name] || topCategory.name} (${topCategory.percent}%).`;
      }

      let contextNote = '';
      if (selectedDateInfo) {
        contextNote = `\n\n💡 *Примечание: В фильтре панели управления выбрана дата: **${selectedDateInfo.date} (${selectedDateInfo.label})** — на этот день зарегистрировано **${selectedDateInfo.total} мероприят${selectedDateInfo.total === 1 ? 'ие' : 'ий'}** (${ruCategoryNames[selectedDateInfo.topCat] || selectedDateInfo.topCat} - ${selectedDateInfo.topPct}%).*`;
      }

      const actionText = action ? '\n\nВы можете скачать официальный реестр мероприятий в формате Word (.doc) или Excel (.xls) по кнопкам ниже:' : '';

      return {
        text: `${heading}${summary}${contextNote}${actionText}`,
        action,
        lang: 'ru',
        intent: intent.type
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

      const tableRows = (activeCats.length > 0 ? activeCats : categoryStats).map((cat: any, i: number) => {
        const catEn = enCategoryNames[cat.name] || cat.name;
        const status = isDayView ? (cat.count > 0 ? 'In progress / Scheduled' : 'No events') : 'Active';
        return `| ${i + 1} | ${catEn} | ${cat.count} event${cat.count === 1 ? '' : 's'} | ${cat.percent}% | ${status} |`;
      }).join('\n');

      let heading = '';
      let summary = '';
      if (isDayView) {
        heading = `For the date (**${dateLabel}**), a total of **${total} event${total === 1 ? '' : 's'}** are organized across Yunusobod district. Category breakdown in percentages (donut chart representation):\n\n| No | Event Category | Count | Share (%) | Current Status |\n|---|----------------|-------|-----------|----------------|\n${tableRows}`;
        summary = `\n\n**Analytics Summary for ${dateLabel}:**\n* **Total scheduled events:** ${total} events (100% agreement with dashboard donut chart and stat card).\n* **Leading category:** ${enCategoryNames[topCategory.name] || topCategory.name} (${topCategory.percent}% share).`;
      } else {
        heading = `For the period (**${dateLabel}**), a total of **${total} events** have been organized in Yunusobod district. Full breakdown by category (donut chart representation):\n\n| No | Event Category | Count | Share (%) | Current Status |\n|---|----------------|-------|-----------|----------------|\n${tableRows}`;
        summary = `\n\n**Analytics Summary:** A total of ${total} events held. Leading track is ${enCategoryNames[topCategory.name] || topCategory.name} (${topCategory.percent}% share).`;
      }

      let contextNote = '';
      if (selectedDateInfo) {
        contextNote = `\n\n💡 *Note: The dashboard filter is currently set to **${selectedDateInfo.date} (${selectedDateInfo.label})** — on that date, there is **${selectedDateInfo.total} event${selectedDateInfo.total === 1 ? '' : 's'}** (${enCategoryNames[selectedDateInfo.topCat] || selectedDateInfo.topCat} - ${selectedDateInfo.topPct}%).*`;
      }

      const actionText = action ? '\n\nYou can download the official report in Word (.doc) or Excel (.xls) format using the buttons below:' : '';

      return {
        text: `${heading}${summary}${contextNote}${actionText}`,
        action,
        lang: 'en',
        intent: intent.type
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

    const tableRows = (activeCats.length > 0 ? activeCats : categoryStats).map((cat: any, i: number) => {
      const catUz = uzCategoryNames[cat.name] || cat.name;
      const status = isDayView ? (cat.count > 0 ? 'O‘tkazilmoqda / Jarayonda' : 'Rejalashtirilmagan') : 'Muntazam';
      return `| ${i + 1} | ${catUz} | ${cat.count} ta tadbir | ${cat.percent}% | ${status} |`;
    }).join('\n');

    let heading = '';
    let summary = '';
    if (isDayView) {
      heading = `Tanlangan kunda (**${dateLabel}**) Yunusobod tumanida jami **${total} ta tadbir** ${total > 0 ? 'rejalashtirilgan va o‘tkazilmoqda' : 'mavjud emas'}. Tadbirlar turlari (doiraviy diagramma) bo‘yicha foizlar taqsimoti:\n\n| № | Yo‘nalish (Kategoriya) | Tadbirlar soni | Foiz ulushi | Holati |\n|---|------------------------|----------------|-------------|--------|\n${tableRows}`;
      summary = `\n\n**${dateLabel} kunlik tahliliy xulosa:**\n* **Jami tadbirlar:** ${total} ta tadbir (Dashboarddagi kartochka va doiraviy diagramma ko‘rsatkichi bilan 100% bir xil).\n* **Yetakchi soha:** ${uzCategoryNames[topCategory.name] || topCategory.name} (**${topCategory.percent}%** ulush bilan yetakchi).`;
    } else {
      heading = `Davr (**${dateLabel}**) bo‘yicha Yunusobod tumanida jami **${total} ta tadbir** o‘tkazilgan. Tadbirlar turlari (doiraviy diagramma) bo‘yicha to‘liq taqsimot:\n\n| № | Yo‘nalish (Kategoriya) | Tadbirlar soni | Foiz ulushi | Holati |\n|---|------------------------|----------------|-------------|--------|\n${tableRows}`;
      summary = `\n\n**Tahliliy xulosa:** Jami ${total} ta tadbir o‘tkazilgan bo‘lib, eng yetakchi yo‘nalish — ${uzCategoryNames[topCategory.name] || topCategory.name} (${topCategory.percent}%) hisoblanadi.`;
    }

    let contextNote = '';
    if (selectedDateInfo) {
      contextNote = `\n\n💡 *Eslatma: Dashboard filtrida tanlangan sana: **${selectedDateInfo.date} (${selectedDateInfo.label})** — ushbu kunda jami **${selectedDateInfo.total} ta tadbir** (${uzCategoryNames[selectedDateInfo.topCat] || selectedDateInfo.topCat} - ${selectedDateInfo.topPct}%) mavjud.*`;
    }

    const actionText = action ? '\n\nTadbirlarning to‘liq rasmiy ro‘yxatini davlat standarti bo‘yicha Word (.doc) yoki Excel (.xls) formatida yuklab olishingiz mumkin:' : '';

    return {
      text: `${heading}${summary}${contextNote}${actionText}`,
      action,
      lang: 'uz',
      intent: intent.type
    };
  }

  /**
   * 18. Yoshlar toifalari, rollari, roziliklari va demografiya tahlili
   */
  static formatYouthRolesBreakdown(intent: ParsedIntent): AIResponse {
    const lang = intent.lang;
    let action: ActionType = null;
    if (intent.wantsBoth) action = 'DOWNLOAD:USERS_BOTH';
    else if (intent.wantsWord) action = 'DOWNLOAD:USERS_WORD';
    else if (intent.wantsExcel) action = 'DOWNLOAD:USERS_EXCEL';

    if (lang === 'ru') {
      return {
        text: `Демографическое распределение и социальные роли молодёжи Юнусабадского района (всего **12 486 зарегистрированных**):\n\n| № | Категория / Роль | Численность | Доля (%) | Примечание |\n|---|------------------|-------------|----------|------------|\n| 1 | Спортсмены | 3 870 чел. | 31% | Регулярные участники соревнований |\n| 2 | Студенты вузов и колледжей | 2 490 чел. | 20% | Академическая и проектная активность |\n| 3 | Ищущие работу / выпускники | 1 123 чел. | 9% | Программы трудоустройства |\n| 4 | Волонтеры | 874 чел. | 7% | Общественные инициативы района |\n| 5 | Другие категории молодёжи | 4 129 чел. | 33% | Общий резерв активности |\n\n**Ключевые показатели вовлечённости:**\n* **Согласие на SMS-информирование:** 10 238 чел. (**82%** активировали получение уведомлений).\n* **Готовность посещать мероприятия:** 10 864 чел. (**87%** активных участников).\n* **Гендерное соотношение:** Юноши — 52% (6 493 чел.), Девушки — 48% (5 993 чел.).\n* **Возрастной диапазон:** 15–20 лет (35%), 21–25 лет (45%), 26–30 лет (20%).\n* **Мобильные операторы:** Beeline 90/91 (38%), Ucell 93/94 (34%), Mobiuz 97 (18%), Uztelecom 99/95 (10%).${action ? '\n\nВы можете скачать официальный реестр молодёжи в формате Word (.doc) или Excel (.xls) по кнопкам ниже:' : ''}`,
        action,
        lang: 'ru',
        intent: intent.type
      };
    }

    if (lang === 'en') {
      return {
        text: `Demographic breakdown and social roles of youth across Yunusobod district (**12,486 total registered**):\n\n| No | Youth Role / Category | Count | Share (%) | Description |\n|---|-----------------------|-------|-----------|-------------|\n| 1 | Athletes & Sports Enthusiasts | 3,870 users | 31% | Tournament participants |\n| 2 | College & University Students | 2,490 users | 20% | Academic & hackathon tracks |\n| 3 | Job Seekers | 1,123 users | 9% | Career fairs & resume workshops |\n| 4 | Volunteers | 874 users | 7% | Community outreach & eco-actions |\n| 5 | Other General Youth | 4,129 users | 33% | General district youth contingent |\n\n**Key Participation Metrics:**\n* **SMS Notification Consent:** 10,238 users (**82%** opted in for direct SMS).\n* **Active Participation Rate:** 10,864 users (**87%** active).\n* **Gender Breakdown:** Male — 52% (6,493), Female — 48% (5,993).\n* **Age Cohorts:** 15–20 yrs (35%), 21–25 yrs (45%), 26–30 yrs (20%).\n* **Telecom Operators:** Beeline 90/91 (38%), Ucell 93/94 (34%), Mobiuz 97 (18%), Uztelecom 99/95 (10%).${action ? '\n\nYou can download the complete youth registry report in Word (.doc) or Excel (.xls) format using the buttons below:' : ''}`,
        action,
        lang: 'en',
        intent: intent.type
      };
    }

    return {
      text: `Yunusobod tumanidagi ro‘yxatga olingan yoshlarning (**jami 12 486 nafar**) rollar va ijtimoiy toifalar kesimidagi taqsimoti:\n\n| № | Yoshlar toifasi / Rol | Soni (nafar) | Foiz ulushi | Izoh va faollik darajasi |\n|---|-----------------------|--------------|-------------|--------------------------|\n| 1 | Sportchi yoshlar | 3 870 nafar | 31% | Musobaqa va marafon ishtirokchilari |\n| 2 | Talaba yoshlar | 2 490 nafar | 20% | OTM va texnikum talabalari |\n| 3 | Ish qidiruvchi yoshlar | 1 123 nafar | 9% | Bandlik dasturlari va yarmarkalar |\n| 4 | Volontyor yoshlar | 874 nafar | 7% | Obodonlashtirish va xayriya aksiyalari |\n| 5 | Boshqa toifadagi yoshlar | 4 129 nafar | 33% | Tuman yoshlarining umumiy qatlami |\n\n**Demografik va texnik ko‘rsatkichlar:**\n* **SMS xabarnomalarga ruxsat:** **10 238 nafar (82%)** yoshlar telefonlariga SMS xabarnoma olishga rozilik bildirgan.\n* **Tadbirlarda qatnashishga rozilik:** **10 864 nafar (87%)** yoshlar faol ishtirokchi hisoblanadi.\n* **Jins nisbati:** Yigitlar — **52%** (6 493 nafar), Qizlar — **48%** (5 993 nafar).\n* **Yosh chegaralari:** 15–20 yosh (35%), 21–25 yosh (45%), 26–30 yosh (20%).\n* **Mobil operatorlar:** Beeline 90/91 (38%), Ucell 93/94 (34%), Mobiuz 97 (18%), UZTELECOM 99/95 (10%).${action ? '\n\nYoshlar to‘liq bazasi bo‘yicha rasmiy davlat hisobotini Word (.doc) yoki Excel (.xls) formatida quyidagi tugmalar orqali yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz',
      intent: intent.type
    };
  }

  /**
   * 19. Mahallalar ro'yxati, reytingi va qamrovi (Top 5 va 64 ta mahalla tahlili)
   */
  static formatMahallasList(intent: ParsedIntent): AIResponse {
    const lang = intent.lang;
    let action: ActionType = null;
    if (intent.wantsBoth) action = 'DOWNLOAD:MAHALLAS_BOTH';
    else if (intent.wantsWord) action = 'DOWNLOAD:MAHALLAS_WORD';
    else if (intent.wantsExcel) action = 'DOWNLOAD:MAHALLAS_EXCEL';

    if (lang === 'ru') {
      return {
        text: `В Юнусабадском районе насчитывается **64 схода граждан (махалли)**. Рейтинг наиболее активных махаллей района:\n\n| № | Сход граждан (Махалля) | Проведено мероприятий | Участников | Средний охват | Уровень активности |\n|---|------------------------|-----------------------|------------|---------------|--------------------|\n| 1 | Сход «Бодомзор» | 28 событий | 840 чел. | 88% | Высокий (Лидер) |\n| 2 | Сход «Чинор» | 24 события | 720 чел. | 85% | Высокий |\n| 3 | Сход «Навбахор» | 22 события | 660 чел. | 82% | Высокий |\n| 4 | Сход «Октепа» | 19 событий | 570 чел. | 79% | Стабильный |\n| 5 | Сход «Янги хаёт» | 17 событий | 510 чел. | 76% | Стабильный |\n\n**Показатели ключевых махаллей:**\n* **Сход «Тинчлик»:** 620 зарегистрированных молодых жителей, охват 81%.\n* **Сход «Шахристон»:** 590 участников, охват 78%.\n* **Сход «Богишамол»:** 510 участников, охват 75%.\n* **Сход «Бахор»:** 480 участников, охват 74%.\n\nСортировка в рейтинге доступна по трем параметрам: количеству мероприятий, проценту охвата и численности молодёжи.${action ? '\n\nВы можете скачать официальный сводный отчет по махаллям района в формате Word (.doc) или Excel (.xls) по кнопкам ниже:' : ''}`,
        action,
        lang: 'ru',
        intent: intent.type
      };
    }

    if (lang === 'en') {
      return {
        text: `There are **64 neighborhood committees (mahallas)** in Yunusobod district. Performance ranking of leading mahallas:\n\n| No | Mahalla (Neighborhood) | Events Held | Attendees | Avg Coverage | Activity Rating |\n|---|------------------------|-------------|-----------|--------------|-----------------|\n| 1 | Bodomzor Mahalla | 28 events | 840 youth | 88% | High (Leader) |\n| 2 | Chinor Mahalla | 24 events | 720 youth | 85% | High |\n| 3 | Navbahor Mahalla | 22 events | 660 youth | 82% | High |\n| 4 | Oqtepa Mahalla | 19 events | 570 youth | 79% | Stable |\n| 5 | Yangi hayot Mahalla | 17 events | 510 youth | 76% | Stable |\n\n**Key District Insights:**\n* **Tinchlik Mahalla:** 620 registered youth, 81% participation rate.\n* **Shahriston Mahalla:** 590 registered youth, 78% coverage.\n* **Bog'ishamol Mahalla:** 510 registered youth, 75% coverage.\n* **Bahor Mahalla:** 480 registered youth, 74% coverage.\n\nRanking can be sorted by total events, average youth engagement percentage, or total registered participants.${action ? '\n\nYou can download the complete mahallas performance audit in Word (.doc) or Excel (.xls) format below:' : ''}`,
        action,
        lang: 'en',
        intent: intent.type
      };
    }

    return {
      text: `Yunusobod tumanida jami **64 ta mahalla** mavjud bo‘lib, ulardan 17 tasi platformaning dastlabki pilot bosqichida to‘liq tizimlashtirilgan. Tuman bo‘yicha eng namunali va yetakchi **Top 5 ta mahalla reytingi**:\n\n| № | Mahalla nomi | O‘tkazilgan tadbirlar | Ishtirokchilar | O‘rtacha qamrov | Faollik darajasi |\n|---|--------------|-----------------------|----------------|-----------------|------------------|\n| 1 | Bodomzor mahallasi | 28 ta tadbir | 840 nafar | 88% | Yuqori (Yetakchi) |\n| 2 | Chinor mahallasi | 24 ta tadbir | 720 nafar | 85% | Yuqori |\n| 3 | Navbahor mahallasi | 22 ta tadbir | 660 nafar | 82% | Yuqori |\n| 4 | Oqtepa mahallasi | 19 ta tadbir | 570 nafar | 79% | Barqaror |\n| 5 | Yangi hayot mahallasi | 17 ta tadbir | 510 nafar | 76% | Barqaror |\n\n**Boshqa asosiy mahallalar ko‘rsatkichlari:**\n* **Tinchlik mahallasi:** 620 nafar ro‘yxatga olingan yoshlar, qamrov darajasi 81%.\n* **Shahriston mahallasi:** 590 nafar yoshlar, o‘rtacha qamrov 78%.\n* **Bog‘ishamol mahallasi:** 510 nafar yoshlar, tadbirlar qamrovi 75%.\n* **Bahor mahallasi:** 480 nafar yoshlar, o‘rtacha ko‘rsatkich 74%.\n\n**Mahalla reytingini saralash imkoniyatlari:** Platformada mahallalarni «Tadbirlar soni», «O‘rtacha qamrov» va «Ro‘yxatdan o‘tgan yoshlar soni» bo‘yicha oson saralash mumkin.${action ? '\n\nMahallalar bo‘yicha to‘liq tahliliy hisobotni davlat standarti bo‘yicha Word (.doc) yoki Excel (.xls) formatida yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz',
      intent: intent.type
    };
  }

  /**
   * 20. Xarita va o'tkazilish lokatsiyalari tahlili (MapView va 6 ta asosiy maskan)
   */
  static formatLocationStats(intent: ParsedIntent): AIResponse {
    const lang = intent.lang;
    let action: ActionType = null;
    if (intent.wantsBoth) action = 'DOWNLOAD:EVENTS_BOTH';
    else if (intent.wantsWord) action = 'DOWNLOAD:EVENTS_WORD';
    else if (intent.wantsExcel) action = 'DOWNLOAD:EVENTS_EXCEL';

    if (lang === 'ru') {
      return {
        text: `В Юнусабадском районе функционирует **6 основных локаций** для проведения молодежных мероприятий:\n\n| № | Наименование локации | Адрес / Ориентир | Основные направления | Вместимость |\n|---|----------------------|------------------|----------------------|-------------|\n| 1 | Спорткомплекс Юнусабада | 11-й квартал | Мини-футбол, волейбол, кураш | 500+ чел. |\n| 2 | Центр культуры и просвещения | 4-й квартал | Театр, поэзия, концерты | 350 чел. |\n| 3 | Районный центр молодёжи | Проспект Амира Темура | IT-хакатоны, стартапы, дебаты | 250 чел. |\n| 4 | Центральная библиотека района | Массив Центр-5 | Литература, Заковат, лекции | 150 чел. |\n| 5 | Парк отдыха «Радуга» | Махалля Богишамол | Эко-акции, марафоны на воздухе | 800+ чел. |\n| 6 | Конференц-зал хокимията | Центр района | Открытый диалог с руководством | 200 чел. |\n\n**Работа интерактивной карты (MapView):**\n* При нажатии на метку (пин) открывается список событий данной локации.\n* Если на выбранную дату мероприятий нет, система сообщает: «Bu sanada ushbu hududda tadbirlar yo‘q».\n* При включении месячного фильтра отображается сводный график всех 6 площадок.`,
        action,
        lang: 'ru',
        intent: intent.type
      };
    }

    if (lang === 'en') {
      return {
        text: `There are **6 primary venue hubs** hosting youth events across Yunusobod district:\n\n| No | Venue Name | Location / Landmark | Focus Activities | Capacity |\n|---|------------|---------------------|------------------|----------|\n| 1 | Yunusobod Sports Arena | 11th Block | Football, volleyball, wrestling | 500+ guests |\n| 2 | Culture & Arts Center | 4th Block | Theatre, musical concerts, poetry | 350 guests |\n| 3 | District Youth Center | Amir Temur Avenue | IT hackathons, startup bootcamps | 250 guests |\n| 4 | Central District Library | Center-5 area | Book clubs, intellectual quizzes | 150 guests |\n| 5 | «Raduga» Recreation Park | Bog'ishamol | Open-air runs, ecology actions | 800+ guests |\n| 6 | District Hall (Hokimiyat) | District Center | Direct youth dialogues with leadership | 200 guests |\n\n**Interactive Mapview Guide:**\n* Selecting any map pin filters the list to that venue.\n* If no event exists on that day, the platform displays: «Bu sanada ushbu hududda tadbirlar yo‘q».\n* Monthly filtering consolidates event trajectories across all 6 hubs.`,
        action,
        lang: 'en',
        intent: intent.type
      };
    }

    return {
      text: `Yunusobod tumanida yoshlar tadbirlarini o‘tkazish uchun **6 ta asosiy lokatsiya maskani** xaritaga biriktirilgan:\n\n| № | Lokatsiya nomi | Joylashuvi / Manzil | Asosiy yo‘nalishlari | Sig‘imi |\n|---|----------------|---------------------|----------------------|---------|\n| 1 | Yunusobod sport majmuasi | 11-mavze | Mini-futbol, voleybol, kurash | 500+ o‘rin |\n| 2 | Madaniyat va ma’rifat markazi | 4-mavze | Teatr kechalari, adabiyot, musiqa | 350 o‘rin |\n| 3 | Tuman yoshlar markazi | Amir Temur shoh ko‘chasi | IT hackathon, startaplar, munozara | 250 o‘rin |\n| 4 | Tuman markaziy kutubxonasi | Markaz-5 hududi | Kitobxonlik haftaligi, Zakovat | 150 o‘rin |\n| 5 | «Raduga» istirohat bog‘i | Bog‘ishamol mahallasi | Marafonlar, ochiq osmon aksiyalari | 800+ o‘rin |\n| 6 | Tuman hokimiyati anjumanlar zali | Tuman markazi | Rahbariyat bilan ochiq muloqotlar | 200 o‘rin |\n\n**Xarita (MapView) bilan ishlash bo‘yicha qo‘llanma:**\n* Xaritadagi har bir pinni bosganda, aynan o‘sha maskanda bo‘lib o‘tadigan tadbirlar ro‘yxati filtrlanadi.\n* Agar tanlangan sanada tadbir rejalashtirilmagan bo‘lsa, «Bu sanada ushbu hududda tadbirlar yo‘q» xabari chiqadi.\n* Oylik rejim yoqilganda butun oy davomida shu lokatsiyadagi barcha tadbirlar dinamikasi ko‘rinadi.`,
      action,
      lang: 'uz',
      intent: intent.type
    };
  }

  /**
   * 21. Platforma boshqaruvi, ma'muriy ko'rsatmalar va sozlamalar (How-To)
   */
  static formatPlatformHowTo(intent: ParsedIntent): AIResponse {
    const lang = intent.lang;

    if (lang === 'ru') {
      return {
        text: `**Руководство по управлению платформой «Yunusobod — Birga»:**\n\n* **1. Добавление мероприятия:** Перейдите в раздел «Tadbirlar» ➔ нажмите синюю кнопку «+ Yangi tadbir qo‘shish» ➔ заполните обязательные поля (название, направление, локация, дата и время, возрастные рамки, описание) ➔ нажмите «Saqlash». Событие мгновенно появится в системе и обновит графики.\n* **2. Блокировка и разблокировка:** В разделе «Foydalanuvchilar» найдите пользователя по поиску ➔ в столбце действий (три точки) выберите «Bloklash» для ограничения или «Faollashtirish» для разблокировки в 1 клик.\n* **3. Темная и светлая тема (Dark Mode):** Переключатель темы находится в верхнем правом углу меню или в разделе «Sozlamalar».\n* **4. Календарные фильтры:** Кнопки «Bugun», «Kecha», «Shu hafta», «Shu oy», «Shu yil» мгновенно отфильтровывают нужный период. Двойной клик по дате в календаре фиксирует выбранный день.\n* **5. Почему нет данных после 5 ноября?** Платформа фиксирует только фактические состоявшиеся данные в реальном времени. Будущие даты еще не наступили, поэтому статистика по ним отобразится только по мере наступления событий.\n* **6. Функции окна AI:** Кнопка расширения (квадрат рядом с крестиком закрытия) разворачивает окно чата на весь экран, значок корзины очищает историю, а значок копирования копирует ответ.`,
        action: null,
        lang: 'ru',
        intent: intent.type
      };
    }

    if (lang === 'en') {
      return {
        text: `**«Yunusobod — Birga» Platform Administration & How-To Guide:**\n\n* **1. Adding an Event:** Navigate to the «Tadbirlar» (Events) tab ➔ Click «+ Yangi tadbir qo‘shish» ➔ Complete required fields (title, category, venue, date/time, age bracket, description) ➔ Click «Saqlash» (Save). The event reflects immediately across dashboards.\n* **2. Blocking & Unblocking Users:** In «Foydalanuvchilar» (Users), find the user ➔ Click the three-dots action menu ➔ Select «Bloklash» to suspend or «Faollashtirish» to unblock instantly.\n* **3. Dark / Light Mode:** Switch themes via the sun/moon toggle icon in the header or within «Sozlamalar» (Settings).\n* **4. Calendar Filters:** Use preset buttons («Bugun» - Today, «Kecha» - Yesterday, «Shu hafta» - This Week, «Shu oy» - This Month, «Shu yil» - This Year). Double-clicking any calendar day isolates that single date.\n* **5. Why are dates past Nov 5 unavailable?** The platform strictly records verified, real-time historical data up to today. Future dates will populate automatically once those dates arrive.\n* **6. AI Assistant Controls:** Click the expand icon (square next to close 'X') for full-screen mode, trash icon to clear chat history, and copy icon on any bubble to copy text.`,
        action: null,
        lang: 'en',
        intent: intent.type
      };
    }

    return {
      text: `**«Yunusobod — Birga» platformasidan foydalanish va boshqarish bo‘yicha to‘liq qo‘llanma:**\n\n* **1. Yangi tadbir qo‘shish:** «Tadbirlar» bo‘limiga o‘ting ➔ ko‘k rangli «+ Yangi tadbir qo‘shish» tugmasini bosing ➔ majburiy maydonlarni (tadbir nomi, yo‘nalishi, o‘tkazilish joyi/lokatsiyasi, sanasi va vaqti, yosh chegarasi, tavsifi) to‘ldiring ➔ «Saqlash» tugmasini bosing. Yangi tadbir darhol ro‘yxatda aks etadi va diagrammalarga ta’sir qiladi.\n* **2. Qoidabuzarni bloklash va blokdan chiqarish:** «Foydalanuvchilar» bo‘limida kerakli shaxsni qidiruv orqali toping ➔ amallar menyusidan (3 nuqta) «Bloklash» yoki aksincha blokdan chiqarish uchun «Faollashtirish» tugmasini bir klikda bosing.\n* **3. Qorong‘i va yorug‘ rejim (Dark / Light mode):** Sahifa yuqori burchagidagi quyosh/oy belgisi yoki «Sozlamalar» bo‘limidagi mavzu o‘tkazgichi orqali bir zumda rejimni o‘zgartirish mumkin.\n* **4. Kalendar filtrlari va double-click:** «Bugun», «Kecha», «Shu hafta», «Shu oy», «Shu yil» tugmalari orqali davrlar tanlanadi. Kalendardagi istalgan sanaga 2 marta tez bosish (double click) aynan o‘sha kunni filtrlaydi.\n* **5. Nega 5-noyabrdan keyingi sanalarda tadbirlar ko‘rinmaydi?** Chunki platformada faqat o‘tgan va bugungi kungacha bo‘lib o‘tgan faktik ma’lumotlar qayd etiladi. Kelajak sanalar (6-noyabr va keyingi kunlar) hali yetib kelmagani uchun analitikada aks ettirilmaydi.\n* **6. AI yordamchi qulayliklari:** Oyna yuqori o‘ng burchagidagi to‘rtburchak tugmasi orqali chatni to‘liq ekranga kattalashtirish (expand), savat belgisi orqali suhbat tarixini tozalash va har bir xabar ostidagi nusxa olish (copy) belgisi mavjud.`,
      action: null,
      lang: 'uz',
      intent: intent.type
    };
  }

  /**
   * 22. Umumiy tadbirlar hisoboti va eksporti
   */
  static formatEventsList(intent: ParsedIntent): AIResponse {
    const lang = intent.lang;
    let action: ActionType = null;
    if (intent.wantsBoth) action = 'DOWNLOAD:EVENTS_BOTH';
    else if (intent.wantsWord) action = 'DOWNLOAD:EVENTS_WORD';
    else if (intent.wantsExcel) action = 'DOWNLOAD:EVENTS_EXCEL';

    if (lang === 'ru') {
      return {
        text: `В Юнусабадском районе с момента старта платформы проведено **245 мероприятий** с общим охватом **19 740 посещений** молодежи. Средняя посещаемость составляет **76%**.\n\n* **Спортивные состязания:** 91 мероприятие (38%)\n* **Культурные вечера:** 58 мероприятий (24%)\n* **IT и образование:** 39 мероприятий (15%)\n* **Ярмарки занятости:** 29 мероприятий (12%)\n* **Волонтерство и диалог:** 28 мероприятий (11%)${action ? '\n\nОфициальный реестр всех мероприятий готов к выгрузке в формате Word (.doc) или Excel (.xls) по госстандарту:' : ''}`,
        action,
        lang: 'ru',
        intent: intent.type
      };
    }

    if (lang === 'en') {
      return {
        text: `A total of **245 events** have been successfully hosted across Yunusobod district, engaging over **19,740 youth attendances** with an average attendance rate of **76%**.\n\n* **Sports & Athletics:** 91 events (38%)\n* **Culture & Arts:** 58 events (24%)\n* **IT & Digital Skills:** 39 events (15%)\n* **Youth Career & Jobs:** 29 events (12%)\n* **Volunteering & Civic Engagement:** 28 events (11%)${action ? '\n\nThe official district events register is ready for download in Word (.doc) or Excel (.xls) format:' : ''}`,
        action,
        lang: 'en',
        intent: intent.type
      };
    }

    return {
      text: `«Yunusobod — Birga» platformasida jami **245 ta tadbir** o‘tkazilgan bo‘lib, ularda **19 740 nafar yoshlar qatnovi** qayd etilgan. Tuman bo‘yicha o‘rtacha davomat ko‘rsatkichi **76%** ni tashkil etadi.\n\n* **Sport musobaqalari:** 91 ta tadbir (38%)\n* **Madaniyat va ma’rifat:** 58 ta tadbir (24%)\n* **IT va ta’lim kurslari:** 39 ta tadbir (15%)\n* **Yoshlar bandligi:** 29 ta tadbir (12%)\n* **Volontyorlik va ochiq muloqot:** 28 ta tadbir (11%)${action ? '\n\nBarcha tadbirlarning davlat standarti bo‘yicha to‘liq rasmiy ro‘yxatini Word (.doc) yoki Excel (.xls) formatida yuklab olishingiz mumkin:' : ''}`,
      action,
      lang: 'uz',
      intent: intent.type
    };
  }
}

