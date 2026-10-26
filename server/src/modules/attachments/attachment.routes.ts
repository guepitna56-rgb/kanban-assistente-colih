import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { AttachmentController } from './attachment.controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import {
  requireWorkspaceMember,
  requireRole,
} from '../../middlewares/workspaceMiddleware.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middlewares/errorHandler.js';

// Assegura diretório de uploads
if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const blockedExtensions = ['.exe', '.bat', '.sh', '.bin', '.cmd', '.msi'];
    if (blockedExtensions.includes(ext)) {
      return cb(new AppError('Tipo de arquivo não permitido por motivos de segurança.', 400));
    }
    cb(null, true);
  },
});

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireWorkspaceMember);

router.post(
  '/upload',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  upload.single('file'),
  AttachmentController.upload
);

router.get(
  '/:id/download',
  AttachmentController.download
);

router.delete(
  '/:id',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  AttachmentController.delete
);

export const attachmentRoutes = router;
