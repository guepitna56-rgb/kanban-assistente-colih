import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', NotificationController.list);
router.patch('/:id/read', NotificationController.markAsRead);
router.post('/mark-all-read', NotificationController.markAllAsRead);

export const notificationRoutes = router;
