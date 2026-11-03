import { prisma } from '../../config/db';
import { AttendanceStatus } from '@prisma/client';

export class RegistrationsService {
  static async register(userId: number, eventId: number) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } }
    });

    if (!event) {
      throw new Error('Tadbir topilmadi');
    }

    if (event._count.registrations >= event.capacity) {
      throw new Error('Kechirasiz, ushbu tadbir uchun barcha o‘rinlar band bo‘lgan');
    }

    const qrToken = `qr_${eventId}_${userId}_${Date.now()}`;

    const reg = await prisma.eventRegistration.upsert({
      where: {
        userId_eventId: { userId, eventId }
      },
      update: {
        status: AttendanceStatus.REGISTERED,
        registeredAt: new Date()
      },
      create: {
        userId,
        eventId,
        status: AttendanceStatus.REGISTERED,
        qrToken
      }
    });

    return {
      success: true,
      registrationId: reg.id,
      qrToken: reg.qrToken,
      message: 'Muvaffaqiyatli ro‘yxatdan o‘tdingiz'
    };
  }

  static async unregister(userId: number, eventId: number) {
    await prisma.eventRegistration.deleteMany({
      where: {
        userId,
        eventId
      }
    });

    return {
      success: true,
      message: 'Ro‘yxatdan o‘tish bekor qilindi'
    };
  }

  static async checkIn(qrToken: string) {
    const reg = await prisma.eventRegistration.findUnique({
      where: { qrToken },
      include: {
        user: true,
        event: true
      }
    });

    if (!reg) {
      throw new Error('QR bilet yaroqsiz');
    }

    if (reg.status === AttendanceStatus.ATTENDED) {
      return {
        alreadyCheckedIn: true,
        message: 'Ushbu ishtirokchi oldinroq davomatdan o‘tgan',
        user: reg.user.name,
        event: reg.event.title
      };
    }

    const updated = await prisma.eventRegistration.update({
      where: { id: reg.id },
      data: {
        status: AttendanceStatus.ATTENDED,
        checkedInAt: new Date()
      }
    });

    return {
      success: true,
      message: 'Davomat tasdiqlandi (Kelgan)',
      user: reg.user.name,
      event: reg.event.title,
      checkedInAt: updated.checkedInAt
    };
  }

  static async getUserRegistrations(userId: number) {
    const regs = await prisma.eventRegistration.findMany({
      where: { userId },
      include: {
        event: {
          include: { place: true }
        }
      },
      orderBy: { registeredAt: 'desc' }
    });

    return regs;
  }
}

