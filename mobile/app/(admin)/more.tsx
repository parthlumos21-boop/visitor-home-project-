import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function MoreScreen() {
  const { clearAuth } = useAuthStore();
  const router = useRouter();

  const confirmLogout = () => {
    Alert.alert('Logout?', 'Are you sure you want to logout from My Gate?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View className="flex-1 justify-center items-center bg-gray-50 p-6">
      <Text className="text-xl text-gray-500 mb-8">Admin Settings</Text>
      <TouchableOpacity 
        onPress={confirmLogout}
        className="w-full bg-red-500 p-4 rounded-xl"
      >
        <Text className="text-white text-center font-bold">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
