import { Router } from 'express';
import { MemberController } from './member.controller.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import {
  requireWorkspaceMember,
  requireRole,
} from '../../middlewares/workspaceMiddleware.js';
import {
  inviteMemberSchema,
  updateMemberRoleSchema,
} from './member.schemas.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireWorkspaceMember);

router.get('/', MemberController.listMembers);

router.post(
  '/',
  requireRole(['OWNER', 'ADMIN']),
  validateRequest({ body: inviteMemberSchema }),
  MemberController.addMember
);

router.put(
  '/:memberId',
  requireRole(['OWNER', 'ADMIN']),
  validateRequest({ body: updateMemberRoleSchema }),
  MemberController.updateMember
);

router.delete(
  '/:memberId',
  requireRole(['OWNER', 'ADMIN']),
  MemberController.removeMember
);

export const memberRoutes = router;
