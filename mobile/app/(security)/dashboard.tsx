import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { DashboardCard } from '../../components/DashboardCard';
import { QrCode, Users, CheckCircle, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function SecurityDashboard() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
      
      <TouchableOpacity 
        onPress={() => router.push('/(security)/scan')}
        className="bg-blue-600 rounded-2xl p-8 mb-6 flex-row items-center justify-center shadow-lg"
      >
        <QrCode color="white" size={32} />
        <Text className="text-white text-2xl font-bold ml-4">SCAN QR</Text>
      </TouchableOpacity>

      <Text className="text-xl font-bold text-gray-900 mb-4">Gate Status</Text>

      <View className="flex-row flex-wrap justify-between -mx-1">
        <DashboardCard
          title="Expected Today"
          value="45"
          icon={<Clock color="#2563eb" size={20} />}
        />
        <DashboardCard
          title="Inside Now"
          value="24"
          icon={<Users color="#10b981" size={20} />}
        />
        <DashboardCard
          title="Pending Gate"
          value="12"
          icon={<Clock color="#f59e0b" size={20} />}
          colorClass="bg-yellow-50"
        />
        <DashboardCard
          title="Approved"
          value="88"
          icon={<CheckCircle color="#8b5cf6" size={20} />}
        />
      </View>
    </ScrollView>
  );
}
