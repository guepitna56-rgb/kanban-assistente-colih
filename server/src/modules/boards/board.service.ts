import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { CalendarService } from '../calendar/calendar.service.js';

export class BoardService {
  // --- Quadros ---
  static async listBoards(workspaceId: string, userId?: string) {
    let boards = await prisma.board.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { lists: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (boards.length === 0) {
      // Auto-cria o Quadro Operacional COLIH oficial caso a comissão ainda não possua nenhum quadro
      const defaultBoard = await prisma.$transaction(async (tx) => {
        const b = await tx.board.create({
          data: {
            workspaceId,
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
              boardId: b.id,
              title: canonicalColumns[i],
              position: i,
            },
          });
        }

        return b;
      });

      if (userId) {
        await AuditService.log({
          workspaceId,
          userId,
          action: 'QUADRO_CRIADO',
          entityType: 'Board',
          entityId: defaultBoard.id,
          details: { title: defaultBoard.title, autoCreated: true },
        });
      }

      boards = [
        {
          ...defaultBoard,
          _count: { lists: 6 },
        },
      ];
    }

    return boards;
  }

  static async getBoardById(workspaceId: string, boardId: string) {
    const board = await prisma.board.findFirst({
      where: { id: boardId, workspaceId },
      include: {
        labels: {
          orderBy: { createdAt: 'asc' },
        },
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: {
                labels: true,
                checklistItems: { orderBy: { position: 'asc' } },
                attachments: true,
                assignedMember: {
                  include: {
                    user: {
                      select: { id: true, name: true, avatarUrl: true },
                    },
                  },
                },
                hospital: {
                  select: { id: true, name: true, city: true },
                },
                doctor: {
                  select: { id: true, name: true, specialty: true, crm: true, crmState: true },
                },
                _count: {
                  select: { comments: true, attachments: true },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new AppError('Quadro não encontrado neste workspace.', 404);
    }

    return board;
  }

  static async createBoard(
    workspaceId: string,
    userId: string,
    data: { title: string; description?: string | null; useColihTemplate?: boolean }
  ) {
    const board = await prisma.$transaction(async (tx) => {
      const created = await tx.board.create({
        data: {
          workspaceId,
          title: data.title,
          description: data.description || null,
        },
      });

      if (data.useColihTemplate) {
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
              boardId: created.id,
              title: canonicalColumns[i],
              position: i,
            },
          });
        }
      }

      return created;
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'QUADRO_CRIADO',
      entityType: 'Board',
      entityId: board.id,
      details: { title: board.title, template: data.useColihTemplate ? 'COLIH' : 'Livre' },
    });

    return board;
  }

  static async updateBoard(
    workspaceId: string,
    boardId: string,
    userId: string,
    data: { title?: string; description?: string | null }
  ) {
    const existing = await prisma.board.findFirst({
      where: { id: boardId, workspaceId },
    });

    if (!existing) {
      throw new AppError('Quadro não encontrado neste workspace.', 404);
    }

    const updated = await prisma.board.update({
      where: { id: boardId },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'QUADRO_ATUALIZADO',
      entityType: 'Board',
      entityId: boardId,
      details: data,
    });

    return updated;
  }

  static async deleteBoard(workspaceId: string, boardId: string, userId: string) {
    const existing = await prisma.board.findFirst({
      where: { id: boardId, workspaceId },
    });

    if (!existing) {
      throw new AppError('Quadro não encontrado neste workspace.', 404);
    }

    await prisma.board.delete({
      where: { id: boardId },
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'QUADRO_EXCLUIDO',
      entityType: 'Board',
      entityId: boardId,
      details: { title: existing.title },
    });

    return { message: 'Quadro excluído com sucesso.' };
  }

  // --- Listas ---
  static async createList(workspaceId: string, boardId: string, userId: string, data: { title: string; position?: number }) {
    const board = await prisma.board.findFirst({
      where: { id: boardId, workspaceId },
    });

    if (!board) {
      throw new AppError('Quadro não encontrado neste workspace.', 404);
    }

    const count = await prisma.boardList.count({ where: { boardId } });
    const position = data.position !== undefined ? data.position : count;

    const list = await prisma.boardList.create({
      data: {
        boardId,
        title: data.title,
        position,
      },
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'LISTA_CRIADA',
      entityType: 'BoardList',
      entityId: list.id,
      details: { title: list.title, boardId },
    });

    return list;
  }

  static async updateList(
    workspaceId: string,
    listId: string,
    userId: string,
    data: { title?: string; position?: number }
  ) {
    const list = await prisma.boardList.findUnique({
      where: { id: listId },
      include: { board: true },
    });

    if (!list || list.board.workspaceId !== workspaceId) {
      throw new AppError('Lista não encontrada neste workspace.', 404);
    }

    const updated = await prisma.boardList.update({
      where: { id: listId },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.position !== undefined ? { position: data.position } : {}),
      },
    });

    return updated;
  }

  static async deleteList(workspaceId: string, listId: string, userId: string) {
    const list = await prisma.boardList.findUnique({
      where: { id: listId },
      include: { board: true },
    });

    if (!list || list.board.workspaceId !== workspaceId) {
      throw new AppError('Lista não encontrada neste workspace.', 404);
    }

    await prisma.boardList.delete({
      where: { id: listId },
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'LISTA_EXCLUIDA',
      entityType: 'BoardList',
      entityId: listId,
      details: { title: list.title },
    });

    return { message: 'Lista e seus cartões excluídos com sucesso.' };
  }

  // --- Validação de Hierarquia para Atribuição de Tarefas ---
  static async validateAssignmentHierarchy(
    workspaceId: string,
    callerUserId: string,
    targetMemberId: string
  ) {
    const ROLE_RANK: Record<string, number> = {
      GUEST: 0,
      MEMBER: 1,
      ADMIN: 2,
      OWNER: 3,
    };

    const [callerMember, targetMember] = await Promise.all([
      prisma.workspaceMember.findFirst({
        where: { workspaceId, userId: callerUserId },
        include: { user: { select: { name: true } } },
      }),
      prisma.workspaceMember.findFirst({
        where: { id: targetMemberId, workspaceId },
        include: { user: { select: { name: true } } },
      }),
    ]);

    if (!callerMember) {
      throw new AppError('Usuário autor da ação não pertence a este workspace.', 403);
    }

    if (!targetMember) {
      throw new AppError('Membro atribuído não pertence ao workspace.', 400);
    }

    if (targetMember.role === 'GUEST') {
      throw new AppError(
        'Membros com perfil de Visualizador (GUEST) não podem receber atribuição de tarefas.',
        400
      );
    }

    if (callerMember.role === 'GUEST') {
      throw new AppError(
        'Visualizadores (GUEST) possuem acesso somente leitura e não podem designar tarefas.',
        403
      );
    }

    const callerRank = ROLE_RANK[callerMember.role] ?? 0;
    const targetRank = ROLE_RANK[targetMember.role] ?? 0;

    if (targetRank > callerRank) {
      const roleLabels: Record<string, string> = {
        MEMBER: 'Membro',
        ADMIN: 'Administrador',
        OWNER: 'Coordenador (Owner)',
      };
      const callerLabel = roleLabels[callerMember.role] || callerMember.role;
      const targetLabel = roleLabels[targetMember.role] || targetMember.role;
      throw new AppError(
        `Violação de hierarquia: um usuário com nível "${callerLabel}" não pode designar tarefas para "${targetMember.user.name}" que possui nível superior ("${targetLabel}").`,
        403
      );
    }

    return { callerMember, targetMember };
  }

  // --- Cartões ---
  static async createCard(workspaceId: string, userId: string, data: any) {
    const list = await prisma.boardList.findUnique({
      where: { id: data.listId },
      include: { board: true },
    });

    if (!list || list.board.workspaceId !== workspaceId) {
      throw new AppError('Lista não encontrada neste workspace.', 404);
    }

    if (data.assignedMemberId) {
      await BoardService.validateAssignmentHierarchy(workspaceId, userId, data.assignedMemberId);
    }

    

    const cardCount = await prisma.card.count({ where: { listId: data.listId } });

    const card = await prisma.card.create({
      data: {
        listId: data.listId,
        title: data.title,
        description: data.description || null,
        position: cardCount,
        priority: data.priority || 'MEDIA',
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assignedMemberId: data.assignedMemberId || null,
        hospitalId: data.hospitalId || null,
        doctorId: data.doctorId || null,
        tag: data.tag || null,
        statusBadge: data.statusBadge || null,
        checklistTitle: data.checklistTitle || null,
        checklistDone: !!data.checklistDone,
        cardCategory: data.cardCategory || 'VISITA',
        checklistItems: data.checklistItems && data.checklistItems.length > 0
          ? {
              create: data.checklistItems.map((title: string, index: number) => ({
                title,
                position: index,
                isDone: false,
              })),
            }
          : undefined,
        labels: data.labelIds && data.labelIds.length > 0
          ? { connect: data.labelIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: {
        labels: true,
        checklistItems: { orderBy: { position: 'asc' } },
        attachments: true,
        assignedMember: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        hospital: {
          select: { id: true, name: true, city: true },
        },
        doctor: {
          select: { id: true, name: true, specialty: true, crm: true, crmState: true },
        },
      },
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'CARTAO_CRIADO',
      entityType: 'Card',
      entityId: card.id,
      details: { title: card.title, listTitle: list.title },
    });

    // Se houver membro designado diferente do autor, notificar
    if (card.assignedMemberId && card.assignedMember?.user.id !== userId) {
      await NotificationService.create({
        workspaceId,
        recipientUserId: card.assignedMember!.user.id,
        title: 'Você recebeu um novo cartão de ação',
        message: `Você foi designado para o cartão "${card.title}" no quadro "${list.board.title}".`,
        link: `/workspaces/${workspaceId}/boards/${list.boardId}`,
      });
    }

    // Sincronização automática com Google Calendar do membro designado
    if (card.dueDate && card.assignedMemberId) {
      CalendarService.syncVisitCard(card.id).catch((err) => {
        console.warn('Falha silenciosa ao sincronizar visita com Google Calendar:', err);
      });
    }

    return card;
  }

  static async getCardById(workspaceId: string, cardId: string) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: { board: true },
        },
        labels: true,
        checklistItems: { orderBy: { position: 'asc' } },
        assignedMember: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        hospital: {
          select: { id: true, name: true, city: true },
        },
        doctor: {
          select: { id: true, name: true, specialty: true, crm: true, crmState: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
              },
            },
          },
        },
        attachments: {
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!card || card.list.board.workspaceId !== workspaceId) {
      throw new AppError('Cartão não encontrado neste workspace.', 404);
    }

    return card;
  }

  static async updateCard(workspaceId: string, cardId: string, userId: string, data: any) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: { include: { board: true } },
        assignedMember: true,
      },
    });

    if (!card || card.list.board.workspaceId !== workspaceId) {
      throw new AppError('Cartão não encontrado neste workspace.', 404);
    }

    if (
      data.assignedMemberId !== undefined &&
      data.assignedMemberId !== null &&
      data.assignedMemberId !== card.assignedMemberId
    ) {
      await BoardService.validateAssignmentHierarchy(workspaceId, userId, data.assignedMemberId);
    }

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.priority ? { priority: data.priority } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate ? new Date(data.startDate) : null } : {}),
        ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
        ...(data.assignedMemberId !== undefined ? { assignedMemberId: data.assignedMemberId } : {}),
        ...(data.hospitalId !== undefined ? { hospitalId: data.hospitalId } : {}),
        ...(data.doctorId !== undefined ? { doctorId: data.doctorId } : {}),
        ...(data.tag !== undefined ? { tag: data.tag } : {}),
        ...(data.statusBadge !== undefined ? { statusBadge: data.statusBadge } : {}),
        ...(data.checklistTitle !== undefined ? { checklistTitle: data.checklistTitle } : {}),
        ...(data.checklistDone !== undefined ? { checklistDone: data.checklistDone } : {}),
        ...(data.cardCategory !== undefined ? { cardCategory: data.cardCategory } : {}),
        ...(data.labelIds !== undefined
          ? {
              labels: {
                set: data.labelIds.map((id: string) => ({ id })),
              },
            }
          : {}),
      },
      include: {
        labels: true,
        checklistItems: { orderBy: { position: 'asc' } },
        attachments: true,
        assignedMember: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        hospital: { select: { id: true, name: true, city: true } },
        doctor: { select: { id: true, name: true, specialty: true, crm: true } },
      },
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'CARTAO_ATUALIZADO',
      entityType: 'Card',
      entityId: cardId,
      details: data,
    });

    if (
      data.assignedMemberId &&
      data.assignedMemberId !== card.assignedMemberId &&
      updated.assignedMember?.user?.id !== userId
    ) {
      await NotificationService.create({
        workspaceId,
        recipientUserId: updated.assignedMember!.user.id,
        title: 'Você foi designado para uma tarefa',
        message: `Você foi designado para o cartão "${updated.title}" no quadro "${card.list.board.title}".`,
        link: `/workspaces/${workspaceId}/boards/${card.list.boardId}`,
      });
    }

    // Se o membro designado mudou e havia evento anterior, remove da agenda do membro anterior
    if (
      card.assignedMemberId &&
      data.assignedMemberId !== undefined &&
      data.assignedMemberId !== card.assignedMemberId &&
      card.googleEventId &&
      card.assignedMember?.userId
    ) {
      CalendarService.deleteCardEvent(card.id, card.assignedMember.userId, card.googleEventId).catch((err) => {
        console.warn('Falha ao remover evento anterior do Google Calendar:', err);
      });
    }

    // Sincroniza atualização de data, título, médico ou membro no Google Calendar
    CalendarService.syncVisitCard(updated.id).catch((err) => {
      console.warn('Falha silenciosa ao sincronizar visita atualizada no Google Calendar:', err);
    });

    return updated;
  }

  static async toggleChecklist(workspaceId: string, cardId: string, userId: string, done: boolean) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { list: { include: { board: true } } },
    });

    if (!card || card.list.board.workspaceId !== workspaceId) {
      throw new AppError('Cartão não encontrado neste workspace.', 404);
    }

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: { checklistDone: done },
    });

    return updated;
  }

  static async addChecklistItem(workspaceId: string, cardId: string, title: string) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: { include: { board: true } },
        checklistItems: true,
      },
    });

    if (!card || card.list.board.workspaceId !== workspaceId) {
      throw new AppError('Cartão não encontrado neste workspace.', 404);
    }

    const nextPos = card.checklistItems.length;
    const item = await prisma.cardChecklistItem.create({
      data: {
        cardId,
        title,
        position: nextPos,
        isDone: false,
      },
    });

    return item;
  }

  static async updateChecklistItem(
    workspaceId: string,
    itemId: string,
    data: { isDone?: boolean; title?: string }
  ) {
    const item = await prisma.cardChecklistItem.findUnique({
      where: { id: itemId },
      include: {
        card: { include: { list: { include: { board: true } } } },
      },
    });

    if (!item || item.card.list.board.workspaceId !== workspaceId) {
      throw new AppError('Item do checklist não encontrado.', 404);
    }

    const updated = await prisma.cardChecklistItem.update({
      where: { id: itemId },
      data: {
        ...(data.isDone !== undefined ? { isDone: data.isDone } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
      },
    });

    return updated;
  }

  static async deleteChecklistItem(workspaceId: string, itemId: string) {
    const item = await prisma.cardChecklistItem.findUnique({
      where: { id: itemId },
      include: {
        card: { include: { list: { include: { board: true } } } },
      },
    });

    if (!item || item.card.list.board.workspaceId !== workspaceId) {
      throw new AppError('Item do checklist não encontrado.', 404);
    }

    await prisma.cardChecklistItem.delete({
      where: { id: itemId },
    });

    return { success: true };
  }

  static async moveCard(
    workspaceId: string,
    cardId: string,
    userId: string,
    data: { targetListId: string; newPosition: number }
  ) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { list: { include: { board: true } } },
    });

    if (!card || card.list.board.workspaceId !== workspaceId) {
      throw new AppError('Cartão não encontrado neste workspace.', 404);
    }

    const targetList = await prisma.boardList.findUnique({
      where: { id: data.targetListId },
      include: { board: true },
    });

    if (!targetList || targetList.board.workspaceId !== workspaceId) {
      throw new AppError('Lista de destino não encontrada neste workspace.', 404);
    }

    const isSameList = card.listId === data.targetListId;

    await prisma.$transaction(async (tx) => {
      if (isSameList) {
        // Movendo dentro da mesma lista
        const cards = await tx.card.findMany({
          where: { listId: card.listId },
          orderBy: { position: 'asc' },
        });

        const reordered = cards.filter((c) => c.id !== cardId);
        reordered.splice(data.newPosition, 0, card);

        for (let i = 0; i < reordered.length; i++) {
          await tx.card.update({
            where: { id: reordered[i].id },
            data: { position: i },
          });
        }
      } else {
        // Movendo entre listas diferentes
        // 1. Atualizar posições na lista de origem
        await tx.card.updateMany({
          where: {
            listId: card.listId,
            position: { gt: card.position },
          },
          data: {
            position: { decrement: 1 },
          },
        });

        // 2. Abrir espaço na lista de destino
        await tx.card.updateMany({
          where: {
            listId: data.targetListId,
            position: { gte: data.newPosition },
          },
          data: {
            position: { increment: 1 },
          },
        });

        // 3. Atualizar o cartão para a nova lista e nova posição
        await tx.card.update({
          where: { id: cardId },
          data: {
            listId: data.targetListId,
            position: data.newPosition,
          },
        });
      }
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'CARTAO_MOVIDO',
      entityType: 'Card',
      entityId: cardId,
      details: {
        cardTitle: card.title,
        fromList: card.list.title,
        toList: targetList.title,
        newPosition: data.newPosition,
      },
    });

    return { message: 'Posição do cartão atualizada com sucesso.' };
  }

  static async deleteCard(workspaceId: string, cardId: string, userId: string) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: { include: { board: true } },
        assignedMember: true,
      },
    });

    if (!card || card.list.board.workspaceId !== workspaceId) {
      throw new AppError('Cartão não encontrado neste workspace.', 404);
    }

    if (card.googleEventId && card.assignedMember?.userId) {
      CalendarService.deleteCardEvent(card.id, card.assignedMember.userId, card.googleEventId).catch((err) => {
        console.warn('Falha ao excluir evento no Google Calendar:', err);
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.card.delete({ where: { id: cardId } });
      // Reordenar posições subsequentes na lista
      await tx.card.updateMany({
        where: {
          listId: card.listId,
          position: { gt: card.position },
        },
        data: {
          position: { decrement: 1 },
        },
      });
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'CARTAO_EXCLUIDO',
      entityType: 'Card',
      entityId: cardId,
      details: { title: card.title },
    });

    return { message: 'Cartão excluído com sucesso.' };
  }

  // --- Comentários ---
  static async addComment(workspaceId: string, cardId: string, memberId: string, content: string) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { list: { include: { board: true } } },
    });

    if (!card || card.list.board.workspaceId !== workspaceId) {
      throw new AppError('Cartão não encontrado.', 404);
    }

    const comment = await prisma.cardComment.create({
      data: {
        cardId,
        authorId: memberId,
        content,
      },
      include: {
        author: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    return comment;
  }

  // --- Etiquetas (Labels) ---
  static async createBoardLabel(
    workspaceId: string,
    boardId: string,
    userId: string,
    data: { title?: string | null; color: string }
  ) {
    const board = await prisma.board.findFirst({
      where: { id: boardId, workspaceId },
    });

    if (!board) {
      throw new AppError('Quadro não encontrado neste workspace.', 404);
    }

    const label = await prisma.boardLabel.create({
      data: {
        boardId,
        title: data.title ? data.title.trim() : null,
        color: data.color.trim(),
      },
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'ETIQUETA_CRIADA',
      entityType: 'BoardLabel',
      entityId: label.id,
      details: { title: label.title, color: label.color, boardId },
    });

    return label;
  }

  static async deleteBoardLabel(workspaceId: string, labelId: string, userId: string) {
    const label = await prisma.boardLabel.findUnique({
      where: { id: labelId },
      include: { board: true },
    });

    if (!label || label.board.workspaceId !== workspaceId) {
      throw new AppError('Etiqueta não encontrada neste workspace.', 404);
    }

    await prisma.boardLabel.delete({
      where: { id: labelId },
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'ETIQUETA_EXCLUIDA',
      entityType: 'BoardLabel',
      entityId: labelId,
      details: { title: label.title, color: label.color },
    });

    return { message: 'Etiqueta excluída com sucesso.' };
  }

  static async attachLabelToCard(
    workspaceId: string,
    cardId: string,
    labelId: string,
    userId: string
  ) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { list: { include: { board: true } } },
    });

    if (!card || card.list.board.workspaceId !== workspaceId) {
      throw new AppError('Cartão não encontrado neste workspace.', 404);
    }

    const label = await prisma.boardLabel.findUnique({
      where: { id: labelId },
      include: { board: true },
    });

    if (!label || label.board.workspaceId !== workspaceId) {
      throw new AppError('Etiqueta não encontrada neste workspace.', 404);
    }

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: {
        labels: {
          connect: { id: labelId },
        },
      },
      include: {
        labels: true,
      },
    });

    return updated;
  }

  static async detachLabelFromCard(
    workspaceId: string,
    cardId: string,
    labelId: string,
    userId: string
  ) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { list: { include: { board: true } } },
    });

    if (!card || card.list.board.workspaceId !== workspaceId) {
      throw new AppError('Cartão não encontrado neste workspace.', 404);
    }

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: {
        labels: {
          disconnect: { id: labelId },
        },
      },
      include: {
        labels: true,
      },
    });

    return updated;
  }
}
