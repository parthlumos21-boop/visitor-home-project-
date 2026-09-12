import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../app';
import { NotificationService } from '../services/notification.service';
import { VisitStatus } from '@prisma/client';

const requiredString = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

const parseVisitDateTime = (visitDate: string, arrivalTime?: string) => {
  const [day, month, year] = visitDate.split('-').map(Number);
  const scheduledAt = day && month && year ? new Date(year, month - 1, day) : new Date(visitDate);

  if (Number.isNaN(scheduledAt.getTime())) {
    return null;
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

const generateVisitDisplayId = async () => {
  const lastVisit = await prisma.visit.findFirst({
    where: { displayId: { not: null } },
    orderBy: { createdAt: 'desc' }
  });
  let newNumber = 1;
  if (lastVisit?.displayId && lastVisit.displayId.startsWith('VIS-')) {
    const numPart = parseInt(lastVisit.displayId.replace('VIS-', ''), 10);
    if (!isNaN(numPart)) newNumber = numPart + 1;
  } else {
    const count = await prisma.visit.count();
    newNumber = count + 1;
  }
  return `VIS-${String(newNumber).padStart(6, '0')}`;
};

const endOfVisitDay = (date: Date) => {
  const expiresAt = new Date(date);
  expiresAt.setHours(23, 59, 59, 999);
  return expiresAt;
};

export const createNewAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      mobile,
      email,
      company,
      visitorType,
      purpose,
      personToMeet,
      department,
      visitDate,
      arrivalTime,
      vehicleNumber,
      notes,
    } = req.body || {};

    if (!requiredString(fullName) || !requiredString(mobile) || !requiredString(purpose) || !requiredString(personToMeet) || !requiredString(visitDate)) {
      res.status(400).json({ error: 'Full name, mobile, purpose, person to meet, and visit date are required' });
      return;
    }

    const lastAppointment = await prisma.newAppointment.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    let newAppNumber = 1;
    if (lastAppointment?.appointmentId && lastAppointment.appointmentId.startsWith('APT-')) {
      const numPart = parseInt(lastAppointment.appointmentId.replace('APT-', ''), 10);
      if (!isNaN(numPart)) newAppNumber = numPart + 1;
    } else {
      const count = await prisma.newAppointment.count();
      newAppNumber = count + 1;
    }
    const appointmentId = `APT-${String(newAppNumber).padStart(6, '0')}`;
    const visitorPhone = mobile.trim();
    const visitorEmail = email?.trim() || null;
    const visitorName = fullName.trim();
    const hostName = personToMeet.trim();
    const hostEmail = hostName.toLowerCase();
    const scheduledAt = parseVisitDateTime(visitDate.trim(), arrivalTime);

    if (!scheduledAt) {
      res.status(400).json({ error: 'Invalid visit date' });
      return;
    }

    const cleanHostName = hostName.trim();

    let host = await prisma.user.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { equals: cleanHostName, mode: 'insensitive' } },
          { name: { contains: cleanHostName, mode: 'insensitive' } },
          { id: cleanHostName },
          { email: { equals: cleanHostName, mode: 'insensitive' } },
          { email: { contains: cleanHostName, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, department: true, role: true },
    });

    if (!host) {
      host = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { contains: cleanHostName, mode: 'insensitive' } },
            { email: { contains: cleanHostName, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, department: true, role: true },
      });
    }

    const creator = (req as any).user?.id
      ? await prisma.user.findUnique({
          where: { id: (req as any).user.id },
          select: { id: true, name: true, role: true },
        })
      : await prisma.user.findFirst({
          where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
          select: { id: true, name: true, role: true },
        });

    if (!host) {
      console.error(`[Appointment Error] Host Employee "${hostName}" was not found in PostgreSQL User table.`);
      res.status(400).json({ error: `Employee "${hostName}" was not found in active employees list` });
      return;
    }

    console.log(`[Appointment Success] Matched Host Employee in Postgres: ID=${host.id}, Name=${host.name}, Role=${host.role}, Dept=${host.department}`);

    const existingVisitor = await prisma.visitorProfile.findFirst({
      where: {
        OR: [
          { phone: visitorPhone },
          ...(visitorEmail ? [{ email: visitorEmail }] : []),
        ],
      },
    });

    // Check for duplicate active appointment
    const duplicateAppointment = await prisma.newAppointment.findFirst({
      where: {
        mobile: visitorPhone,
        personToMeet: host.name,
        visitDate: visitDate.trim(),
        status: { notIn: ['REJECTED', 'CANCELLED', 'EXPIRED', 'COMPLETED'] },
      },
    });

    if (duplicateAppointment) {
      res.status(400).json({ error: 'An active appointment already exists for this visitor and host on this date.' });
      return;
    }

    const visitor = existingVisitor
      ? await prisma.visitorProfile.update({
          where: { id: existingVisitor.id },
          data: { name: visitorName, email: visitorEmail },
        })
      : await prisma.visitorProfile.create({
          data: { name: visitorName, phone: visitorPhone, email: visitorEmail },
        });

    const displayId = await generateVisitDisplayId();

    const currentUser = (req as any).user;
    const isInternalCreator = currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'EMPLOYEE');
    const initialAppointmentStatus = isInternalCreator ? 'APPROVED' : 'REGISTERED';
    const initialVisitStatus = isInternalCreator ? VisitStatus.APPROVED : VisitStatus.PENDING;

    const appointment = await prisma.newAppointment.create({
      data: {
        id: randomUUID(),
        appointmentId,
        fullName: visitorName,
        mobile: visitorPhone,
        email: visitorEmail,
        company: company?.trim() || null,
        visitorType: visitorType?.trim() || null,
        purpose: purpose.trim(),
        personToMeet: host.name,
        department: department?.trim() || host.department || null,
        visitDate: visitDate.trim(),
        arrivalTime: arrivalTime?.trim() || null,
        vehicleNumber: vehicleNumber?.trim() || null,
        notes: notes?.trim() || null,
        status: initialAppointmentStatus,
        decidedAt: isInternalCreator ? new Date() : null,
        decidedBy: isInternalCreator ? (creator?.id || null) : null,
        decidedByName: isInternalCreator ? (creator?.name || null) : null,
      },
    });

    const visit = await prisma.visit.create({
      data: {
        displayId,
        visitorId: visitor.id,
        hostId: host.id,
        createdBy: creator?.id || null,
        purpose: purpose.trim(),
        scheduledAt,
        status: initialVisitStatus,
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

    console.log('[New Appointment]', JSON.stringify({
      appointmentId: appointment.appointmentId,
      fullName: appointment.fullName,
      mobile: appointment.mobile,
      purpose: appointment.purpose,
      personToMeet: appointment.personToMeet,
      createdAt: appointment.createdAt,
    }));

    // Send notification strictly to Admin (Keval V Shah) via Dispatcher
    await NotificationService.notifyAdminOfNewAppointment(appointment);
    
    // Also send push notification to the Employee (Host)
    await NotificationService.notifyHostOfNewAppointment(appointment);

    // Also send push notification to the Visitor if they are a registered user
    await NotificationService.notifyVisitorOfNewAppointment(appointment);

    const visitorUser = await prisma.user.findFirst({
      where: {
        role: 'VISITOR',
        OR: [
          { phone: visitor.phone },
          ...(visitor.email ? [{ email: visitor.email }] : []),
        ],
      },
      select: { id: true, role: true },
    });

    if (visitorUser) {
      await NotificationService.sendNotification({
        type: 'APPOINTMENT_APPROVED',
        title: 'Visit Approved',
        message: `Your visit with ${host.name} is approved by ${creator?.name || 'Keval V Shah'}.`,
        visitorId: visit.displayId || undefined,
        visitId: visit.id,
        recipientId: visitorUser.id,
        recipientRole: visitorUser.role,
        targetScreen: 'TotalVisits',
        data: { visitId: visit.id, appointmentId: appointment.id },
      });
    }

    res.status(201).json({ ...appointment, visit });
  } catch (error) {
    console.error('[Appointment Controller Error]:', error);
    res.status(500).json({ error: 'Failed to create new appointment', details: String(error) });
  }
};

const autoExpireAppointments = async () => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Find appointments that aren't already expired/completed/rejected
    const activeAppointments = await prisma.newAppointment.findMany({
      where: {
        status: { in: ['REGISTERED', 'APPROVED', 'PENDING'] }
      },
      select: { id: true, mobile: true, email: true, visitDate: true }
    });

    const oldAppointments = activeAppointments.filter(app => {
      // Parse DD-MM-YYYY
      const parts = app.visitDate.trim().split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        const visitDateObj = new Date(year, month - 1, day);
        return visitDateObj < startOfToday;
      }
      return false; // Skip invalid formats
    });

    if (oldAppointments.length > 0) {
      await prisma.newAppointment.updateMany({
        where: { id: { in: oldAppointments.map(a => a.id) } },
        data: { status: 'EXPIRED' }
      });

      // Also expire corresponding visits
      const mobiles = oldAppointments.map(a => a.mobile);
      if (mobiles.length > 0) {
        const profiles = await prisma.visitorProfile.findMany({
          where: { phone: { in: mobiles } },
          select: { id: true }
        });
        if (profiles.length > 0) {
          await prisma.visit.updateMany({
            where: {
              visitorId: { in: profiles.map(p => p.id) },
              status: { in: [VisitStatus.PENDING, VisitStatus.APPROVED] },
              scheduledAt: { lt: startOfToday }
            },
            data: { status: VisitStatus.EXPIRED }
          });
        }
      }
      console.log(`[Auto Expire] Marked ${oldAppointments.length} appointments as EXPIRED.`);
    }
  } catch (err) {
    console.error('Auto expire error:', err);
  }
};

export const getNewAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    await autoExpireAppointments();
    const showAll = req.query.all === 'true';
    const personToMeet = req.query.personToMeet as string | undefined;

    const appointments = await prisma.newAppointment.findMany({
      where: {
        ...(showAll ? {} : { status: 'REGISTERED' }),
        ...(personToMeet ? { personToMeet: personToMeet } : {})
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch new appointments' });
  }
};

export const approveNewAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { approverId, approverName } = req.body || {};
    const finalApproverName = approverName || (req as any).user?.name || 'Keval V Shah';

    const appointment = await prisma.newAppointment.update({
      where: { id },
      data: {
        status: 'APPROVED',
        rejectionReason: null,
        decidedAt: new Date(),
        decidedBy: approverId || (req as any).user?.id || null,
        decidedByName: finalApproverName,
      },
    });

    const visitorProfile = await prisma.visitorProfile.findFirst({
      where: {
        OR: [
          { phone: appointment.mobile },
          ...(appointment.email ? [{ email: appointment.email }] : []),
        ],
      },
      select: { id: true },
    });
    const host = await prisma.user.findFirst({
      where: {
        role: 'EMPLOYEE',
        OR: [{ name: appointment.personToMeet }, { id: appointment.personToMeet }, { email: appointment.personToMeet.toLowerCase() }],
      },
      select: { id: true },
    });

    if (visitorProfile && host) {
      await prisma.visit.updateMany({
        where: {
          visitorId: visitorProfile.id,
          hostId: host.id,
          status: VisitStatus.PENDING,
        },
        data: { status: VisitStatus.APPROVED },
      });
    }

    // Notify the specific Employee (personToMeet) via Dispatcher
    await NotificationService.notifyHostOfAppointmentApproval(appointment);

    // Notify the Visitor via Dispatcher
    await NotificationService.notifyVisitorOfApproval(appointment, approverName);

    // Notify Admin (Keval V Shah) that someone approved it
    const adminUsers = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
      select: { id: true }
    });
    for (const adminUser of adminUsers) {
      await NotificationService.sendNotification({
        type: 'APPOINTMENT_APPROVED_ADMIN',
        title: 'Appointment Approved',
        message: `${appointment.fullName}'s appointment was approved by ${approverName}.`,
        recipientId: adminUser.id,
        channelId: 'max',
        priority: 'high'
      });
    }

    console.log('[New Appointment Approved]', JSON.stringify({
      appointmentId: appointment.appointmentId,
      fullName: appointment.fullName,
      personToMeet: appointment.personToMeet,
      decidedAt: appointment.decidedAt,
    }));

    res.json(appointment);
  } catch (error) {
    console.error('Approve appointment error:', error);
    res.status(500).json({ error: 'Failed to approve appointment' });
  }
};

export const rejectNewAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { reason, approverId, approverName } = req.body || {};

    if (!requiredString(reason)) {
      res.status(400).json({ error: 'Rejection reason is required' });
      return;
    }

    const finalApproverName = approverName || (req as any).user?.name || 'Keval V Shah';

    const appointment = await prisma.newAppointment.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason.trim(),
        decidedAt: new Date(),
        decidedBy: approverId || (req as any).user?.id || null,
        decidedByName: finalApproverName,
      },
    });

    const visitorProfile = await prisma.visitorProfile.findFirst({
      where: {
        OR: [
          { phone: appointment.mobile },
          ...(appointment.email ? [{ email: appointment.email }] : []),
        ],
      },
      select: { id: true },
    });
    const host = await prisma.user.findFirst({
      where: {
        role: 'EMPLOYEE',
        OR: [{ name: appointment.personToMeet }, { id: appointment.personToMeet }, { email: appointment.personToMeet.toLowerCase() }],
      },
      select: { id: true },
    });

    if (visitorProfile && host) {
      await prisma.visit.updateMany({
        where: {
          visitorId: visitorProfile.id,
          hostId: host.id,
          status: VisitStatus.PENDING,
        },
        data: { status: VisitStatus.REJECTED },
      });
    }

    // Notify the specific Employee (personToMeet)
    const employeeUser = await prisma.user.findFirst({
      where: {
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        OR: [
          { id: appointment.personToMeet },
          { name: appointment.personToMeet }
        ]
      },
      select: { id: true, role: true }
    });

    if (employeeUser) {
      await NotificationService.sendNotification({
        type: 'APPOINTMENT_REJECTED',
        title: 'Appointment Rejected',
        message: `${appointment.fullName}'s appointment has been rejected.`,
        visitorId: appointment.appointmentId,
        recipientId: employeeUser.id,
        recipientRole: employeeUser.role,
      });
    }

    // Notify the Visitor
    await NotificationService.notifyVisitorOfRejection(appointment);

    console.log('[New Appointment Rejected]', JSON.stringify({
      appointmentId: appointment.appointmentId,
      fullName: appointment.fullName,
      reason: appointment.rejectionReason,
      decidedAt: appointment.decidedAt,
    }));

    res.json(appointment);
  } catch (error) {
    console.error('Reject appointment error:', error);
    res.status(500).json({ error: 'Failed to reject appointment' });
  }
};

export const renewAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { approverId, approverName } = req.body || {};
    const finalApproverName = approverName || (req as any).user?.name || 'Keval V Shah';

    const now = new Date();
    const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const currentHours = hours % 12 || 12;
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const todayTime = `${currentHours}:${currentMinutes} ${ampm}`;

    let appointment = await prisma.newAppointment.findUnique({ where: { id } });
    let visitRecord = null;
    if (!appointment) {
      visitRecord = await prisma.visit.findUnique({ where: { id }, include: { visitor: true, host: true } });
      if (!visitRecord) {
        res.status(404).json({ error: 'Appointment or Visit not found' });
        return;
      }
      appointment = await prisma.newAppointment.findFirst({
        where: {
          mobile: visitRecord.visitor.phone,
          personToMeet: visitRecord.host.name,
        },
        orderBy: { createdAt: 'desc' }
      });
      if (!appointment) {
        res.status(404).json({ error: 'Original appointment not found' });
        return;
      }
    }

    appointment = await prisma.newAppointment.update({
      where: { id: appointment.id },
      data: {
        status: 'RENEWED',
        visitDate: todayDate,
        arrivalTime: todayTime,
        rejectionReason: null,
        decidedAt: now,
        decidedBy: approverId || (req as any).user?.id || null,
        decidedByName: finalApproverName,
      },
    });

    const visitorProfile = await prisma.visitorProfile.findFirst({
      where: {
        OR: [
          { phone: appointment.mobile },
          ...(appointment.email ? [{ email: appointment.email }] : []),
        ],
      },
      select: { id: true },
    });
    const host = await prisma.user.findFirst({
      where: {
        role: 'EMPLOYEE',
        OR: [{ name: appointment.personToMeet }, { id: appointment.personToMeet }, { email: appointment.personToMeet.toLowerCase() }],
      },
      select: { id: true, role: true },
    });

    if (visitorProfile && host) {
      await prisma.visit.updateMany({
        where: {
          visitorId: visitorProfile.id,
          hostId: host.id,
          status: { in: [VisitStatus.EXPIRED, VisitStatus.PENDING, VisitStatus.REJECTED] },
        },
        data: { 
          status: VisitStatus.RENEWED,
          scheduledAt: parseVisitDateTime(todayDate, todayTime) || now
        },
      });
    }

    // Notify the Visitor
    const visitorUser = await prisma.user.findFirst({
      where: {
        role: 'VISITOR',
        OR: [
          { phone: appointment.mobile },
          ...(appointment.email ? [{ email: appointment.email }] : []),
        ],
      },
      select: { id: true, role: true },
    });

    if (visitorUser) {
      await NotificationService.sendNotification({
        type: 'APPOINTMENT_RENEWED',
        title: 'Pass Renewed',
        message: `Your visit pass has been renewed for today by ${finalApproverName}.`,
        visitorId: appointment.appointmentId,
        visitId: appointment.id,
        recipientId: visitorUser.id,
        recipientRole: visitorUser.role,
        targetScreen: 'TotalVisits',
      });
    }

    // Notify the Employee (Host)
    if (host) {
      await NotificationService.sendNotification({
        type: 'APPOINTMENT_RENEWED',
        title: 'Appointment Renewed',
        message: `${appointment.fullName}'s appointment has been renewed for today by ${finalApproverName}.`,
        visitorId: appointment.appointmentId,
        recipientId: host.id,
        recipientRole: host.role,
      });
    }

    // Notify Admins
    const adminUsers = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
      select: { id: true }
    });
    for (const adminUser of adminUsers) {
      await NotificationService.sendNotification({
        type: 'APPOINTMENT_RENEWED_ADMIN',
        title: 'Appointment Renewed',
        message: `${appointment.fullName}'s appointment was renewed by ${finalApproverName}.`,
        recipientId: adminUser.id,
        channelId: 'max',
        priority: 'high'
      });
    }

    console.log('[New Appointment Renewed]', JSON.stringify({
      appointmentId: appointment.appointmentId,
      fullName: appointment.fullName,
      personToMeet: appointment.personToMeet,
      renewedAt: appointment.decidedAt,
    }));

    res.json(appointment);
  } catch (error) {
    console.error('Renew appointment error:', error);
    res.status(500).json({ error: 'Failed to renew appointment' });
  }
};

