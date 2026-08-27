import { Response } from 'express';
import { Role, VisitStatus } from '@prisma/client';
import { prisma } from '../app';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalVisits, pendingApprovals, currentlyInside, appointmentsToday, admin] = await Promise.all([
      prisma.newAppointment.count(),
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
    ]);

    res.json({
      totalVisits,
      pendingApprovals,
      currentlyInside,
      appointmentsToday,
      adminName: admin?.name || 'Admin User',
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch admin dashboard' });
  }
};

export const getEmployees = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const employees = await prisma.user.findMany({
      where: {
        role: Role.EMPLOYEE,
        status: 'ACTIVE',
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    res.json(employees);
  } catch (error) {
    console.error('Admin employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};
