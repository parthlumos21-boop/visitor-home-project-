import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function EmployeeProfile() {
  const { clearAuth } = useAuthStore();

  return (
    <View className="flex-1 justify-center items-center bg-gray-50 p-6">
      <Text className="text-xl text-gray-500 mb-8">Employee Profile</Text>
      <TouchableOpacity 
        onPress={clearAuth}
        className="w-full bg-red-500 p-4 rounded-xl"
      >
        <Text className="text-white text-center font-bold">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
