import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { DashboardCard } from '../../components/DashboardCard';
import { Users, CheckCircle, Clock, UserX, UserCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-2xl font-bold text-gray-900 mb-6">Overview</Text>

      <View className="flex-row flex-wrap justify-between -mx-1">
        <DashboardCard
          title="Total Visitors"
          value="142"
          icon={<Users color="#2563eb" size={20} />}
          onPress={() => router.push('/(admin)/visitors')}
        />
        <DashboardCard
          title="Inside Now"
          value="24"
          icon={<UserCheck color="#10b981" size={20} />}
          onPress={() => router.push('/(admin)/visitors?filter=inside')}
        />
        <DashboardCard
          title="Pending Approvals"
          value="12"
          icon={<Clock color="#f59e0b" size={20} />}
          onPress={() => router.push('/(admin)/approvals')}
          colorClass="bg-yellow-50"
        />
        <DashboardCard
          title="Rejected Today"
          value="3"
          icon={<UserX color="#ef4444" size={20} />}
        />
        <DashboardCard
          title="Pre-booked"
          value="45"
          icon={<CheckCircle color="#8b5cf6" size={20} />}
        />
      </View>
    </ScrollView>
  );
}
