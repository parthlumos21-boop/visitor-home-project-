import { Response } from 'express';
import { Role, VisitStatus } from '@prisma/client';
import { prisma } from '../app';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalVisits, pendingApprovals, currentlyInside, appointmentsToday, admin, totalEmployees, employeesByDeptRaw, totalSecurity] = await Promise.all([
      prisma.visit.count(),
      prisma.newAppointment.count({
        where: { status: 'REGISTERED' },
      }),
      prisma.visit.count({
        where: {
          status: VisitStatus.CHECKED_IN,
          checkInAt: { not: null },
          checkOutAt: null,
        },
      }),
      prisma.newAppointment.count({
        where: {
          visitDate: `${String(todayStart.getDate()).padStart(2, '0')}-${String(todayStart.getMonth() + 1).padStart(2, '0')}-${todayStart.getFullYear()}`,
        },
      }),
      req.user?.id
        ? prisma.user.findUnique({
            where: { id: req.user.id },
            select: { name: true },
          })
        : null,
      prisma.user.count({
        where: { role: Role.EMPLOYEE, status: 'ACTIVE' }
      }),
      (prisma.user as any).groupBy({
        by: ['department'],
        where: { role: Role.EMPLOYEE, status: 'ACTIVE', department: { not: null } },
        _count: { id: true }
      }),
      prisma.user.count({
        where: { role: Role.SECURITY, status: 'ACTIVE' }
      })
    ]);

    const employeesByDept: Record<string, number> = {};
    (employeesByDeptRaw as any[]).forEach((dept: any) => {
      if (dept.department) {
        employeesByDept[dept.department] = dept._count.id;
      }
    });

    console.log('[Admin Dashboard]', JSON.stringify({
      totalVisits,
      pendingApprovals,
      currentlyInside,
      appointmentsToday,
      totalEmployees,
      totalSecurity,
      source: 'postgres',
    }));

    res.json({
      totalVisits,
      pendingApprovals,
      currentlyInside,
      appointmentsToday,
      adminName: admin?.name || 'Admin User',
      totalEmployees,
      employeesByDept,
      totalSecurity
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch admin dashboard' });
  }
};
