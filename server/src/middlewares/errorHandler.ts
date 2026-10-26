import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode = 400, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Erro do Zod (validação de dados de entrada)
  if (err instanceof ZodError) {
    const issues = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(422).json({
      status: 'error',
      message: 'Dados de entrada inválidos.',
      code: 'VALIDATION_ERROR',
      details: issues,
    });
    return;
  }

  // Erro operacional da aplicação
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      code: 'APP_ERROR',
      details: err.details,
    });
    return;
  }

  // Erro do Prisma ORM
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        status: 'error',
        message: 'Já existe um registro com os dados informados.',
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        status: 'error',
        message: 'Registro solicitado não foi encontrado.',
        code: 'NOT_FOUND',
      });
      return;
    }
  }

  console.error('Erro não tratado:', err);

  res.status(500).json({
    status: 'error',
    message: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
    code: 'INTERNAL_SERVER_ERROR',
  });
}
