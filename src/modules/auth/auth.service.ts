import { prisma } from '../../config/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';
import { RegisterInput, LoginInput, CreateSubAdminInput } from './auth.schema';
import { Role } from '@prisma/client';

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const passwordHash = await hashPassword(data.password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: data.role as Role,
        },
      });

      if (data.role === 'STUDENT') {
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            // Make sure your StudentProfile model has a `fullName` field
            fullName: data.fullName?.trim() || undefined,
          },
        });
      } else if (data.role === 'MANAGER') {
        await tx.managerProfile.create({
          data: { userId: user.id },
        });
      }

      return user;
    });

    const token = generateToken({
      userId: result.id,
      email: result.email,
      role: result.role,
    });

    return {
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
      },
      token,
    };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.isTerminated) {
      throw new Error('Account is terminated');
    }

    const isValidPassword = await comparePassword(data.password, user.passwordHash);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async createSubAdmin(data: CreateSubAdminInput, adminId: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const passwordHash = await hashPassword(data.password);

    const subAdmin = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: 'SUBADMIN',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE_SUBADMIN',
        performedBy: adminId,
        targetType: 'User',
        targetId: subAdmin.id,
      },
    });

    return {
      id: subAdmin.id,
      email: subAdmin.email,
      role: subAdmin.role,
    };
  }

  async deleteSubAdmin(subAdminId: string, adminId: string) {
    const subAdmin = await prisma.user.findUnique({
      where: { id: subAdminId },
    });

    if (!subAdmin || subAdmin.role !== 'SUBADMIN') {
      throw new Error('Sub-admin not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.delete({
        where: { id: subAdminId },
      });

      await tx.auditLog.create({
        data: {
          action: 'DELETE_SUBADMIN',
          performedBy: adminId,
          targetType: 'User',
          targetId: subAdminId,
        },
      });
    });

    return { message: 'Sub-admin deleted successfully' };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        managerProfile: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isTerminated: user.isTerminated,
      studentProfile: user.studentProfile,
      managerProfile: user.managerProfile,
    };
  }
}