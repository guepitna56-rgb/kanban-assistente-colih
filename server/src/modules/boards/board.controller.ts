import { Request, Response, NextFunction } from 'express';
import { BoardService } from './board.service.js';

export class BoardController {
  // Boards
  static async listBoards(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const userId = req.user?.id;
      const boards = await BoardService.listBoards(workspaceId, userId);
      res.status(200).json({
        status: 'success',
        data: { boards },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBoardById(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const boardId = req.params.id;
      const board = await BoardService.getBoardById(workspaceId, boardId);
      res.status(200).json({
        status: 'success',
        data: { board },
      });
    } catch (error) {
      next(error);
    }
  }

  static async createBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const userId = req.user!.id;
      const board = await BoardService.createBoard(workspaceId, userId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Quadro criado com sucesso.',
        data: { board },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const boardId = req.params.id;
      const userId = req.user!.id;
      const board = await BoardService.updateBoard(workspaceId, boardId, userId, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Quadro atualizado com sucesso.',
        data: { board },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const boardId = req.params.id;
      const userId = req.user!.id;
      const result = await BoardService.deleteBoard(workspaceId, boardId, userId);
      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // Lists
  static async createList(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const boardId = req.params.boardId;
      const userId = req.user!.id;
      const list = await BoardService.createList(workspaceId, boardId, userId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Lista criada com sucesso.',
        data: { list },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateList(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const listId = req.params.listId;
      const userId = req.user!.id;
      const list = await BoardService.updateList(workspaceId, listId, userId, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Lista atualizada com sucesso.',
        data: { list },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteList(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const listId = req.params.listId;
      const userId = req.user!.id;
      const result = await BoardService.deleteList(workspaceId, listId, userId);
      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cards
  static async createCard(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const userId = req.user!.id;
      const card = await BoardService.createCard(workspaceId, userId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Cartão criado com sucesso.',
        data: { card },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCardById(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const cardId = req.params.cardId;
      const card = await BoardService.getCardById(workspaceId, cardId);
      res.status(200).json({
        status: 'success',
        data: { card },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCard(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const cardId = req.params.cardId;
      const userId = req.user!.id;
      const card = await BoardService.updateCard(workspaceId, cardId, userId, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Cartão atualizado com sucesso.',
        data: { card },
      });
    } catch (error) {
      next(error);
    }
  }

  static async moveCard(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const cardId = req.params.cardId;
      const userId = req.user!.id;
      const result = await BoardService.moveCard(workspaceId, cardId, userId, req.body);
      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const cardId = req.params.cardId;
      const userId = req.user!.id;
      const card = await BoardService.toggleChecklist(workspaceId, cardId, userId, req.body.done);
      res.status(200).json({
        status: 'success',
        message: 'Checklist atualizado.',
        data: { card },
      });
    } catch (error) {
      next(error);
    }
  }

  static async addChecklistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const cardId = req.params.cardId;
      const item = await BoardService.addChecklistItem(workspaceId, cardId, req.body.title);
      res.status(201).json({
        status: 'success',
        message: 'Item do checklist adicionado.',
        data: { item },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateChecklistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const itemId = req.params.itemId;
      const item = await BoardService.updateChecklistItem(workspaceId, itemId, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Item do checklist atualizado.',
        data: { item },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteChecklistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const itemId = req.params.itemId;
      await BoardService.deleteChecklistItem(workspaceId, itemId);
      res.status(200).json({
        status: 'success',
        message: 'Item do checklist removido.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCard(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const cardId = req.params.cardId;
      const userId = req.user!.id;
      const result = await BoardService.deleteCard(workspaceId, cardId, userId);
      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // Comments
  static async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const cardId = req.params.cardId;
      const memberId = req.workspaceContext!.memberId;
      const comment = await BoardService.addComment(workspaceId, cardId, memberId, req.body.content);
      res.status(201).json({
        status: 'success',
        message: 'Comentário adicionado.',
        data: { comment },
      });
    } catch (error) {
      next(error);
    }
  }

  // Labels
  static async createLabel(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const boardId = req.params.boardId;
      const userId = req.user!.id;
      const label = await BoardService.createBoardLabel(workspaceId, boardId, userId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Etiqueta criada com sucesso.',
        data: { label },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteLabel(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const labelId = req.params.labelId;
      const userId = req.user!.id;
      const result = await BoardService.deleteBoardLabel(workspaceId, labelId, userId);
      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  static async attachLabel(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const cardId = req.params.cardId;
      const labelId = req.params.labelId;
      const userId = req.user!.id;
      const card = await BoardService.attachLabelToCard(workspaceId, cardId, labelId, userId);
      res.status(200).json({
        status: 'success',
        message: 'Etiqueta vinculada ao cartão.',
        data: { card },
      });
    } catch (error) {
      next(error);
    }
  }

  static async detachLabel(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const cardId = req.params.cardId;
      const labelId = req.params.labelId;
      const userId = req.user!.id;
      const card = await BoardService.detachLabelFromCard(workspaceId, cardId, labelId, userId);
      res.status(200).json({
        status: 'success',
        message: 'Etiqueta removida do cartão.',
        data: { card },
      });
    } catch (error) {
      next(error);
    }
  }
}
