import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { AuditService } from '../audit/audit.service.js';

export class DoctorService {
  static async list(workspaceId: string, filters: { query?: string; specialty?: string; hospitalId?: string }) {
    const validQuery = typeof filters.query === 'string' && filters.query.trim() !== '' ? filters.query.trim() : undefined;
    const validSpecialty = typeof filters.specialty === 'string' && filters.specialty.trim() !== '' ? filters.specialty.trim() : undefined;
    const validHospitalId = typeof filters.hospitalId === 'string' && filters.hospitalId.trim() !== '' ? filters.hospitalId.trim() : undefined;

    return prisma.doctor.findMany({
      where: {
        workspaceId,
        ...(validSpecialty ? { specialty: validSpecialty } : {}),
        ...(validHospitalId ? { hospitalId: validHospitalId } : {}),
        ...(validQuery
          ? {
              OR: [
                { name: { contains: validQuery } },
                { crm: { contains: validQuery } },
                { specialty: { contains: validQuery } },
              ],
            }
          : {}),
      },
      include: {
        hospital: {
          select: { id: true, name: true, city: true },
        },
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getById(workspaceId: string, doctorId: string) {
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, workspaceId },
      include: {
        hospital: true,
      },
    });

    if (!doctor) {
      throw new AppError('Médico ou profissional não encontrado neste workspace.', 404);
    }

    return doctor;
  }

  static async create(workspaceId: string, userId: string, data: any) {
    if (data.hospitalId) {
      const hospital = await prisma.hospital.findFirst({
        where: { id: data.hospitalId, workspaceId },
      });
      if (!hospital) {
        throw new AppError('Hospital selecionado não pertence a esta comissão.', 400);
      }
    }

    const doctor = await prisma.doctor.create({
      data: {
        workspaceId,
        name: data.name,
        crm: data.crm,
        crmState: data.crmState.toUpperCase(),
        specialty: data.specialty,
        phone: data.phone || null,
        email: data.email || null,
        hospitalId: data.hospitalId || null,
        cooperativeLevel: data.cooperativeLevel || 'EM_CONTATO',
        acceptsBloodless: !!data.acceptsBloodless,
        notes: data.notes || null,
      },
      include: {
        hospital: {
          select: { id: true, name: true },
        },
      },
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'MEDICO_CRIADO',
      entityType: 'Doctor',
      entityId: doctor.id,
      details: { name: doctor.name, crm: `${doctor.crm}/${doctor.crmState}`, specialty: doctor.specialty },
    });

    return doctor;
  }

  static async update(workspaceId: string, doctorId: string, userId: string, data: any) {
    const existing = await prisma.doctor.findFirst({
      where: { id: doctorId, workspaceId },
    });

    if (!existing) {
      throw new AppError('Médico não encontrado neste workspace.', 404);
    }

    if (data.hospitalId) {
      const hospital = await prisma.hospital.findFirst({
        where: { id: data.hospitalId, workspaceId },
      });
      if (!hospital) {
        throw new AppError('Hospital selecionado não pertence a esta comissão.', 400);
      }
    }

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.crm ? { crm: data.crm } : {}),
        ...(data.crmState ? { crmState: data.crmState.toUpperCase() } : {}),
        ...(data.specialty ? { specialty: data.specialty } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.hospitalId !== undefined ? { hospitalId: data.hospitalId } : {}),
        ...(data.cooperativeLevel ? { cooperativeLevel: data.cooperativeLevel } : {}),
        ...(data.acceptsBloodless !== undefined ? { acceptsBloodless: data.acceptsBloodless } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
      include: {
        hospital: {
          select: { id: true, name: true },
        },
      },
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'MEDICO_ATUALIZADO',
      entityType: 'Doctor',
      entityId: doctorId,
      details: data,
    });

    return updated;
  }

  static async delete(workspaceId: string, doctorId: string, userId: string) {
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, workspaceId },
    });

    if (!doctor) {
      throw new AppError('Médico não encontrado neste workspace.', 404);
    }

    await prisma.doctor.delete({
      where: { id: doctorId },
    });

    await AuditService.log({
      workspaceId,
      userId,
      action: 'MEDICO_EXCLUIDO',
      entityType: 'Doctor',
      entityId: doctorId,
      details: { name: doctor.name, crm: doctor.crm },
    });

    return { message: 'Médico removido com sucesso.' };
  }
}
