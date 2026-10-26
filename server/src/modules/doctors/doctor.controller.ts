import { Request, Response, NextFunction } from 'express';
import { DoctorService } from './doctor.service.js';

export class DoctorController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const { q, specialty, hospitalId } = req.query;
      const doctors = await DoctorService.list(workspaceId, {
        query: q as string | undefined,
        specialty: specialty as string | undefined,
        hospitalId: hospitalId as string | undefined,
      });
      res.status(200).json({
        status: 'success',
        data: { doctors },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const doctorId = req.params.id;
      const doctor = await DoctorService.getById(workspaceId, doctorId);
      res.status(200).json({
        status: 'success',
        data: { doctor },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const userId = req.user!.id;
      const doctor = await DoctorService.create(workspaceId, userId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Médico cadastrado com sucesso.',
        data: { doctor },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const doctorId = req.params.id;
      const userId = req.user!.id;
      const doctor = await DoctorService.update(workspaceId, doctorId, userId, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Dados do médico atualizados com sucesso.',
        data: { doctor },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const doctorId = req.params.id;
      const userId = req.user!.id;
      const result = await DoctorService.delete(workspaceId, doctorId, userId);
      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
