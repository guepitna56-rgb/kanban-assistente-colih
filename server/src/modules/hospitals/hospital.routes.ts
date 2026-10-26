import { Router } from 'express';
import { HospitalController } from './hospital.controller.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import {
  requireWorkspaceMember,
  requireRole,
} from '../../middlewares/workspaceMiddleware.js';
import {
  createHospitalSchema,
  updateHospitalSchema,
} from './hospital.schemas.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireWorkspaceMember);

router.get('/', HospitalController.list);
router.get('/:id', HospitalController.getById);

router.post(
  '/',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: createHospitalSchema }),
  HospitalController.create
);

router.put(
  '/:id',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  validateRequest({ body: updateHospitalSchema }),
  HospitalController.update
);

router.delete(
  '/:id',
  requireRole(['OWNER', 'ADMIN']),
  HospitalController.delete
);

export const hospitalRoutes = router;
