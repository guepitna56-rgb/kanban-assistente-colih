import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationService } from '../notifications/notification.service.js';

export class MemberService {
  static async listMembers(workspaceId: string) {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members;
  }

  static async addMember(
    workspaceId: string,
    callerUserId: string,
    data: {
      email: string;
      role: 'ADMIN' | 'MEMBER' | 'GUEST';
      title?: string;
      name?: string;
      phone?: string;
      congregation?: string;
      password?: string;
      isFacilitator?: boolean;
    }
  ) {
    let targetUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!targetUser) {
      // Se o usuário ainda não existe, cria a conta diretamente
      const userName = data.name?.trim() || data.email.split('@')[0];
      const rawPassword = data.password || 'Colih@2026';
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(rawPassword, salt);

      targetUser = await prisma.user.create({
        data: {
          name: userName,
          email: data.email,
          phone: data.phone?.trim() || null,
          passwordHash,
        },
      });
    } else {
      // Se já existe e foi fornecido telefone ou nome mais completo, atualiza
      if (data.phone && !targetUser.phone) {
        targetUser = await prisma.user.update({
          where: { id: targetUser.id },
          data: { phone: data.phone.trim() },
        });
      }
    }

    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      throw new AppError('Este irmão já é membro desta comissão/workspace.', 409);
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    // Definir título canônico de Facilitador ou função se aplicável
    let memberTitle = data.title?.trim() || null;
    if (data.isFacilitator && !memberTitle) {
      memberTitle = 'Facilitador de Visitas Hospitalares';
    } else if (!memberTitle && data.role === 'MEMBER') {
      memberTitle = 'Facilitador de Campo';
    }

    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role: data.role,
        title: memberTitle,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    });

    await AuditService.log({
      workspaceId,
      userId: callerUserId,
      action: 'MEMBRO_ADICIONADO',
      entityType: 'WorkspaceMember',
      entityId: newMember.id,
      details: { addedUserEmail: targetUser.email, role: data.role, title: memberTitle },
    });

    await NotificationService.create({
      workspaceId,
      recipientUserId: targetUser.id,
      title: 'Você foi adicionado à comissão COLIH',
      message: `Você agora faz parte do workspace "${workspace?.name}" como ${memberTitle || data.role}.`,
      link: `/workspaces/${workspaceId}/dashboard`,
    });

    return newMember;
  }

  static async updateMember(
    workspaceId: string,
    memberId: string,
    callerUserId: string,
    callerRole: string,
    data: {
      name?: string;
      phone?: string | null;
      role?: 'ADMIN' | 'MEMBER' | 'GUEST';
      title?: string | null;
    }
  ) {
    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
      include: { workspace: true, user: true },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new AppError('Membro não encontrado neste workspace.', 404);
    }

    if (member.role === 'OWNER' && data.role) {
      throw new AppError('A função do proprietário (OWNER) não pode ser rebaixada.', 400);
    }

    // Apenas OWNER pode promover a ADMIN ou alterar privilégios de outro ADMIN
    if (callerRole !== 'OWNER' && data.role && data.role !== member.role) {
      throw new AppError('Apenas o Coordenador Geral (OWNER) pode alterar papéis de acesso no sistema.', 403);
    }

    // Atualiza dados de usuário (Nome e Telefone) se fornecidos
    if (data.name || data.phone !== undefined) {
      await prisma.user.update({
        where: { id: member.userId },
        data: {
          ...(data.name ? { name: data.name.trim() } : {}),
          ...(data.phone !== undefined ? { phone: data.phone ? data.phone.trim() : null } : {}),
        },
      });
    }

    // Atualiza dados de membresia (Role e Title) se fornecidos
    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: {
        ...(data.role ? { role: data.role } : {}),
        ...(data.title !== undefined ? { title: data.title ? data.title.trim() : null } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    });

    await AuditService.log({
      workspaceId,
      userId: callerUserId,
      action: 'MEMBRO_ATUALIZADO',
      entityType: 'WorkspaceMember',
      entityId: memberId,
      details: {
        updatedUserId: member.userId,
        newRole: data.role || member.role,
        newTitle: data.title !== undefined ? data.title : member.title,
        newName: data.name,
      },
    });

    await NotificationService.create({
      workspaceId,
      recipientUserId: member.userId,
      title: 'Seu cadastro na comissão foi atualizado',
      message: `Suas informações no workspace "${member.workspace.name}" foram atualizadas.`,
      link: `/workspaces/${workspaceId}/members`,
    });

    return updated;
  }

  static async removeMember(
    workspaceId: string,
    memberId: string,
    callerUserId: string,
    callerRole: string
  ) {
    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new AppError('Membro não encontrado neste workspace.', 404);
    }

    if (member.role === 'OWNER') {
      throw new AppError('O proprietário (OWNER) não pode ser removido do workspace.', 400);
    }

    // Regra RBAC: ADMIN não pode remover outro ADMIN, apenas OWNER pode
    if (callerRole === 'ADMIN' && member.role === 'ADMIN' && member.userId !== callerUserId) {
      throw new AppError('Apenas o OWNER pode remover administradores.', 403);
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    await AuditService.log({
      workspaceId,
      userId: callerUserId,
      action: 'MEMBRO_REMOVIDO',
      entityType: 'WorkspaceMember',
      entityId: memberId,
      details: { removedUserId: member.userId },
    });

    return { message: 'Membro removido com sucesso.' };
  }
}
