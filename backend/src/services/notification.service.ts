import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { prisma, io } from '../app';

const expo = new Expo();

export interface SendNotificationPayload {
  recipientId?: string;
  recipientRole?: string;
  type: string;
  title: string;
  message: string;
  visitorId?: string;
  visitId?: string;
}

export class NotificationService {
  /**
   * Broadcasts a notification to an entire role group (e.g. all ADMINs)
   */
  static async sendRoleNotification(role: string, payload: Omit<SendNotificationPayload, 'recipientId' | 'recipientRole'>) {
    const users = await prisma.user.findMany({ where: { role: role as any } });
    if (!users.length) return;

    for (const user of users) {
      await this.sendNotification({
        ...payload,
        recipientId: user.id,
        recipientRole: role
      });
    }
  }

  /**
   * Sends a notification to a specific user, saving it to DB, emitting via Socket.IO, and sending via Expo Push
   */
  static async sendNotification(payload: SendNotificationPayload) {
    // 1. Save to Database
    const notification = await prisma.notification.create({
      data: {
        recipientId: payload.recipientId,
        recipientRole: payload.recipientRole,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        visitorId: payload.visitorId,
        visitId: payload.visitId,
      }
    });

    // 2. Real-Time Emission via Socket.IO
    if (payload.recipientId) {
      io.to(payload.recipientId).emit('new_notification', notification);
    } else if (payload.recipientRole) {
      io.emit('new_role_notification', notification);
    }

    // 3. Expo Push Notification
    if (payload.recipientId) {
      const pushTokens = await prisma.pushToken.findMany({
        where: { userId: payload.recipientId, isActive: true }
      });

      if (pushTokens.length > 0) {
        const messages: ExpoPushMessage[] = [];
        for (const pt of pushTokens) {
          if (!Expo.isExpoPushToken(pt.token)) {
            console.error(`Push token ${pt.token} is not a valid Expo push token`);
            continue;
          }
          messages.push({
            to: pt.token,
            sound: 'default',
            title: payload.title,
            body: payload.message,
            data: { 
              type: payload.type,
              visitorId: payload.visitorId,
              visitId: payload.visitId,
              notificationId: notification.id
            },
          });
        }

        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          try {
            await expo.sendPushNotificationsAsync(chunk);
          } catch (error) {
            console.error('Error sending push notification chunk:', error);
          }
        }
      }
    }

    return notification;
  }
}
