import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, Modal, Pressable, useWindowDimensions, RefreshControl, Image } from 'react-native';
import { Bell, CalendarDays, Clock, LogOut, UserCheck, Users, X, Shield, Plus, ArrowRight } from 'lucide-react-native';
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
      console.log('[Admin Dashboard]', {
        totalVisits: dashboardStats.totalVisits,
        pendingApprovals: dashboardStats.pendingApprovals,
        currentlyInside: dashboardStats.currentlyInside,
        source: 'postgres',
      });
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
      icon: <Users color="#3b82f6" size={26} />,
      onPress: () => router.push('/(admin)/total-visits'),
      badgeColor: 'bg-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Employees',
      value: stats.totalEmployees || 0,
      icon: <UserCheck color="#3b82f6" size={26} />,
      onPress: () => router.push('/(admin)/employees'),
      badgeColor: 'bg-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Security',
      value: stats.totalSecurity || 0,
      icon: <Shield color="#3b82f6" size={26} />,
      onPress: () => router.push('/(admin)/security'),
      badgeColor: 'bg-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  const numColumns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
  const gap = 12;
  const padding = 32;
  const availableWidth = width - padding - (numColumns - 1) * gap;
  const cardWidth = availableWidth / numColumns;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-100 px-4 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 56, height: 56 }}
              resizeMode="contain"
            />
            <View className="w-[1px] h-10 bg-gray-300 mx-3" />
            <View className="flex-col">
              <Text className="text-2xl font-extrabold text-gray-900 leading-tight">Admin</Text>
              <Text className="text-sm font-semibold text-gray-500">System Administrator</Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleOpenNotifications}
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
              className="h-10 w-10 items-center justify-center rounded-full bg-blue-50 mr-3"
              activeOpacity={0.75}
            >
              <Bell color="#1e3a8a" size={20} />
              <View className="absolute top-2 right-2 h-2.5 w-2.5 bg-blue-600 rounded-full border border-white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLogoutVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Logout"
              className="h-10 w-10 items-center justify-center rounded-full bg-blue-50"
              activeOpacity={0.75}
            >
              <LogOut color="#1e3a8a" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
      >
        <View className="flex-row items-center bg-white rounded-xl shadow-sm border-l-4 border-blue-600 p-4 mb-4" style={{ overflow: 'hidden' }}>
          <View className="flex-1 z-10">
            <Text className="text-xl font-extrabold text-gray-900 mb-1" numberOfLines={1}>Welcome, {adminName || 'Admin'}</Text>
            <Text className="text-sm text-gray-500 font-medium">Manage visitors and appointments</Text>
          </View>
          <View className="flex-row items-center ml-2 z-10">
            <TouchableOpacity 
              onPress={() => router.push('/(admin)/add-visitor')} 
              className="h-9 flex-row items-center rounded-lg bg-blue-600 px-3 shadow-sm"
              activeOpacity={0.8}
            >
               <Plus color="#ffffff" size={16} strokeWidth={3} />
               <Text className="ml-1 text-xs font-bold text-white">Appointment</Text>
            </TouchableOpacity>
          </View>
          <View className="absolute -right-3 -top-3 opacity-5">
            <Shield color="#2563eb" size={120} />
          </View>
        </View>

        {isLoading ? (
          <View key="loading" className="mt-12 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-3 text-sm text-gray-500">Loading dashboard...</Text>
          </View>
        ) : error ? (
          <View key="error" className="mt-8 rounded-lg border border-red-100 bg-red-50 p-4">
            <Text className="text-base font-semibold text-red-700">{error}</Text>
            <TouchableOpacity onPress={loadDashboard} className="mt-3 h-11 justify-center rounded-md bg-red-600 px-4">
              <Text className="text-center font-semibold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View key="overview" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
            <View className="mb-3">
              <Text className="text-xl font-bold text-gray-900">Overview</Text>
            </View>
            <View className="flex-row items-start justify-between">
              {cards.map((card) => (
                <TouchableOpacity
                  key={card.title}
                  onPress={card.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${card.title}`}
                  className="flex-1 items-center"
                  activeOpacity={0.8}
                >
                  <View className={`w-14 h-14 rounded-2xl items-center justify-center relative ${card.bgColor}`}>
                    {card.icon}
                    <View className={`absolute -top-2 -right-2 min-w-5 h-5 rounded-full px-1 items-center justify-center border-2 border-white ${card.badgeColor}`}>
                      <Text className="text-[10px] font-bold text-white leading-none">
                        {String(card.value > 99 ? '99+' : card.value)}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs font-medium text-gray-700 mt-2 text-center leading-tight flex-shrink">
                    {card.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!isLoading && !error && (
          <TouchableOpacity 
            onPress={() => router.push('/(admin)/approvals')}
            activeOpacity={0.8}
            className="bg-white rounded-3xl p-4 flex-row items-center shadow-sm border border-gray-100 mb-4"
          >
            <View className="w-12 h-12 rounded-full bg-gray-50 items-center justify-center relative mr-4">
              <Bell color="#4b5563" size={24} />
              <View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            </View>
            <View className="flex-1 justify-center flex-shrink-1">
              <Text className="text-base font-bold text-gray-900 mb-0.5" numberOfLines={1}>Pending visiting approvals</Text>
              <Text className="text-sm text-gray-600" numberOfLines={1}>You have {stats.pendingApprovals} approvals pending!</Text>
            </View>
            <View className="ml-2">
              <Text className="text-sm font-semibold text-blue-600">View All</Text>
            </View>
          </TouchableOpacity>
        )}
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




