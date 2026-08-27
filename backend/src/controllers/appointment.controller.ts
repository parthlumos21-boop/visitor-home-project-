import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../app';
import { NotificationService } from '../services/notification.service';

const requiredString = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

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

    const appointment = await prisma.newAppointment.create({
      data: {
        id: randomUUID(),
        appointmentId,
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email?.trim() || null,
        company: company?.trim() || null,
        visitorType: visitorType?.trim() || null,
        purpose: purpose.trim(),
        personToMeet: personToMeet.trim(),
        department: department?.trim() || null,
        visitDate: visitDate.trim(),
        arrivalTime: arrivalTime?.trim() || null,
        vehicleNumber: vehicleNumber?.trim() || null,
        notes: notes?.trim() || null,
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

    // Find all users who should receive this notification
    const targetUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['SUPER_ADMIN', 'EMPLOYEE', 'RECEPTIONIST']
        }
      },
      select: { id: true, role: true }
    });

    if (targetUsers.length > 0) {
      for (const u of targetUsers) {
        await NotificationService.sendNotification({
          type: 'NEW_APPOINTMENT_REQUEST',
          title: 'New Appointment Request',
          message: `${appointment.fullName} requested an appointment to meet ${appointment.personToMeet}.`,
          recipientId: u.id,
          recipientRole: u.role,
        });
      }
    }

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Create new appointment error:', error);
    res.status(500).json({ error: 'Failed to create new appointment' });
  }
};

export const getNewAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const showAll = req.query.all === 'true';
    const appointments = await prisma.newAppointment.findMany({
      where: showAll ? undefined : { status: 'REGISTERED' },
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
    const appointment = await prisma.newAppointment.update({
      where: { id },
      data: {
        status: 'APPROVED',
        rejectionReason: null,
        decidedAt: new Date(),
      },
    });

    // Notify admins, receptionists, and the employee
    const targetUsers = await prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'EMPLOYEE', 'RECEPTIONIST'] } },
      select: { id: true, role: true }
    });

    for (const u of targetUsers) {
      await NotificationService.sendNotification({
        type: 'APPOINTMENT_APPROVED',
        title: 'Appointment Approved',
        message: `${appointment.fullName}'s appointment for ${appointment.visitDate} has been approved.`,
        visitorId: appointment.appointmentId,
        recipientId: u.id,
        recipientRole: u.role,
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
    const { reason } = req.body || {};

    if (!requiredString(reason)) {
      res.status(400).json({ error: 'Rejection reason is required' });
      return;
    }

    const appointment = await prisma.newAppointment.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason.trim(),
        decidedAt: new Date(),
      },
    });

    // Notify admins, receptionists, and the employee
    const targetUsers = await prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'EMPLOYEE', 'RECEPTIONIST'] } },
      select: { id: true, role: true }
    });

    for (const u of targetUsers) {
      await NotificationService.sendNotification({
        type: 'APPOINTMENT_REJECTED',
        title: 'Appointment Rejected',
        message: `${appointment.fullName}'s appointment has been rejected.`,
        visitorId: appointment.appointmentId,
        recipientId: u.id,
        recipientRole: u.role,
      });
    }

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
