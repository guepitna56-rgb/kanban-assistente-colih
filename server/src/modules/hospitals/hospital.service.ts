import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { AuditService } from '../audit/audit.service.js';

export class HospitalService {
  static async list(workspaceId: string, query?: string) {
    const validQuery = typeof query === 'string' && query.trim() !== '' ? query.trim() : undefined;
    return prisma.hospital.findMany({
      where: {
        workspaceId,
        ...(validQuery
          ? {
              OR: [
                { name: { contains: validQuery } },
                { city: { contains: validQuery } },
                { type: { contains: validQuery } },
              ],
            }
          : {}),
      },
      include: {
        _count: {
          select: {
            doctors: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getById(workspaceId: string, hospitalId: string) {
    const hospital = await prisma.hospital.findFirst({
      where: { id: hospitalId, workspaceId },
      include: {
        doctors: {
          select: {
            id: true,
            name: true,
            crm: true,
            crmState: true,
            specialty: true,
            cooperativeLevel: true,
            phone: true,
          },
        }
      }
    });

    if (!hospital) {
      throw new AppError('Hospital ou instituição de saúde não encontrado.', 404);
    }

    return hospital;
  }

  static async create(workspaceId: string, userId: string, data: any) {
    const hospital = await prisma.hospital.create({
      data: {
        workspaceId,
        name: data.name,
        legalName: data.legalName || null,
        type: data.type,
        address: data.address || null,
        city: data.city,
        state: data.state.toUpperCase(),
        zipCode: data.zipCode || null,
        phone: data.phone || null,
        emergencyPhone: data.emergencyPhone || null,
        email: data.email || null,
        notes: data.notes || null,
      },
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'HOSPITAL_CRIADO',
      entityType: 'Hospital',
      entityId: hospital.id,
      details: { name: hospital.name, city: hospital.city, type: hospital.type },
    });

    return hospital;
  }

  static async update(workspaceId: string, hospitalId: string, userId: string, data: any) {
    const existing = await prisma.hospital.findFirst({
      where: { id: hospitalId, workspaceId },
    });

    if (!existing) {
      throw new AppError('Hospital não encontrado neste workspace.', 404);
    }

    const updated = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.legalName !== undefined ? { legalName: data.legalName } : {}),
        ...(data.type ? { type: data.type } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.city ? { city: data.city } : {}),
        ...(data.state ? { state: data.state.toUpperCase() } : {}),
        ...(data.zipCode !== undefined ? { zipCode: data.zipCode } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.emergencyPhone !== undefined ? { emergencyPhone: data.emergencyPhone } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'HOSPITAL_ATUALIZADO',
      entityType: 'Hospital',
      entityId: hospitalId,
      details: data,
    });

    return updated;
  }

  static async delete(workspaceId: string, hospitalId: string, userId: string) {
    const hospital = await prisma.hospital.findFirst({
      where: { id: hospitalId, workspaceId },
      include: {
        _count: {
          select: { doctors: true }
        }
      }
    });

    if (!hospital) {
      throw new AppError('Hospital não encontrado neste workspace.', 404);
    }

    
    await prisma.hospital.delete({
      where: { id: hospitalId },
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'HOSPITAL_EXCLUIDO',
      entityType: 'Hospital',
      entityId: hospitalId,
      details: { name: hospital.name },
    });

    return { message: 'Hospital removido com sucesso.' };
  }
}
