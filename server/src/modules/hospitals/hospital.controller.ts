import { Request, Response, NextFunction } from 'express';
import { HospitalService } from './hospital.service.js';

export class HospitalController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const query = req.query.q as string | undefined;
      const hospitals = await HospitalService.list(workspaceId, query);
      res.status(200).json({
        status: 'success',
        data: { hospitals },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const hospitalId = req.params.id;
      const hospital = await HospitalService.getById(workspaceId, hospitalId);
      res.status(200).json({
        status: 'success',
        data: { hospital },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const userId = req.user!.id;
      const hospital = await HospitalService.create(workspaceId, userId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Hospital cadastrado com sucesso.',
        data: { hospital },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const hospitalId = req.params.id;
      const userId = req.user!.id;
      const hospital = await HospitalService.update(workspaceId, hospitalId, userId, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Hospital atualizado com sucesso.',
        data: { hospital },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      const hospitalId = req.params.id;
      const userId = req.user!.id;
      const result = await HospitalService.delete(workspaceId, hospitalId, userId);
      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
