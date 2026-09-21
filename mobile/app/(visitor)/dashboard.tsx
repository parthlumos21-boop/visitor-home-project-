import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { ClipboardList, Clock, History, Plus, LogOut, ChevronRight, Shield, Bell, ArrowRight, Users, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { getMyVisitorStats } from '../../services/visits';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VisitorDashboard() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({ totalVisits: 0, appointmentRequests: 0, visitHistory: 0 });

  const loadStats = async () => {
    try {
      const data = await getMyVisitorStats();
      setStats({
        totalVisits: data?.totalVisits || 0,
        appointmentRequests: data?.appointmentRequests || 0,
        visitHistory: data?.visitHistory || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => {
        clearAuth();
        router.replace('/(auth)/login');
      }}
    ]);
  };

  const handleCardPress = (title: string, routeName: string) => {
    try {
      router.push(`/(visitor)/${routeName}`);
    } catch(err) {
      console.error(`Error navigating to ${title}:`, err);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: Math.max(insets.top, 16) + 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
      >
        <View className="flex-row justify-between items-center mb-6 px-1">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center mr-3 shadow-sm">
              <Shield color="#ffffff" size={20} />
            </View>
            <View>
              <Text className="text-[22px] font-black text-gray-900 tracking-tight leading-tight">Visitor</Text>
              <Text className="text-[12px] text-gray-500 font-medium leading-tight">Smart Visitor Management</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => {}} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full border border-gray-200 mr-2 relative">
              <Bell color="#4b5563" size={20} />
              <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full border border-gray-200">
              <LogOut color="#4b5563" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-blue-50 rounded-3xl p-5 mb-6 shadow-sm border border-blue-100 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="flex-1 pr-2">
              <Text className="text-[19px] font-bold text-gray-900 mb-0.5" numberOfLines={1}>Welcome, {user?.name?.split(' ')[0] || 'Visitor'}</Text>
              <Text className="text-sm text-gray-500">Your Visitor Dashboard</Text>
            </View>
          </View>
          <View className="bg-blue-600 px-3 py-1.5 rounded-md shadow-sm ml-2">
            <Text className="text-[10px] font-bold text-white tracking-widest">VISITOR</Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-4 px-1">
          <View className="flex-row items-center">
            <View className="w-1 h-6 bg-blue-600 rounded-full mr-2" />
            <Text className="text-lg font-extrabold text-gray-900">Your Visit Overview</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-between px-1">
          {/* Card 1: Total Visits */}
          <TouchableOpacity onPress={() => handleCardPress('Total Visits', 'total-visits')} className="bg-white rounded-[16px] p-4 mb-3 w-[48%] shadow-sm border border-gray-100 active:opacity-70 justify-between min-h-[120px]">
            <View className="flex-row items-start justify-between">
              <View className="bg-blue-50 w-10 h-10 rounded-xl items-center justify-center">
                <Users color="#2563eb" size={20} />
              </View>
            </View>
            <View className="mt-3">
              <Text className="text-gray-900 font-bold text-[14px] leading-tight mb-1">Total Visits</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-[22px] font-black text-gray-900">{String(stats.totalVisits).padStart(2, '0')}</Text>
                <ArrowRight color="#9ca3af" size={16} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 2: Appointment Requests */}
          <TouchableOpacity onPress={() => handleCardPress('Appointment Requests', 'appointment-requests')} className="bg-white rounded-[16px] p-4 mb-3 w-[48%] shadow-sm border border-gray-100 active:opacity-70 justify-between min-h-[120px]">
            <View className="flex-row items-start justify-between">
              <View className="bg-emerald-50 w-10 h-10 rounded-xl items-center justify-center">
                <Calendar color="#10b981" size={20} />
              </View>
            </View>
            <View className="mt-3">
              <Text className="text-gray-900 font-bold text-[14px] leading-tight mb-1">Appointments</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-[22px] font-black text-gray-900">{String(stats.appointmentRequests).padStart(2, '0')}</Text>
                <ArrowRight color="#9ca3af" size={16} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 3: Visit History */}
          <TouchableOpacity onPress={() => handleCardPress('Visit History', 'visit-history')} className="bg-white rounded-[16px] p-4 mb-3 w-[48%] shadow-sm border border-gray-100 active:opacity-70 justify-between min-h-[120px]">
            <View className="flex-row items-start justify-between">
              <View className="bg-indigo-50 w-10 h-10 rounded-xl items-center justify-center">
                <History color="#6366f1" size={20} />
              </View>
            </View>
            <View className="mt-3">
              <Text className="text-gray-900 font-bold text-[14px] leading-tight mb-1">Visit History</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-[12px] font-bold text-[#6366f1] mr-1">View All</Text>
                <ArrowRight color="#6366f1" size={12} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => router.push('/(visitor)/new-registration')}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg shadow-blue-600/50"
      >
        <Plus color="#ffffff" size={28} />
      </TouchableOpacity>
    </View>
  );
}
