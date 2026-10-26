import path from 'path';
import fs from 'fs';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class AttachmentService {
  static async upload(workspaceId: string, userId: string, file: Express.Multer.File, cardId?: string) {
    if (!file) {
      throw new AppError('Nenhum arquivo enviado.', 400);
    }

    if (cardId) {
      const card = await prisma.card.findUnique({
        where: { id: cardId },
        include: { list: { include: { board: true } } },
      });
      if (!card || card.list.board.workspaceId !== workspaceId) {
        throw new AppError('Cartão não encontrado neste workspace.', 404);
      }
    }

    const attachment = await prisma.attachment.create({
      data: {
        workspaceId,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedById: userId,
        cardId: cardId || null,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return attachment;
  }

  static async getById(workspaceId: string, attachmentId: string) {
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, workspaceId },
      include: {
        uploadedBy: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    if (!attachment) {
      throw new AppError('Anexo não encontrado.', 404);
    }

    return attachment;
  }

  static async delete(workspaceId: string, attachmentId: string, _userId: string) {
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, workspaceId },
    });

    if (!attachment) {
      throw new AppError('Anexo não encontrado.', 404);
    }

    // Remove arquivo físico se existir
    const filePath = path.join(env.UPLOAD_DIR, attachment.filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('[Attachment] Erro ao remover arquivo físico:', err);
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return { success: true };
  }
}
