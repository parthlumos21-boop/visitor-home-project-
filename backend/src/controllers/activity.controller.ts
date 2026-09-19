import { Request, Response } from 'express';
import { prisma } from '../app';

export const logMobileActivity = async (req: Request, res: Response): Promise<void> => {
  const { event, screen, action, method, url, status, message, metadata, userEmail, userRole } = req.body || {};
  const activity = {
    time: new Date().toISOString(),
    event,
    screen,
    action,
    method,
    url,
    status,
    message,
    userEmail,
    userRole,
    metadata,
  };

  console.log('[Mobile Activity]', JSON.stringify(activity));

  try {
    await prisma.activityLog.create({
      data: {
        event: event || 'mobile_activity',
        screen,
        action,
        method,
        url,
        status: status === undefined || status === null ? null : String(status),
        message,
        userEmail,
        userRole,
        metadata: metadata || undefined,
      },
    });
  } catch (error) {
    console.error('[Mobile Activity DB Error]', error);
  }

  res.status(204).send();
};
