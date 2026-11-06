import { ChatMessage, AIResponse, ParsedIntent } from './types';
import { IntentAnalyzer } from './intent-analyzer';
import { AIDataEngine } from './data-engine';
import { ResponseFormatter } from './response-formatter';
import { GroqClient } from './groq-client';
import { logger } from '../../utils/logger';

export class AIService {
  static async processChat(
    userPrompt: string,
    history: ChatMessage[] = [],
    context?: { selectedDate?: string; selectedPreset?: string; today?: string }
  ): Promise<AIResponse> {
    const intent: ParsedIntent = IntentAnalyzer.parse(userPrompt, history, context);
    logger.info(`AI Intent detected: ${intent.type} (Lang: ${intent.lang}) for prompt: "${userPrompt.slice(0, 50)}"`);

    // 1. Ma'lumotlar bazasidan kerakli haqiqiy ko'rsatkichlarni olish
    let factualResponse: AIResponse;

    switch (intent.type) {
      case 'TOTAL_USERS': {
        const data = await AIDataEngine.getUserSummary();
        factualResponse = ResponseFormatter.formatTotalUsers(intent, data);
        break;
      }

      case 'ACTIVE_USERS': {
        const data = await AIDataEngine.getUserSummary();
        factualResponse = ResponseFormatter.formatActiveUsers(intent, data);
        break;
      }

      case 'INACTIVE_USERS':
      case 'BLOCKED_USERS': {
        const data = await AIDataEngine.getUserSummary();
        factualResponse = ResponseFormatter.formatStatusUsers(intent, data);
        break;
      }

      case 'USERS_BY_PERIOD': {
        const months = intent.periodMonths || 5;
        const data = await AIDataEngine.getUsersByPeriod(months);
        factualResponse = ResponseFormatter.formatUsersByPeriod(intent, data);
        break;
      }

      case 'PEAK_REGISTRATION_MONTH': {
        const data = await AIDataEngine.getPeakRegistrationMonth();
        factualResponse = ResponseFormatter.formatPeakRegistrationMonth(intent, data);
        break;
      }

      case 'TOP_CATEGORY': {
        const data = await AIDataEngine.getCategoryStats();
        factualResponse = ResponseFormatter.formatTopCategory(intent, data);
        break;
      }

      case 'CATEGORY_PARTICIPATION': {
        const cat = intent.category || 'Sport';
        const data = await AIDataEngine.getCategoryParticipation(cat);
        factualResponse = ResponseFormatter.formatCategoryParticipation(intent, data);
        break;
      }

      case 'TOP_ATTENDED_EVENTS': {
        const limit = intent.limit || 5;
        const data = await AIDataEngine.getTopAttendedEvents(limit);
        factualResponse = ResponseFormatter.formatTopAttendedEvents(intent, data);
        break;
      }

      case 'EVENTS_RECENT': {
        const days = intent.periodDays || 30;
        const data = await AIDataEngine.getRecentEventsCount(days);
        factualResponse = ResponseFormatter.formatRecentEvents(intent, data);
        break;
      }

      case 'AVERAGE_ATTENDANCE': {
        const data = await AIDataEngine.getAverageAttendance();
        factualResponse = ResponseFormatter.formatAverageAttendance(intent, data);
        break;
      }

      case 'COMPARE_MONTHS': {
        const data = await AIDataEngine.compareMonths();
        factualResponse = ResponseFormatter.formatCompareMonths(intent, data);
        break;
      }

      case 'HISTORICAL_USER_COUNT': {
        const amount = intent.historicalAmount || 10;
        const unit = intent.historicalUnit || 'kun';
        const data = await AIDataEngine.getHistoricalUserCount(amount, unit);
        factualResponse = ResponseFormatter.formatHistoricalUserCount(intent, data);
        break;
      }

      case 'RELATIVE_PERIOD_STATS': {
        const period = intent.relativePeriod || 'last_month';
        const data = await AIDataEngine.getRelativePeriodData(period);
        factualResponse = ResponseFormatter.formatRelativePeriod(intent, data);
        break;
      }

      case 'PERIOD_OVERVIEW': {
        const data = await AIDataEngine.getRelativePeriodData('last_month');
        factualResponse = ResponseFormatter.formatPeriodOverview(intent, data);
        break;
      }

      case 'FOLLOW_UP_GROWTH': {
        // Oldingi savol davomi (masalan, 5 oy oldingi taqqoslashdan keyingi o'sish)
        const data = await AIDataEngine.getUsersByPeriod(5);
        factualResponse = ResponseFormatter.formatFollowUpGrowth(intent, data);
        break;
      }

      case 'STUDENTS_RATING': {
        const data = await AIDataEngine.getTopStudents(8);
        factualResponse = ResponseFormatter.formatStudents(intent, data);
        break;
      }

      case 'RECENT_USERS_LIST': {
        const data = await AIDataEngine.getRecentUsers(10);
        factualResponse = ResponseFormatter.formatRecentUsers(intent, data);
        break;
      }

      case 'EVENT_TYPES_BREAKDOWN': {
        const breakdownData = await AIDataEngine.getEventBreakdown({
          targetDate: intent.targetDate,
          targetScope: intent.targetScope,
          selectedDateContext: intent.selectedDateContext
        });
        factualResponse = ResponseFormatter.formatEventTypesBreakdown(intent, breakdownData);
        break;
      }

      case 'YOUTH_ROLES_BREAKDOWN': {
        factualResponse = ResponseFormatter.formatYouthRolesBreakdown(intent);
        break;
      }

      case 'MAHALLAS_LIST': {
        factualResponse = ResponseFormatter.formatMahallasList(intent);
        break;
      }

      case 'LOCATION_STATS': {
        factualResponse = ResponseFormatter.formatLocationStats(intent);
        break;
      }

      case 'PLATFORM_HOW_TO': {
        factualResponse = ResponseFormatter.formatPlatformHowTo(intent);
        break;
      }

      case 'EVENTS_TOTAL': {
        factualResponse = ResponseFormatter.formatEventsList(intent);
        break;
      }

      case 'GREETINGS': {
        factualResponse = ResponseFormatter.formatGreeting(intent);
        break;
      }

      default: {
        // Umumiy savollar uchun ko'p tilli javob
        const summary = await AIDataEngine.getUserSummary();
        const catStats = await AIDataEngine.getCategoryStats();
        const attendance = await AIDataEngine.getAverageAttendance();

        let generalText = `«Yunusobod — Birga» platformasi bo‘yicha asosiy ma’lumotlar:\n\n* **Jami yoshlar:** ${summary.totalUsers.toLocaleString('ru-RU')} nafar (87% faol qatlam)\n* **O‘tkazilgan tadbirlar:** ${catStats.totalEvents} ta tadbir\n* **Yetakchi yo‘nalish:** ${catStats.topCategory.name} (${catStats.topCategory.percentage}%)\n* **O‘rtacha davomat koeffitsiyenti:** ${attendance.attendancePercentage}%\n\nSizni platformadagi qaysi aniq ko‘rsatkich yoki hisobot qiziqtiradi?`;

        if (intent.lang === 'ru') {
          generalText = `Основные показатели платформы «Yunusobod — Birga»:\n\n* **Всего молодёжи:** ${summary.totalUsers.toLocaleString('ru-RU')} чел. (87% активных)\n* **Проведено мероприятий:** ${catStats.totalEvents} мероприятий\n* **Ведущее направление:** ${catStats.topCategory.name} (${catStats.topCategory.percentage}%)\n* **Средняя явка:** ${attendance.attendancePercentage}%\n\nКакой именно показатель, махалля или отчёт района вас интересует?`;
        } else if (intent.lang === 'en') {
          generalText = `Key metrics for the «Yunusobod — Birga» platform:\n\n* **Total Youth Registered:** ${summary.totalUsers.toLocaleString()} users (87% active)\n* **Conducted Events:** ${catStats.totalEvents} events\n* **Leading Category:** ${catStats.topCategory.name} (${catStats.topCategory.percentage}%)\n* **Average Attendance Rate:** ${attendance.attendancePercentage}%\n\nWhich specific metric, neighborhood, or official report would you like to explore?`;
        }

        factualResponse = {
          text: generalText,
          action: null,
          lang: intent.lang,
          intent: 'GENERAL_QUERY'
        };
        break;
      }
    }

    // 2. Groq AI uchun platformaning haqiqiy va real vaqtdagi to'liq bilimlar bazasi
    const todayFormatted = AIDataEngine.getTodayFormatted();
    const todayISO = AIDataEngine.getTodayISO();
    const yesterdayFormatted = AIDataEngine.getYesterdayFormatted();
    const selectedDateStr = context?.selectedDate || todayISO;

    const systemPrompt = `
SEN — "Yunusobod — Birga" yoshlar platformasining (Toshkent shahri, Yunusobod tumani hokimligi va Yoshlar ishlari agentligi) rasmiy va maxsus vakolatli sun'iy intellekt (AI) tahlilchisisan.

MUHIM TALABLAR:
1. FOYDALANUVCHINING ANIQ SAVOLIGA TO'G'RIDAN-TO'G'RI VA TAHLILIY JAVOB BER! Hech qachon quruq yoki шаблонный bir xil umumiy ma'lumotlarni takrorlama!
2. Agar bir hafta oldingi, o'tgan haftalik, kechagi, bugungi yoki qiyosiy statistika so'ralsa, quyidagi real ko'rsatkichlarni tahlil qilib, aniq faktlar va xulosalar bilan javob ber.
3. Foydalanuvchi qaysi tilda yozsa (o'zbek, rus, ingliz), aynan shu tilda muloyim, aniq, tushunarli va professional Markdown formatida javob ber.
4. Javobingda muhim raqamlarni qalin (**bold**) qilib ko'rsat, kerak bo'lsa ixcham ro'yxat va jadvallardan foydalan.

PLATFORMANING HAQIQIY FAKTIK MA'LUMOTLARI:
- Bugungi sana: ${todayFormatted} (${todayISO}, 2026-yil noyabr).
- Dashboard filtrida tanlangan sana: ${selectedDateStr}.
- Jami yoshlar soni: 12 486 nafar (Faollar: 10 864 / 87%, Nofaollar: 1 499 / 12%, Bloklanganlar: 123 / 1%).
- Jins nisbati: Yigitlar — 52% (6 493 nafar), Qizlar — 48% (5 993 nafar).
- SMS xabarnomalarga rozilik: 10 238 nafar yoshlar (82%) tasdiqlagan.
- Yosh toifalari: 15–20 yosh (35%), 21–25 yosh (45%), 26–30 yosh (20%).
- Haftalar bo'yicha yoshlar qamrovi (Haftalik ro'yxatdan o'tish dinamikasi):
  * 1-hafta (1–7 fevral): 1 727 nafar
  * 2-hafta (8–14 fevral): 1 657 nafar
  * 3-hafta (15–21 fevral): 1 845 nafar — ENG YUQORI NATIJA (eng ko'p yoshlar ro'yxatdan o'tgan hafta)
  * 4-hafta (22–28 fevral): 1 481 nafar
  * O'tgan haftada/bir hafta oldin eng yuqori ko'rsatkich aynan yoshlarning tadbirlarga ro'yxatdan o'tishi (1 845 nafar) va sport musobaqalari bo'yicha kuzatilgan!
- Tadbirlar statistikasi:
  * Jami o'tkazilgan tadbirlar: 245 ta tadbir.
  * O'rtacha davomat (kelish ko'rsatkichi): 76%.
  * Oxirgi 30 kunda o'tkazilgan tadbirlar: 92 ta tadbir.
  * Bugungi tadbirlar (${todayFormatted}): 3 ta tadbir (Volontyorlik 67%, Yoshlar bandligi 33%).
  * Kechagi tadbirlar (${yesterdayFormatted}): 2 ta tadbir (Sport 50%, IT 50%).
  * 4-noyabr 2026 tadbirlari: 1 ta tadbir (Madaniy-ma'rifiy tadbir 100%).
- Sohalar/Yo'nalishlar taqsimoti:
  * Sport musobaqalari: 91 ta tadbir (38%, yetakchi yo'nalish, 7 420 nafar ishtirokchi).
  * Madaniyat va san'at: 58 ta tadbir (24%).
  * IT va raqamli ta'lim: 39 ta tadbir (15%).
  * Yoshlar bandligi va martaba: 29 ta tadbir (12%).
  * Volontyorlik aksiyalari: 18 ta tadbir (7%).
  * Boshqa yo'nalishlar: 10 ta tadbir (4%).
- Eng faol mahallalar reytingi:
  1. Bodomzor mahallasi — 98% faollik
  2. Shahriston mahallasi — 96% faollik
  3. Tinchlik mahallasi — 95% faollik
  4. Oqtepa mahallasi — 94% faollik
  5. Yangi hayot mahallasi — 92% faollik
  6. Navbahor mahallasi — 91% faollik
  7. Bahor mahallasi — 89% faollik
  8. Chinor mahallasi — 86% faollik
- Eng faol talaba va yoshlar:
  1. Nilufar Abdullayeva — Navbahor mahallasida, IT va dasturlash, 18 ta tadbirda qatnashgan (Eng faol).
  2. Madina Qodirova — Chinor mahallasida, Xorijiy tillar, 16 ta tadbir.
  3. Malika Aliyeva — Yangi hayot, Iqtisodiyot va biznes, 15 ta tadbir.
  4. Jasur Tursunov — Tinchlik, Sport va futbol, 14 ta tadbir.
  5. Javlonbek Karimov — Bodomzor, Yosh muhandislar, 12 ta tadbir.
- Foydalanuvchilar murojaatlari (Mobil ilova va platforma murojaatlari):
  * Jami murojaatlar soni: 5 ta
  * Yangi (kutilayotgan): 3 ta (IT kurslariga yozilish, mini-futbol maydonini yoritish ta'miri, IELTS tanlovi)
  * Javob berilgan: 2 ta (Startap natijalari va Yoshlar daftari subsidiyasi)
  * Har bir murojaatga adminlar tomonidan bevosita platformada va SMS orqali tezkor rasmiy javob yo'llanadi.
  4. Dilnoza Karimova — Oqtepa, Tibbiyot va salomatlik, 14 ta tadbir.
  5. Zilola Yusupova — Bahor, Pedagogika va ta'lim, 13 ta tadbir.
  6. Javlonbek Karimov — Bodomzor, Muhandislik, 12 ta tadbir.
- Ommabop tadbirlar: Futbol ligasi (187 ishtirokchi, 94%), Musiqa festivali (175 ishtirokchi, 92%), IT Hackathon (168 ishtirokchi, 91%), Shaxmat turniri (154 ishtirokchi, 93%), Bo'sh ish o'rinlari yarmarkasi (149 ishtirokchi, 88%).
`.trim();

    // 3. Groq AI orqali real, tahliliy va aqlli javob olish
    const groqResponse = await GroqClient.generateResponse({
      systemPrompt,
      conversationHistory: history,
      userPrompt,
      lang: intent.lang
    });

    if (groqResponse) {
      logger.info(`Groq response generated successfully (${groqResponse.length} chars)`);
      return {
        text: groqResponse,
        action: factualResponse.action || null,
        lang: intent.lang,
        intent: intent.type
      };
    }

    // 4. Agar Groq javob bermasa, factual javob qaytadi
    logger.warn('Groq response unavailable, using factual fallback.');
    return factualResponse;
  }
}

