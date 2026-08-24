import { Request, Response } from 'express';
import { prisma } from '../app';
import { VisitStatus } from '@prisma/client';

export const scanQrCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'QR token is required' });
      return;
    }

    const qrCode = await prisma.qrCode.findUnique({
      where: { token },
      include: {
        visit: {
          include: {
            visitor: true,
            host: { select: { name: true, email: true } }
          }
        }
      }
    });

    if (!qrCode) {
      res.status(404).json({ error: 'INVALID QR' });
      return;
    }

    if (new Date() > qrCode.expiresAt) {
      res.status(400).json({ error: 'EXPIRED PASS' });
      return;
    }

    const visit = qrCode.visit;
    if (visit.status !== VisitStatus.APPROVED) {
      res.status(403).json({ error: 'ENTRY NOT APPROVED', status: visit.status });
      return;
    }

    if (visit.checkInAt && !visit.checkOutAt) {
      res.status(400).json({ error: 'VISITOR ALREADY INSIDE' });
      return;
    }

    res.json({ message: 'ALLOW ENTRY', visit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process QR scan' });
  }
};

export const checkInVisitor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { visitId } = req.body;
    const visit = await prisma.visit.update({
      where: { id: visitId },
      data: { 
        checkInAt: new Date(),
        status: VisitStatus.CHECKED_IN
      }
    });
    res.json(visit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check in visitor' });
  }
};

export const checkOutVisitor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { visitId } = req.body;
    const visit = await prisma.visit.update({
      where: { id: visitId },
      data: { 
        checkOutAt: new Date(),
        status: VisitStatus.COMPLETED
      }
    });
    res.json(visit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check out visitor' });
  }
};
