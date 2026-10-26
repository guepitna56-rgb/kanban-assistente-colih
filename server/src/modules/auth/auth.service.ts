import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { WorkspaceService } from '../workspaces/workspace.service.js';

export class AuthService {
  static async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    congregation?: string;
    roleInterest?: string;
    workspaceId?: string;
    newWorkspace?: { name: string; city: string; state: string; description?: string };
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new AppError('Este endereço de e-mail já está cadastrado no sistema.', 409);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    let assignedWorkspaceId: string | undefined = undefined;

    // Se solicitou criar uma nova comissão
    if (data.newWorkspace && data.newWorkspace.name) {
      const createdWs = await WorkspaceService.create(user.id, {
        name: data.newWorkspace.name,
        city: data.newWorkspace.city,
        state: data.newWorkspace.state,
        description: data.newWorkspace.description,
      });
      assignedWorkspaceId = createdWs.id;
    } else if (data.workspaceId) {
      // Se selecionou uma comissão existente
      const ws = await prisma.workspace.findUnique({ where: { id: data.workspaceId } });
      if (ws) {
        await prisma.workspaceMember.create({
          data: {
            workspaceId: ws.id,
            userId: user.id,
            role: 'MEMBER',
            title: data.roleInterest || 'Facilitador de Visitas Hospitalares',
          },
        });
        assignedWorkspaceId = ws.id;
      }
    } else {
      // Se não especificou mas existe ao menos uma comissão no sistema, vincula
      const defaultWs = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });
      if (defaultWs) {
        await prisma.workspaceMember.create({
          data: {
            workspaceId: defaultWs.id,
            userId: user.id,
            role: 'MEMBER',
            title: data.roleInterest || 'Facilitador de Visitas Hospitalares',
          },
        });
        assignedWorkspaceId = defaultWs.id;
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user, token, workspaceId: assignedWorkspaceId };
  }

  static async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Credenciais incorretas. Verifique seu e-mail e senha.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Esta conta de usuário foi desativada.', 403);
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Credenciais incorretas. Verifique seu e-mail e senha.', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };

    return { user: safeUser, token };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return user;
  }

  static async updateProfile(userId: string, data: { name?: string; phone?: string; avatarUrl?: string | null }) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return updated;
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('A senha atual fornecida está incorreta.', 400);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Senha alterada com sucesso.' };
  }
}
