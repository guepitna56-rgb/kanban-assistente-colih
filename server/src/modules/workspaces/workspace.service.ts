import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { AuditService } from '../audit/audit.service.js';

export class WorkspaceService {
  static async listPublicWorkspaces() {
    const workspaces = await prisma.workspace.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        description: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      city: w.city,
      state: w.state,
      description: w.description,
      memberCount: w._count.members,
    }));
  }

  static async joinWorkspace(userId: string, workspaceId: string, roleTitle?: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new AppError('Comissão/Workspace não encontrado.', 404);
    }

    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role: 'MEMBER',
        title: roleTitle || 'Facilitador de Visitas Hospitalares',
      },
    });

    return member;
  }

  static async listUserWorkspaces(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            owner: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: {
                members: true,
                hospitals: true,
                doctors: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      userRole: m.role,
      userTitle: m.title,
    }));
  }

  static async getById(workspaceId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            members: true,
            hospitals: true,
            doctors: true,
            boards: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new AppError('Comissão/Workspace não encontrado.', 404);
    }

    return workspace;
  }

  static async create(
    userId: string,
    data: { name: string; description?: string; city: string; state: string }
  ) {
    const workspace = await prisma.$transaction(async (tx) => {
      const created = await tx.workspace.create({
        data: {
          name: data.name,
          description: data.description || null,
          city: data.city,
          state: data.state.toUpperCase(),
          ownerId: userId,
        },
      });

      // Cria automaticamente a membresia com OWNER
      await tx.workspaceMember.create({
        data: {
          workspaceId: created.id,
          userId,
          role: 'OWNER',
          title: 'Coordenador / Proprietário',
        },
      });

      // Cria automaticamente o Quadro Kanban COLIH Oficial com as 6 etapas do fluxo
      const defaultBoard = await tx.board.create({
        data: {
          workspaceId: created.id,
          title: 'Quadro Operacional COLIH',
          description: 'Fluxo oficial de visitas médicas, protocolos HLC e projetos hospitalares',
        },
      });

      const canonicalColumns = [
        'Agendamento & Triagem',
        'Visitas Encaminhadas',
        'HLC-31 & Protocolos',
        'Envio de E-mail HLC-37',
        'Facilitadores & Redes',
        'Projetos Hospitalares',
      ];

      for (let i = 0; i < canonicalColumns.length; i++) {
        await tx.boardList.create({
          data: {
            boardId: defaultBoard.id,
            title: canonicalColumns[i],
            position: i,
          },
        });
      }

      return created;
    });

    await AuditService.log({
      workspaceId: workspace.id,
      userId,
      action: 'WORKSPACE_CRIADO',
      entityType: 'Workspace',
      entityId: workspace.id,
      details: { name: workspace.name, city: workspace.city, state: workspace.state },
    });

    return workspace;
  }

  static async update(
    workspaceId: string,
    userId: string,
    data: { name?: string; description?: string | null; city?: string; state?: string }
  ) {
    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.city ? { city: data.city } : {}),
        ...(data.state ? { state: data.state.toUpperCase() } : {}),
      },
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'WORKSPACE_ATUALIZADO',
      entityType: 'Workspace',
      entityId: workspaceId,
      details: data,
    });

    return updated;
  }

  static async delete(workspaceId: string, userId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new AppError('Workspace não encontrado.', 404);
    }

    if (workspace.ownerId !== userId) {
      throw new AppError('Apenas o proprietário (OWNER) pode excluir o workspace.', 403);
    }

    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return { message: 'Workspace excluído com sucesso.' };
  }
}
