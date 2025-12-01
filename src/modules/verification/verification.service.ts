import { prisma } from '../../config/prisma';
import { SubmitVerificationInput, ReviewVerificationInput } from './verification.schema';

export class VerificationService {
  async submitVerification(userId: string, data: SubmitVerificationInput) {
    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId },
    });

    if (!managerProfile) {
      throw new Error('Manager profile not found');
    }

    if (managerProfile.verified) {
      throw new Error('Already verified');
    }

    const existingPending = await prisma.managerVerification.findFirst({
      where: {
        managerId: managerProfile.id,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      throw new Error('Verification already pending');
    }

    const verification = await prisma.managerVerification.create({
      data: {
        managerId: managerProfile.id,
        initialHostelNames: data.initialHostelNames,
        ownerName: data.ownerName,
        city: data.city,
        address: data.address,
        buildingImages: data.buildingImages,
        hostelFor: data.hostelFor,
        easypaisaNumber: data.easypaisaNumber,
        jazzcashNumber: data.jazzcashNumber,
        customBanks: data.customBanks,
        acceptedRules: data.acceptedRules,
      },
    });

    return verification;
  }

  async getMyVerifications(userId: string) {
    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId },
    });

    if (!managerProfile) {
      throw new Error('Manager profile not found');
    }

    return prisma.managerVerification.findMany({
      where: { managerId: managerProfile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllVerifications(status?: string) {
    const where = status ? { status: status as any } : {};
    
    return prisma.managerVerification.findMany({
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVerificationById(id: string) {
    const verification = await prisma.managerVerification.findUnique({
      where: { id },
      include: {
        manager: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    if (!verification) {
      throw new Error('Verification not found');
    }

    return verification;
  }

  async reviewVerification(id: string, reviewerId: string, data: ReviewVerificationInput) {
    const verification = await prisma.managerVerification.findUnique({
      where: { id },
      include: { manager: true },
    });

    if (!verification) {
      throw new Error('Verification not found');
    }

    if (verification.status !== 'PENDING') {
      throw new Error('Verification already reviewed');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.managerVerification.update({
        where: { id },
        data: {
          status: data.status,
          adminComment: data.adminComment,
          reviewedBy: reviewerId,
        },
      });

      if (data.status === 'APPROVED') {
        await tx.managerProfile.update({
          where: { id: verification.managerId },
          data: { verified: true },
        });
      }

      await tx.auditLog.create({
        data: {
          action: `VERIFICATION_${data.status}`,
          performedBy: reviewerId,
          targetType: 'ManagerVerification',
          targetId: id,
          details: data.adminComment,
        },
      });

      return updated;
    });

    return result;
  }
}