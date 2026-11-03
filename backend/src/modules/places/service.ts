import { prisma } from '../../config/db';
import { Prisma } from '@prisma/client';

export class PlacesService {
  static async getPlaces(params: { category?: string; mahallaId?: number; q?: string }) {
    const where: Prisma.PlaceWhereInput = {};

    if (params.category) {
      where.category = { contains: params.category, mode: 'insensitive' };
    }

    if (params.mahallaId) {
      where.mahallaId = params.mahallaId;
    }

    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { address: { contains: params.q, mode: 'insensitive' } }
      ];
    }

    const places = await prisma.place.findMany({
      where,
      include: {
        mahalla: { select: { id: true, name: true } },
        events: {
          select: { id: true, title: true, date: true, time: true }
        }
      },
      orderBy: { id: 'asc' }
    });

    return places;
  }

  static async getPlaceById(id: number) {
    const place = await prisma.place.findUnique({
      where: { id },
      include: {
        mahalla: true,
        events: {
          orderBy: { date: 'desc' },
          take: 5
        }
      }
    });

    if (!place) {
      throw new Error('Joy topilmadi');
    }

    return place;
  }
}

