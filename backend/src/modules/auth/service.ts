import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { generateToken } from '../../utils/jwt';
import { Role, UserStatus } from '@prisma/client';

// Oddiy xotira keshi (OTP kodlar uchun)
const otpCache = new Map<string, { code: string; expiresAt: number }>();

export class AuthService {
  static async login(username: string, pass: string) {
    // 1. Standart admin tekshiruvi (.env dagi)
    if (username === env.ADMIN_USERNAME && pass === env.ADMIN_PASSWORD) {
      // Admin foydalanuvchini bazada tekshirish yoki yaratish
      let admin = await prisma.user.findFirst({
        where: { role: Role.ADMIN }
      });

      if (!admin) {
        const hash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
        admin = await prisma.user.create({
          data: {
            name: 'Administrator',
            phone: '+998901234567',
            passwordHash: hash,
            role: Role.ADMIN,
            status: UserStatus.ACTIVE
          }
        });
      }

      const token = generateToken({
        id: admin.id,
        phone: admin.phone,
        role: admin.role,
        name: admin.name
      });

      return {
        token,
        user: {
          id: admin.id,
          name: admin.name,
          phone: admin.phone,
          role: admin.role,
          status: admin.status
        }
      };
    }

    // 2. Bazadagi foydalanuvchilar orasidan qidirish (telefon yoki login bo'yicha)
    const user = await prisma.user.findFirst({
      where: {
        phone: username
      }
    });

    if (!user || !user.passwordHash) {
      throw new Error('Login yoki parol noto‘g‘ri');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new Error('Sizning profilingiz bloklangan');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new Error('Login yoki parol noto‘g‘ri');
    }

    const token = generateToken({
      id: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    };
  }

  static async sendOtp(phone: string) {
    const formattedPhone = phone.trim();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minut

    otpCache.set(formattedPhone, { code, expiresAt });
    console.log(`[SMS OTP] ${formattedPhone} raqamiga yuborilgan kod: ${code}`);

    return {
      message: 'Tasdiqlash kodi muvaffaqiyatli yuborildi',
      demoCode: process.env.NODE_ENV === 'development' ? code : undefined,
      expiresInSeconds: 300
    };
  }

  static async verifyOtp(phone: string, code: string) {
    const formattedPhone = phone.trim();
    const cached = otpCache.get(formattedPhone);

    // Development uchun standart demo kod 123456
    const isValid = (cached && cached.code === code && cached.expiresAt > Date.now()) || (code === '123456');

    if (!isValid) {
      throw new Error('Tasdiqlash kodi noto‘g‘ri yoki muddati o‘tgan');
    }

    otpCache.delete(formattedPhone);

    let user = await prisma.user.findUnique({
      where: { phone: formattedPhone }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'Yunusobod yoshi',
          phone: formattedPhone,
          role: Role.USER,
          status: UserStatus.ACTIVE
        }
      });
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new Error('Foydalanuvchi bloklangan');
    }

    const token = generateToken({
      id: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    };
  }

  static async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mahalla: true
      }
    });

    if (!user) {
      throw new Error('Foydalanuvchi topilmadi');
    }

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      mahalla: user.mahalla,
      createdAt: user.createdAt
    };
  }
}

