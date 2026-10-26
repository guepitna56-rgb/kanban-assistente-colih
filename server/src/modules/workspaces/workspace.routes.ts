import { Router } from 'express';
import { WorkspaceController } from './workspace.controller.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import {
  requireWorkspaceMember,
  requireRole,
} from '../../middlewares/workspaceMiddleware.js';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from './workspace.schemas.js';

const router = Router();

// Rota pública para listar comissões ativas no cadastro
router.get('/public', WorkspaceController.listPublicWorkspaces);

router.use(requireAuth);

router.get('/', WorkspaceController.listUserWorkspaces);
router.post('/:workspaceId/join', WorkspaceController.joinWorkspace);
router.post(
  '/',
  validateRequest({ body: createWorkspaceSchema }),
  WorkspaceController.create
);

router.get(
  '/:workspaceId',
  requireWorkspaceMember,
  WorkspaceController.getById
);

router.put(
  '/:workspaceId',
  requireWorkspaceMember,
  requireRole(['OWNER', 'ADMIN']),
  validateRequest({ body: updateWorkspaceSchema }),
  WorkspaceController.update
);

router.delete(
  '/:workspaceId',
  requireWorkspaceMember,
  requireRole(['OWNER']),
  WorkspaceController.delete
);

export const workspaceRoutes = router;
