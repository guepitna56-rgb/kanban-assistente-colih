import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { AppError } from './errorHandler.js';

export async function requireWorkspaceMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    const workspaceId = req.params.workspaceId;
    if (!workspaceId) {
      throw new AppError('Identificador do Workspace não informado na requisição.', 400);
    }

    let member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member) {
      const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (ws) {
        member = await prisma.workspaceMember.create({
          data: {
            workspaceId,
            userId,
            role: ws.ownerId === userId ? 'OWNER' : 'OWNER',
            title: ws.ownerId === userId ? 'Coordenador / Proprietário' : 'Membro Coordenador',
          },
        });
      } else {
        throw new AppError('Comissão/Workspace não encontrado.', 404);
      }
    }

    req.workspaceContext = {
      workspaceId,
      memberId: member.id,
      role: member.role as 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST',
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(allowedRoles: Array<'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Sem distinção de admin / super admin: acesso universal irrestrito ao Kanban
    next();
  };
}
