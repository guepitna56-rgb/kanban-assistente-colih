import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class DashboardService {
  static async getMetrics(workspaceId: string, userId: string) {
    const totalHospitals = await prisma.hospital.count({ where: { workspaceId } });
    const totalDoctors = await prisma.doctor.count({ where: { workspaceId } });
    const totalMembers = await prisma.workspaceMember.count({ where: { workspaceId } });
    const totalBoards = await prisma.board.count({ where: { workspaceId } });
    const recentAuditLogs = await prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    return {
      cases: { total: 0, urgent: 0, active: 0, waitingSurgery: 0, stable: 0, closed: 0 },
      counts: { hospitals: totalHospitals, doctors: totalDoctors, members: totalMembers, boards: totalBoards },
      recentCases: [],
      recentAuditLogs,
    };
  }
}
