import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Request, Response } from 'express';
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
    res.json(visits);
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
  } catch (error) {
    console.error('updateVisitStatus error:', error);
    res.status(500).json({ error: 'Failed to update status', details: error.message || String(error) });
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

    if (!visitorProfile) {
      res.json([]);
      return;
    }

    const invitations = await prisma.visit.findMany({
      where: {
        visitorId: visitorProfile.id,
        createdBy: { not: null },
        status: { in: ['PENDING', 'APPROVED'] }
      },
      include: {
        host: {
          select: { name: true }
        },
        visitor: {
          select: { name: true }
        }
      },
      orderBy: { scheduledAt: 'desc' }
    });

    res.json(invitations);
  } catch (error) {
    console.error('getVisitorInvitations error:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
};




