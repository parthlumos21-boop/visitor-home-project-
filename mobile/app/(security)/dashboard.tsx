import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { QrCode, Users, CalendarDays, CheckCircle, Bell, LogOut, ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSecurityDashboardStats, SecurityDashboardStats } from '../../services/security';

export default function SecurityDashboard() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const insets = useSafeAreaInsets();
  
  const [stats, setStats] = useState<SecurityDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    try {
      const data = await getSecurityDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.replace('/(auth)/login');
  };

  const navigateToList = (filter: string) => {
    router.push(`/(security)/visitors?filter=${filter}`);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View 
        className="bg-white px-4 pb-3 border-b border-gray-200 flex-row items-center justify-between"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft color="#1f2937" size={24} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Security Dashboard</Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity className="mr-4">
            <Bell color="#4b5563" size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <LogOut color="#ef4444" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Welcome Section */}
        <View className="mb-6">
          <Text className="text-gray-500 text-lg">Welcome,</Text>
          <Text className="text-3xl font-bold text-gray-900">{user?.name || 'Security'}</Text>
        </View>
        
        {/* Main Action */}
        <TouchableOpacity 
          onPress={() => router.push('/(security)/scan')}
          className="bg-blue-600 rounded-2xl p-8 mb-8 flex-col items-center justify-center shadow-lg border border-blue-500"
        >
          <QrCode color="white" size={48} className="mb-3" />
          <Text className="text-white text-2xl font-bold mb-1">SCAN VISITOR QR</Text>
          <Text className="text-blue-100 text-sm">Verify visitor & check-in</Text>
        </TouchableOpacity>

        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Today's Overview</Text>

        {loading ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {/* Today's Visitors Card */}
            <TouchableOpacity 
              onPress={() => navigateToList('todays')}
              activeOpacity={0.7}
              className="w-[48%] bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
            >
              <View className="flex-row justify-between items-start mb-3">
                <Users color="#3b82f6" size={28} />
                <ChevronRight color="#d1d5db" size={20} />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-1">{stats?.todaysVisitors?.toString().padStart(2, '0') || '00'}</Text>
              <Text className="text-gray-500 text-sm uppercase font-semibold">Today's{'\n'}Visitors</Text>
            </TouchableOpacity>

            {/* Inside Now Card */}
            <TouchableOpacity 
              onPress={() => navigateToList('inside')}
              activeOpacity={0.7}
              className="w-[48%] bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="w-7 h-7 rounded-full bg-green-100 items-center justify-center">
                  <View className="w-3 h-3 rounded-full bg-green-500" />
                </View>
                <ChevronRight color="#d1d5db" size={20} />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-1">{stats?.insideNow?.toString().padStart(2, '0') || '00'}</Text>
              <Text className="text-gray-500 text-sm uppercase font-semibold">Inside Now</Text>
            </TouchableOpacity>

            {/* Upcoming Card */}
            <TouchableOpacity 
              onPress={() => navigateToList('upcoming')}
              activeOpacity={0.7}
              className="w-[48%] bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
            >
              <View className="flex-row justify-between items-start mb-3">
                <CalendarDays color="#f59e0b" size={28} />
                <ChevronRight color="#d1d5db" size={20} />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-1">{stats?.upcoming?.toString().padStart(2, '0') || '00'}</Text>
              <Text className="text-gray-500 text-sm uppercase font-semibold">Upcoming</Text>
            </TouchableOpacity>

            {/* Checked Out Card */}
            <TouchableOpacity 
              onPress={() => navigateToList('checkedOut')}
              activeOpacity={0.7}
              className="w-[48%] bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
            >
              <View className="flex-row justify-between items-start mb-3">
                <CheckCircle color="#8b5cf6" size={28} />
                <ChevronRight color="#d1d5db" size={20} />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-1">{stats?.checkedOut?.toString().padStart(2, '0') || '00'}</Text>
              <Text className="text-gray-500 text-sm uppercase font-semibold">Checked Out</Text>
            </TouchableOpacity>

          </View>
        )}
      </ScrollView>
    </View>
  );
}
