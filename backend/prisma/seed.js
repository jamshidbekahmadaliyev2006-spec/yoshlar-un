"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sync_1 = require("csv-parse/sync");
const prisma = new client_1.PrismaClient();
const MAHALLAS = [
    { name: 'Tinchlik', population: 7800, youthCount: 2340 },
    { name: 'Navbahor', population: 6400, youthCount: 1980 },
    { name: 'Bodomzor', population: 9200, youthCount: 2860 },
    { name: 'Yangi hayot', population: 5800, youthCount: 1720 },
    { name: 'Oqtepa', population: 8100, youthCount: 2450 },
    { name: 'Chinor', population: 6900, youthCount: 2100 },
    { name: 'Bahor', population: 7300, youthCount: 2210 }
];
async function main() {
    console.log('🌱 Boshlang‘ich ma’lumotlarni bazaga yuklash boshlandi...');
    // 1. Mahallalarni yaratish
    console.log('1. Mahallalarni yuklash...');
    const mahallaMap = new Map(); // csvId -> dbId
    for (let i = 0; i < MAHALLAS.length; i++) {
        const m = MAHALLAS[i];
        const created = await prisma.mahalla.upsert({
            where: { name: m.name },
            update: {},
            create: {
                name: m.name,
                population: m.population,
                youthCount: m.youthCount
            }
        });
        mahallaMap.set(i + 1, created.id);
    }
    // 2. 141 ta joyni CSV fayldan o'qib yuklash
    console.log('2. 141 ta joyni CSV dan yuklash...');
    const csvPath = path.join(__dirname, '../data/places-seed.csv');
    if (fs.existsSync(csvPath)) {
        const fileContent = fs.readFileSync(csvPath, 'utf-8');
        const records = (0, sync_1.parse)(fileContent, {
            columns: true,
            skip_empty_lines: true
        });
        for (const row of records) {
            const csvMid = parseInt(row.mahalla_id, 10);
            const dbMid = mahallaMap.get(csvMid) || 1;
            await prisma.place.upsert({
                where: { id: parseInt(row.id, 10) },
                update: {
                    name: row.name,
                    category: row.category,
                    address: row.address,
                    latitude: parseFloat(row.latitude),
                    longitude: parseFloat(row.longitude),
                    googlePlaceId: row.google_place_id,
                    capacity: parseInt(row.capacity, 10) || 100,
                    mahallaId: dbMid
                },
                create: {
                    id: parseInt(row.id, 10),
                    name: row.name,
                    category: row.category,
                    address: row.address,
                    latitude: parseFloat(row.latitude),
                    longitude: parseFloat(row.longitude),
                    googlePlaceId: row.google_place_id,
                    capacity: parseInt(row.capacity, 10) || 100,
                    mahallaId: dbMid
                }
            });
        }
        console.log(`✅ ${records.length} ta joy bazaga saqlandi.`);
    }
    // 3. Admin va asosiy foydalanuvchilarni yaratish
    console.log('3. Foydalanuvchilarni yaratish...');
    const adminPasswordHash = await bcrypt.hash('admin12345', 10);
    const defaultPasswordHash = await bcrypt.hash('user12345', 10);
    const admin = await prisma.user.upsert({
        where: { phone: '+998901234567' },
        update: {},
        create: {
            name: 'Administrator',
            phone: '+998901234567',
            passwordHash: adminPasswordHash,
            role: client_1.Role.ADMIN,
            status: client_1.UserStatus.ACTIVE,
            mahallaId: 1
        }
    });
    const demoUsersData = [
        { name: 'Azizbek Karimov', phone: '+998 90 100 10 10', role: client_1.Role.USER, status: client_1.UserStatus.ACTIVE, mid: 1 },
        { name: 'Dilshodbek Nurmatov', phone: '+998 91 137 23 39', role: client_1.Role.USER, status: client_1.UserStatus.ACTIVE, mid: 2 },
        { name: 'Nilufar Abdullayeva', phone: '+998 93 211 49 68', role: client_1.Role.USER, status: client_1.UserStatus.ACTIVE, mid: 3 },
        { name: 'Sardor Tursunov', phone: '+998 94 348 62 87', role: client_1.Role.USER, status: client_1.UserStatus.INACTIVE, mid: 4 },
        { name: 'Shahlo Raxmatova', phone: '+998 95 485 75 16', role: client_1.Role.USER, status: client_1.UserStatus.ACTIVE, mid: 5 },
        { name: 'Bekzod Jo‘raev', phone: '+998 97 622 88 35', role: client_1.Role.USER, status: client_1.UserStatus.BLOCKED, mid: 6 },
        { name: 'Madina Qodirova', phone: '+998 98 759 11 54', role: client_1.Role.USER, status: client_1.UserStatus.ACTIVE, mid: 7 },
        { name: 'Javlonbek Abdullayev', phone: '+998 99 896 24 73', role: client_1.Role.COACH, status: client_1.UserStatus.ACTIVE, mid: 1 },
        { name: 'Sabrina Raximova', phone: '+998 90 233 37 92', role: client_1.Role.VOLUNTEER, status: client_1.UserStatus.ACTIVE, mid: 2 },
        { name: 'Otabek Yusupov', phone: '+998 91 370 50 11', role: client_1.Role.USER, status: client_1.UserStatus.ACTIVE, mid: 3 }
    ];
    const createdUserIds = [admin.id];
    for (const u of demoUsersData) {
        const usr = await prisma.user.upsert({
            where: { phone: u.phone },
            update: {},
            create: {
                name: u.name,
                phone: u.phone,
                passwordHash: defaultPasswordHash,
                role: u.role,
                status: u.status,
                mahallaId: u.mid
            }
        });
        createdUserIds.push(usr.id);
    }
    // 4. Tadbirlarni yaratish (Sport, Madaniy, Ta'lim, Ishga joylashish, Volontyorlik, Boshqa)
    console.log('4. Tadbirlarni yuklash...');
    const pool = [
        { title: 'Futbol musobaqasi', cat: client_1.EventCategory.SPORT, desc: 'Yunusobod tumanidagi yoshlar o‘rtasida minifutbol bo‘yicha tuman chempionati. G‘oliblarga qimmatbaho esdalik sovg‘alari va diplomlar topshiriladi.' },
        { title: 'Voleybol turniri', cat: client_1.EventCategory.SPORT, desc: 'Mahallalar o‘rtasida do‘stona voleybol kubogi.' },
        { title: 'Shaxmat turniri', cat: client_1.EventCategory.SPORT, desc: 'Zakovatli yoshlar uchun shaxmat va shashka chempionati.' },
        { title: 'Musiqa festivali', cat: client_1.EventCategory.CULTURAL, desc: 'Yunusobod yoshlar ijodiy festivali va konsert dasturi.' },
        { title: 'Ko‘rgazma ochilishi', cat: client_1.EventCategory.CULTURAL, desc: 'Yosh rassomlar va hunarmandlar asarlari ko‘rgazmasi.' },
        { title: 'IT kurslari (Frontend)', cat: client_1.EventCategory.EDUCATION, desc: 'Zamonaviy veb dasturlash (HTML, CSS, React) bo‘yicha bepul amaliy master-klass.' },
        { title: 'Ingliz tili darsi', cat: client_1.EventCategory.EDUCATION, desc: 'Speaking va IELTS ga tayyorgarlik bo‘yicha ochiq seminar.' },
        { title: 'Ishga joylashish yarmarkasi', cat: client_1.EventCategory.EMPLOYMENT, desc: 'Yunusoboddagi 40+ yirik korxona va tashkilotlar ishtirokida bo‘sh ish o‘rinlari yarmarkasi.' },
        { title: 'Rezyume ustaxonasi', cat: client_1.EventCategory.EMPLOYMENT, desc: 'To‘g‘ri rezyume tayyorlash va suhbatdan muvaffaqiyatli o‘tish sirlari.' },
        { title: 'Ko‘chat ekish aksiyasi', cat: client_1.EventCategory.VOLUNTEER, desc: 'Yashil makon umummilliy loyihasi doirasida daraxt ekish xayriya aksiyasi.' },
        { title: 'Yoshlar uchrashuvi', cat: client_1.EventCategory.OTHER, desc: 'Tuman faollari va yoshlar yetakchilari bilan ochiq muloqot.' }
    ];
    const dbPlaces = await prisma.place.findMany({ take: 20 });
    const placeIds = dbPlaces.map(p => p.id);
    const dates = [
        '2025-10-24', '2025-10-25', '2025-10-26', '2025-10-27',
        '2025-10-28', '2025-10-29', '2025-10-30', '2025-10-31',
        '2025-11-01', '2025-11-02', '2025-11-05', '2025-11-10'
    ];
    for (let i = 0; i < pool.length; i++) {
        const item = pool[i];
        const pid = placeIds[i % placeIds.length] || 1;
        const dateStr = dates[i % dates.length];
        const event = await prisma.event.create({
            data: {
                title: item.title,
                category: item.cat,
                placeId: pid,
                date: dateStr,
                time: `${9 + (i % 8)}:00`,
                ageRange: '15–25 yosh',
                capacity: 100 + i * 20,
                description: item.desc,
                createdById: admin.id
            }
        });
        // Registrations
        for (let uIdx = 1; uIdx < createdUserIds.length; uIdx++) {
            if ((uIdx + i) % 2 === 0) {
                const isPast = dateStr <= '2025-10-28';
                const attended = isPast && (uIdx + i) % 3 !== 0;
                await prisma.eventRegistration.upsert({
                    where: {
                        userId_eventId: {
                            userId: createdUserIds[uIdx],
                            eventId: event.id
                        }
                    },
                    update: {},
                    create: {
                        userId: createdUserIds[uIdx],
                        eventId: event.id,
                        status: attended ? client_1.AttendanceStatus.ATTENDED : client_1.AttendanceStatus.REGISTERED,
                        qrToken: `qr_${event.id}_${createdUserIds[uIdx]}_${Date.now()}`
                    }
                });
            }
        }
    }
    // 5. Sozlamalarni yaratish
    console.log('5. Tizim sozlamalarini yuklash...');
    await prisma.setting.upsert({
        where: { key: 'general_config' },
        update: {},
        create: {
            key: 'general_config',
            value: {
                districtName: 'Yunusobod tumani',
                systemName: 'Yoshlar bandligi platformasi',
                email: 'info@yunusobod.uz',
                phone: '+998 71 123 45 67',
                notifications: [1, 1, 1]
            },
            description: 'Asosiy tuman va tizim sozlamalari'
        }
    });
    console.log('✨ Seed muvaffaqiyatli yakunlandi!');
}
main()
    .catch((e) => {
    console.error('Seedda xatolik:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
