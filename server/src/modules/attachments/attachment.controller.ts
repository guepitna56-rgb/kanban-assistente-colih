import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AttachmentService } from './attachment.service.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class AttachmentController {
  static async upload(req: Request, res: Response) {
    const workspaceId = req.params.workspaceId;
    const userId = req.user!.id;
    const cardId = req.body.cardId as string | undefined;

    if (!req.file) {
      throw new AppError('Nenhum arquivo enviado.', 400);
    }

    const attachment = await AttachmentService.upload(
      workspaceId,
      userId,
      req.file,
      cardId
    );

    res.status(201).json({
      status: 'success',
      data: { attachment },
    });
  }

  static async download(req: Request, res: Response) {
    const workspaceId = req.params.workspaceId;
    const attachmentId = req.params.id;

    const attachment = await AttachmentService.getById(workspaceId, attachmentId);
    const filePath = path.join(env.UPLOAD_DIR, attachment.filename);

    if (!fs.existsSync(filePath)) {
      throw new AppError('Arquivo não encontrado no servidor de arquivos.', 404);
    }

    res.download(filePath, attachment.originalName);
  }

  static async delete(req: Request, res: Response) {
    const workspaceId = req.params.workspaceId;
    const attachmentId = req.params.id;
    const userId = req.user!.id;

    await AttachmentService.delete(workspaceId, attachmentId, userId);

    res.status(200).json({
      status: 'success',
      data: { message: 'Anexo removido com sucesso.' },
    });
  }
}
