import { prisma } from '../../config/prisma';
import { StartConversationInput, SendMessageInput } from './chat.schema';

export class ChatService {
  async startConversation(userId: string, data: StartConversationInput) {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!studentProfile) {
      throw new Error('Student profile not found');
    }

    const managerProfile = await prisma.managerProfile.findUnique({
      where: { id: data.managerId },
    });

    if (!managerProfile) {
      throw new Error('Manager not found');
    }

    const existingConversation = await prisma.conversation.findUnique({
      where: {
        studentId_managerId: {
          studentId: studentProfile.id,
          managerId: data.managerId,
        },
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    const conversation = await prisma.conversation.create({
      data: {
        studentId: studentProfile.id,
        managerId: data.managerId,
      },
    });

    return conversation;
  }

  async sendMessage(userId: string, data: SendMessageInput) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: data.conversationId },
      include: {
        student: true,
        manager: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const isStudent = conversation.student.userId === userId;
    const isManager = conversation.manager.userId === userId;

    if (!isStudent && !isManager) {
      throw new Error('Not authorized to send messages in this conversation');
    }

    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: userId,
        text: data.text,
      },
    });

    return message;
  }

  async getMyConversations(userId: string, role: string) {
    if (role === 'STUDENT') {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId },
      });

      if (!studentProfile) {
        throw new Error('Student profile not found');
      }

      return prisma.conversation.findMany({
        where: { studentId: studentProfile.id },
        include: {
          manager: {
            include: {
              user: {
                select: { email: true },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } else if (role === 'MANAGER') {
      const managerProfile = await prisma.managerProfile.findUnique({
        where: { userId },
      });

      if (!managerProfile) {
        throw new Error('Manager profile not found');
      }

      return prisma.conversation.findMany({
        where: { managerId: managerProfile.id },
        include: {
          student: {
            include: {
              user: {
                select: { email: true },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    throw new Error('Invalid role');
  }

  async getConversationMessages(userId: string, conversationId: string, role: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        student: true,
        manager: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const isStudent = conversation.student.userId === userId;
    const isManager = conversation.manager.userId === userId;
    const isAdmin = role === 'ADMIN' || role === 'SUBADMIN';

    if (!isStudent && !isManager && !isAdmin) {
      throw new Error('Not authorized to view this conversation');
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { email: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  }

  async getAllConversations() {
    return prisma.conversation.findMany({
      include: {
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
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}