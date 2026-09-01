import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import io, { Socket } from 'socket.io-client';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

const isExpoGo = Constants.appOwnership === 'expo';

let useLastNotificationResponse: any = () => null;
if (Platform.OS !== 'web') {
  try {
    const Notifications = require('expo-notifications');
    useLastNotificationResponse = Notifications.useLastNotificationResponse;
  } catch (e) {}
}

// Configure foreground notification behavior for dev/production builds and Expo Go local notifications.
if (Platform.OS !== 'web') {
  import('expo-notifications').then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
      }).catch(e => console.log('Could not configure notification channel', e));
    }
  }).catch(e => console.log('Could not load expo-notifications', e));
}

import { useAuthStore } from '../store/authStore';
import { registerForPushNotificationsAsync } from '../services/push';
import { API_URL } from '../services/apiConfig';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  visitorId?: string;
  visitId?: string;
  targetScreen?: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const router = useRouter();
  const lastNotificationResponse = useLastNotificationResponse();

  // Handle deep linking from push notifications
  useEffect(() => {
    if (lastNotificationResponse && user && token) {
      const data = lastNotificationResponse.notification.request.content.data;
      
      // If we have a targetScreen and identifier, navigate!
      if (data?.targetScreen === 'Approval' && data?.appointmentId) {
        // Give time for UI to settle
        setTimeout(() => {
          router.push(`/(admin)/approvals?appointmentId=${data.appointmentId}`);
        }, 100);
      } else if (data?.targetScreen === 'VisitDetails' && data?.visitId) {
        setTimeout(() => {
          router.push(`/(admin)/visitors`); // Assuming visitors handles visitId similar to approvals
        }, 100);
      } else if (data?.targetScreen === 'VisitDetails' && data?.appointmentId) {
         // Visitor viewing their appointment
         // Assuming visitor app handles appointment deep links
      }

      // Mark this notification as read in backend if we have notificationId
      if (data?.notificationId) {
        markAsRead(String(data.notificationId)).catch(console.error);
      }
    }
  }, [lastNotificationResponse, user, token]);

  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: NotificationItem) => !n.isRead).length);
      }
    } catch (e) {
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const registerDevice = async () => {
    if (!token) return;
    const pushToken = await registerForPushNotificationsAsync();
    if (pushToken) {
      try {
        await fetch(`${API_URL}/api/notifications/register-device`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ token: pushToken, platform: Platform.OS }),
        });
      } catch (e) {
        console.error('Failed to register push token with backend', e);
      }
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      registerDevice();

      // Setup Socket.io
      const newSocket = io(API_URL, {
        auth: { token }
      });

      newSocket.on('connect', () => console.log('Socket connected'));
      
      const handleNewNotification = async (newNotif: NotificationItem) => {
        setNotifications((prev) => {
          // Prevent duplicates if backend accidentally emits multiple
          if (prev.find(n => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
        setUnreadCount((prev) => prev + 1);

        // Trigger native banner and system sound while the app is in the foreground.
        try {
          if (Platform.OS !== 'web') {
            const Notifications = await import('expo-notifications');
            await Notifications.scheduleNotificationAsync({
              content: {
                title: newNotif.title,
                body: newNotif.message,
                sound: true,
              },
              trigger: Platform.OS === 'android' ? { channelId: 'default' } : null,
            });
          }
        } catch (err) {
          console.log('Could not trigger system sound', err);
        }

        // Display Instagram-style in-app toast notification
        Toast.show({
          type: 'instagram',
          text1: newNotif.title,
          text2: newNotif.message,
          position: 'top',
          visibilityTime: 4000,
          autoHide: true,
          topOffset: 50,
        });
      };

      newSocket.on('new_notification', handleNewNotification);
      newSocket.on('new_role_notification', handleNewNotification);

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user, token]);

  // Handle AppState changes (e.g. returning from background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user && token) {
        fetchNotifications();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user, token]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      error,
      refreshNotifications: fetchNotifications,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
