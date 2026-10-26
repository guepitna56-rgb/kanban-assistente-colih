import { Request, Response, NextFunction } from 'express';
import { CalendarService } from './calendar.service.js';

export class CalendarController {
  /**
   * Obtém a URL para o usuário conectar com o Google Calendar
   */
  static async getConnectUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const url = CalendarService.getAuthUrl(userId);
      res.status(200).json({
        status: 'success',
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint de Callback chamado pelo Google OAuth
   */
  static async handleCallback(req: Request, res: Response, next: NextFunction) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${frontendUrl}/profile?calendar=error&message=${encodeURIComponent(String(error))}`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/profile?calendar=error&message=Parametros_invalidos`);
    }

    try {
      const userId = String(state);
      await CalendarService.handleCallback(String(code), userId);
      return res.redirect(`${frontendUrl}/profile?calendar=connected`);
    } catch (err: any) {
      console.error('Erro no callback do Google Calendar:', err);
      return res.redirect(
        `${frontendUrl}/profile?calendar=error&message=${encodeURIComponent(err.message || 'Falha_na_autenticacao')}`
      );
    }
  }

  /**
   * Obtém status de conexão do Google Agenda do usuário logado
   */
  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const status = await CalendarService.getStatus(userId);
      res.status(200).json({
        status: 'success',
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Desconecta o Google Calendar
   */
  static async disconnect(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await CalendarService.disconnect(userId);
      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sincroniza manualmente um cartão de visita específico
   */
  static async syncCard(req: Request, res: Response, next: NextFunction) {
    try {
      const cardId = req.params.cardId;
      const event = await CalendarService.syncVisitCard(cardId);
      res.status(200).json({
        status: 'success',
        message: event ? 'Visita sincronizada com o Google Agenda.' : 'Não sincronizado (verifique se o facilitador possui o Google Agenda conectado e prazo definido).',
        data: { event },
      });
    } catch (error) {
      next(error);
    }
  }
}
