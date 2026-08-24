import { Request, Response } from 'express';
import { prisma } from '../app';
import { VisitStatus } from '@prisma/client';

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

export const updateVisitStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const visit = await prisma.visit.update({
      where: { id },
      data: { status }
    });
    res.json(visit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};
