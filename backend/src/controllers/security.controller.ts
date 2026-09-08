import { Request, Response } from 'express';
import { prisma, io } from '../app';
import { VisitStatus, Role as RoleEnum } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { NotificationService } from '../services/notification.service';

export const scanQrCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'QR token is required' });
      return;
    }

    let cleanToken = (token || '').toString().trim();
    if ((cleanToken.startsWith('{') && cleanToken.endsWith('}')) || (cleanToken.startsWith('"') && cleanToken.endsWith('"'))) {
      try {
        const parsed = JSON.parse(cleanToken);
        if (typeof parsed === 'string') {
          cleanToken = parsed.trim();
        } else if (typeof parsed === 'object' && parsed !== null) {
          cleanToken = parsed.token || parsed.displayId || parsed.id || cleanToken;
        }
      } catch (e) {}
    }

    // 1. Find by QR token
    const qrCode = await prisma.qrCode.findUnique({
      where: { token: cleanToken },
      include: {
        visit: {
          include: {
            visitor: true,
            host: { select: { id: true, name: true, email: true, department: true, role: true } }
          }
        }
      }
    });

    let visit = qrCode?.visit || null;

    // 2. Fallback: Find visit directly by displayId or id
    if (!visit) {
      visit = await prisma.visit.findFirst({
        where: {
          OR: [
            { displayId: cleanToken },
            { id: cleanToken }
          ]
        },
        include: {
          visitor: true,
          host: { select: { id: true, name: true, email: true, department: true, role: true } }
        }
      });
    }

    if (!visit) {
      res.status(404).json({ error: 'INVALID QR CODE' });
      return;
    }

    const scheduledDate = visit.scheduledAt ? new Date(visit.scheduledAt) : new Date();

    const details = {
      visitId: visit.id,
      displayId: visit.displayId || visit.id,
      visitorId: visit.displayId || visit.id,
      visitorName: visit.visitor?.name || (visit as any).guestName || 'Visitor',
      visitorEmail: visit.visitor?.email || (visit as any).guestEmail || 'N/A',
      visitorPhone: visit.visitor?.phone || (visit as any).guestPhone || 'N/A',
      visitorCompany: (visit as any).companyName || 'N/A',
      hostName: visit.host?.name || 'N/A',
      hostDepartment: visit.host?.department || 'General',
      date: scheduledDate.toLocaleDateString('en-IN'),
      time: scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      purpose: visit.purpose || 'Official Visit',
      status: visit.status,
      checkInAt: visit.checkInAt ? new Date(visit.checkInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
      checkOutAt: visit.checkOutAt ? new Date(visit.checkOutAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
      allowCheckIn: visit.status === VisitStatus.APPROVED && !visit.checkInAt,
      allowCheckOut: visit.status === VisitStatus.CHECKED_IN || (!!visit.checkInAt && !visit.checkOutAt),
    };

    res.json({
      message: visit.status === VisitStatus.APPROVED ? 'ALLOW ENTRY' : `STATUS: ${visit.status}`,
      visit,
      details,
    });
  } catch (error) {
    console.error('scanQrCode error:', error);
    res.status(500).json({ error: 'Failed to process QR scan' });
  }
};

export const checkInVisitor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { visitId } = req.body;
    if (!visitId) {
      res.status(400).json({ error: 'Visit ID is required' });
      return;
    }
    const visit = await prisma.visit.update({
      where: { id: visitId },
      data: { 
        checkInAt: new Date(),
        status: VisitStatus.CHECKED_IN
      },
      include: {
        visitor: true,
        host: { select: { id: true, name: true, email: true, department: true, role: true } }
      }
    });

    if (visit.visitor?.phone || visit.visitor?.email) {
      await prisma.newAppointment.updateMany({
        where: {
          OR: [
            ...(visit.visitor?.phone ? [{ mobile: visit.visitor.phone }] : []),
            ...(visit.visitor?.email ? [{ email: visit.visitor.email }] : [])
          ],
          status: 'APPROVED'
        },
        data: { status: 'CHECKED_IN' }
      });
    }

    // Trigger Push Notifications to Host Employee & Admin
    try {
      if (visit.host?.id) {
        await NotificationService.notifyHostOfVisitorArrival(visit);
      }
      await NotificationService.notifyAdminOfVisitorArrival(visit);
    } catch (notifErr) {
      console.error('Failed to send check-in notification:', notifErr);
    }

    // Emit real-time Socket events for live UI updates
    try {
      io.emit('visit_updated', { visitId: visit.id, status: VisitStatus.CHECKED_IN, visit });
      io.emit('appointment_updated', { visitId: visit.id, status: 'CHECKED_IN' });
    } catch (socketErr) {
      console.error('Failed to emit socket check-in event:', socketErr);
    }

    res.json({ message: 'Visitor checked in successfully', visit });
  } catch (error) {
    console.error('checkInVisitor error:', error);
    res.status(500).json({ error: 'Failed to check in visitor' });
  }
};

export const checkOutVisitor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { visitId } = req.body;
    if (!visitId) {
      res.status(400).json({ error: 'Visit ID is required' });
      return;
    }
    const visit = await prisma.visit.update({
      where: { id: visitId },
      data: { 
        checkOutAt: new Date(),
        status: VisitStatus.COMPLETED
      },
      include: {
        visitor: true,
        host: { select: { id: true, name: true, email: true, department: true, role: true } }
      }
    });

    if (visit.visitor?.phone || visit.visitor?.email) {
      await prisma.newAppointment.updateMany({
        where: {
          OR: [
            ...(visit.visitor?.phone ? [{ mobile: visit.visitor.phone }] : []),
            ...(visit.visitor?.email ? [{ email: visit.visitor.email }] : [])
          ],
          status: 'CHECKED_IN'
        },
        data: { status: 'COMPLETED' }
      });
    }

    // Dispatch Push Notifications to Host Employee & Admin on Check-Out
    try {
      if (visit.host?.id) {
        await NotificationService.notifyHostOfVisitorCheckOut(visit);
      }
      await NotificationService.notifyAdminOfVisitorCheckOut(visit);
    } catch (notifErr) {
      console.error('Failed to send check-out notification:', notifErr);
    }

    // Emit Socket events
    try {
      io.emit('visit_updated', { visitId: visit.id, status: VisitStatus.COMPLETED, visit });
      io.emit('appointment_updated', { visitId: visit.id, status: 'COMPLETED' });
    } catch (socketErr) {
      console.error('Failed to emit socket check-out event:', socketErr);
    }

    res.json({ message: 'Visitor checked out successfully', visit });
  } catch (error) {
    console.error('checkOutVisitor error:', error);
    res.status(500).json({ error: 'Failed to check out visitor' });
  }
};

const getUniqueConstraintMessage = (error: any): string | null => {
  if (error.code === 'P2002' && error.meta && Array.isArray(error.meta.target)) {
    const target = error.meta.target[0];
    if (target === 'email') return 'Email address is already in use.';
    if (target === 'phone') return 'Phone number is already in use.';
    if (target === 'employeeId') return 'Employee ID is already in use.';
  }
  return null;
};

export const getSecurityGuards = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const guards = await (prisma.user as any).findMany({
      where: { role: RoleEnum.SECURITY },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        designation: true,
        status: true,
        role: true,
      }
    });
    res.json(guards);
  } catch (error) {
    console.error('getSecurityGuards error:', error);
    res.status(500).json({ error: 'Failed to fetch security guards' });
  }
};

export const createSecurityGuard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, employeeId, phone, email, password, designation, status } = req.body;

    if (typeof password !== 'string' || password.trim().length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password.trim(), salt);

    const newGuard = await (prisma.user as any).create({
      data: {
        name,
        employeeId,
        phone,
        email,
        passwordHash,
        role: RoleEnum.SECURITY,
        designation,
        status: status || 'ACTIVE',
      }
    });

    res.status(201).json({ id: newGuard.id, message: 'Security guard created successfully' });
  } catch (error: any) {
    console.error('createSecurityGuard error:', error);
    const uniqueConstraintMessage = getUniqueConstraintMessage(error);
    if (uniqueConstraintMessage) {
      res.status(400).json({ error: uniqueConstraintMessage });
      return;
    }
    res.status(500).json({ error: 'Failed to create security guard' });
  }
};

export const updateSecurityGuard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, employeeId, phone, email, designation, status } = req.body;
    
    await (prisma.user as any).update({
      where: { id: req.params.id as string },
      data: {
        name,
        employeeId,
        phone,
        email,
        designation,
        status,
      }
    });

    res.json({ message: 'Security guard updated successfully' });
  } catch (error: any) {
    console.error('updateSecurityGuard error:', error);
    const uniqueConstraintMessage = getUniqueConstraintMessage(error);
    if (uniqueConstraintMessage) {
      res.status(400).json({ error: uniqueConstraintMessage });
      return;
    }
    res.status(500).json({ error: 'Failed to update security guard' });
  }
};

export const deactivateSecurityGuard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await (prisma.user as any).update({
      where: { id: req.params.id as string },
      data: { status: 'INACTIVE' }
    });
    res.json({ message: 'Security guard deactivated successfully' });
  } catch (error) {
    console.error('deactivateSecurityGuard error:', error);
    res.status(500).json({ error: 'Failed to deactivate security guard' });
  }
};

export const getSecurityDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const now = new Date();

    const [todaysVisitors, insideNow, upcoming, checkedOut] = await Promise.all([
      prisma.visit.count({ where: { scheduledAt: { gte: todayStart, lte: todayEnd } } }),
      prisma.visit.count({ where: { status: VisitStatus.CHECKED_IN, checkInAt: { not: null }, checkOutAt: null } }),
      prisma.visit.count({ where: { status: VisitStatus.APPROVED, scheduledAt: { gte: now } } }),
      prisma.visit.count({ where: { status: VisitStatus.COMPLETED, scheduledAt: { gte: todayStart, lte: todayEnd } } }),
    ]);

    res.json({ todaysVisitors, insideNow, upcoming, checkedOut });
  } catch (error) {
    console.error('getSecurityDashboardStats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getSecurityVisits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filter = req.query.filter as string;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    let where: any = {};

    if (filter === 'upcoming') {
      where.status = VisitStatus.APPROVED;
      where.scheduledAt = { gte: new Date() };
    } else if (filter === 'inside') {
      where.status = VisitStatus.CHECKED_IN;
      where.checkInAt = { not: null };
      where.checkOutAt = null;
    } else if (filter === 'todays') {
      where.scheduledAt = { gte: todayStart, lte: todayEnd };
    } else if (filter === 'checkedOut') {
      where.status = VisitStatus.COMPLETED;
      where.scheduledAt = { gte: todayStart, lte: todayEnd };
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        visitor: true,
        host: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 100,
    });

    res.json(visits);
  } catch (error) {
    console.error('getSecurityVisits error:', error);
    res.status(500).json({ error: 'Failed to fetch security visits' });
  }
};
