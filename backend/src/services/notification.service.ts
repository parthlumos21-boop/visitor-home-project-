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
  channelId?: string;
  priority?: string;
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

        console.log(`[Push Dispatcher] Beaming high-priority lock screen notification to channel [max]`);
        messages.push({
          to: pt.token,
          sound: 'default',
          priority: 'high',
          channelId: 'max',
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

      // Send notifications individually (to prevent PUSH_TOO_MANY_EXPERIENCE_IDS crashes) but CONCURRENTLY to avoid API timeouts
      await Promise.all(messages.map(async (msg) => {
        try {
          const tickets = await expo.sendPushNotificationsAsync([msg]);
          console.log('[Push] Expo tickets response:', JSON.stringify(tickets));
          tickets.forEach((ticket) => {
            if (ticket.status === 'error') {
              console.error(`[Push Error] Expo server rejected push notification to token ${msg.to}`);
              console.error(`[Push Error Details] ${ticket.message} (Code: ${ticket.details?.error})`);
            }
          });
        } catch (error) {
          console.error(`[Push] Error sending push notification to token ${msg.to}:`, error);
        }
      }));
    }

    return notification;
  }

  static async notifyAdminOfNewAppointment(appointment: any) {
    console.log(`[Push Notification] Preparing to notify Admin of new appointment: ${appointment.appointmentId}`);
    const payload = {
      type: 'NEW_APPOINTMENT_REQUEST',
      title: 'New Appointment Request',
      message: `${appointment.fullName} has requested a visitor appointment.\n${appointment.appointmentId}`,
      targetScreen: 'Approval',
      data: { appointmentId: appointment.appointmentId },
      channelId: 'max',
      priority: 'high',
    };

    const superAdmins = await prisma.user.findMany({
      where: {
        OR: [
          { role: Role.SUPER_ADMIN, status: 'ACTIVE' },
          { email: 'keval@swatiswitchgears.com' }
        ]
      },
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

    console.log(`[Push] New appointment ${appointment.appointmentId}: no active admins found to notify.`);
    return null;
  }

  static async notifyHostOfNewAppointment(appointment: any) {
    if (!appointment.personToMeet) return;
    
    console.log(`[Push Notification] Preparing to notify Host (${appointment.personToMeet}) of new appointment: ${appointment.appointmentId}`);
    
    const hostUsers = await prisma.user.findMany({
      where: {
        role: Role.EMPLOYEE,
        status: 'ACTIVE',
        OR: [
          { id: appointment.personToMeet },
          { name: appointment.personToMeet }
        ]
      },
      select: { id: true, role: true }
    });

    if (hostUsers.length > 0) {
      console.log(`[Push Notification] Found ${hostUsers.length} Host(s) (${appointment.personToMeet}). Dispatching push notification...`);
      for (const hostUser of hostUsers) {
        await this.sendNotification({
          type: 'NEW_APPOINTMENT_REQUEST',
          title: 'New Visitor Request',
          message: `${appointment.fullName} is requesting to meet with you.\n${appointment.appointmentId}`,
          visitorId: appointment.appointmentId,
          recipientId: hostUser.id,
          recipientRole: hostUser.role,
          targetScreen: 'Approval',
          channelId: 'max',
          priority: 'high',
          data: { appointmentId: appointment.appointmentId }
        });
      }
    } else {
      console.log(`[Push Notification] Host (${appointment.personToMeet}) not found in User collection or not ACTIVE. Push skipped.`);
    }
  }

  static async notifyVisitorOfNewAppointment(appointment: any) {
    console.log(`[Push Notification] Checking User collection for Visitor email: ${appointment.email}`);
    if (!appointment.email) {
      console.log(`[Push Notification] No email provided in appointment ${appointment.appointmentId}, skipping visitor notification.`);
      return;
    }

    const visitorUser = await prisma.user.findUnique({
      where: { email: appointment.email }
    });

    if (visitorUser) {
      console.log(`[Push Notification] Found Visitor in User collection (ID: ${visitorUser.id}). Dispatching push notification...`);
      return this.sendNotification({
        type: 'NEW_APPOINTMENT_CREATED',
        title: 'Appointment Registered',
        message: `Your appointment request (${appointment.appointmentId}) has been registered.`,
        recipientId: visitorUser.id,
        channelId: 'max',
        priority: 'high',
        targetScreen: 'VisitorAppointments',
        data: { appointmentId: appointment.appointmentId }
      });
    } else {
      console.log(`[Push Notification] Visitor email ${appointment.email} not found in User collection. Push notification skipped.`);
    }
  }

  static async notifyHostOfAppointmentApproval(appointment: any) {
    const employeeUser = await prisma.user.findFirst({
      where: {
        role: Role.EMPLOYEE,
        status: 'ACTIVE',
        OR: [
          { id: appointment.personToMeet },
          { name: appointment.personToMeet }
        ]
      },
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

  static async notifyVisitorOfApproval(appointment: any, approverName: string = 'Keval V Shah') {
    console.log(`[Push Notification] Checking User collection for Visitor approval: phone=${appointment.mobile}, email=${appointment.email}`);
    if (!appointment.mobile && !appointment.email) {
      console.log(`[Push Notification] No mobile or email provided in appointment ${appointment.appointmentId}, skipping visitor notification.`);
      return;
    }

    const orConditions = [];
    if (appointment.mobile) orConditions.push({ phone: appointment.mobile });
    if (appointment.email) orConditions.push({ email: appointment.email });

    const visitorUsers = await prisma.user.findMany({
      where: { OR: orConditions },
      select: { id: true, role: true }
    });

    if (visitorUsers.length > 0) {
      console.log(`[Push Notification] Found ${visitorUsers.length} Visitor(s) in User collection. Dispatching approval push notification...`);
      for (const visitorUser of visitorUsers) {
        await this.sendNotification({
          type: 'APPOINTMENT_APPROVED',
          title: 'Appointment Approved',
          message: `Your appointment approval is done by ${approverName}.\n${appointment.appointmentId}`,
          visitorId: appointment.appointmentId,
          recipientId: visitorUser.id,
          recipientRole: visitorUser.role,
          channelId: 'max',
          priority: 'high',
          data: { appointmentId: appointment.appointmentId }
        });
      }
    } else {
      console.log(`[Push Notification] Visitor (phone: ${appointment.mobile}, email: ${appointment.email}) not found in User collection. Push notification skipped.`);
    }
  }

  static async notifyVisitorOfRejection(appointment: any) {
    console.log(`[Push Notification] Checking User collection for Visitor rejection: phone=${appointment.mobile}, email=${appointment.email}`);
    if (!appointment.mobile && !appointment.email) {
      console.log(`[Push Notification] No mobile or email provided in appointment ${appointment.appointmentId}, skipping visitor notification.`);
      return;
    }

    const orConditions = [];
    if (appointment.mobile) orConditions.push({ phone: appointment.mobile });
    if (appointment.email) orConditions.push({ email: appointment.email });

    const visitorUsers = await prisma.user.findMany({
      where: { OR: orConditions },
      select: { id: true, role: true }
    });

    if (visitorUsers.length > 0) {
      console.log(`[Push Notification] Found ${visitorUsers.length} Visitor(s) in User collection. Dispatching rejection push notification...`);
      for (const visitorUser of visitorUsers) {
        await this.sendNotification({
          type: 'APPOINTMENT_REJECTED',
          title: 'Appointment Rejected',
          message: `Your appointment has been rejected.\nReason: ${appointment.rejectionReason || 'No reason provided'}\n${appointment.appointmentId}`,
          visitorId: appointment.appointmentId,
          recipientId: visitorUser.id,
          recipientRole: visitorUser.role,
          channelId: 'max',
          priority: 'high',
          targetScreen: 'VisitDetails',
          data: { appointmentId: appointment.appointmentId, rejectionReason: appointment.rejectionReason }
        });
      }
    } else {
      console.log(`[Push Notification] Visitor (phone: ${appointment.mobile}, email: ${appointment.email}) not found in User collection. Push notification skipped.`);
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

  static async notifyAdminOfVisitorCheckOut(visit: any) {
    return this.sendRoleNotification(Role.SUPER_ADMIN, {
      type: 'VISITOR_CHECKED_OUT',
      title: 'Visitor Checked Out',
      message: `${visit.visitor?.name || 'Visitor'} has checked out at the Security Gate.`,
      visitId: visit.id,
      targetScreen: 'VisitDetails',
      data: { visitId: visit.id }
    });
  }

  static async notifyHostOfVisitorCheckOut(visit: any) {
    return this.sendNotification({
      type: 'VISITOR_CHECKED_OUT',
      title: 'Visitor Checked Out',
      message: `${visit.visitor?.name || 'Visitor'} has completed their visit and checked out at the Security Gate.`,
      visitId: visit.id,
      recipientId: visit.host?.id,
      recipientRole: visit.host?.role,
      targetScreen: 'VisitDetails',
      data: { visitId: visit.id }
    });
  }

}
