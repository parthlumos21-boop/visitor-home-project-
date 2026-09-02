import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { Role } from '@prisma/client';
import { prisma, io } from '../app';

const expo = new Expo();
const ADMIN_EMAIL = 'keval@swatiswitchgears.com';

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
  static async sendRoleNotification(role: Role, payload: Omit<SendNotificationPayload, 'recipientId' | 'recipientRole'>) {
    const users = await prisma.user.findMany({ where: { role, status: 'ACTIVE' } });
    if (!users.length) {
      console.warn(`[Push] No active users found for role ${role}`);
      return [];
    }

    const notifications = [];
    for (const user of users) {
      notifications.push(await this.sendNotification({
        ...payload,
        recipientId: user.id,
        recipientRole: role,
      }));
    }
    return notifications;
  }

  static async sendNotification(payload: SendNotificationPayload) {
    const notification = await prisma.notification.create({
      data: {
        recipientId: payload.recipientId,
        recipientRole: payload.recipientRole,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        visitorId: payload.visitorId,
        visitId: payload.visitId,
        targetScreen: payload.targetScreen,
        data: payload.data ? payload.data : undefined,
      }
    });

    if (payload.recipientId) {
      io.to(payload.recipientId).emit('new_notification', notification);
    } else if (payload.recipientRole) {
      io.emit('new_role_notification', notification);
    }

    if (payload.recipientId) {
      const pushTokens = await prisma.pushToken.findMany({
        where: { userId: payload.recipientId, isActive: true }
      });
      console.log(`[Push] ${payload.type} recipient=${payload.recipientId} tokens=${pushTokens.length}`);

      const messages: ExpoPushMessage[] = [];
      for (const pt of pushTokens) {
        if (!Expo.isExpoPushToken(pt.token)) {
          console.error(`[Push] Invalid Expo token for user ${payload.recipientId}: ${pt.token}`);
          continue;
        }

        messages.push({
          to: pt.token,
          sound: 'default',
          priority: 'high',
          channelId: 'default',
          title: payload.title,
          body: payload.message,
          categoryId: payload.type,
          data: {
            type: payload.type,
            visitorId: payload.visitorId,
            visitId: payload.visitId,
            notificationId: notification.id,
            targetScreen: payload.targetScreen,
            ...(payload.data || {}),
          },
        });
      }

      if (pushTokens.length > 0 && messages.length === 0) {
        console.warn(`[Push] ${payload.type} recipient=${payload.recipientId} has no valid Expo push tokens`);
      }

      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          const tickets = await expo.sendPushNotificationsAsync(chunk);
          console.log('[Push] Expo tickets:', JSON.stringify(tickets));
        } catch (error) {
          console.error('[Push] Error sending push notification chunk:', error);
        }
      }
    }

    return notification;
  }

  static async notifyAdminOfNewAppointment(appointment: any) {
    const payload = {
      type: 'NEW_APPOINTMENT_REQUEST',
      title: 'New Appointment Request',
      message: `${appointment.fullName} has requested a visitor appointment.\n${appointment.appointmentId}`,
      targetScreen: 'Approval',
      data: { appointmentId: appointment.appointmentId },
    };

    const superAdmins = await prisma.user.findMany({
      where: { role: Role.SUPER_ADMIN, status: 'ACTIVE' },
      select: { id: true, role: true, email: true },
    });

    if (superAdmins.length > 0) {
      console.log(`[Push] New appointment ${appointment.appointmentId}: notifying ${superAdmins.length} SUPER_ADMIN user(s)`);
      const notifications = [];
      for (const adminUser of superAdmins) {
        notifications.push(await this.sendNotification({
          ...payload,
          recipientId: adminUser.id,
          recipientRole: adminUser.role,
        }));
      }
      return notifications;
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
      select: { id: true, role: true, email: true },
    });
    if (adminUser) {
      console.log(`[Push] New appointment ${appointment.appointmentId}: notifying fallback admin ${adminUser.email}`);
      return this.sendNotification({
        ...payload,
        recipientId: adminUser.id,
        recipientRole: adminUser.role,
      });
    }

    console.warn(`[Push] New appointment ${appointment.appointmentId}: no SUPER_ADMIN or fallback admin found`);
  }

  static async notifyHostOfAppointmentApproval(appointment: any) {
    const employeeUser = await prisma.user.findFirst({
      where: { name: appointment.personToMeet, role: Role.EMPLOYEE },
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
        title: 'Appointment Approved',
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
        title: 'Appointment Rejected',
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
    return this.sendRoleNotification(Role.SUPER_ADMIN, {
      type: 'VISITOR_CHECKED_IN',
      title: 'Visitor Checked In',
      message: `${visit.visitor.name} has arrived at the gate.\n${visit.displayId || visit.id}`,
      visitId: visit.id,
      targetScreen: 'VisitDetails',
      data: { visitId: visit.id }
    });
  }

  static async notifyHostOfVisitorArrival(visit: any) {
    return this.sendNotification({
      type: 'VISITOR_CHECKED_IN',
      title: 'Visitor Arrived',
      message: `${visit.visitor.name} has arrived at the gate.\n${visit.displayId || visit.id}`,
      visitId: visit.id,
      recipientId: visit.host.id,
      recipientRole: visit.host.role,
      targetScreen: 'VisitDetails',
      data: { visitId: visit.id }
    });
  }

  static async notifySystemAlert(role: Role, message: string) {
    return this.sendRoleNotification(role, {
      type: 'SYSTEM_ALERT',
      title: 'System Alert',
      message
    });
  }
}
