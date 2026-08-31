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
      }
    });
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

    res.status(201).json(visitor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create visitor' });
  }
};

export const updateVisitStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const visit = await prisma.visit.update({
      where: { id },
      data: { status },
      include: {
        host: true,
        visitor: true
      }
    });

    if (status === 'CHECKED_IN') {
      // Notify Admin and Host via Dispatcher
      await NotificationService.notifyAdminOfVisitorArrival(visit);
      await NotificationService.notifyHostOfVisitorArrival(visit);
    }

    res.json(visit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};
