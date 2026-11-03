import { prisma } from '../../config/db';
import bcrypt from 'bcryptjs';

export class SettingsService {
  static async getSettings() {
    const setting = await prisma.setting.findUnique({
      where: { key: 'general_config' }
    });

    if (!setting) {
      return {
        tuman: 'Yunusobod tumani',
        sys: 'Yoshlar bandligi platformasi',
        email: 'info@yunusobod.uz',
        tel: '+998 71 123 45 67',
        login: 'admin',
        n: [1, 1, 1]
      };
    }

    return setting.value as any;
  }

  static async updateSettings(data: any) {
    const current = await this.getSettings();
    const updatedValue = {
      ...current,
      ...data
    };

    const record = await prisma.setting.upsert({
      where: { key: 'general_config' },
      update: {
        value: updatedValue
      },
      create: {
        key: 'general_config',
        value: updatedValue,
        description: 'Umumiy tizim sozlamalari'
      }
    });

    return record.value;
  }

  static async updatePassword(username: string, oldPass: string, newPass: string) {
    // 1. Foydalanuvchini topish
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phone: username }, { role: 'ADMIN' }]
      }
    });

    if (!user || !user.passwordHash) {
      throw new Error('Foydalanuvchi topilmadi');
    }

    const isMatch = await bcrypt.compare(oldPass, user.passwordHash);
    if (!isMatch) {
      throw new Error('Eski parol noto‘g‘ri');
    }

    if (oldPass === newPass) {
      throw new Error('Yangi parol eskisidan farq qilishi kerak');
    }

    const newHash = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });

    return { success: true, message: 'Parol muvaffaqiyatli yangilandi' };
  }
}

