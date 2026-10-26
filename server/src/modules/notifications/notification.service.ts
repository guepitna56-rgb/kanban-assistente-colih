import { prisma } from '../../config/prisma.js';

export interface CreateNotificationParams {
  workspaceId: string;
  recipientUserId: string;
  title: string;
  message: string;
  link?: string;
}

export class NotificationService {
  static async create(params: CreateNotificationParams) {
    try {
      return await prisma.notification.create({
        data: {
          workspaceId: params.workspaceId,
          recipientUserId: params.recipientUserId,
          title: params.title,
          message: params.message,
          link: params.link,
        },
      });
    } catch (error) {
      console.error('Falha ao criar notificação:', error);
    }
  }

  static async notifyWorkspaceMembers(
    workspaceId: string,
    excludeUserId: string,
    title: string,
    message: string,
    link?: string
  ) {
    try {
      const members = await prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          userId: { not: excludeUserId },
        },
        select: { userId: true },
      });

      if (members.length === 0) return;

      const notificationsData = members.map((m) => ({
        workspaceId,
        recipientUserId: m.userId,
        title,
        message,
        link,
      }));

      await prisma.notification.createMany({
        data: notificationsData,
      });
    } catch (error) {
      console.error('Falha ao notificar membros do workspace:', error);
    }
  }

  static async listUserNotifications(userId: string, workspaceId?: string) {
    return prisma.notification.findMany({
      where: {
        recipientUserId: userId,
        ...(workspaceId ? { workspaceId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientUserId: userId,
      },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string, workspaceId?: string) {
    return prisma.notification.updateMany({
      where: {
        recipientUserId: userId,
        isRead: false,
        ...(workspaceId ? { workspaceId } : {}),
      },
      data: { isRead: true },
    });
  }
}
