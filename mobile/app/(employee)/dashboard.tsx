import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNotifications, AppNotification } from '../../services/notifications';
import { EmployeeDashboardStats, getEmployeeDashboard } from '../../services/employee';
import api from '../../services/api';
import EmployeeDashboardHeader from '../../components/employee/EmployeeDashboardHeader';
import EmployeeWelcomeCard from '../../components/employee/EmployeeWelcomeCard';
import EmployeeDailySummary from '../../components/employee/EmployeeDailySummary';

export default function EmployeeDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, clearAuth } = useAuthStore();
  const employeeName = user?.name ? user.name.split(' ')[0] : 'Employee';

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isLogoutVisible, setLogoutVisible] = useState(false);
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [stats, setStats] = useState<EmployeeDashboardStats & { approvals?: number }>({
    myVisitors: 0,
    newVisitors: 0,
    upcoming: 0,
    inside: 0,
    recent: 0,
    approvals: 0,
  });

  const loadDashboard = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const dashboardStats = await getEmployeeDashboard();
      let approvalsCount = 0;
      if (user?.name) {
        try {
          const url = `/new-appointments?personToMeet=${encodeURIComponent(user.name)}`;
          const res = await api.get(url);
          if (Array.isArray(res.data)) {
            approvalsCount = res.data.filter((a: any) => a.status === 'REGISTERED').length;
          }
        } catch (e) {}
      }
      setStats({ ...dashboardStats, approvals: approvalsCount });
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleLogout = async () => {
    setLogoutVisible(false);
    await clearAuth();
    router.replace('/(auth)/login');
  };

  const handleOpenNotifications = async () => {
    setNotificationsVisible(true);
    setLoadingNotifications(true);
    try {
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNavigate = (destination: string) => {
    if (destination === 'approvals') {
      router.push('/(employee)/approvals');
    } else if (destination === 'new-appointment') {
      router.push('/(employee)/new-appointment');
    } else if (destination === 'visitors') {
      router.push('/(employee)/visitors?filter=my');
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: insets.bottom + 110,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2864DC']}
            tintColor="#2864DC"
          />
        }
      >
        {/* Header Section */}
        <EmployeeDashboardHeader
          onNotificationsPress={handleOpenNotifications}
          onLogoutPress={() => setLogoutVisible(true)}
          hasUnreadNotifications={true}
        />

        {/* Welcome Card */}
        <EmployeeWelcomeCard userName={employeeName} roleBadgeText="EMPLOYEE" />

        {/* Loading / Error States */}
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2864DC" />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadDashboard} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Daily Summary Section (Single Shared Card with 3 Columns) */
          <EmployeeDailySummary stats={stats} onNavigate={handleNavigate} />
        )}
      </ScrollView>

      {/* Logout Modal */}
      <Modal transparent visible={isLogoutVisible} animationType="fade" onRequestClose={() => setLogoutVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setLogoutVisible(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Logout?</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                onPress={() => setLogoutVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogout}
                style={styles.confirmLogoutButton}
              >
                <Text style={styles.confirmLogoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Notifications Modal */}
      <Modal transparent visible={isNotificationsVisible} animationType="fade" onRequestClose={() => setNotificationsVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setNotificationsVisible(false)}>
          <Pressable style={styles.notificationsModalBox} onPress={(e) => e.stopPropagation()}>
            <View style={styles.notificationsHeaderRow}>
              <Text style={styles.notificationsTitle}>Notifications</Text>
              <TouchableOpacity
                onPress={() => setNotificationsVisible(false)}
                style={styles.closeModalButton}
              >
                <X color="#374151" size={21} />
              </TouchableOpacity>
            </View>

            {loadingNotifications ? (
              <View style={styles.notificationsLoading}>
                <ActivityIndicator size="small" color="#2864DC" />
                <Text style={styles.loadingNotificationsText}>Loading...</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                  <Text style={styles.emptyNotificationsText}>No notifications available.</Text>
                ) : (
                  notifications.map((notif) => (
                    <View key={notif.id} style={styles.notificationItem}>
                      <Text style={styles.notificationItemTitle}>{notif.title}</Text>
                      <Text style={styles.notificationItemMessage}>{notif.message}</Text>
                      <Text style={styles.notificationItemTime}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    marginTop: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#748094',
    fontWeight: '500',
  },
  errorContainer: {
    marginTop: 32,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    padding: 16,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#B91C1C',
  },
  retryButton: {
    marginTop: 12,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '800',
    color: '#172033',
  },
  modalMessage: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: '#748094',
  },
  modalActionsRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    height: 46,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontWeight: '600',
    color: '#334155',
  },
  confirmLogoutButton: {
    height: 46,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#DC2626',
  },
  confirmLogoutButtonText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notificationsModalBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  notificationsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  notificationsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172033',
  },
  closeModalButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationsLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingNotificationsText: {
    marginTop: 8,
    fontSize: 13,
    color: '#748094',
  },
  emptyNotificationsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#748094',
  },
  notificationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notificationItemTitle: {
    fontWeight: '700',
    color: '#172033',
    fontSize: 14,
  },
  notificationItemMessage: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  notificationItemTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
});
