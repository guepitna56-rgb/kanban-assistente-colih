import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.schemas.js';

const router = Router();

router.post(
  '/register',
  validateRequest({ body: registerSchema }),
  AuthController.register
);

router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  AuthController.login
);

router.post('/logout', AuthController.logout);

router.get('/me', requireAuth, AuthController.me);

router.put(
  '/profile',
  requireAuth,
  validateRequest({ body: updateProfileSchema }),
  AuthController.updateProfile
);

router.put(
  '/change-password',
  requireAuth,
  validateRequest({ body: changePasswordSchema }),
  AuthController.changePassword
);

export const authRoutes = router;
