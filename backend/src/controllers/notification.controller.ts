import { Request, Response } from 'express';
import { prisma } from '../app';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { NotificationService } from '../services/notification.service';

export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: userId
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const getUnreadCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const count = await prisma.notification.count({
      where: { recipientId: userId, isRead: false }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const notificationId = String(req.params.id);
    await prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    await prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

export const registerDevice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { token, platform } = req.body;
    if (!token || !userId) {
      res.status(400).json({ error: 'Token and userId are required' });
      return;
    }

    await prisma.pushToken.upsert({
      where: { token },
      update: { userId, isActive: true, platform },
      create: { userId, token, platform, isActive: true }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to register device:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
};

export const unregisterDevice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }
    await prisma.pushToken.deleteMany({
      where: { token, userId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unregister device' });
  }
};

export const testAdminPush = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only super admin can send test push notifications' });
      return;
    }

    const notification = await NotificationService.sendNotification({
      recipientId: req.user.id,
      recipientRole: req.user.role,
      type: 'TEST_PUSH',
      title: 'Test Push Notification',
      message: 'Admin phone push notifications are working.',
      targetScreen: 'Approval',
      data: { test: true },
    });

    res.json({ success: true, notificationId: notification.id });
  } catch (error) {
    console.error('Failed to send test push:', error);
    res.status(500).json({ error: 'Failed to send test push notification' });
  }
};
