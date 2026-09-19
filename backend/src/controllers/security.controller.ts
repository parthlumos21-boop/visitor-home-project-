import { Request, Response } from 'express';
import { prisma, io } from '../app';
import { VisitStatus, Role as RoleEnum } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { NotificationService } from '../services/notification.service';

const normalizeQrToken = (value: unknown): string => {
  const raw = (value || '').toString().trim();
  if (!raw) return '';

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed.trim();
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const candidate =
        (parsed as any).token ||
        (parsed as any).qrToken ||
        (parsed as any).visitId ||
        (parsed as any).displayId ||
        (parsed as any).appointmentId ||
        (parsed as any).id;
      return candidate ? candidate.toString().trim() : raw;
    }
  } catch (e) {}

  return raw.replace(/^["'\s]+|["'\s]+$/g, '').trim();
};

export const scanQrCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'QR token is required' });
      return;
    }

    const cleanToken = normalizeQrToken(token);
    if (!cleanToken) {
      res.status(400).json({ error: 'QR token is invalid' });
      return;
    }

    // 1. Find by QR token
    let qrCode = await prisma.qrCode.findUnique({
      where: { token: cleanToken },
      include: {
        visit: {
          include: {
            visitor: true,
            host: { select: { id: true, name: true, email: true, department: true, role: true } },
          },
        },
      },
    });

    const isQrExpired = !!(
      qrCode &&
      qrCode.expiresAt &&
      qrCode.expiresAt < new Date() &&
      qrCode.visit?.status !== VisitStatus.CHECKED_IN
    );

    let visit = qrCode?.visit || null;

    // 2. Fallback: Find visit directly by displayId, id, or visitorId
    if (!visit) {
      visit = await prisma.visit.findFirst({
        where: {
          OR: [
            { displayId: cleanToken },
            { id: cleanToken },
            { visitorId: cleanToken },
          ],
        },
        include: {
          visitor: true,
          host: { select: { id: true, name: true, email: true, department: true, role: true } },
        },
      });
    }

    // 3. Fallback: admin visitor cards may encode the NewAppointment id/appointmentId.
    if (!visit) {
      const appointment = await prisma.newAppointment.findFirst({
        where: {
          OR: [
            { id: cleanToken },
            { appointmentId: cleanToken },
          ],
        },
      });

      if (appointment) {
        visit = await prisma.visit.findFirst({
          where: {
            visitor: {
              OR: [
                { phone: appointment.mobile },
                ...(appointment.email ? [{ email: appointment.email }] : []),
              ],
            },
            host: {
              OR: [
                { name: appointment.personToMeet },
                { id: appointment.personToMeet },
              ],
            },
            scheduledAt: parseAppointmentDateTime(appointment.visitDate, appointment.arrivalTime),
          },
          include: {
            visitor: true,
            host: { select: { id: true, name: true, email: true, department: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
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
      status: isQrExpired ? VisitStatus.EXPIRED : visit.status,
      checkInAt: visit.checkInAt ? new Date(visit.checkInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
      checkOutAt: visit.checkOutAt ? new Date(visit.checkOutAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
      durationMinutes: visit.durationMinutes,
      qrExpired: isQrExpired,
      allowCheckIn: !isQrExpired && visit.status === VisitStatus.APPROVED && !visit.checkInAt,
      allowCheckOut: visit.status === VisitStatus.CHECKED_IN || (!!visit.checkInAt && !visit.checkOutAt),
    };
    const action =
      isQrExpired ? 'EXPIRED_PASS' :
      details.allowCheckIn ? 'ALLOW_CHECK_IN' :
      details.allowCheckOut ? 'ALLOW_CHECK_OUT' :
      visit.status === VisitStatus.PENDING ? 'PENDING_APPROVAL' :
      visit.status === VisitStatus.EXPIRED ? 'EXPIRED' :
      visit.status === VisitStatus.COMPLETED ? 'COMPLETED' :
      `STATUS_${visit.status}`;

    // Notify both Employee (Host) and Admin simultaneously when Security scans QR Code
    try {
      if (visit.hostId) {
        await NotificationService.sendNotification({
          recipientId: visit.hostId,
          type: 'VISITOR_SCANNED',
          title: 'Visitor Arrived at Security Gate',
          message: `${details.visitorName} has arrived and QR code was scanned by Security.`,
          visitId: visit.id,
          targetScreen: 'Approvals',
          data: { appointmentId: details.displayId, visitorName: details.visitorName }
        });
      }
      await NotificationService.sendRoleNotification(RoleEnum.SUPER_ADMIN, {
        type: 'VISITOR_SCANNED',
        title: 'Visitor Arrived at Security Gate',
        message: `${details.visitorName} has arrived and QR code was scanned by Security.`,
        visitId: visit.id,
        targetScreen: 'Approvals',
        data: { appointmentId: details.displayId, visitorName: details.visitorName }
      });
    } catch (notifErr) {
      console.error('Scan notification broadcast error:', notifErr);
    }

    res.json({
      message: action,
      visit,
      details: { ...details, action },
    });
  } catch (error) {
    console.error('scanQrCode error:', error);
    res.status(500).json({ error: 'Failed to process QR scan' });
  }
};

const parseAppointmentDateTime = (visitDate: string, arrivalTime?: string | null) => {
  const [day, month, year] = visitDate.split('-').map(Number);
  const scheduledAt = day && month && year ? new Date(year, month - 1, day) : new Date(visitDate);

  if (Number.isNaN(scheduledAt.getTime())) {
    return undefined;
  }

  scheduledAt.setHours(9, 0, 0, 0);
  const match = arrivalTime?.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (match) {
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    scheduledAt.setHours(hours, minutes, 0, 0);
  }

  return scheduledAt;
};

export const checkInVisitor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { visitId } = req.body;
    if (!visitId) {
      res.status(400).json({ error: 'Visit ID is required' });
      return;
    }
    const existingVisit = await prisma.visit.findUnique({
      where: { id: visitId },
      select: { id: true, status: true, checkInAt: true },
    });

    if (!existingVisit) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }

    if (existingVisit.status !== VisitStatus.APPROVED || existingVisit.checkInAt) {
      res.status(400).json({ error: `Cannot check in visitor with status ${existingVisit.status}` });
      return;
    }

    const visit = await prisma.visit.update({
      where: { id: visitId },
      data: { 
        checkInAt: new Date(),
        checkOutAt: null,
        durationMinutes: null,
        status: VisitStatus.CHECKED_IN
      },
      include: {
        visitor: true,
        host: { select: { id: true, name: true, email: true, department: true, role: true } }
      }
    });
      // Expire QR pass
      const qrCode = await prisma.qrCode.findFirst({ where: { visitId: visit.id } });
      if (qrCode) {
        await prisma.qrCode.update({ where: { id: qrCode.id }, data: { expiresAt: new Date() } });
      }

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
    const existingVisit = await prisma.visit.findUnique({
      where: { id: visitId },
      select: { checkInAt: true, checkOutAt: true, status: true },
    });

    if (!existingVisit) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }

    if (!existingVisit.checkInAt || existingVisit.status !== VisitStatus.CHECKED_IN) {
      res.status(400).json({ error: 'Visitor must be checked in before checkout' });
      return;
    }

    if (existingVisit.checkOutAt) {
      res.status(400).json({ error: 'Visitor is already checked out' });
      return;
    }

    const checkOutAt = new Date();
    const durationMinutes = Math.max(0, Math.ceil((checkOutAt.getTime() - existingVisit.checkInAt.getTime()) / 60000));

    const visit = await prisma.visit.update({
      where: { id: visitId },
      data: { 
        checkOutAt,
        durationMinutes,
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
    const todayVisitWhere = {
      status: { not: VisitStatus.COMPLETED },
      OR: [
        { scheduledAt: { gte: todayStart, lte: todayEnd } },
        { checkInAt: { gte: todayStart, lte: todayEnd } },
        { checkOutAt: { gte: todayStart, lte: todayEnd } },
      ],
    };

    const [todaysVisitors, insideNow, upcoming, checkedOut] = await Promise.all([
      prisma.visit.count({ where: todayVisitWhere }),
      prisma.visit.count({ where: { status: VisitStatus.CHECKED_IN, checkInAt: { not: null }, checkOutAt: null } }),
      prisma.visit.count({ where: { status: VisitStatus.APPROVED, scheduledAt: { gte: now } } }),
      prisma.visit.count({ where: { status: VisitStatus.COMPLETED, checkOutAt: { gte: todayStart, lte: todayEnd } } }),
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
    const source = req.query.source as string;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (source === 'newAppointments') {
      let where: any = {};

      if (filter === 'upcoming') {
        where.status = 'APPROVED';
      } else if (filter === 'inside') {
        where.status = 'CHECKED_IN';
      } else if (filter === 'todays') {
        where.visitDate = `${String(todayStart.getDate()).padStart(2, '0')}-${String(todayStart.getMonth() + 1).padStart(2, '0')}-${todayStart.getFullYear()}`;
      } else if (filter === 'checkedOut') {
        where.status = 'COMPLETED';
      }

      const appointments = await prisma.newAppointment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });

      const appointmentVisits = appointments.map((appointment) => {
        const scheduledAt = parseAppointmentDateTime(appointment.visitDate, appointment.arrivalTime) || appointment.createdAt;

        return {
          id: appointment.id,
          displayId: appointment.appointmentId,
          appointmentId: appointment.appointmentId,
          source: 'NewAppointment',
          visitor: {
            name: appointment.fullName,
            phone: appointment.mobile,
            email: appointment.email,
            company: appointment.company,
            visitorType: appointment.visitorType,
          },
          host: {
            id: appointment.personToMeet,
            name: appointment.personToMeet,
            email: null,
            department: appointment.department,
          },
          qrCode: null,
          purpose: appointment.purpose,
          scheduledAt,
          status: appointment.status,
          createdByName: appointment.decidedByName,
          decidedByName: appointment.decidedByName,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
          rejectionReason: appointment.rejectionReason,
          notes: appointment.notes,
          vehicleNumber: appointment.vehicleNumber,
        };
      });

      console.log('[Security Visits]', JSON.stringify({
        filter: filter || 'all',
        count: appointmentVisits.length,
        source: 'public.NewAppointment',
      }));

      res.json(appointmentVisits);
      return;
    }
    
    let where: any = {};

    if (filter === 'upcoming') {
      where.status = VisitStatus.APPROVED;
      where.scheduledAt = { gte: new Date() };
    } else if (filter === 'inside') {
      where.status = VisitStatus.CHECKED_IN;
      where.checkInAt = { not: null };
      where.checkOutAt = null;
    } else if (filter === 'todays') {
      where.status = { not: VisitStatus.COMPLETED };
      where.OR = [
        { scheduledAt: { gte: todayStart, lte: todayEnd } },
        { checkInAt: { gte: todayStart, lte: todayEnd } },
        { checkOutAt: { gte: todayStart, lte: todayEnd } },
      ];
    } else if (filter === 'checkedOut') {
      where.status = VisitStatus.COMPLETED;
      where.checkOutAt = { gte: todayStart, lte: todayEnd };
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        visitor: true,
        qrCode: { select: { token: true, expiresAt: true } },
        host: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    const decoratedVisits = visits.map((visit) => {
      const qrExpired = !!(
        visit.qrCode?.expiresAt &&
        visit.qrCode.expiresAt < new Date() &&
        visit.status === VisitStatus.APPROVED &&
        !visit.checkInAt
      );

      return qrExpired ? { ...visit, status: VisitStatus.EXPIRED, qrExpired: true } : visit;
    });

    console.log('[Security Visits]', JSON.stringify({
      filter: filter || 'all',
      count: decoratedVisits.length,
      source: 'postgres',
    }));

    res.json(decoratedVisits);
  } catch (error) {
    console.error('getSecurityVisits error:', error);
    res.status(500).json({ error: 'Failed to fetch security visits' });
  }
};
