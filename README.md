# Yunusobod — Birga (Yoshlar Bandligi va Faolligi Platformasi)

Toshkent shahri Yunusobod tumani yoshlari uchun yagona raqamli ekotizim: tadbirlar, sport musobaqalari, ta'lim, ishga joylashish va volontyorlik loyihalarini qamrab oluvchi tuman darajasidagi zamonaviy platforma.

---

## 📁 Loyiha tuzilmasi

```text
yunusobod-birga/
├── README.md                 # Loyiha hujjatlari va ishga tushirish qo'llanmasi
├── docker-compose.yml        # PostgreSQL + Backend + Admin frontend bir buyruqda
├── .env.example              # Muhit o'zgaruvchilari namunasi
├── docs/
│   ├── openapi.yaml          # OpenAPI 3.0 spetsifikatsiyasi (Admin & Mobile uchun yagona kontrakt)
│   └── db-schema.md          # Ma'lumotlar bazasi jadvallari, indekslar va munosabatlar
│
├── backend/                  # Node.js + TypeScript + Express + Prisma (PostgreSQL / PostGIS)
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma     # Barcha jadvallar (users, mahallas, places, events, registrations...)
│   │   ├── seed.ts           # 141 ta joy, mahallalar va demo tadbirlarni yuklovchi skript
│   ├── data/
│   │   └── places-seed.csv   # Yunusoboddagi 141 ta real maktab, stadion, masjid, bog'lar
│   └── src/
│       ├── server.ts         # Asosiy server fayli
│       ├── config/           # env.ts, db.ts
│       ├── middleware/       # auth.ts, role.ts, validate.ts, error.ts
│       ├── utils/            # jwt.ts, logger.ts, response.ts
│       └── modules/          # auth, users, mahallas, places, events, registrations, stats, settings, uploads
│
├── admin/                    # React 18 + TypeScript + Vite (Admin panel)
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── main.tsx & App.tsx
│   │   ├── router.tsx        # Dashboard, Mahalla, Users, Events, EventForm, EventDetails, Settings
│   │   ├── api/              # client.ts, events.ts, users.ts, mahallas.ts, places.ts, stats.ts
│   │   ├── pages/            # 7 ta to'liq sahifa
│   │   ├── components/       # layout (Sidebar, Topbar), ui, charts (WeeklyBars, Donut, MahallaRanking), map (MapView, EventCalendar)
│   │   ├── store/            # authStore, themeStore (Dark/Light rejim)
│   │   └── styles/           # tokens.css, animations.css, global.css (1-ga-1 dizayn)
│
└── mobile/                   # Mobil ilova (Flutter / React Native)
    └── README.md             # Mobil dasturchilar uchun backend API ulanish qo'llanmasi
```

---

## 🚀 Tezkor ishga tushirish (Docker orqali)

Barcha xizmatlar (PostgreSQL, Backend API va Admin Panel) ni bir buyruq bilan ishga tushirish:

```bash
# 1. Loyiha papkasiga kiring
cd yunusobod-birga

# 2. Muhit sozlamalarini nusxalang
cp .env.example .env

# 3. Docker compose orqali ishga tushiring
docker-compose up -d --build
```

Xizmatlar manzillari:
- **Admin Panel**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000/api/v1`
- **Swagger / OpenAPI**: `http://localhost:5000/api/docs`
- **PostgreSQL**: `localhost:5432` (db: `yunusobod_birga`, user: `postgres`, parol: `postgres`)

---

## 🛠 Mahalliy muhitda ishlab chiqish (Local Development)

### 1. Backend

```bash
cd backend
npm install

# .env faylini yaratish
cp .env.example .env

# Bazaga ulanish va migratsiyalarni yurgizish
npx prisma db push

# 141 ta joy va demo ma'lumotlarni bazaga yuklash
npx prisma db seed

# Dasturchi rejimida ishga tushirish
npm run dev
```

Backend `http://localhost:5000` portida ishlaydi.

### 2. Admin Panel (Frontend)

```bash
cd admin
npm install

# Dasturchi rejimida ishga tushirish
npm run dev
```

Admin panel `http://localhost:3000` (yoki Vite bergan portda) ochiladi.

---

## 🔑 Dastlabki tizimga kirish (Default Credentials)

- **Admin Login**: `admin`
- **Admin Parol**: `admin12345`

---

## 📊 Tizim imkoniyatlari

1. **Dashboard (Bosh sahifa)**:
   - Jami foydalanuvchilar, jami tadbirlar, faol ishtirokchilar, bugungi tadbirlar hisoblagichi.
   - 4 haftalik davomat grafigi: ro'yxatdan o'tganlar va haqiqatda kelganlar soni hamda kelish foizi (`WeeklyBars`).
   - Tadbirlar toifalari bo'yicha taqsimot (`Donut`).
   - Yunusobod xaritasi: lokatsiyalar belgilari (pins), zoom boshqaruvi, faol nuqtani ko'rish.
   - Interaktiv kalendar: kunlar bo'yicha tadbirlar ro'yxati.

2. **Mahallalar reytingi**:
   - Mahallalar bo'yicha faollik ko'rsatkichi (`MahallaRanking`).
   - Qatnashganlar, kelish foizi va tadbirlar soni bo'yicha saralash jadvali.

3. **Foydalanuvchilar boshqaruvi**:
   - Qidiruv, rol bo'yicha filtr, status bo'yicha almashtirish (Faol / Bloklangan).
   - Foydalanuvchilar ro'yxatini CSV formatida eksport qilish.
   - Sahifalash (Pagination).

4. **Tadbirlar ro'yxati va filtrlash**:
   - Turlar (Sport, Madaniy, Ta'lim, Ishga joylashish, Volontyorlik, Boshqa) bo'yicha filtr.
   - Tezkor qidiruv, yangi tadbir qo'shish tugmasi.

5. **Tadbir qo'shish**:
   - Forma: nomi, turi, lokatsiyasi, sana, vaqt, tavsif.
   - Xaritadan to'g'ridan-to'g'ri nuqtani tanlash.
   - Rasm yuklash (drag & drop / preview).

6. **Tadbir tafsilotlari**:
   - To'liq ma'lumot, lokatsiya xaritasi, Google Maps yo'nalishi.
   - Qatnashuvchilar avatarlari va barcha qatnashuvchilar modal oynasi.
   - Ro'yxatdan o'tish / bekor qilish imkoniyati.

7. **Sozlamalar**:
   - Asosiy sozlamalar (tuman nomi, tizim nomi, email, telefon).
   - Xavfsizlik (login va parol o'zgartirish).
   - Bildirishnomalar boshqaruvi.

