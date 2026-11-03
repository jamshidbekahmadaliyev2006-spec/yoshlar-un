import { PrismaClient, Role, UserStatus, EventCategory, AttendanceStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

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
  const mahallaMap = new Map<number, number>(); // csvId -> dbId

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
    const records = parse(fileContent, {
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
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      mahallaId: 1
    }
  });

  const demoUsersData = [
    { name: 'Azizbek Karimov', phone: '+998 90 100 10 10', role: Role.USER, status: UserStatus.ACTIVE, mid: 1 },
    { name: 'Dilshodbek Nurmatov', phone: '+998 91 137 23 39', role: Role.USER, status: UserStatus.ACTIVE, mid: 2 },
    { name: 'Nilufar Abdullayeva', phone: '+998 93 211 49 68', role: Role.USER, status: UserStatus.ACTIVE, mid: 3 },
    { name: 'Sardor Tursunov', phone: '+998 94 348 62 87', role: Role.USER, status: UserStatus.INACTIVE, mid: 4 },
    { name: 'Shahlo Raxmatova', phone: '+998 95 485 75 16', role: Role.USER, status: UserStatus.ACTIVE, mid: 5 },
    { name: 'Bekzod Jo‘raev', phone: '+998 97 622 88 35', role: Role.USER, status: UserStatus.BLOCKED, mid: 6 },
    { name: 'Madina Qodirova', phone: '+998 98 759 11 54', role: Role.USER, status: UserStatus.ACTIVE, mid: 7 },
    { name: 'Javlonbek Abdullayev', phone: '+998 99 896 24 73', role: Role.COACH, status: UserStatus.ACTIVE, mid: 1 },
    { name: 'Sabrina Raximova', phone: '+998 90 233 37 92', role: Role.VOLUNTEER, status: UserStatus.ACTIVE, mid: 2 },
    { name: 'Otabek Yusupov', phone: '+998 91 370 50 11', role: Role.USER, status: UserStatus.ACTIVE, mid: 3 }
  ];

  const createdUserIds: number[] = [admin.id];
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
    { title: 'Futbol musobaqasi', cat: EventCategory.SPORT, desc: 'Yunusobod tumanidagi yoshlar o‘rtasida minifutbol bo‘yicha tuman chempionati. G‘oliblarga qimmatbaho esdalik sovg‘alari va diplomlar topshiriladi.' },
    { title: 'Voleybol turniri', cat: EventCategory.SPORT, desc: 'Mahallalar o‘rtasida do‘stona voleybol kubogi.' },
    { title: 'Shaxmat turniri', cat: EventCategory.SPORT, desc: 'Zakovatli yoshlar uchun shaxmat va shashka chempionati.' },
    { title: 'Musiqa festivali', cat: EventCategory.CULTURAL, desc: 'Yunusobod yoshlar ijodiy festivali va konsert dasturi.' },
    { title: 'Ko‘rgazma ochilishi', cat: EventCategory.CULTURAL, desc: 'Yosh rassomlar va hunarmandlar asarlari ko‘rgazmasi.' },
    { title: 'IT kurslari (Frontend)', cat: EventCategory.EDUCATION, desc: 'Zamonaviy veb dasturlash (HTML, CSS, React) bo‘yicha bepul amaliy master-klass.' },
    { title: 'Ingliz tili darsi', cat: EventCategory.EDUCATION, desc: 'Speaking va IELTS ga tayyorgarlik bo‘yicha ochiq seminar.' },
    { title: 'Ishga joylashish yarmarkasi', cat: EventCategory.EMPLOYMENT, desc: 'Yunusoboddagi 40+ yirik korxona va tashkilotlar ishtirokida bo‘sh ish o‘rinlari yarmarkasi.' },
    { title: 'Rezyume ustaxonasi', cat: EventCategory.EMPLOYMENT, desc: 'To‘g‘ri rezyume tayyorlash va suhbatdan muvaffaqiyatli o‘tish sirlari.' },
    { title: 'Ko‘chat ekish aksiyasi', cat: EventCategory.VOLUNTEER, desc: 'Yashil makon umummilliy loyihasi doirasida daraxt ekish xayriya aksiyasi.' },
    { title: 'Yoshlar uchrashuvi', cat: EventCategory.OTHER, desc: 'Tuman faollari va yoshlar yetakchilari bilan ochiq muloqot.' }
  ];

  const dbPlaces = await prisma.place.findMany({ take: 20 });
  const placeIds = dbPlaces.map(p => p.id);

  const dates = [
    '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31',
    '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04',
    '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-10'
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
        const isPast = dateStr <= '2026-11-02';
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
            status: attended ? AttendanceStatus.ATTENDED : AttendanceStatus.REGISTERED,
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

