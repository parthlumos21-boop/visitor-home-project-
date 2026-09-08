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
  const count = await prisma.visit.count();
  return `VIS-${String(count + 1).padStart(6, '0')}`;
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

    const count = await prisma.newAppointment.count();
    const appointmentId = `APT-${String(count + 1).padStart(6, '0')}`;
    const visitorPhone = mobile.trim();
    const visitorEmail = email?.trim() || null;
    const visitorName = fullName.trim();
    const hostName = personToMeet.trim();
    const scheduledAt = parseVisitDateTime(visitDate.trim(), arrivalTime);

    if (!scheduledAt) {
      res.status(400).json({ error: 'Invalid visit date' });
      return;
    }

    const [host, creator] = await Promise.all([
      prisma.user.findFirst({
        where: {
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          OR: [{ name: hostName }, { id: hostName }],
        },
        select: { id: true, name: true, department: true },
      }),
      (req as any).user?.id
        ? prisma.user.findUnique({
            where: { id: (req as any).user.id },
            select: { id: true, name: true, role: true },
          })
        : prisma.user.findFirst({
            where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
            orderBy: { createdAt: 'asc' },
            select: { id: true, name: true, role: true },
          }),
    ]);

    if (!host) {
      res.status(400).json({ error: `Employee "${hostName}" was not found` });
      return;
    }

    const existingVisitor = await prisma.visitorProfile.findFirst({
      where: {
        OR: [
          { phone: visitorPhone },
          ...(visitorEmail ? [{ email: visitorEmail }] : []),
        ],
      },
    });

    const visitor = existingVisitor
      ? await prisma.visitorProfile.update({
          where: { id: existingVisitor.id },
          data: { name: visitorName, email: visitorEmail },
        })
      : await prisma.visitorProfile.create({
          data: { name: visitorName, phone: visitorPhone, email: visitorEmail },
        });

    const displayId = await generateVisitDisplayId();

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
        status: 'APPROVED',
        decidedAt: new Date(),
        decidedBy: creator?.id || null,
        decidedByName: creator?.name || 'Keval V Shah',
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
    console.error('Create new appointment error:', error);
    res.status(500).json({ error: 'Failed to create new appointment' });
  }
};

export const getNewAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
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
        OR: [{ name: appointment.personToMeet }, { id: appointment.personToMeet }],
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
        OR: [{ name: appointment.personToMeet }, { id: appointment.personToMeet }],
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
