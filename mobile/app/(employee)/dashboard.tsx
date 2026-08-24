import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { DashboardCard } from '../../components/DashboardCard';
import { Users, Clock, History, CalendarPlus } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function EmployeeDashboard() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
      
      <TouchableOpacity 
        className="bg-indigo-600 rounded-2xl p-6 mb-6 flex-row items-center justify-center shadow-md"
      >
        <CalendarPlus color="white" size={24} />
        <Text className="text-white text-xl font-bold ml-3">Invite Visitor</Text>
      </TouchableOpacity>

      <Text className="text-xl font-bold text-gray-900 mb-4">My Visitors</Text>

      <View className="flex-row flex-wrap justify-between -mx-1">
        <DashboardCard
          title="Waiting for Me"
          value="2"
          icon={<Clock color="#f59e0b" size={20} />}
          colorClass="bg-yellow-50"
        />
        <DashboardCard
          title="Upcoming Today"
          value="5"
          icon={<Users color="#2563eb" size={20} />}
        />
        <DashboardCard
          title="Currently Inside"
          value="1"
          icon={<Users color="#10b981" size={20} />}
        />
        <DashboardCard
          title="Recent Visits"
          value="12"
          icon={<History color="#8b5cf6" size={20} />}
        />
      </View>
    </ScrollView>
  );
}
