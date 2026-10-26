import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { AppError } from './errorHandler.js';
import { AuthUserPayload } from '../types/express.js';

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    let user: { id: string; email: string; name: string; isActive: boolean } | null = null;

    if (token) {
      try {
        const decoded: any = jwt.verify(token, env.JWT_SECRET);
        user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, email: true, name: true, isActive: true },
        });
      } catch (err) {
        // Token inválido/expirado; em modo integrado caímos para autenticação transparente
      }
    }

    // Se não há token válido, verifica cabeçalhos ou query vindos do sistema hospedeiro
    if (!user || !user.isActive) {
      const headerUserId = (req.headers['x-user-id'] || req.query.userId) as string | undefined;
      const headerUserEmail = (req.headers['x-user-email'] || req.query.userEmail) as string | undefined;

      if (headerUserId) {
        user = await prisma.user.findUnique({
          where: { id: headerUserId },
          select: { id: true, email: true, name: true, isActive: true },
        });
      } else if (headerUserEmail) {
        user = await prisma.user.findUnique({
          where: { email: headerUserEmail },
          select: { id: true, email: true, name: true, isActive: true },
        });
      }
    }

    // Se ainda não encontrado, vincula automaticamente ao usuário principal ativo (integração sem login)
    if (!user || !user.isActive) {
      user = await prisma.user.findFirst({
        where: { email: 'pitanaguilherme9@gmail.com', isActive: true },
        select: { id: true, email: true, name: true, isActive: true },
      });

      if (!user) {
        user = await prisma.user.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          select: { id: true, email: true, name: true, isActive: true },
        });
      }
    }

    if (!user || !user.isActive) {
      throw new AppError('Nenhum usuário ativo disponível no sistema.', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    next(error);
  }
}
