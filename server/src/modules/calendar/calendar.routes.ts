import { Router } from 'express';
import { CalendarController } from './calendar.controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = Router();

// Callback do OAuth 2.0 (Google redireciona o navegador para cá)
router.get('/callback', CalendarController.handleCallback);

// Rotas protegidas por autenticação
router.use(requireAuth);

router.get('/connect', CalendarController.getConnectUrl);
router.get('/status', CalendarController.getStatus);
router.post('/disconnect', CalendarController.disconnect);
router.post('/cards/:cardId/sync', CalendarController.syncCard);

export const calendarRoutes = router;
