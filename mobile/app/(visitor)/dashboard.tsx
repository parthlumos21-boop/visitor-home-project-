import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { ClipboardList, Clock, History, Plus, LogOut, Mail, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { getVisitorInvitations } from '../../services/visits';

export default function VisitorDashboard() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);

  const loadInvitations = async () => {
    try {
      const data = await getVisitorInvitations();
      setInvitations(data || []);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInvitations();
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
    <ScrollView 
      className="flex-1 bg-gray-50" 
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
      }
    >
      <View className="flex-row justify-between items-center mt-16 mb-5">
        <TouchableOpacity 
          onPress={() => router.push('/(visitor)/new-registration')}
          className="bg-blue-600 px-5 py-3 rounded-xl shadow-sm flex-row items-center"
        >
          <Plus color="#ffffff" size={18} className="mr-2" />
          <Text className="text-white font-bold text-sm">New Appointment</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} className="p-3 bg-white rounded-full shadow-sm border border-gray-100">
          <LogOut color="#ef4444" size={20} />
        </TouchableOpacity>
      </View>

      <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <Text className="text-xl font-bold text-gray-900 mb-2">Welcome, {user?.name || 'Visitor'}</Text>
        <Text className="text-sm font-semibold text-gray-800 mb-1">Your Visitor Dashboard</Text>
        <Text className="text-xs text-gray-500">Manage your appointments.</Text>
      </View>

      <Text className="text-gray-500 font-bold mb-4 ml-1 mt-2">YOUR VISIT OVERVIEW</Text>

      {/* Invitations Card */}
      <TouchableOpacity 
        onPress={() => handleCardPress('Invitations', 'invitations')} 
        className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 active:opacity-70 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1">
          <View className="bg-blue-100 p-3 rounded-full mr-4">
            <Mail color="#2563eb" size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-bold mb-1">INVITATIONS</Text>
            <Text className="text-gray-500 text-xs">Waiting for your response</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <Text className="text-xl font-bold text-gray-900 mr-2">{invitations.length < 10 ? `0${invitations.length}` : invitations.length}</Text>
          <ChevronRight color="#9ca3af" size={20} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleCardPress('Total Visits', 'total-visits')} className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 active:opacity-70 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="bg-blue-50 p-3 rounded-full mr-4">
            <ClipboardList color="#3b82f6" size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-bold mb-1">TOTAL VISITS</Text>
            <Text className="text-gray-500 text-xs">View all your visits</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <Text className="text-xl font-bold text-gray-900 mr-2">06</Text>
          <ChevronRight color="#9ca3af" size={20} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleCardPress('Appointment Requests', 'appointment-requests')} className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 active:opacity-70 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="bg-amber-50 p-3 rounded-full mr-4">
            <Clock color="#f59e0b" size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-bold mb-1">APPOINTMENT REQUESTS</Text>
            <Text className="text-gray-500 text-xs">Waiting for confirmation</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <Text className="text-xl font-bold text-gray-900 mr-2">02</Text>
          <ChevronRight color="#9ca3af" size={20} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleCardPress('Visit History', 'visit-history')} className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 active:opacity-70 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="bg-emerald-50 p-3 rounded-full mr-4">
            <History color="#10b981" size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-bold mb-1">VISIT HISTORY</Text>
            <Text className="text-gray-500 text-xs">View your previous visits</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <Text className="text-sm font-bold text-blue-600 mr-2">VIEW ALL</Text>
          <ChevronRight color="#9ca3af" size={20} />
        </View>
      </TouchableOpacity>

    </ScrollView>
  );
}
