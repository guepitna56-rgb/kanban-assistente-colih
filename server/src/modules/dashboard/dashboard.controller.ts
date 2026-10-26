import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const metrics = await DashboardService.getMetrics(workspaceId, req.user!.id);
      res.status(200).json({
        status: 'success',
        data: { metrics },
      });
    } catch (error) {
      next(error);
    }
  }
}
