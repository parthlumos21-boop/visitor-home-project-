import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../app';
import { VisitStatus, Role } from '@prisma/client';
import { NotificationService } from '../services/notification.service';

export const getVisitors = async (req: Request, res: Response): Promise<void> => {
  try {
    const visits = await prisma.visit.findMany({
      include: {
        visitor: true,
        host: {
          select: { name: true, email: true }
        }
      },
      orderBy: { scheduledAt: 'desc' }
    });
    const creatorIds = visits
      .map((visit) => visit.createdBy)
      .filter((id): id is string => Boolean(id));
    const creators = creatorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, name: true },
        })
      : [];
    const creatorNames = new Map(creators.map((creator) => [creator.id, creator.name]));

    res.json(
      visits.map((visit) => ({
        ...visit,
        createdByName: visit.createdBy ? creatorNames.get(visit.createdBy) || null : null,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch visitors' });
  }
};

export const createVisitorRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { visitorId, hostId, purpose, scheduledAt } = req.body;
    
    // Generate VIS-000125 format ID
    const count = await prisma.visit.count();
    const displayId = `VIS-${String(count + 1).padStart(6, '0')}`;
    
    const visit = await prisma.visit.create({
      data: {
        displayId,
        visitorId,
        hostId,
        purpose,
        scheduledAt: new Date(scheduledAt),
        status: VisitStatus.PENDING
      },
      include: {
        visitor: true,
        host: true
      }
    });

    if (visit.host) {
      await NotificationService.sendNotification({
        type: 'NEW_VISITOR_REQUEST',
        title: 'New Visitor Request',
        message: `${visit.visitor.name} has requested a visit.\n${visit.displayId}`,
        visitorId: visit.displayId || undefined,
        recipientId: visit.host.id,
        recipientRole: visit.host.role,
        targetScreen: 'Approval',
      });
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN', status: 'ACTIVE' }
    });

    if (adminUser) {
      await NotificationService.sendNotification({
        type: 'NEW_VISITOR_REQUEST',
        title: 'New Visitor Request',
        message: `${visit.visitor.name} has requested a visit.\n${visit.displayId}`,
        visitorId: visit.displayId || undefined,
        recipientId: adminUser.id,
        recipientRole: adminUser.role,
        targetScreen: 'Approval',
      });
    }

    res.status(201).json(visit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create request' });
  }
};

export const checkVisitor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, email } = req.body;
    if (!phone && !email) {
      res.status(400).json({ error: 'Phone or email is required' });
      return;
    }

    const visitors = await prisma.visitorProfile.findMany({
      where: {
        OR: [
          ...(phone ? [{ phone }] : []),
          ...(email ? [{ email }] : [])
        ]
      }
    });

    res.json({ exists: visitors.length > 0, visitors });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check visitor' });
  }
};

export const getVisitorHosts = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hosts = await prisma.user.findMany({
      where: { role: Role.EMPLOYEE, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, department: true },
    });

    res.json(hosts);
  } catch (error) {
    console.error('getVisitorHosts error:', error);
    res.status(500).json({ error: 'Failed to fetch employee list' });
  }
};

export const createVisitor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email, photoUrl, idType, idNumber } = req.body;
    
    if (!name || !phone) {
      res.status(400).json({ error: 'Name and phone are required' });
      return;
    }

    const existing = await prisma.visitorProfile.findFirst({
      where: {
        OR: [
          { phone },
          ...(email ? [{ email }] : [])
        ]
      }
    });

    if (existing) {
      res.status(400).json({ error: 'Visitor already exists', visitor: existing });
      return;
    }

    const visitor = await prisma.visitorProfile.create({
      data: { name, phone, email, photoUrl, idType, idNumber }
    });

    // Find Admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'keval@swatiswitchgears.com' },
      select: { id: true, role: true }
    });

    if (adminUser) {
      await NotificationService.sendNotification({
        type: 'NEW_VISITOR',
        title: 'New Visitor Added',
        message: `${name} was added to the system. Mobile: ${phone}`,
        visitorId: visitor.id,
        recipientId: adminUser.id,
        recipientRole: adminUser.role,
      });
    }

    // Notify the Visitor that Admin created their profile
    const adminName = (req as any).user?.name || 'Keval V Shah';
    const newVisitorUser = await prisma.user.findUnique({
      where: { phone }
    });

    if (newVisitorUser) {
      await NotificationService.sendNotification({
        type: 'VISITOR_REGISTERED_BY_ADMIN',
        title: 'Registration Complete',
        message: `You have been registered by Admin ${adminName}.`,
        recipientId: newVisitorUser.id,
        channelId: 'max',
        priority: 'high'
      });
    }

    res.status(201).json(visitor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create visitor' });
  }
};

export const updateVisitStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, rejectionReason } = req.body;
    
    // Check if the ID belongs to an Invitation
    const invitation = await prisma.invitation.findUnique({ where: { id } });
    if (invitation) {
      const updatedInv = await prisma.invitation.update({
        where: { id },
        data: { 
          status,
          ...(rejectionReason && { notes: invitation.notes ? `${invitation.notes}\nRejection Reason: ${rejectionReason}` : `Rejection Reason: ${rejectionReason}` })
        }
      });
      if (status === 'APPROVED') {
        const creatorId = invitation.createdBy;
        if (creatorId) {
          await NotificationService.sendNotification({
            recipientId: creatorId,
            type: 'INVITATION_ACCEPTED',
            title: 'Invitation Accepted',
            message: `${invitation.fullName} has accepted your invitation.`,
            targetScreen: 'TotalVisits',
            channelId: 'max',
            priority: 'high',
          }).catch(console.error);
        }
        const visitorUser = await prisma.user.findFirst({
          where: { 
            role: 'VISITOR',
            OR: [
              { phone: invitation.mobile },
              ...(invitation.email ? [{ email: invitation.email }] : [])
            ]
          }
        });
        if (visitorUser) {
          await NotificationService.sendNotification({
            recipientId: visitorUser.id,
            type: 'INVITATION_ACCEPTED',
            title: 'Invitation Accepted',
            message: `You have successfully accepted the invitation.`,
            targetScreen: 'Invitations',
            channelId: 'max',
            priority: 'high',
          }).catch(console.error);
        }
      } else if (status === 'REJECTED') {
        const creatorId = invitation.createdBy;
        if (creatorId) {
          await NotificationService.sendNotification({
            recipientId: creatorId,
            type: 'INVITATION_REJECTED',
            title: 'Invitation Rejected',
            message: `${invitation.fullName} has rejected your invitation.${rejectionReason ? `\nReason: ${rejectionReason}` : ''}`,
            targetScreen: 'TotalVisits',
            channelId: 'max',
            priority: 'high',
          }).catch(console.error);
        }
        const visitorUser = await prisma.user.findFirst({
          where: { 
            role: 'VISITOR',
            OR: [
              { phone: invitation.mobile },
              ...(invitation.email ? [{ email: invitation.email }] : [])
            ]
          }
        });
        if (visitorUser) {
          await NotificationService.sendNotification({
            recipientId: visitorUser.id,
            type: 'INVITATION_REJECTED',
            title: 'Invitation Rejected',
            message: `You have successfully rejected the invitation.`,
            targetScreen: 'Invitations',
            channelId: 'max',
            priority: 'high',
          }).catch(console.error);
        }
      }
      res.status(200).json(updatedInv);
      return;
    }

    // Check if the ID belongs to a NewAppointment
    const appointment = await prisma.newAppointment.findUnique({ where: { id } });
    if (appointment) {
      const updatedApp = await prisma.newAppointment.update({
        where: { id },
        data: { 
          status,
          ...(rejectionReason && { notes: appointment.notes ? `${appointment.notes}\nRejection Reason: ${rejectionReason}` : `Rejection Reason: ${rejectionReason}` })
        }
      });
      if (status === 'APPROVED') {
        const creatorId = appointment.decidedBy;
        if (creatorId) {
          await NotificationService.sendNotification({
            recipientId: creatorId,
            type: 'INVITATION_ACCEPTED',
            title: 'Appointment Accepted',
            message: `${appointment.fullName} has accepted the appointment.`,
            targetScreen: 'TotalVisits',
            channelId: 'max',
            priority: 'high',
          }).catch(console.error);
        }
        const visitorUser = await prisma.user.findFirst({
          where: { 
            role: 'VISITOR',
            OR: [
              { phone: appointment.mobile },
              ...(appointment.email ? [{ email: appointment.email }] : [])
            ]
          }
        });
        if (visitorUser) {
          await NotificationService.sendNotification({
            recipientId: visitorUser.id,
            type: 'INVITATION_ACCEPTED',
            title: 'Appointment Accepted',
            message: `You have successfully accepted the appointment.`,
            targetScreen: 'Invitations',
            channelId: 'max',
            priority: 'high',
          }).catch(console.error);
        }
      } else if (status === 'REJECTED') {
        const creatorId = appointment.decidedBy;
        if (creatorId) {
          await NotificationService.sendNotification({
            recipientId: creatorId,
            type: 'INVITATION_REJECTED',
            title: 'Appointment Rejected',
            message: `${appointment.fullName} has rejected the appointment.${rejectionReason ? `\nReason: ${rejectionReason}` : ''}`,
            targetScreen: 'TotalVisits',
            channelId: 'max',
            priority: 'high',
          }).catch(console.error);
        }
        const visitorUser = await prisma.user.findFirst({
          where: { 
            role: 'VISITOR',
            OR: [
              { phone: appointment.mobile },
              ...(appointment.email ? [{ email: appointment.email }] : [])
            ]
          }
        });
        if (visitorUser) {
          await NotificationService.sendNotification({
            recipientId: visitorUser.id,
            type: 'INVITATION_REJECTED',
            title: 'Appointment Rejected',
            message: `You have successfully rejected the appointment.`,
            targetScreen: 'Invitations',
            channelId: 'max',
            priority: 'high',
          }).catch(console.error);
        }
      }
      res.status(200).json(updatedApp);
      return;
    }

    const visit = await prisma.visit.update({
      where: { id },
      data: { 
        status,
      },
      include: {
        host: true,
        visitor: true
      }
    });

    if (status === 'CHECKED_IN') {
      // Notify Admin and Host via Dispatcher
      await NotificationService.notifyAdminOfVisitorArrival(visit);
      await NotificationService.notifyHostOfVisitorArrival(visit);
    } else if (status === 'APPROVED' && visit.createdBy) {
      const appointmentCount = await prisma.newAppointment.count();
      const visitDate = `${String(visit.scheduledAt.getDate()).padStart(2, '0')}-${String(visit.scheduledAt.getMonth() + 1).padStart(2, '0')}-${visit.scheduledAt.getFullYear()}`;
      const arrivalTime = visit.scheduledAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const creator = await prisma.user.findUnique({
        where: { id: visit.createdBy },
        select: { id: true, name: true },
      });

      await prisma.newAppointment.create({
        data: {
          appointmentId: `APT-${String(appointmentCount + 1).padStart(6, '0')}`,
          fullName: visit.visitor.name,
          mobile: visit.visitor.phone,
          email: visit.visitor.email || null,
          purpose: visit.purpose,
          personToMeet: visit.host.name,
          department: visit.host.department || null,
          visitDate,
          arrivalTime,
          status: 'APPROVED',
          decidedAt: new Date(),
          decidedBy: creator?.id || null,
          decidedByName: creator?.name || 'Keval V Shah',
        },
      });
      await prisma.qrCode.upsert({
        where: { visitId: visit.id },
        update: {},
        create: {
          visitId: visit.id,
          token: randomUUID(),
          expiresAt: (() => {
            const expiresAt = new Date(visit.scheduledAt);
            expiresAt.setHours(23, 59, 59, 999);
            return expiresAt;
          })(),
        },
      });

      await NotificationService.sendNotification({
        type: 'INVITATION_ACCEPTED',
        title: 'Invitation Accepted',
        message: `${visit.visitor.name} has accepted your invitation.`,
        visitId: visit.id,
        recipientId: visit.host.id,
        recipientRole: visit.host.role,
        targetScreen: 'Visitors',
        data: { visitId: visit.id }
      });
      await NotificationService.sendRoleNotification('SUPER_ADMIN', {
        type: 'INVITATION_ACCEPTED',
        title: 'Invitation Accepted',
        message: `${visit.visitor.name} has accepted an invitation from ${visit.host.name}.`,
        visitId: visit.id,
        targetScreen: 'Approvals',
        data: { visitId: visit.id }
      });
      const visitorUser = await prisma.user.findFirst({
        where: {
          role: Role.VISITOR,
          OR: [
            { phone: visit.visitor.phone },
            ...(visit.visitor.email ? [{ email: visit.visitor.email }] : []),
          ],
        },
        select: { id: true, role: true },
      });

      if (visitorUser) {
        await NotificationService.sendNotification({
          type: 'INVITATION_ACCEPTED_VISITOR',
          title: 'Invitation Accepted',
          message: `Your visit with ${visit.host.name} is confirmed.`,
          visitId: visit.id,
          recipientId: visitorUser.id,
          recipientRole: visitorUser.role,
          targetScreen: 'TotalVisits',
          data: { visitId: visit.id },
        });
      }
    } else if (status === 'REJECTED' && visit.createdBy) {
      await NotificationService.sendNotification({
        type: 'INVITATION_REJECTED',
        title: 'Invitation Rejected',
        message: `${visit.visitor.name} rejected your invitation. Reason: ${rejectionReason || 'No reason provided'}.`,
        visitId: visit.id,
        recipientId: visit.host.id,
        recipientRole: visit.host.role,
        targetScreen: 'Visitors',
        data: { visitId: visit.id }
      });
      await NotificationService.sendRoleNotification('SUPER_ADMIN', {
        type: 'INVITATION_REJECTED',
        title: 'Invitation Rejected',
        message: `${visit.visitor.name} rejected an invitation from ${visit.host.name}. Reason: ${rejectionReason || 'None'}`,
        visitId: visit.id,
        targetScreen: 'Approvals',
        data: { visitId: visit.id }
      });
    }

    res.json(visit);
  } catch (error: any) {
    console.error('updateVisitStatus error:', error);
    res.status(500).json({ error: 'Failed to update status', details: error.message || String(error) });
  }
};

export const getMyVisitorVisits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { email: true, phone: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const visitorProfile = await prisma.visitorProfile.findFirst({
      where: {
        OR: [
          ...(user.email ? [{ email: user.email }] : []),
          ...(user.phone ? [{ phone: user.phone }] : []),
        ],
      },
    });

    if (!visitorProfile) {
      res.json([]);
      return;
    }

    const filter = String(req.query.filter || 'all');
    const statuses =
      filter === 'requests'
        ? [VisitStatus.PENDING]
        : filter === 'total'
          ? [VisitStatus.APPROVED, VisitStatus.CHECKED_IN, VisitStatus.COMPLETED]
          : filter === 'history'
            ? [VisitStatus.COMPLETED]
          : undefined;

    const visits = await prisma.visit.findMany({
      where: {
        visitorId: visitorProfile.id,
        ...(statuses ? { status: { in: statuses } } : {}),
      },
      include: {
        visitor: { select: { name: true, phone: true } },
        host: { select: { id: true, name: true, department: true } },
        qrCode: { select: { token: true, expiresAt: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    res.json(visits);
  } catch (error) {
    console.error('getMyVisitorVisits error:', error);
    res.status(500).json({ error: 'Failed to fetch visitor visits' });
  }
};

export const getVisitorInvitations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { email: true, phone: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const visitorProfile = await prisma.visitorProfile.findFirst({
      where: {
        OR: [
          { email: user.email },
          { phone: user.phone || '' }
        ]
      }
    });

    // Fetch from Invitation table
    const invitations = await prisma.invitation.findMany({
      where: {
        OR: [
          { mobile: user.phone || '' },
          { email: user.email }
        ],
        status: { in: ['PENDING', 'APPROVED'] }
      },
    });

    // Fetch from NewAppointment table
    const newAppointments = await prisma.newAppointment.findMany({
      where: {
        OR: [
          { mobile: user.phone || '' },
          { email: user.email }
        ],
        status: { in: ['REGISTERED', 'PENDING', 'APPROVED'] }
      },
    });

    // Helper to parse dates
    const parseDateTime = (visitDate?: string, arrivalTime?: string | null) => {
      let scheduledAt = new Date();
      try {
        if (visitDate) {
          const [day, month, year] = visitDate.split('-');
          let hours = 12, minutes = 0;
          if (arrivalTime) {
            const timeMatch = arrivalTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
            if (timeMatch) {
              hours = parseInt(timeMatch[1], 10);
              minutes = parseInt(timeMatch[2], 10);
              const ampm = timeMatch[3]?.toUpperCase();
              if (ampm === 'PM' && hours < 12) hours += 12;
              if (ampm === 'AM' && hours === 12) hours = 0;
            }
          }
          scheduledAt = new Date(Number(year), Number(month) - 1, Number(day), hours, minutes);
        }
      } catch (e) {}
      return scheduledAt;
    };

    // Map invitations
    const mappedInvitations = invitations.map((inv) => ({
      id: inv.id,
      displayId: inv.invitationId,
      visitorId: visitorProfile?.id || null,
      hostId: inv.createdBy,
      createdBy: inv.createdBy,
      createdByName: inv.createdByName || null,
      purpose: inv.purpose,
      status: inv.status,
      scheduledAt: parseDateTime(inv.visitDate, inv.arrivalTime),
      createdAt: inv.createdAt,
      host: { name: inv.personToMeet || 'Employee' },
      visitor: { name: inv.fullName }
    }));

    // Map new appointments
    const mappedAppointments = newAppointments.map((app) => ({
      id: app.id,
      displayId: app.appointmentId,
      visitorId: visitorProfile?.id || null,
      hostId: app.decidedBy,
      createdBy: app.decidedBy,
      createdByName: app.decidedByName || null,
      purpose: app.purpose,
      status: app.status,
      scheduledAt: parseDateTime(app.visitDate, app.arrivalTime),
      createdAt: app.createdAt,
      host: { name: app.personToMeet || 'Employee' },
      visitor: { name: app.fullName }
    }));

    // Combine and sort by createdAt descending
    const combined = [...mappedInvitations, ...mappedAppointments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json(combined);
  } catch (error) {
    console.error('getVisitorInvitations error:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
};





