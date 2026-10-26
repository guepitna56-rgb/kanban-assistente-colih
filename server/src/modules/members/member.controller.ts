import { Request, Response, NextFunction } from 'express';
import { MemberService } from './member.service.js';

export class MemberController {
  static async listMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const members = await MemberService.listMembers(workspaceId);
      res.status(200).json({
        status: 'success',
        data: { members },
      });
    } catch (error) {
      next(error);
    }
  }

  static async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const callerUserId = req.user!.id;
      const member = await MemberService.addMember(workspaceId, callerUserId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Membro adicionado com sucesso.',
        data: { member },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMember(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const memberId = req.params.memberId;
      const callerUserId = req.user!.id;
      const callerRole = req.workspaceContext!.role;
      const member = await MemberService.updateMember(
        workspaceId,
        memberId,
        callerUserId,
        callerRole,
        req.body
      );
      res.status(200).json({
        status: 'success',
        message: 'Dados do membro atualizados com sucesso.',
        data: { member },
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const memberId = req.params.memberId;
      const callerUserId = req.user!.id;
      const callerRole = req.workspaceContext!.role;
      const result = await MemberService.removeMember(
        workspaceId,
        memberId,
        callerUserId,
        callerRole
      );
      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
