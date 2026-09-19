import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ChevronLeft, UserCircle, Briefcase, Mail, Phone } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getEmployeeById, EmployeeDetails as EmployeeDetailsType } from '../../../services/employee';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function EmployeeDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  
  const [employee, setEmployee] = useState<EmployeeDetailsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const data = await getEmployeeById(id as string);
        setEmployee(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch employee details');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployee();
  }, [id, router]);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!employee) return null;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-200 pb-3" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-center px-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft color="#111827" size={28} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Employee Details</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <View className="bg-white rounded-xl border border-gray-200 p-6 items-center shadow-sm mb-6">
          <View className="w-24 h-24 rounded-full bg-blue-50 items-center justify-center mb-4 border border-blue-100">
            <UserCircle color="#2563eb" size={64} strokeWidth={1} />
          </View>
          <Text className="text-2xl font-bold text-gray-900">{employee.name}</Text>
        </View>

        <View className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
          <View className="flex-row items-center mb-4 pb-4 border-b border-gray-100">
            <UserCircle color="#6b7280" size={20} className="mr-3" />
            <View>
              <Text className="text-sm text-gray-500">Role</Text>
              <Text className="text-base font-semibold text-gray-900">{employee.role}</Text>
            </View>
          </View>
          <View className="flex-row items-center mb-4 pb-4 border-b border-gray-100">
            <Briefcase color="#6b7280" size={20} className="mr-3" />
            <View>
              <Text className="text-sm text-gray-500">Department</Text>
              <Text className="text-base font-semibold text-gray-900">{employee.department || 'N/A'}</Text>
            </View>
          </View>
          <View className="flex-row items-center mb-4 pb-4 border-b border-gray-100">
            <Phone color="#6b7280" size={20} className="mr-3" />
            <View>
              <Text className="text-sm text-gray-500">Mobile</Text>
              <Text className="text-base font-semibold text-gray-900">{employee.phone || 'N/A'}</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <Mail color="#6b7280" size={20} className="mr-3" />
            <View>
              <Text className="text-sm text-gray-500">Email</Text>
              <Text className="text-base font-semibold text-gray-900">{employee.email}</Text>
            </View>
          </View>
        </View>

        <Text className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider ml-1">Visitor Activity</Text>
        <View className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-8 flex-row flex-wrap justify-between">
          <View className="w-[48%] bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
            <Text className="text-sm text-gray-500 mb-1">Total Appointments</Text>
            <Text className="text-2xl font-bold text-gray-900">{employee.activity.totalAppointments}</Text>
          </View>
          <View className="w-[48%] bg-blue-50 rounded-lg p-3 mb-3 border border-blue-100">
            <Text className="text-sm text-blue-700 mb-1">Approved</Text>
            <Text className="text-2xl font-bold text-blue-700">{employee.activity.approved}</Text>
          </View>
          <View className="w-[48%] bg-red-50 rounded-lg p-3 border border-red-100">
            <Text className="text-sm text-red-700 mb-1">Rejected</Text>
            <Text className="text-2xl font-bold text-red-700">{employee.activity.rejected}</Text>
          </View>
          <View className="w-[48%] bg-green-50 rounded-lg p-3 border border-green-100">
            <Text className="text-sm text-green-700 mb-1">Completed</Text>
            <Text className="text-2xl font-bold text-green-700">{employee.activity.completed}</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
