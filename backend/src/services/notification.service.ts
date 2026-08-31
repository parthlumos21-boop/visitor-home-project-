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
  targetScreen?: string;
  data?: Record<string, any>;
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
        // @ts-ignore - targetScreen is in schema.prisma but Prisma client types are cached/stale
        targetScreen: payload.targetScreen,
        data: payload.data ? payload.data : null,
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
            categoryId: payload.type,
            data: { 
              type: payload.type,
              visitorId: payload.visitorId,
              visitId: payload.visitId,
              notificationId: notification.id,
              targetScreen: payload.targetScreen,
              ...(payload.data || {})
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

  // --- NotificationDispatcher Logic ---

  static async notifyAdminOfNewAppointment(appointment: any) {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'keval@swatiswitchgears.com' },
      select: { id: true, role: true }
    });
    if (adminUser) {
      return this.sendNotification({
        type: 'NEW_APPOINTMENT_REQUEST',
        title: '🔔 New Appointment Request',
        message: `${appointment.fullName} has requested a visitor appointment.\n${appointment.appointmentId}`,
        recipientId: adminUser.id,
        recipientRole: adminUser.role,
        targetScreen: 'Approval',
        data: { appointmentId: appointment.appointmentId }
      });
    }
  }

  static async notifyHostOfAppointmentApproval(appointment: any) {
    const employeeUser = await prisma.user.findFirst({
      where: { name: appointment.personToMeet, role: 'EMPLOYEE' },
      select: { id: true, role: true }
    });
    if (employeeUser) {
      return this.sendNotification({
        type: 'APPOINTMENT_APPROVED',
        title: 'Appointment Approved',
        message: `Your appointment has been approved.\n${appointment.appointmentId}`,
        visitorId: appointment.appointmentId,
        recipientId: employeeUser.id,
        recipientRole: employeeUser.role,
        targetScreen: 'VisitDetails',
        data: { appointmentId: appointment.appointmentId }
      });
    }
  }

  static async notifyVisitorOfApproval(appointment: any) {
    if (!appointment.mobile) return;
    const visitorUser = await prisma.user.findUnique({
      where: { phone: appointment.mobile },
      select: { id: true, role: true }
    });
    if (visitorUser) {
      return this.sendNotification({
        type: 'APPOINTMENT_APPROVED',
        title: '✅ Appointment Approved',
        message: `Your appointment has been approved.\n${appointment.appointmentId}`,
        visitorId: appointment.appointmentId,
        recipientId: visitorUser.id,
        recipientRole: visitorUser.role,
        targetScreen: 'VisitDetails',
        data: { appointmentId: appointment.appointmentId }
      });
    }
  }

  static async notifyVisitorOfRejection(appointment: any) {
    if (!appointment.mobile) return;
    const visitorUser = await prisma.user.findUnique({
      where: { phone: appointment.mobile },
      select: { id: true, role: true }
    });
    if (visitorUser) {
      return this.sendNotification({
        type: 'APPOINTMENT_REJECTED',
        title: '❌ Appointment Rejected',
        message: `Your appointment has been rejected.\n${appointment.appointmentId}`,
        visitorId: appointment.appointmentId,
        recipientId: visitorUser.id,
        recipientRole: visitorUser.role,
        targetScreen: 'VisitDetails',
        data: { appointmentId: appointment.appointmentId, rejectionReason: appointment.rejectionReason }
      });
    }
  }

  static async notifyAdminOfVisitorArrival(visit: any) {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'keval@swatiswitchgears.com' },
      select: { id: true, role: true }
    });
    if (adminUser) {
      return this.sendNotification({
        type: 'VISITOR_CHECKED_IN',
        title: 'Visitor Checked In',
        message: `${visit.visitor.name} has arrived at the gate.\n${visit.displayId || visit.id}`,
        visitId: visit.id,
        recipientId: adminUser.id,
        recipientRole: adminUser.role,
        targetScreen: 'VisitDetails',
        data: { visitId: visit.id }
      });
    }
  }

  static async notifyHostOfVisitorArrival(visit: any) {
    return this.sendNotification({
      type: 'VISITOR_CHECKED_IN',
      title: '🔔 Visitor Arrived',
      message: `${visit.visitor.name} has arrived at the gate.\n${visit.displayId || visit.id}`,
      visitId: visit.id,
      recipientId: visit.host.id,
      recipientRole: visit.host.role,
      targetScreen: 'VisitDetails',
      data: { visitId: visit.id }
    });
  }

  static async notifySystemAlert(role: string, message: string) {
    return this.sendRoleNotification(role, {
      type: 'SYSTEM_ALERT',
      title: 'System Alert',
      message
    });
  }
}
