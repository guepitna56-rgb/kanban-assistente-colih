import { google } from 'googleapis';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class CalendarService {
  private static getOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/calendar/callback';

    if (!clientId || !clientSecret) {
      throw new AppError(
        'Credenciais do Google Calendar (GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET) não configuradas no ambiente.',
        500
      );
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  /**
   * Gera URL de autorização OAuth 2.0 do Google
   */
  static getAuthUrl(userId: string): string {
    const oauth2Client = this.getOAuth2Client();

    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: userId, // Passa o ID do usuário como state seguro
    });
  }

  /**
   * Processa o callback com o código de autorização do Google
   */
  static async handleCallback(code: string, userId: string) {
    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Obtém o e-mail da conta Google conectada
    let googleEmail: string | null = null;
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      googleEmail = userInfo.data.email || null;
    } catch (err) {
      console.warn('Não foi possível obter e-mail do usuário Google:', err);
    }

    // Salva o refreshToken e status no banco de dados
    const updateData: any = {
      googleCalendarConnected: true,
      googleEmail,
    };

    if (tokens.refresh_token) {
      updateData.googleRefreshToken = tokens.refresh_token;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        googleCalendarConnected: true,
        googleEmail: true,
      },
    });

    return updatedUser;
  }

  /**
   * Desconecta o Google Calendar do usuário
   */
  static async disconnect(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new AppError('Usuário não encontrado.', 404);

    if (user.googleRefreshToken) {
      try {
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
        await oauth2Client.revokeCredentials();
      } catch (err) {
        console.warn('Falha ao revogar token no Google (pode já estar expirado):', err);
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleCalendarConnected: false,
        googleRefreshToken: null,
        googleEmail: null,
      },
    });

    return { message: 'Google Calendar desconectado com sucesso.' };
  }

  /**
   * Obtém status de conexão do calendário do usuário
   */
  static async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        googleCalendarConnected: true,
        googleEmail: true,
      },
    });

    if (!user) throw new AppError('Usuário não encontrado.', 404);

    const isConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

    return {
      connected: !!user.googleCalendarConnected,
      email: user.googleEmail,
      isConfigured,
    };
  }

  /**
   * Obtém cliente autenticado para um usuário específico
   */
  private static async getCalendarClientForUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleCalendarConnected: true,
        googleRefreshToken: true,
      },
    });

    if (!user || !user.googleCalendarConnected || !user.googleRefreshToken) {
      return null;
    }

    try {
      const oauth2Client = this.getOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
      return google.calendar({ version: 'v3', auth: oauth2Client });
    } catch (err) {
      console.error(`Erro ao instanciar cliente Google Calendar para usuário ${userId}:`, err);
      return null;
    }
  }

  /**
   * Sincroniza um cartão (Visita) com a agenda do facilitador responsável
   */
  static async syncVisitCard(cardId: string) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        assignedMember: { include: { user: true } },
        hospital: true,
        doctor: true,
        checklistItems: { orderBy: { position: 'asc' } },
        list: { include: { board: true } },
      },
    });

    if (!card) return null;

    // Se não há facilitador ou não há prazo de visita, não sincroniza
    const assigneeUserId = card.assignedMember?.userId;
    if (!assigneeUserId || !card.dueDate) {
      // Se havia um evento anterior e foi retirado o prazo ou membro, removemos da agenda
      if (card.googleEventId && assigneeUserId) {
        await this.deleteCardEvent(card.id, assigneeUserId, card.googleEventId);
      }
      return null;
    }

    const calendar = await this.getCalendarClientForUser(assigneeUserId);
    if (!calendar) {
      // Usuário não conectou o Google Calendar
      return null;
    }

    // Monta dados do evento
    const dueDate = new Date(card.dueDate);
    const dateStr = dueDate.toISOString().split('T')[0];

    const doctorName = card.doctor?.name || '';
    const doctorSpecialty = card.doctor?.specialty || '';
    const hospitalName = card.hospital?.name || '';
    const hospitalCity = card.hospital?.city ? `(${card.hospital.city}/${card.hospital.state || ''})` : '';

    const checklistText =
      card.checklistItems && card.checklistItems.length > 0
        ? card.checklistItems
            .map((it, idx) => `${it.isDone ? ' [X] ' : ' [ ] '} ${idx + 1}. ${it.title}`)
            .join('\n')
        : ' 1. Agendar visita\n 2. Realizar visita presencial\n 3. Recolher HLC-31\n 4. Enviar e-mail formal PBM';

    const eventPayload: any = {
      summary: `Visita COLIH: Dr(a). ${doctorName || card.title} ${doctorSpecialty ? `(${doctorSpecialty})` : ''}`,
      location: hospitalName ? `${hospitalName} ${hospitalCity}`.trim() : undefined,
      description: [
        '🏥 VISITA PROTOCOLAR COLIH',
        doctorName ? `Médico: Dr(a). ${doctorName}` : '',
        card.doctor?.crm ? `CRM: ${card.doctor.crm} (${card.doctor.crmState || ''})` : '',
        doctorSpecialty ? `Especialidade: ${doctorSpecialty}` : '',
        hospitalName ? `Hospital: ${hospitalName} ${hospitalCity}` : '',
        '',
        '📋 Protocolo de 4 Etapas:',
        checklistText,
        '',
        card.description ? `Notas / Instruções:\n${card.description}` : '',
        '',
        `Quadro: ${card.list.board.title} | Lista: ${card.list.title}`,
        'Sistema de Gestão COLIH',
      ]
        .filter(Boolean)
        .join('\n'),
      start: {
        date: dateStr, // Evento de dia inteiro ou específico
      },
      end: {
        date: dateStr,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 1440 }, // 24 horas antes
          { method: 'popup', minutes: 120 }, // 2 horas antes
        ],
      },
    };

    try {
      if (card.googleEventId) {
        // Tenta atualizar o evento existente
        try {
          const res = await calendar.events.patch({
            calendarId: 'primary',
            eventId: card.googleEventId,
            requestBody: eventPayload,
          });
          return res.data;
        } catch (err: any) {
          // Se o evento foi deletado no Google, cria um novo
          if (err.code === 404) {
            const res = await calendar.events.insert({
              calendarId: 'primary',
              requestBody: eventPayload,
            });
            await prisma.card.update({
              where: { id: card.id },
              data: { googleEventId: res.data.id },
            });
            return res.data;
          }
          throw err;
        }
      } else {
        // Cria um novo evento no Google Agenda
        const res = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventPayload,
        });

        await prisma.card.update({
          where: { id: card.id },
          data: { googleEventId: res.data.id },
        });

        return res.data;
      }
    } catch (err) {
      console.error(`Erro ao sincronizar evento do Google Calendar para o cartão ${card.id}:`, err);
      return null;
    }
  }

  /**
   * Remove evento do Google Calendar se o card for deletado ou desassociado
   */
  static async deleteCardEvent(cardId: string, userId: string, eventId: string) {
    try {
      const calendar = await this.getCalendarClientForUser(userId);
      if (!calendar) return;

      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });

      const card = await prisma.card.findUnique({ where: { id: cardId } });
      if (card) {
        await prisma.card.update({
          where: { id: cardId },
          data: { googleEventId: null },
        });
      }
    } catch (err) {
      console.warn(`Erro ao excluir evento ${eventId} do Google Calendar:`, err);
    }
  }
}
