import { prisma } from '../../config/prisma';
import { CreateReportInput, ResolveReportInput } from './reports.schema';

export class ReportsService {
  async createReport(userId: string, data: CreateReportInput) {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!studentProfile) {
      throw new Error('Student profile not found');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        hostel: {
          include: { manager: true },
        },
      },
    });

    if (!booking || booking.studentId !== studentProfile.id) {
      throw new Error('Booking not found or not authorized');
    }

    const existingReport = await prisma.report.findFirst({
      where: {
        bookingId: data.bookingId,
        status: 'OPEN',
      },
    });

    if (existingReport) {
      throw new Error('An open report already exists for this booking');
    }

    const report = await prisma.report.create({
      data: {
        bookingId: data.bookingId,
        studentId: studentProfile.id,
        managerId: booking.hostel.manager.id,
        description: data.description,
      },
    });

    return report;
  }

  async getMyReports(userId: string) {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!studentProfile) {
      throw new Error('Student profile not found');
    }

    return prisma.report.findMany({
      where: { studentId: studentProfile.id },
      include: {
        booking: {
          include: { hostel: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getManagerReports(userId: string) {
    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId },
    });

    if (!managerProfile) {
      throw new Error('Manager profile not found');
    }

    return prisma.report.findMany({
      where: { managerId: managerProfile.id },
      include: {
        booking: {
          include: { hostel: true },
        },
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

  async getAllReports(status?: string) {
    const where = status ? { status: status as any } : {};

    return prisma.report.findMany({
      where,
      include: {
        booking: {
          include: {
            hostel: true,
          },
        },
        student: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
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

  async getReportById(reportId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        booking: {
          include: {
            hostel: true,
          },
        },
        student: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
        manager: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    return report;
  }

  async resolveReport(reportId: string, resolverId: string, data: ResolveReportInput) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        student: true,
        manager: true,
      },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    if (report.status !== 'OPEN') {
      throw new Error('Report already resolved');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedReport = await tx.report.update({
        where: { id: reportId },
        data: {
          status: 'RESOLVED',
          decision: data.decision,
          finalResolution: data.finalResolution,
          resolvedBy: resolverId,
        },
      });

      if (data.decision === 'STUDENT_FAULT') {
        await tx.user.update({
          where: { id: report.student.userId },
          data: { isTerminated: true },
        });

        await tx.auditLog.create({
          data: {
            action: 'STUDENT_TERMINATED_REPORT',
            performedBy: resolverId,
            targetType: 'User',
            targetId: report.student.userId,
            details: `Terminated due to report: ${data.finalResolution}`,
          },
        });
      } else if (data.decision === 'MANAGER_FAULT') {
        await tx.user.update({
          where: { id: report.manager.userId },
          data: { isTerminated: true },
        });

        await tx.auditLog.create({
          data: {
            action: 'MANAGER_TERMINATED_REPORT',
            performedBy: resolverId,
            targetType: 'User',
            targetId: report.manager.userId,
            details: `Terminated due to report: ${data.finalResolution}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: `REPORT_RESOLVED_${data.decision}`,
          performedBy: resolverId,
          targetType: 'Report',
          targetId: reportId,
          details: data.finalResolution,
        },
      });

      return updatedReport;
    });

    return result;
  }
}