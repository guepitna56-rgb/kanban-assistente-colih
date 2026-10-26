import { Router } from 'express';
import { DoctorController } from './doctor.controller.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import {
  requireWorkspaceMember,
  requireRole,
} from '../../middlewares/workspaceMiddleware.js';
import {
  createDoctorSchema,
  updateDoctorSchema,
} from './doctor.schemas.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireWorkspaceMember);

router.get('/', DoctorController.list);
router.get('/:id', DoctorController.getById);

router.post(
  '/',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: createDoctorSchema }),
  DoctorController.create
);

router.put(
  '/:id',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: updateDoctorSchema }),
  DoctorController.update
);

router.delete(
  '/:id',
  requireRole(['OWNER', 'ADMIN']),
  DoctorController.delete
);

export const doctorRoutes = router;
