import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, RefreshControl, ActivityIndicator, useWindowDimensions, Modal, Pressable } from 'react-native';
import { Users, Clock, History, CalendarPlus, LogOut, Bell, X, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNotifications, AppNotification } from '../../services/notifications';
import { EmployeeDashboardStats, getEmployeeDashboard } from '../../services/employee';
import api from '../../services/api';

export default function EmployeeDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user, clearAuth } = useAuthStore();
  const employeeName = user?.name || 'Employee';

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
          const url = `/new-appointments?all=true&personToMeet=${encodeURIComponent(user.name)}`;
          const res = await api.get(url);
          if (Array.isArray(res.data)) {
            approvalsCount = res.data.length;
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
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Uniform clean color scheme for all cards
  const cards = [
    {
      title: 'Approvals',
      value: stats.approvals || 0,
      icon: <Check color="#2563eb" size={22} />,
      onPress: () => router.push('/(employee)/approvals'),
    },
    {
      title: 'New Visitor',
      value: stats.newVisitors,
      icon: <CalendarPlus color="#2563eb" size={22} />,
      onPress: () => router.push('/(employee)/invitations'),
    },
    {
      title: 'My Visitors',
      value: stats.myVisitors,
      icon: <Clock color="#2563eb" size={22} />,
      onPress: () => router.push('/(employee)/visitors?filter=my'),
    },
    {
      title: 'Upcoming Today',
      value: stats.upcoming,
      icon: <Users color="#2563eb" size={22} />,
      onPress: () => router.push('/(employee)/visitors?filter=upcoming'),
    },
    {
      title: 'Recent Visits',
      value: stats.recent,
      icon: <History color="#2563eb" size={22} />,
      onPress: () => router.push('/(employee)/visitors?filter=recent'),
    }
  ];

    const numColumns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
    const gap = 12;
  const padding = width >= 768 ? 48 : 32;
  const availableWidth = width - padding - (numColumns - 1) * gap;
  const cardWidth = Math.max(140, availableWidth / numColumns);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Sticky Header */}
      <View className="bg-white border-b border-gray-200 px-4 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-lg font-bold text-gray-950">Employee</Text>
          <TouchableOpacity
            onPress={handleOpenNotifications}
            className="h-11 w-11 items-center justify-center rounded-full bg-gray-100 mr-2"
          >
            <Bell color="#111827" size={21} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setLogoutVisible(true)}
            className="h-11 w-11 items-center justify-center rounded-full bg-red-50"
          >
            <LogOut color="#dc2626" size={21} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: width >= 768 ? 24 : 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
      >
        <Text className="text-xl font-bold text-gray-950">Welcome, {employeeName}</Text>
        <Text className="mt-1 text-base text-gray-600">Here is your daily summary</Text>

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
          <View className="mt-6 flex-row flex-wrap justify-center" style={{ gap }}>
            {cards.map((card) => (
              <TouchableOpacity
                key={card.title}
                onPress={card.onPress}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                style={{ width: cardWidth, aspectRatio: 1, maxWidth: 220 }}
                activeOpacity={0.78}
              >
                <View className="mb-3 h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
                  {card.icon}
                </View>
                <Text className="min-h-[40px] text-sm font-semibold leading-5 text-gray-700">{card.title}</Text>
                <View className="flex-1 justify-end">
                  <Text className="text-3xl font-bold text-gray-950">{String(card.value).padStart(2, '0')}</Text>
                  <Text className="mt-2 text-sm font-semibold text-blue-700">View -&gt;</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Logout Modal */}
      <Modal transparent visible={isLogoutVisible} animationType="fade" onRequestClose={() => setLogoutVisible(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/50 px-6" onPress={() => setLogoutVisible(false)}>
          <Pressable className="w-full max-w-sm rounded-lg bg-white p-6" onPress={(event) => event.stopPropagation()}>
            <Text className="text-center text-xl font-bold text-gray-950">Logout?</Text>
            <Text className="mt-4 text-center text-base leading-6 text-gray-600">
              Are you sure you want to logout?
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

      {/* Notifications Modal */}
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
