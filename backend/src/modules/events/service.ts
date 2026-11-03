import { prisma } from '../../config/db';
import { EventCategory, Prisma, AttendanceStatus } from '@prisma/client';

export class EventsService {
  static async getEvents(params: {
    q?: string;
    category?: string;
    date?: string;
    limit?: number;
  }) {
    const where: Prisma.EventWhereInput = {};

    if (params.category) {
      where.category = params.category as EventCategory;
    }

    if (params.date) {
      where.date = params.date;
    }

    if (params.q) {
      const q = params.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { place: { name: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const events = await prisma.event.findMany({
      where,
      take: params.limit ? Math.min(100, params.limit) : undefined,
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ],
      include: {
        place: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true
          }
        },
        _count: {
          select: { registrations: true }
        },
        registrations: {
          select: {
            status: true
          }
        }
      }
    });

    return events.map(e => {
      const attendedCount = e.registrations.filter(r => r.status === AttendanceStatus.ATTENDED).length;
      return {
        id: e.id,
        title: e.title,
        category: e.category,
        date: e.date,
        time: e.time,
        ageRange: e.ageRange,
        capacity: e.capacity,
        description: e.description,
        imageUrl: e.imageUrl,
        place: e.place,
        going: e._count.registrations,
        came: attendedCount
      };
    });
  }

  static async getEventById(id: number) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        place: true,
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!event) {
      throw new Error('Tadbir topilmadi');
    }

    const participants = event.registrations.map(r => ({
      id: r.user.id,
      name: r.user.name,
      role: r.user.role,
      status: r.status,
      registeredAt: r.registeredAt
    }));

    return {
      id: event.id,
      title: event.title,
      category: event.category,
      date: event.date,
      time: event.time,
      ageRange: event.ageRange,
      capacity: event.capacity,
      description: event.description,
      imageUrl: event.imageUrl,
      place: event.place,
      going: event.registrations.length,
      participants
    };
  }

  static async createEvent(data: {
    title: string;
    category: EventCategory;
    placeId: number;
    date: string;
    time: string;
    ageRange?: string;
    capacity?: number;
    description: string;
    imageUrl?: string;
    userId?: number;
  }) {
    const event = await prisma.event.create({
      data: {
        title: data.title,
        category: data.category,
        placeId: data.placeId,
        date: data.date,
        time: data.time,
        ageRange: data.ageRange || '15–25 yosh',
        capacity: data.capacity || 100,
        description: data.description,
        imageUrl: data.imageUrl,
        createdById: data.userId
      },
      include: {
        place: true
      }
    });

    return event;
  }

  static async updateEvent(id: number, data: Partial<{
    title: string;
    category: EventCategory;
    placeId: number;
    date: string;
    time: string;
    ageRange: string;
    capacity: number;
    description: string;
    imageUrl: string;
  }>) {
    const updated = await prisma.event.update({
      where: { id },
      data,
      include: { place: true }
    });

    return updated;
  }

  static async deleteEvent(id: number) {
    await prisma.event.delete({
      where: { id }
    });
    return { success: true, message: 'Tadbir o‘chirildi' };
  }
}

