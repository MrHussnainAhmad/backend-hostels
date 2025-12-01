import { prisma } from '../../config/prisma';
import { CreateReservationInput, ReviewReservationInput } from './reservations.schema';

export class ReservationsService {
  async createReservation(userId: string, data: CreateReservationInput) {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!studentProfile) {
      throw new Error('Student profile not found');
    }

    if (!studentProfile.selfVerified) {
      throw new Error('Please complete self verification first');
    }

    if (studentProfile.currentHostelId) {
      throw new Error('You already have an active hostel');
    }

    const hostel = await prisma.hostel.findUnique({
      where: { id: data.hostelId },
    });

    if (!hostel || !hostel.isActive) {
      throw new Error('Hostel not found or inactive');
    }

    const existingReservation = await prisma.reservation.findFirst({
      where: {
        studentId: studentProfile.id,
        hostelId: data.hostelId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    });

    if (existingReservation) {
      throw new Error('You already have an active reservation for this hostel');
    }

    const reservation = await prisma.reservation.create({
      data: {
        studentId: studentProfile.id,
        hostelId: data.hostelId,
        message: data.message,
      },
    });

    return reservation;
  }

  async getMyReservations(userId: string) {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!studentProfile) {
      throw new Error('Student profile not found');
    }

    return prisma.reservation.findMany({
      where: { studentId: studentProfile.id },
      include: {
        hostel: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelReservation(userId: string, reservationId: string) {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!studentProfile) {
      throw new Error('Student profile not found');
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation || reservation.studentId !== studentProfile.id) {
      throw new Error('Reservation not found');
    }

    if (reservation.status !== 'PENDING') {
      throw new Error('Can only cancel pending reservations');
    }

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' },
    });

    return updated;
  }

  async getHostelReservations(userId: string, hostelId: string) {
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

    return prisma.reservation.findMany({
      where: { hostelId },
      include: {
        student: {
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

  async reviewReservation(userId: string, reservationId: string, data: ReviewReservationInput) {
    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId },
    });

    if (!managerProfile) {
      throw new Error('Manager profile not found');
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { hostel: true },
    });

    if (!reservation || reservation.hostel.managerId !== managerProfile.id) {
      throw new Error('Reservation not found or not authorized');
    }

    if (reservation.status !== 'PENDING') {
      throw new Error('Reservation already reviewed');
    }

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: data.status,
        rejectReason: data.rejectReason,
      },
    });

    return updated;
  }
}