import { Response } from 'express';
import { Role, VisitStatus } from '@prisma/client';
import { prisma } from '../app';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { NotificationService } from '../services/notification.service';

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

const parseVisitDateTime = (visitDate: string, arrivalTime?: string) => {
  const dateOnly = new Date(visitDate);
  if (Number.isNaN(dateOnly.getTime())) {
    return null;
  }

  const scheduledAt = new Date(dateOnly);
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

const generateDisplayId = async () => {
  const count = await prisma.visit.count();
  return `VIS-${String(count + 1).padStart(6, '0')}`;
};

const endOfVisitDay = (date: Date) => {
  const expiresAt = new Date(date);
  expiresAt.setHours(23, 59, 59, 999);
  return expiresAt;
};

const getUniqueConstraintMessage = (error: any): string | null => {
  if (error?.code !== 'P2002') {
    return null;
  }

  const fields = Array.isArray(error.meta?.target) ? error.meta.target : [];

  if (fields.includes('phone')) {
    return 'An employee with this mobile number already exists.';
  }

  if (fields.includes('email')) {
    return 'An employee with this email address already exists.';
  }

  return 'An employee with these details already exists.';
};

export const getEmployees = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { department } = req.query;
    const whereClause: any = {
      role: Role.EMPLOYEE,
    };
    if (department) {
      whereClause.department = String(department);
    }

    const employees = await (prisma.user as any).findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        designation: true,
        status: true,
      },
    });
    res.json(employees);
  } catch (error) {
    console.error('getEmployees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

export const getEmployeeById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const employee = await (prisma.user as any).findUnique({
      where: { id: req.params.id as string, role: Role.EMPLOYEE },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        designation: true,
        status: true,
      } as any,
    });

    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    // Get visitor activity
    const activity = {
      totalAppointments: 0,
      approved: 0,
      rejected: 0,
      completed: 0
    };

    const hostVisits = await (prisma.visit as any).findMany({
      where: { hostId: employee.id }
    });

    activity.totalAppointments = hostVisits.length;
    activity.approved = hostVisits.filter((v: any) => v.status === 'APPROVED' || v.status === 'CHECKED_IN' || v.status === 'COMPLETED').length;
    activity.rejected = hostVisits.filter((v: any) => v.status === 'REJECTED').length;
    activity.completed = hostVisits.filter((v: any) => v.status === 'COMPLETED').length;

    res.json({ ...employee, activity });
  } catch (error) {
    console.error('getEmployeeById error:', error);
    res.status(500).json({ error: 'Failed to fetch employee details' });
  }
};

export const getEmployeeDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user?.id;
    if (!hostId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const todayStart = startOfToday();
    const todayEnd = endOfToday();

        const [myVisitors, newVisitors, upcoming, inside, recent, sentInvitations] = await Promise.all([
      prisma.visit.findMany({
        where: { hostId },
        distinct: ['visitorId'],
        select: { visitorId: true },
      }),
      prisma.visit.count({
        where: { hostId },
      }),
      prisma.visit.count({
        where: {
          hostId,
          scheduledAt: { gte: todayStart, lte: todayEnd },
          status: { in: [VisitStatus.PENDING, VisitStatus.APPROVED] },
        },
      }),
      prisma.visit.count({
        where: {
          hostId,
          status: VisitStatus.CHECKED_IN,
          checkInAt: { not: null },
          checkOutAt: null,
        },
      }),
      prisma.visit.count({
        where: { hostId },
      }),
      prisma.visit.count({
        where: { createdBy: hostId },
      }),
    ]);

    res.json({ myVisitors: myVisitors.length, newVisitors, upcoming, inside, recent, sentInvitations });
  } catch (error) {
    console.error('getEmployeeDashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch employee dashboard' });
  }
};

export const getEmployeeVisits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user?.id;
    if (!hostId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const filter = String(req.query.filter || 'recent');
    const todayStart = startOfToday();
    const todayEnd = endOfToday();
    const where: any = { hostId };

        if (filter === 'upcoming') {
      where.status = { in: [VisitStatus.PENDING, VisitStatus.APPROVED] };
      where.scheduledAt = { gte: todayStart, lte: todayEnd };
    } else if (filter === 'inside') {
      where.status = VisitStatus.CHECKED_IN;
      where.checkInAt = { not: null };
      where.checkOutAt = null;
    } else if (filter === 'sent') {
      delete where.hostId;
      where.createdBy = hostId;
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        visitor: true,
        host: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
      orderBy: filter === 'recent' ? { createdAt: 'desc' } : { scheduledAt: 'asc' },
      take: 50,
    });

    res.json(visits);
  } catch (error) {
    console.error('getEmployeeVisits error:', error);
    res.status(500).json({ error: 'Failed to fetch employee visits' });
  }
};

export const createEmployeeInvitation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user?.id;
    if (!hostId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { fullName, mobile, email, company, visitorType, purpose, visitDate, arrivalTime, validFor, notes } = req.body;

    if (!fullName?.trim() || !mobile?.trim() || !purpose?.trim() || !visitDate?.trim()) {
      res.status(400).json({ error: 'Full name, mobile, purpose, and visit date are required' });
      return;
    }

    const scheduledAt = parseVisitDateTime(visitDate, arrivalTime);
    if (!scheduledAt) {
      res.status(400).json({ error: 'Invalid visit date' });
      return;
    }

    const host = await prisma.user.findUnique({
      where: { id: hostId },
      select: { name: true, department: true },
    });

    const existingVisitor = await prisma.visitorProfile.findFirst({
      where: {
        OR: [
          { phone: mobile.trim() },
          ...(email?.trim() ? [{ email: email.trim() }] : []),
        ],
      },
    });

    const visitor = existingVisitor
      ? await prisma.visitorProfile.update({
      where: { id: existingVisitor.id },
      data: {
        name: fullName.trim(),
        email: email?.trim() || null,
      },
    })
      : await prisma.visitorProfile.create({
      data: {
        name: fullName.trim(),
        phone: mobile.trim(),
        email: email?.trim() || null,
      },
    });

    const displayId = await generateDisplayId();
    const appointmentCount = await prisma.newAppointment.count();
    const appointmentId = `APT-${String(appointmentCount + 1).padStart(6, '0')}`;
    const detailNotes = [notes?.trim(), validFor?.trim() ? `Valid for: ${validFor.trim()}` : null]
      .filter(Boolean)
      .join('\n');

    const visit = await prisma.visit.create({
      data: {
        displayId,
        visitorId: visitor.id,
        hostId,
        createdBy: hostId,
        purpose: notes?.trim() ? `${purpose.trim()} - ${notes.trim()}` : purpose.trim(),
        scheduledAt,
        status: VisitStatus.APPROVED,
      },
      include: {
        visitor: true,
        host: true,
      },
    });
    await prisma.qrCode.create({
      data: {
        visitId: visit.id,
        token: randomUUID(),
        expiresAt: endOfVisitDay(scheduledAt),
      },
    });

    await prisma.newAppointment.create({
      data: {
        appointmentId,
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email?.trim() || null,
        company: company?.trim() || null,
        visitorType: visitorType?.trim() || null,
        purpose: purpose.trim(),
        personToMeet: host?.name || 'Employee',
        department: host?.department || null,
        visitDate: visitDate.trim(),
        arrivalTime: arrivalTime?.trim() || null,
        notes: detailNotes || null,
        status: 'APPROVED',
        decidedAt: new Date(),
        decidedBy: hostId,
        decidedByName: host?.name || 'Employee',
      },
    });

                await NotificationService.sendNotification({
      type: 'NEW_VISITOR_INVITATION',
      title: 'Visitor Invitation Approved',
      message: `${visit.visitor.name}'s visit is approved.\n${visit.displayId}`,
      visitorId: visit.displayId || undefined,
      visitId: visit.id,
      recipientId: hostId,
      recipientRole: Role.EMPLOYEE,
      targetScreen: 'Visitors',
      data: { visitId: visit.id },
    });

    const visitorUser = await prisma.user.findFirst({
      where: {
        role: Role.VISITOR,
        OR: [
          { phone: visitor.phone },
          ...(visitor.email ? [{ email: visitor.email }] : []),
        ],
      },
      select: { id: true, role: true },
    });

    // Send notification to the visitor
    if (visitorUser) {
      await NotificationService.sendNotification({
        type: 'APPOINTMENT_APPROVED',
        title: 'Visit Approved',
        message: `Your visit with ${host?.name || 'Employee'} is approved.`,
        visitorId: visit.displayId || undefined,
        visitId: visit.id,
        recipientId: visitorUser.id,
        recipientRole: visitorUser.role,
        targetScreen: 'TotalVisits',
        data: { visitId: visit.id },
      });
    }

    res.status(201).json(visit);
  } catch (error: any) {
    console.error('createEmployeeInvitation error:', error);
    res.status(500).json({ error: 'Failed to create visitor invitation' });
  }
};

export const createEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, employeeId, phone, email, password, department, designation, role, status } = req.body;

    if (typeof password !== 'string' || password.trim().length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password.trim(), salt);

    const newEmployee = await (prisma.user as any).create({
      data: {
        name,
        employeeId,
        phone,
        email,
        passwordHash,
        role: role as Role || Role.EMPLOYEE,
        department,
        designation,
        status: status || 'ACTIVE',
      }
    });

    res.status(201).json({ id: newEmployee.id, message: 'Employee created successfully' });
  } catch (error: any) {
    console.error('createEmployee error:', error);
    const uniqueConstraintMessage = getUniqueConstraintMessage(error);
    if (uniqueConstraintMessage) {
      res.status(400).json({ error: uniqueConstraintMessage });
      return;
    }

    res.status(500).json({ error: 'Failed to create employee' });
  }
};

export const updateEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, employeeId, phone, email, department, designation, role, status } = req.body;
    
    await (prisma.user as any).update({
      where: { id: req.params.id as string },
      data: {
        name,
        employeeId,
        phone,
        email,
        role: role as Role,
        department,
        designation,
        status,
      }
    });

    res.json({ message: 'Employee updated successfully' });
  } catch (error: any) {
    console.error('updateEmployee error:', error);
    const uniqueConstraintMessage = getUniqueConstraintMessage(error);
    if (uniqueConstraintMessage) {
      res.status(400).json({ error: uniqueConstraintMessage });
      return;
    }

    res.status(500).json({ error: 'Failed to update employee' });
  }
};

export const deactivateEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await (prisma.user as any).update({
      where: { id: req.params.id as string },
      data: { status: 'INACTIVE' }
    });
    res.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    console.error('deactivateEmployee error:', error);
    res.status(500).json({ error: 'Failed to deactivate employee' });
  }
};






