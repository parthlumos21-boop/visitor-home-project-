import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { DashboardCard } from '../../components/DashboardCard';
import { Calendar, Users, CheckCircle, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ReceptionistDashboard() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
      
      <TouchableOpacity 
        className="bg-teal-600 rounded-2xl p-6 mb-6 flex-row items-center justify-center shadow-md"
      >
        <Text className="text-white text-xl font-bold ml-2">Register Walk-in Visitor</Text>
      </TouchableOpacity>

      <Text className="text-xl font-bold text-gray-900 mb-4">Reception Status</Text>

      <View className="flex-row flex-wrap justify-between -mx-1">
        <DashboardCard
          title="Appointments"
          value="15"
          icon={<Calendar color="#2563eb" size={20} />}
        />
        <DashboardCard
          title="Waiting"
          value="4"
          icon={<Clock color="#f59e0b" size={20} />}
          colorClass="bg-yellow-50"
        />
        <DashboardCard
          title="Inside"
          value="24"
          icon={<Users color="#10b981" size={20} />}
        />
        <DashboardCard
          title="Approved"
          value="8"
          icon={<CheckCircle color="#8b5cf6" size={20} />}
        />
      </View>
    </ScrollView>
  );
}
