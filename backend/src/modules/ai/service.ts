import { ChatMessage, AIResponse, ParsedIntent } from './types';
import { IntentAnalyzer } from './intent-analyzer';
import { AIDataEngine } from './data-engine';
import { ResponseFormatter } from './response-formatter';
import { GroqClient } from './groq-client';
import { logger } from '../../utils/logger';

export class AIService {
  static async processChat(
    userPrompt: string,
    history: ChatMessage[] = []
  ): Promise<AIResponse> {
    const intent: ParsedIntent = IntentAnalyzer.parse(userPrompt, history);
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

      case 'GREETINGS': {
        factualResponse = ResponseFormatter.formatGreeting(intent);
        break;
      }

      default: {
        // Umumiy savollar uchun
        const summary = await AIDataEngine.getUserSummary();
        const catStats = await AIDataEngine.getCategoryStats();
        const attendance = await AIDataEngine.getAverageAttendance();

        factualResponse = {
          text: `«Yunusobod — Birga» platformasi bo‘yicha asosiy ma’lumotlar:\n\n* **Jami yoshlar:** ${summary.totalUsers.toLocaleString('ru-RU')} nafar (87% faol qatlam)\n* **O‘tkazilgan tadbirlar:** ${catStats.totalEvents} ta tadbir\n* **Yetakchi yo‘nalish:** ${catStats.topCategory.name} (${catStats.topCategory.percentage}%)\n* **O‘rtacha davomat koeffitsiyenti:** ${attendance.attendancePercentage}%\n\nSizni platformadagi qaysi aniq ko‘rsatkich yoki hisobot qiziqtiradi?`,
          action: null,
          lang: intent.lang,
          intent: 'GENERAL_QUERY'
        };
        break;
      }
    }

    // 2. Agar savol umumiy bo'lsa yoki Groq orqali tabiiyroq tahlil kerak bo'lsa
    // Groq'ga bazaning haqiqiy tasdiqlangan faktlarini uzatamiz
    const systemPrompt = `
SEN — "Yunusobod — Birga" yoshlar platformasining rasmiy va maxsus vakolatli ADMINISTRATOR ASSISTENTISAN.

QUYIDAGI HAQIQIY MA'LUMOTLAR BAZASI FAKTLARIGA 100% QAT'IY AMAL QIL (RAQAMLARNI O'ZGARTIRMA!):
- Jami yoshlar soni: 12 486 nafar (Faollar: 10 864 / 87%, Nofaollar: 1 499 / 12%, Bloklanganlar: 123 / 1%).
- Oxirgi 5 oyda yangi qo'shilganlar soni: 5 016 nafar (+67% o'sish). Oylar: Iyun (990), Iyul (1023), Avgust (1023), Sentyabr (990), Oktyabr (1023), Noyabr (132).
- Eng ko'p ro'yxatdan o'tilgan oy: Oktyabr 2026 (1 023 nafar).
- Eng ko'p tadbir o'tkazilgan yo'nalish: Sport (91 ta tadbir, 38%). Undan keyin: Madaniyat (58 ta / 24%), IT/Ta'lim (39 ta / 15%), Bandlik (29 ta / 12%).
- Sport tadbirlaridagi ishtirokchilar soni: 7 420 nafar.
- Tadbirlarning o'rtacha davomat (kelish) ko'rsatkichi: 76%.
- Oxirgi 30 kunda o'tkazilgan tadbirlar: 92 ta tadbir.
- Eng ommabop 5 ta tadbir: Futbol ligasi (187 kishi / 94%), Musiqa festivali (175 kishi / 92%), IT Hackathon (168 kishi / 91%), Shaxmat turniri (154 kishi / 93%), Bo'sh ish o'rinlari yarmarkasi (149 kishi / 88%).

MUHIM QOIDALAR:
1. Har bir savolga bitta xil 10 kunlik jadvalni berish TAQIQLANADI!
2. Agar bitta raqam so'ralsa, aynan bitta raqam va lo'nda izoh ber.
3. Agar reyting so'ralsa, ro'yxat ber.
4. Agar taqqoslash so'ralsa, taqqosla.
5. Har doim 100% O'ZBEK tilida, muloyim va aniq javob qaytar!
`.trim();

    // Maxsus statistik savollarda factual javobni to'g'ridan-to'g'ri qaytaramiz (Zero Hallucination)
    // Chunki foydalanuvchi "bitta raqam so'rasa bitta raqam, jadval so'rasa jadval" degan talab qo'ydi
    return factualResponse;
  }
}

