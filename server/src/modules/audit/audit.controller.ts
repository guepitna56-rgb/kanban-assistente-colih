import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service.js';

export class AuditController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const logs = await AuditService.listByWorkspace(workspaceId);
      res.status(200).json({
        status: 'success',
        data: { logs },
      });
    } catch (error) {
      next(error);
    }
  }
}
