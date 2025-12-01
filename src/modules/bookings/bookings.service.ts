import { prisma } from '../../config/prisma';
import {
  CreateBookingInput,
  DisapproveBookingInput,
  LeaveHostelInput,
  KickStudentInput,
} from './bookings.schema';

export class BookingsService {
  async createBooking(userId: string, data: CreateBookingInput) {
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

    const existingPendingBooking = await prisma.booking.findFirst({
      where: {
        studentId: studentProfile.id,
        status: 'PENDING',
      },
    });

    if (existingPendingBooking) {
      throw new Error('You already have a pending booking');
    }

    const hostel = await prisma.hostel.findUnique({
      where: { id: data.hostelId },
    });

    if (!hostel || !hostel.isActive) {
      throw new Error('Hostel not found or inactive');
    }

    if (hostel.availableRooms <= 0) {
      throw new Error('No rooms available');
    }

    let amount = 0;
    if (hostel.hostelType === 'PRIVATE') {
      amount = hostel.roomPrice || 0;
    } else if (hostel.hostelType === 'SHARED') {
      amount = hostel.pricePerHeadShared || 0;
    } else if (hostel.hostelType === 'SHARED_FULLROOM') {
      amount = hostel.pricePerHeadFullRoom || 0;
    }

    const booking = await prisma.booking.create({
      data: {
        studentId: studentProfile.id,
        hostelId: data.hostelId,
        amount,
        transactionImage: data.transactionImage,
        transactionDate: data.transactionDate,
        transactionTime: data.transactionTime,
        fromAccount: data.fromAccount,
        toAccount: data.toAccount,
      },
    });

    return booking;
  }

  async getMyBookings(userId: string) {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!studentProfile) {
      throw new Error('Student profile not found');
    }

    return prisma.booking.findMany({
      where: { studentId: studentProfile.id },
      include: {
        hostel: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHostelBookings(userId: string, hostelId: string) {
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

    return prisma.booking.findMany({
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

  async approveBooking(userId: string, bookingId: string) {
    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId },
    });

    if (!managerProfile) {
      throw new Error('Manager profile not found');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { hostel: true, student: true },
    });

    if (!booking || booking.hostel.managerId !== managerProfile.id) {
      throw new Error('Booking not found or not authorized');
    }

    if (booking.status !== 'PENDING') {
      throw new Error('Booking already reviewed');
    }

    if (booking.hostel.availableRooms <= 0) {
      throw new Error('No rooms available');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'APPROVED' },
      });

      await tx.hostel.update({
        where: { id: booking.hostelId },
        data: {
          availableRooms: {
            decrement: 1,
          },
        },
      });

      await tx.studentProfile.update({
        where: { id: booking.studentId },
        data: { currentHostelId: booking.hostelId },
      });

      await tx.auditLog.create({
        data: {
          action: 'BOOKING_APPROVED',
          performedBy: userId,
          targetType: 'Booking',
          targetId: bookingId,
        },
      });

      return updatedBooking;
    });

    return result;
  }

  async disapproveBooking(userId: string, bookingId: string, data: DisapproveBookingInput) {
    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId },
    });

    if (!managerProfile) {
      throw new Error('Manager profile not found');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { hostel: true },
    });

    if (!booking || booking.hostel.managerId !== managerProfile.id) {
      throw new Error('Booking not found or not authorized');
    }

    if (booking.status !== 'PENDING') {
      throw new Error('Booking already reviewed');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'REFUNDED',
          refundImage: data.refundImage,
          refundDate: data.refundDate,
          refundTime: data.refundTime,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'BOOKING_DISAPPROVED_REFUNDED',
          performedBy: userId,
          targetType: 'Booking',
          targetId: bookingId,
        },
      });

      return updatedBooking;
    });

    return result;
  }

  async leaveHostel(userId: string, data: LeaveHostelInput) {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!studentProfile) {
      throw new Error('Student profile not found');
    }

    if (!studentProfile.currentHostelId) {
      throw new Error('You are not in any hostel');
    }

    const activeBooking = await prisma.booking.findFirst({
      where: {
        studentId: studentProfile.id,
        hostelId: studentProfile.currentHostelId,
        status: 'APPROVED',
      },
    });

    if (!activeBooking) {
      throw new Error('No active booking found');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: activeBooking.id },
        data: { status: 'LEFT' },
      });

      await tx.review.create({
        data: {
          bookingId: activeBooking.id,
          hostelId: activeBooking.hostelId,
          rating: data.rating,
          comment: data.review,
        },
      });

      const hostel = await tx.hostel.findUnique({
        where: { id: activeBooking.hostelId },
      });

      if (hostel) {
        const newReviewCount = hostel.reviewCount + 1;
        const newAverageRating =
          (hostel.averageRating * hostel.reviewCount + data.rating) / newReviewCount;

        await tx.hostel.update({
          where: { id: activeBooking.hostelId },
          data: {
            availableRooms: {
              increment: 1,
            },
            reviewCount: newReviewCount,
            averageRating: newAverageRating,
          },
        });
      }

      await tx.studentProfile.update({
        where: { id: studentProfile.id },
        data: { currentHostelId: null },
      });

      await tx.auditLog.create({
        data: {
          action: 'STUDENT_LEFT_HOSTEL',
          performedBy: userId,
          targetType: 'Booking',
          targetId: activeBooking.id,
        },
      });

      return updatedBooking;
    });

    return result;
  }

  async kickStudent(userId: string, bookingId: string, data: KickStudentInput) {
    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId },
    });

    if (!managerProfile) {
      throw new Error('Manager profile not found');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { hostel: true, student: true },
    });

    if (!booking || booking.hostel.managerId !== managerProfile.id) {
      throw new Error('Booking not found or not authorized');
    }

    if (booking.status !== 'APPROVED') {
      throw new Error('Can only kick students with approved bookings');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'LEFT',
          kickReason: data.reason,
          kickByManagerId: managerProfile.id,
        },
      });

      await tx.hostel.update({
        where: { id: booking.hostelId },
        data: {
          availableRooms: {
            increment: 1,
          },
        },
      });

      await tx.studentProfile.update({
        where: { id: booking.studentId },
        data: { currentHostelId: null },
      });

      await tx.auditLog.create({
        data: {
          action: `STUDENT_KICKED_${data.reason}`,
          performedBy: userId,
          targetType: 'Booking',
          targetId: bookingId,
          details: `Student kicked from hostel. Reason: ${data.reason}`,
        },
      });

      return updatedBooking;
    });

    return result;
  }

  async getAllBookings(status?: string) {
    const where = status ? { status: status as any } : {};

    return prisma.booking.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
        hostel: {
          include: {
            manager: {
              include: {
                user: {
                  select: { email: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBookingById(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
        hostel: {
          include: {
            manager: {
              include: {
                user: {
                  select: { email: true },
                },
              },
            },
          },
        },
        review: true,
        reports: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    return booking;
  }
}