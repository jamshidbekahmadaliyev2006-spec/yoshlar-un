export type SupportedLang = 'uz' | 'ru' | 'en';

export type ActionType = 
  | 'DOWNLOAD:MAHALLAS_EXCEL'
  | 'DOWNLOAD:MAHALLAS_WORD'
  | 'DOWNLOAD:MAHALLAS_BOTH'
  | 'DOWNLOAD:EVENTS_EXCEL'
  | 'DOWNLOAD:EVENTS_WORD'
  | 'DOWNLOAD:EVENTS_BOTH'
  | 'DOWNLOAD:USERS_EXCEL'
  | 'DOWNLOAD:USERS_WORD'
  | 'DOWNLOAD:USERS_BOTH'
  | null;

export type IntentType =
  | 'TOTAL_USERS'
  | 'ACTIVE_USERS'
  | 'INACTIVE_USERS'
  | 'BLOCKED_USERS'
  | 'USERS_BY_PERIOD'          // Oxirgi 5 oy, oxirgi 30 kun, 1 oy va h.k.
  | 'PEAK_REGISTRATION_MONTH'  // Qaysi oyda eng ko'p yoshlar ro'yxatdan o'tgan
  | 'EVENTS_TOTAL'
  | 'EVENTS_RECENT'            // Oxirgi 30 kunda nechta tadbir
  | 'TOP_CATEGORY'             // Eng ko'p tadbir qaysi yo'nalishda
  | 'EVENT_TYPES_BREAKDOWN'    // Tadbirlar turlari, foizlari, Donut analitikasi (bugun, aprel, jami)
  | 'YOUTH_ROLES_BREAKDOWN'    // Yoshlar toifalari (talaba, sportchi, volontyor, bandlik, jins)
  | 'CATEGORY_PARTICIPATION'   // Sport / IT tadbirlarida qancha yosh qatnashgan
  | 'TOP_ATTENDED_EVENTS'      // Eng ko'p ishtirokchi qatnashgan 5 ta tadbir
  | 'AVERAGE_ATTENDANCE'       // Tadbirlarning o'rtacha davomat ko'rsatkichi
  | 'COMPARE_MONTHS'           // O'tgan oy va shu oyni taqqoslash
  | 'HISTORICAL_USER_COUNT'    // N kun / oy oldin nechta foydalanuvchi bor edi
  | 'RELATIVE_PERIOD_STATS'    // O'tgan oy, shu oy, o'tgan hafta, shu hafta
  | 'PERIOD_OVERVIEW'          // 10 kunlik / davriy umumiy holat va dinamika
  | 'FOLLOW_UP_GROWTH'         // Avvalgi natijaga nisbatan o'sish qancha
  | 'MAHALLAS_LIST'            // Mahallalar reytingi va qamrovi
  | 'STUDENTS_RATING'
  | 'RECENT_USERS_LIST'
  | 'LOCATION_STATS'           // Xarita va lokatsiyalar bo'yicha ma'lumot
  | 'PLATFORM_HOW_TO'          // Tizimdan foydalanish, boshqaruv, tadbir qo'shish, bloklash
  | 'GREETINGS'
  | 'GENERAL_QUERY';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ParsedIntent {
  type: IntentType;
  periodMonths?: number;
  periodDays?: number;
  historicalAmount?: number;
  historicalUnit?: 'kun' | 'oy' | 'hafta' | 'yil';
  relativePeriod?: 'last_month' | 'this_month' | 'last_week' | 'this_week';
  relativeMetric?: 'users' | 'events' | 'all';
  targetScope?: 'today' | 'yesterday' | 'april' | 'all' | 'selected' | 'custom' | string;
  targetDate?: string;
  selectedDateContext?: string;
  category?: string;
  limit?: number;
  wantsExcel: boolean;
  wantsWord: boolean;
  wantsBoth: boolean;
  wantsTable: boolean;
  isFollowUp: boolean;
  lang: SupportedLang;
  subTopic?: string;
}

export interface AIResponse {
  text: string;
  action: ActionType;
  lang: SupportedLang;
  intent: IntentType;
  dataSnapshot?: any;
}

