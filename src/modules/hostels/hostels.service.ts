import { prisma } from '../../config/prisma';
import { CreateHostelInput, UpdateHostelInput, SearchHostelsInput } from './hostels.schema';

export class HostelsService {
  async createHostel(userId: string, data: CreateHostelInput) {
    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId },
    });

    if (!managerProfile) {
      throw new Error('Manager profile not found');
    }

    if (!managerProfile.verified) {
      throw new Error('Manager not verified');
    }

    const hostel = await prisma.hostel.create({
      data: {
        managerId: managerProfile.id,
        hostelName: data.hostelName,
        city: data.city,
        address: data.address,
        nearbyLocations: data.nearbyLocations,
        totalRooms: data.totalRooms,
        availableRooms: data.totalRooms,
        hostelType: data.hostelType,
        hostelFor: data.hostelFor,
        personsInRoom: data.personsInRoom,
        roomPrice: data.roomPrice,
        pricePerHeadShared: data.pricePerHeadShared,
        pricePerHeadFullRoom: data.pricePerHeadFullRoom,
        fullRoomPriceDiscounted: data.fullRoomPriceDiscounted,
        facilities: data.facilities,
        roomImages: data.roomImages,
        rules: data.rules,
        seoKeywords: data.seoKeywords,
      },
    });

    return hostel;
  }

  async updateHostel(userId: string, hostelId: string, data: UpdateHostelInput) {
    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId },
    });

    if (!managerProfile) {
      throw new Error('Manager profile not found');
    }

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel || hostel.managerId !== managerProfile.id) {
      throw new Error('Hostel not found or not authorized');
    }

    const updated = await prisma.hostel.update({
      where: { id: hostelId },
      data: {
        ...data,
        facilities: data.facilities ? data.facilities : undefined,
      },
    });

    return updated;
  }

  async deleteHostel(userId: string, hostelId: string) {
    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId },
    });

    if (!managerProfile) {
      throw new Error('Manager profile not found');
    }

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel || hostel.managerId !== managerProfile.id) {
      throw new Error('Hostel not found or not authorized');
    }

    await prisma.hostel.delete({
      where: { id: hostelId },
    });

    return { message: 'Hostel deleted' };
  }

  async getMyHostels(userId: string) {
    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId },
    });

    if (!managerProfile) {
      throw new Error('Manager profile not found');
    }

    return prisma.hostel.findMany({
      where: { managerId: managerProfile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchHostels(filters: SearchHostelsInput) {
    const where: any = { isActive: true };

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.nearbyLocation) {
      where.nearbyLocations = { has: filters.nearbyLocation };
    }

    if (filters.hostelType) {
      where.hostelType = filters.hostelType;
    }

    if (filters.hostelFor) {
      where.hostelFor = filters.hostelFor;
    }

    return prisma.hostel.findMany({
      where,
      include: {
        manager: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
      orderBy: { averageRating: 'desc' },
    });
  }

  async getHostelById(id: string) {
    const hostel = await prisma.hostel.findUnique({
      where: { id },
      include: {
        manager: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!hostel) {
      throw new Error('Hostel not found');
    }

    return hostel;
  }

  async getHostelStudents(userId: string, hostelId: string) {
    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId },
    });

    if (!managerProfile) {
      throw new Error('Manager profile not found');
    }

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel || hostel.managerId !== managerProfile.id) {
      throw new Error('Hostel not found or not authorized');
    }

    const activeBookings = await prisma.booking.findMany({
      where: {
        hostelId,
        status: 'APPROVED',
      },
      include: {
        student: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    return activeBookings.map(b => ({
      bookingId: b.id,
      studentId: b.studentId,
      student: b.student,
      joinedAt: b.createdAt,
    }));
  }

  async getAllHostels() {
    return prisma.hostel.findMany({
      include: {
        manager: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}