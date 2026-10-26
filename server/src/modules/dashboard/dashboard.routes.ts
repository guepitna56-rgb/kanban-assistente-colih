import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { requireWorkspaceMember } from '../../middlewares/workspaceMiddleware.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireWorkspaceMember);

router.get('/', DashboardController.getMetrics);

export const dashboardRoutes = router;
