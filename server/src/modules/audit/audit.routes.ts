import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import {
  requireWorkspaceMember,
  requireRole,
} from '../../middlewares/workspaceMiddleware.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireWorkspaceMember);

// Apenas OWNER e ADMIN podem consultar logs de auditoria
router.get('/', requireRole(['OWNER', 'ADMIN']), AuditController.list);

export const auditRoutes = router;
