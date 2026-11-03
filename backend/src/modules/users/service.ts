import { prisma } from '../../config/db';
import { UserStatus, Role, Prisma } from '@prisma/client';

export class UsersService {
  static async getUsers(params: {
    q?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (params.q) {
      const q = params.q.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } }
      ];
    }

    if (params.role) {
      where.role = params.role as Role;
    }

    if (params.status) {
      where.status = params.status as UserStatus;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          mahalla: {
            select: { id: true, name: true }
          }
        }
      })
    ]);

    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      role: u.role,
      status: u.status,
      mahalla: u.mahalla?.name || 'Yunusobod',
      registeredDate: u.createdAt.toISOString().slice(0, 10).split('-').reverse().join('.')
    }));

    return {
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getUserStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, active, blocked, newToday] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      prisma.user.count({ where: { status: UserStatus.BLOCKED } }),
      prisma.user.count({ where: { createdAt: { gte: today } } })
    ]);

    return {
      total,
      active,
      blocked,
      newToday
    };
  }

  static async updateStatus(id: number, status: UserStatus) {
    const user = await prisma.user.update({
      where: { id },
      data: { status }
    });

    return {
      id: user.id,
      name: user.name,
      status: user.status
    };
  }

  static async exportCsv() {
    const users = await prisma.user.findMany({
      take: 1000,
      orderBy: { id: 'asc' },
      include: { mahalla: true }
    });

    const header = 'ID,Ism,Telefon,Rol,Status,Mahalla,Sana\n';
    const rows = users.map(u =>
      [
        u.id,
        `"${u.name.replace(/"/g, '""')}"`,
        `"${u.phone}"`,
        u.role,
        u.status,
        `"${u.mahalla?.name || ''}"`,
        u.createdAt.toISOString().slice(0, 10)
      ].join(',')
    );

    return header + rows.join('\n');
  }
}

