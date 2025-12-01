import { prisma } from '../../config/prisma';
import { SelfVerifyInput, UpdateProfileInput } from './users.schema';

export class UsersService {
  async selfVerifyStudent(userId: string, data: SelfVerifyInput) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    if (profile.selfVerified) {
      throw new Error('Already verified');
    }

    const updated = await prisma.studentProfile.update({
      where: { userId },
      data: {
        ...data,
        selfVerified: true,
      },
    });

    return { verified: true, profile: updated };
  }

  async getStudentProfile(userId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { email: true, role: true, isTerminated: true },
        },
      },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    return profile;
  }

  async updateManagerProfile(userId: string, data: UpdateProfileInput) {
    const updated = await prisma.managerProfile.update({
      where: { userId },
      data,
    });

    return updated;
  }

  async getManagerProfile(userId: string) {
    const profile = await prisma.managerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { email: true, role: true, isTerminated: true },
        },
        hostels: true,
      },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    return profile;
  }

  async getAllUsers(role?: string) {
    const where = role ? { role: role as any } : {};
    
    return prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        isTerminated: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async terminateUser(userId: string, adminId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new Error('Cannot terminate admin');
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isTerminated: true },
      });

      await tx.auditLog.create({
        data: {
          action: 'TERMINATE_USER',
          performedBy: adminId,
          targetType: 'User',
          targetId: userId,
        },
      });
    });

    return { message: 'User terminated' };
  }
}