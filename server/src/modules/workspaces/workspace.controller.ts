import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from './workspace.service.js';

export class WorkspaceController {
  static async listPublicWorkspaces(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaces = await WorkspaceService.listPublicWorkspaces();
      res.status(200).json({
        status: 'success',
        data: { workspaces },
      });
    } catch (error) {
      next(error);
    }
  }

  static async joinWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const workspaceId = req.params.workspaceId;
      const { roleTitle } = req.body;
      const member = await WorkspaceService.joinWorkspace(userId, workspaceId, roleTitle);
      res.status(200).json({
        status: 'success',
        message: 'Você agora é membro desta comissão.',
        data: { member },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUserWorkspaces(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const workspaces = await WorkspaceService.listUserWorkspaces(userId);
      res.status(200).json({
        status: 'success',
        data: { workspaces },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const workspace = await WorkspaceService.getById(workspaceId);
      res.status(200).json({
        status: 'success',
        data: { workspace },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const workspace = await WorkspaceService.create(userId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Comissão/Workspace criado com sucesso.',
        data: { workspace },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const userId = req.user!.id;
      const workspace = await WorkspaceService.update(workspaceId, userId, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Dados do workspace atualizados com sucesso.',
        data: { workspace },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const userId = req.user!.id;
      const result = await WorkspaceService.delete(workspaceId, userId);
      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
