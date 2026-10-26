import { prisma } from '../../config/prisma.js';

export interface CreateAuditLogParams {
  workspaceId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
}

export class AuditService {
  static async log(params: CreateAuditLogParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          workspaceId: params.workspaceId,
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          detailsJson: params.details ? JSON.stringify(params.details) : null,
        },
      });
    } catch (error) {
      console.error('Falha ao registrar log de auditoria:', error);
      // Não propagamos o erro para não interromper a operação principal de negócio
    }
  }

  static async listByWorkspace(workspaceId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
