import fs from 'fs';
import path from 'path';
import { Appeal } from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'appeals.json');

const INITIAL_APPEALS: Appeal[] = [
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

class AppealsStore {
  private appeals: Appeal[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.appeals = JSON.parse(raw);
      } else {
        this.appeals = [...INITIAL_APPEALS];
        this.save();
      }
    } catch {
      this.appeals = [...INITIAL_APPEALS];
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.appeals, null, 2), 'utf-8');
    } catch {}
  }

  getAll(filters?: { status?: string; category?: string; query?: string }): Appeal[] {
    let result = [...this.appeals];

    if (filters?.status && filters.status !== 'all') {
      result = result.filter(a => a.status === filters.status);
    }

    if (filters?.category && filters.category !== 'all' && filters.category !== 'Barcha yo‘nalishlar') {
      result = result.filter(a => a.category === filters.category);
    }

    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        a =>
          a.userName.toLowerCase().includes(q) ||
          a.mahalla.toLowerCase().includes(q) ||
          a.subject.toLowerCase().includes(q) ||
          a.text.toLowerCase().includes(q) ||
          a.phone.includes(q)
      );
    }

    return result.sort((a, b) => b.id - a.id);
  }

  getById(id: number): Appeal | null {
    return this.appeals.find(a => a.id === id) || null;
  }

  create(data: Omit<Appeal, 'id' | 'createdAt' | 'status'>): Appeal {
    const maxId = this.appeals.reduce((m, item) => Math.max(m, item.id), 0);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const newAppeal: Appeal = {
      id: maxId + 1,
      userName: data.userName.trim(),
      phone: data.phone.trim(),
      mahalla: data.mahalla || 'Navbahor mahallasi',
      category: data.category || 'IT va zamonaviy ta’lim',
      subject: data.subject.trim(),
      text: data.text.trim(),
      createdAt: timeStr,
      status: 'new'
    };

    this.appeals.unshift(newAppeal);
    this.save();
    return newAppeal;
  }

  reply(id: number, replyText: string, repliedBy = 'Admin (Administrator)'): Appeal | null {
    const appeal = this.appeals.find(a => a.id === id);
    if (!appeal) return null;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    appeal.status = 'answered';
    appeal.replyText = replyText.trim();
    appeal.repliedAt = timeStr;
    appeal.repliedBy = repliedBy;

    this.save();
    return appeal;
  }

  delete(id: number): boolean {
    const initialLen = this.appeals.length;
    this.appeals = this.appeals.filter(a => a.id !== id);
    if (this.appeals.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  getStats() {
    const total = this.appeals.length;
    const newCount = this.appeals.filter(a => a.status === 'new').length;
    const answeredCount = this.appeals.filter(a => a.status === 'answered').length;
    return {
      total,
      new: newCount,
      answered: answeredCount,
      answeredPercentage: total > 0 ? Math.round((answeredCount / total) * 100) : 100
    };
  }
}

export const appealsService = new AppealsStore();

