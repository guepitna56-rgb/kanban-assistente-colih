import { Router } from 'express';
import { BoardController } from './board.controller.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import {
  requireWorkspaceMember,
  requireRole,
} from '../../middlewares/workspaceMiddleware.js';
import {
  createBoardSchema,
  updateBoardSchema,
  createListSchema,
  updateListSchema,
  createCardSchema,
  updateCardSchema,
  moveCardSchema,
  toggleChecklistSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
  createCommentSchema,
  createLabelSchema,
} from './board.schemas.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireWorkspaceMember);

// Boards
router.get('/', BoardController.listBoards);
router.get('/:id', BoardController.getBoardById);

router.post(
  '/',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: createBoardSchema }),
  BoardController.createBoard
);

router.put(
  '/:id',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: updateBoardSchema }),
  BoardController.updateBoard
);

router.delete(
  '/:id',
  requireRole(['OWNER', 'ADMIN']),
  BoardController.deleteBoard
);

// Lists
router.post(
  '/:boardId/lists',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: createListSchema }),
  BoardController.createList
);

router.put(
  '/lists/:listId',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: updateListSchema }),
  BoardController.updateList
);

router.delete(
  '/lists/:listId',
  requireRole(['OWNER', 'ADMIN']),
  BoardController.deleteList
);

// Cards
router.post(
  '/cards',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: createCardSchema }),
  BoardController.createCard
);

router.get('/cards/:cardId', BoardController.getCardById);

router.put(
  '/cards/:cardId',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: updateCardSchema }),
  BoardController.updateCard
);

router.patch(
  '/cards/:cardId',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: updateCardSchema }),
  BoardController.updateCard
);

router.post(
  '/cards/:cardId/move',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: moveCardSchema }),
  BoardController.moveCard
);

router.patch(
  '/cards/:cardId/checklist',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: toggleChecklistSchema }),
  BoardController.toggleChecklist
);

router.post(
  '/cards/:cardId/checklist-items',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: createChecklistItemSchema }),
  BoardController.addChecklistItem
);

router.patch(
  '/checklist-items/:itemId',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: updateChecklistItemSchema }),
  BoardController.updateChecklistItem
);

router.delete(
  '/checklist-items/:itemId',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  BoardController.deleteChecklistItem
);

router.delete(
  '/cards/:cardId',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  BoardController.deleteCard
);

// Comments
router.post(
  '/cards/:cardId/comments',
  requireRole(['OWNER', 'ADMIN', 'MEMBER', 'GUEST']),
  validateRequest({ body: createCommentSchema }),
  BoardController.addComment
);

// Labels (Etiquetas)
router.post(
  '/:boardId/labels',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: createLabelSchema }),
  BoardController.createLabel
);

router.delete(
  '/labels/:labelId',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  BoardController.deleteLabel
);

router.post(
  '/cards/:cardId/labels/:labelId',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  BoardController.attachLabel
);

router.delete(
  '/cards/:cardId/labels/:labelId',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  BoardController.detachLabel
);

export const boardRoutes = router;

