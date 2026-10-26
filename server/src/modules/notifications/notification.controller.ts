import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service.js';

export class NotificationController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const workspaceId = req.query.workspaceId as string | undefined;
      const notifications = await NotificationService.listUserNotifications(userId, workspaceId);
      res.status(200).json({
        status: 'success',
        data: { notifications },
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const notificationId = req.params.id;
      await NotificationService.markAsRead(notificationId, userId);
      res.status(200).json({
        status: 'success',
        message: 'Notificação marcada como lida.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const workspaceId = req.query.workspaceId as string | undefined;
      await NotificationService.markAllAsRead(userId, workspaceId);
      res.status(200).json({
        status: 'success',
        message: 'Todas as notificações foram marcadas como lidas.',
      });
    } catch (error) {
      next(error);
    }
  }
}
