import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  path: '/',
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await AuthService.register(req.body);
      res.cookie('token', token, COOKIE_OPTIONS);
      res.status(201).json({
        status: 'success',
        message: 'Conta criada com sucesso.',
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await AuthService.login(req.body);
      res.cookie('token', token, COOKIE_OPTIONS);
      res.status(200).json({
        status: 'success',
        message: 'Login realizado com sucesso.',
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie('token', { path: '/' });
      res.status(200).json({
        status: 'success',
        message: 'Logout realizado com sucesso.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await AuthService.getMe(userId);
      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const updatedUser = await AuthService.updateProfile(userId, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Perfil atualizado com sucesso.',
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await AuthService.changePassword(
        userId,
        req.body.currentPassword,
        req.body.newPassword
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
