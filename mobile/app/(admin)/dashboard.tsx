import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, Modal, Pressable, useWindowDimensions, RefreshControl } from 'react-native';
import { Bell, CalendarDays, Clock, LogOut, UserCheck, Users, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAdminDashboard, AdminDashboardStats } from '../../services/admin';
import { getNotifications, AppNotification } from '../../services/notifications';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../services/errorMessage';

const emptyStats: AdminDashboardStats = {
  totalVisits: 0,
  pendingApprovals: 0,
  currentlyInside: 0,
  appointmentsToday: 0,
  adminName: 'Admin User',
  totalEmployees: 0,
  employeesByDept: {},
};

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, clearAuth } = useAuthStore();
  const [stats, setStats] = useState<AdminDashboardStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLogoutVisible, setLogoutVisible] = useState(false);
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleOpenNotifications = () => {
    setNotificationsVisible(true);
    loadNotifications();
  };

  const adminName = useMemo(() => stats.adminName || user?.name || 'Admin User', [stats.adminName, user?.name]);

  const loadDashboard = useCallback(async () => {
    try {
      setError('');
      const dashboardStats = await getAdminDashboard();
      setStats(dashboardStats);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load dashboard data.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleLogout = async () => {
    setLogoutVisible(false);
    await clearAuth();
    router.replace('/(auth)/login');
  };

  const cards = [
    {
      title: 'Total Visits',
      value: stats.totalVisits,
      icon: <Users color="#2563eb" size={22} />,
      onPress: () => router.push('/(admin)/visitors'),
      accent: 'bg-blue-50',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: <Clock color="#d97706" size={22} />,
      onPress: () => router.push('/(admin)/approvals'),
      accent: 'bg-amber-50',
    },
    {
      title: 'Currently Inside',
      value: stats.currentlyInside,
      icon: <UserCheck color="#059669" size={22} />,
      onPress: () => router.push('/(admin)/visitors?filter=inside'),
      accent: 'bg-emerald-50',
    },
    {
      title: 'Appointments Today',
      value: stats.appointmentsToday,
      icon: <CalendarDays color="#7c3aed" size={22} />,
      onPress: () => router.push('/(admin)/approvals'),
      accent: 'bg-violet-50',
    },
    {
      title: 'Total Employees',
      value: stats.totalEmployees || 0,
      icon: <Users color="#0284c7" size={22} />,
      onPress: () => router.push('/(admin)/employees'),
      accent: 'bg-sky-50',
    },
  ];

  const DEPARTMENTS = [
    { name: 'Marketing Dept', color: 'bg-yellow-400' },
    { name: 'Electrical Design', color: 'bg-sky-400' },
    { name: 'Mechanical Dept', color: 'bg-red-400' },
    { name: 'Production & QC', color: 'bg-orange-300' }, // Peach
    { name: 'Dispatch', color: 'bg-green-400' },
  ];

  // Calculate responsive card width
  const numColumns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
  const gap = 12;
  const padding = 32; // 16 on each side
  const availableWidth = width - padding - (numColumns - 1) * gap;
  const cardWidth = availableWidth / numColumns;

  return (
    <View className="flex-1 bg-gray-50">
      <View
        className="bg-white border-b border-gray-200 px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-xl font-bold text-gray-950">Admin</Text>

          <TouchableOpacity
            onPress={handleOpenNotifications}
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
            className="h-11 w-11 items-center justify-center rounded-full bg-gray-100 mr-2"
            activeOpacity={0.75}
          >
            <Bell color="#111827" size={21} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setLogoutVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Logout"
            className="h-11 w-11 items-center justify-center rounded-full bg-red-50"
            activeOpacity={0.75}
          >
            <LogOut color="#dc2626" size={21} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        <Text className="text-2xl font-bold text-gray-950">Good Morning, {adminName || 'Admin'}</Text>
        <Text className="mt-1 text-base text-gray-600">Manage visitors and appointments</Text>

        {isLoading ? (
          <View className="mt-12 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-3 text-sm text-gray-500">Loading dashboard</Text>
          </View>
        ) : error ? (
          <View className="mt-8 rounded-lg border border-red-100 bg-red-50 p-4">
            <Text className="text-base font-semibold text-red-700">{error}</Text>
            <TouchableOpacity onPress={loadDashboard} className="mt-3 h-11 justify-center rounded-md bg-red-600 px-4">
              <Text className="text-center font-semibold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View 
            className="mt-6 flex-row flex-wrap" 
            style={{ gap: gap }}
          >
            {cards.map((card) => (
              <TouchableOpacity
                key={card.title}
                onPress={card.onPress}
                accessibilityRole="button"
                accessibilityLabel={`View ${card.title}`}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                style={{ width: cardWidth, aspectRatio: 1, maxWidth: 220 }}
                activeOpacity={0.78}
              >
                <View className={`mb-3 h-11 w-11 items-center justify-center rounded-lg ${card.accent}`}>
                  {card.icon}
                </View>
                <Text className="min-h-[40px] text-sm font-semibold leading-5 text-gray-700">{card.title}</Text>
                <View className="flex-1 justify-end">
                  <Text className="text-3xl font-bold text-gray-950">{String(card.value).padStart(2, '0')}</Text>
                  <Text className="mt-2 text-sm font-semibold text-blue-700">{'View ->'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Departments Section */}
        <View className="mt-8 mb-2">
          <Text className="text-lg font-bold text-gray-950 mb-3">Departments</Text>
          <View className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            {DEPARTMENTS.map((dept, index) => (
              <TouchableOpacity
                key={dept.name}
                onPress={() => router.push(`/(admin)/employees?department=${encodeURIComponent(dept.name)}`)}
                className={`flex-row items-center justify-between p-4 ${index !== DEPARTMENTS.length - 1 ? 'border-b border-gray-100' : ''}`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View className={`w-3 h-3 rounded-full ${dept.color} mr-3`} />
                  <Text className="text-base font-semibold text-gray-800">{dept.name}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-sm font-medium text-gray-500 mr-2">
                    {stats.employeesByDept?.[dept.name] || 0} Employees
                  </Text>
                  <Text className="text-gray-400 font-bold">→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mt-8 mb-4">
          <Text className="text-lg font-bold text-gray-950 mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between" style={{ gap: gap }}>
            <TouchableOpacity
              onPress={() => router.push('/(admin)/employees/new')}
              className="bg-blue-600 rounded-lg h-12 justify-center items-center flex-row"
              style={{ width: cardWidth * 2 + gap, maxWidth: 300 }}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">+ Add Employee</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(admin)/employees')}
              className="bg-white border border-gray-200 rounded-lg h-12 justify-center items-center flex-row shadow-sm"
              style={{ width: cardWidth * 2 + gap, maxWidth: 300 }}
              activeOpacity={0.7}
            >
              <Users color="#374151" size={18} />
              <Text className="text-gray-800 font-semibold text-base ml-2">Employees List</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <Modal transparent visible={isLogoutVisible} animationType="fade" onRequestClose={() => setLogoutVisible(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/50 px-6" onPress={() => setLogoutVisible(false)}>
          <Pressable className="w-full max-w-sm rounded-lg bg-white p-6" onPress={(event) => event.stopPropagation()}>
            <Text className="text-center text-xl font-bold text-gray-950">Logout?</Text>
            <Text className="mt-4 text-center text-base leading-6 text-gray-600">
              Are you sure you want to logout from My Gate?
            </Text>
            <View className="mt-6 flex-row justify-between">
              <TouchableOpacity
                onPress={() => setLogoutVisible(false)}
                className="h-12 flex-1 items-center justify-center rounded-md border border-gray-300 bg-white mr-3"
              >
                <Text className="font-semibold text-gray-800">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogout}
                className="h-12 flex-1 items-center justify-center rounded-md bg-red-600"
              >
                <Text className="font-semibold text-white">Logout</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={isNotificationsVisible} animationType="fade" onRequestClose={() => setNotificationsVisible(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/50 px-6" onPress={() => setNotificationsVisible(false)}>
          <Pressable className="w-full max-w-sm rounded-lg bg-white p-5" onPress={(event) => event.stopPropagation()}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-bold text-gray-950">Notifications</Text>
              <TouchableOpacity className="h-11 w-11 items-center justify-center" onPress={() => setNotificationsVisible(false)}>
                <X color="#374151" size={21} />
              </TouchableOpacity>
            </View>
            
            {loadingNotifications ? (
              <View className="py-4 items-center justify-center">
                <ActivityIndicator size="small" color="#2563eb" />
                <Text className="mt-2 text-sm text-gray-500">Loading...</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                  <Text className="mt-3 text-base text-gray-600">No notifications available.</Text>
                ) : (
                  notifications.map((notif) => (
                    <View key={notif.id} className="py-3 border-b border-gray-100">
                      <Text className="font-bold text-gray-900">{notif.title}</Text>
                      <Text className="text-sm text-gray-600 mt-1">{notif.message}</Text>
                      <Text className="text-xs text-gray-400 mt-2">
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
