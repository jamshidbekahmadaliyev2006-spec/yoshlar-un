import { AppealItem } from '../types';

const INITIAL_APPEALS: AppealItem[] = [
  {
    id: 1,
    userName: 'Nilufar Abdullayeva',
    phone: '+998 90 234 56 78',
    mahalla: 'Navbahor mahallasi',
    category: 'IT va zamonaviy ta’lim',
    subject: 'IT Parkda bepul Python va Frontend kurslariga qanday yozilish mumkin?',
    text: 'Assalomu alaykum! Men Navbahor mahallasida yashayman. «Yunusobod — Birga» platformasida IT kurslari haqida o‘qidim. Bepul dasturlash kurslariga qatnashish uchun qanday hujjatlar kerak va darslar qaysi kunlari bo‘ladi?',
    createdAt: '06.11.2026, 14:15',
    status: 'new'
  },
  {
    id: 2,
    userName: 'Jasur Tursunov',
    phone: '+998 93 456 78 90',
    mahalla: 'Tinchlik mahallasi',
    category: 'Sport to‘garaklari',
    subject: 'Universal sport maydonchasi yoritish chiroqlari ta’miri',
    text: 'Assalomu alaykum! Tinchlik mahallasidagi ko‘p qavatli uylar yonidagi mini-futbol maydonchasining yoritgichlari bir haftadan beri ishlamayapti. Kechki payt yoshlar bilan sport bilan shug‘ullana olmayapmiz. Iltimos, ta’mirlashda yordam bersangiz.',
    createdAt: '06.11.2026, 11:40',
    status: 'new'
  },
  {
    id: 3,
    userName: 'Madina Qodirova',
    phone: '+998 97 123 99 88',
    mahalla: 'Chinor mahallasi',
    category: 'Iqtidorli yoshlar',
    subject: 'Xorijiy tillar (IELTS) bo‘yicha tuman stipendiyasi tanlovi',
    text: 'Salom! Chinor mahallasidan murojaat qilyapman. Menda IELTS 7.5 sertifikati bor. Tumanimizda iqtidorli talabalar va xorijiy tillarni o‘rganuvchilar uchun grant yoki stipendiya tanlovlari qachon o‘tkaziladi?',
    createdAt: '05.11.2026, 16:20',
    status: 'new'
  },
  {
    id: 4,
    userName: 'Javlonbek Karimov',
    phone: '+998 91 333 44 55',
    mahalla: 'Bodomzor mahallasi',
    category: 'Bandlik va startaplar',
    subject: 'Yosh muhandislar startap grant tanlovi natijalari',
    text: 'Assalomu alaykum! Yoshlar ishlari agentligi tomonidan o‘tkazilgan tuman startap loyihalari tanloviga biznes rejamni topshirgandim. Natijalar qayerda va qachon e’lon qilinadi?',
    createdAt: '04.11.2026, 10:05',
    status: 'answered',
    replyText: 'Salom, Javlonbek! Tanlov komissiyasi barcha arizalarni ko‘rib chiqdi. Natijalar 10-noyabr kuni platformamizning «Tadbirlar» bo‘limida va Yunusobod tumani hokimligining rasmiy kanalida e’lon qilinadi. Sizga muvaffaqiyat tilaymiz!',
    repliedAt: '04.11.2026, 14:30',
    repliedBy: 'Admin (Yunusobod Yoshlar bo‘limi)'
  },
  {
    id: 5,
    userName: 'Malika Aliyeva',
    phone: '+998 99 888 77 66',
    mahalla: 'Yangi hayot mahallasi',
    category: 'Ayollar va yoshlar tadbirkorligi',
    subject: 'Tikuvchilik va hunarmandchilik uchun subsidiya olish tartibi',
    text: 'Assalomu alaykum. Yangi hayot mahallasida yosh tadbirkor ayollar uchun asbob-uskuna xaridiga subsidiya ajratish imkoniyati bormi? Arizani kimga topshirish kerak?',
    createdAt: '03.11.2026, 09:30',
    status: 'answered',
    replyText: 'Assalomu alaykum, Malika! Mahallangizdagi Yoshlar yetakchisiga murojaat qilib, «Yoshlar daftari» jamg‘armasi orqali subsidiya olish uchun ariza topshirishingiz mumkin. Kerakli hujjatlar: pasport nusxasi va biznes reja.',
    repliedAt: '03.11.2026, 12:10',
    repliedBy: 'Admin (Yunusobod Yoshlar bo‘limi)'
  }
];

const safeGet = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const safeSet = (key: string, value: unknown): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export const appealsApi = {
  getAll: (): AppealItem[] => {
    return safeGet<AppealItem[]>('yb_appeals', INITIAL_APPEALS);
  },

  getUnreadCount: (): number => {
    const list = appealsApi.getAll();
    return list.filter(a => a.status === 'new').length;
  },

  reply: (id: number, replyText: string, replierName: string = 'Admin (Administrator)'): AppealItem[] => {
    const list = appealsApi.getAll();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const updated = list.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'answered' as const,
          replyText: replyText.trim(),
          repliedAt: timeStr,
          repliedBy: replierName
        };
      }
      return item;
    });

    safeSet('yb_appeals', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('appeals-updated'));
    }

    // Backend serverga ham sinxron yuborish
    try {
      fetch(`/api/v1/appeals/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText, repliedBy: replierName })
      }).catch(() => {});
    } catch {}

    return updated;
  },

  add: (newAppeal: Omit<AppealItem, 'id' | 'createdAt' | 'status'>): AppealItem => {
    const list = appealsApi.getAll();
    const maxId = list.reduce((m, item) => Math.max(m, item.id), 0);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const created: AppealItem = {
      ...newAppeal,
      id: maxId + 1,
      createdAt: timeStr,
      status: 'new'
    };

    const updated = [created, ...list];
    safeSet('yb_appeals', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('appeals-updated'));
    }

    // Backend serverga ham yuborish
    try {
      fetch('/api/v1/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppeal)
      }).catch(() => {});
    } catch {}

    return created;
  },

  delete: (id: number): AppealItem[] => {
    const list = appealsApi.getAll();
    const updated = list.filter(item => item.id !== id);
    safeSet('yb_appeals', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('appeals-updated'));
    }

    try {
      fetch(`/api/v1/appeals/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch {}

    return updated;
  },

  // Backenddan yangi ma'lumotlarni tortib olish
  fetchFromServer: async (): Promise<AppealItem[]> => {
    try {
      const res = await fetch('/api/v1/appeals');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          safeSet('yb_appeals', json.data);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('appeals-updated'));
          }
          return json.data;
        }
      }
    } catch {}
    return appealsApi.getAll();
  }
};
