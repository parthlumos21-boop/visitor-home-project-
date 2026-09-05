import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createEmployee } from '../../../services/employee';

const DEPARTMENTS = ['Marketing Dept', 'Electrical Design', 'Mechanical Dept', 'Production & QC', 'Dispatch'];

export default function AddEmployee() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    employeeId: '',
    phone: '',
    email: '',
    role: 'EMPLOYEE',
    department: 'Marketing Dept',
    designation: '',
    status: 'ACTIVE',
  });

  const handleSubmit = async () => {
    if (!form.name || !form.employeeId || !form.phone || !form.email || !form.department) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await createEmployee(form);
      Alert.alert('Success', 'Employee added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="bg-white border-b border-gray-200 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center px-4 justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <ChevronLeft color="#111827" size={28} />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">Add Employee</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <X color="#4b5563" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Employee Details</Text>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-1">Full Name *</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg px-4 h-12 text-base"
            placeholder="Enter employee full name"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-1">Employee ID *</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg px-4 h-12 text-base"
            placeholder="EMP-00001"
            value={form.employeeId}
            onChangeText={(text) => setForm({ ...form, employeeId: text })}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-1">Mobile Number *</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg px-4 h-12 text-base"
            placeholder="+91 Enter mobile number"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(text) => setForm({ ...form, phone: text })}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-1">Email Address *</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg px-4 h-12 text-base"
            placeholder="employee@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-1">ROLE *</Text>
          <View className="flex-row gap-2">
            {['EMPLOYEE', 'SUPER_ADMIN'].map(role => (
              <TouchableOpacity
                key={role}
                onPress={() => setForm({ ...form, role })}
                className={`flex-1 items-center justify-center h-12 rounded-lg border ${form.role === role ? 'bg-blue-50 border-blue-600' : 'bg-white border-gray-300'}`}
              >
                <Text className={`font-semibold ${form.role === role ? 'text-blue-700' : 'text-gray-600'}`}>{role === 'SUPER_ADMIN' ? 'Admin' : 'Employee'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-1">DEPARTMENT *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
            {DEPARTMENTS.map(dept => (
              <TouchableOpacity
                key={dept}
                onPress={() => setForm({ ...form, department: dept })}
                className={`px-4 h-10 justify-center rounded-full border mr-2 ${form.department === dept ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-300'}`}
              >
                <Text className={`font-semibold ${form.department === dept ? 'text-white' : 'text-gray-700'}`}>{dept}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-1">DESIGNATION</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg px-4 h-12 text-base"
            placeholder="Enter designation"
            value={form.designation}
            onChangeText={(text) => setForm({ ...form, designation: text })}
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-1">STATUS</Text>
          <View className="flex-row gap-2 mt-2">
            <TouchableOpacity onPress={() => setForm({ ...form, status: 'ACTIVE' })} className="flex-row items-center mr-4">
              <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${form.status === 'ACTIVE' ? 'border-blue-600' : 'border-gray-300'}`}>
                {form.status === 'ACTIVE' && <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
              </View>
              <Text className="text-base text-gray-700 font-medium">Active</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setForm({ ...form, status: 'INACTIVE' })} className="flex-row items-center">
              <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${form.status === 'INACTIVE' ? 'border-blue-600' : 'border-gray-300'}`}>
                {form.status === 'INACTIVE' && <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
              </View>
              <Text className="text-base text-gray-700 font-medium">Inactive</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row mt-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-1 h-12 bg-white border border-gray-300 rounded-lg items-center justify-center mr-3"
          >
            <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`flex-1 h-12 rounded-lg items-center justify-center ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? 'Adding...' : 'Add Employee'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
