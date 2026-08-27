import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { NetworkProvider } from '../store/NetworkContext';
import { View, ActivityIndicator, Text } from 'react-native';
import Toast, { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import { Bell } from 'lucide-react-native';

import { NotificationProvider } from '../context/NotificationContext';

// @ts-ignore
import '../global.css';

const toastConfig: ToastConfig = {
  instagram: ({ text1, text2, props }: ToastConfigParams<any>) => (
    <View className="flex-row items-center bg-gray-900 rounded-full px-4 py-3 mx-4 shadow-lg w-[92%] mt-2">
      <View className="h-10 w-10 rounded-full bg-gray-800 items-center justify-center mr-3 border border-gray-700">
        <Bell color="#3b82f6" size={20} />
      </View>
      <View className="flex-1">
        <Text className="text-white font-bold text-sm" numberOfLines={1}>{text1}</Text>
        <Text className="text-gray-300 text-xs mt-0.5" numberOfLines={2}>{text2}</Text>
      </View>
    </View>
  )
};

export default function RootLayout() {
  const { user, token, isLoading, initializeAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!token) {
      if (!inAuthGroup) {
        // Not authenticated, redirect to login
        router.replace('/(auth)/login');
      }
    } else if (user) {
      // Authenticated, determine redirect based on role
      if (inAuthGroup || (segments.length as number) === 0) {
        if (user.role === 'VISITOR') {
          router.replace('/(visitor)/dashboard');
        } else if (user.role === 'SECURITY') {
          router.replace('/(security)/dashboard');
        } else if (user.role === 'RECEPTIONIST') {
          router.replace('/(receptionist)/dashboard');
        } else if (user.role === 'EMPLOYEE') {
          router.replace('/(employee)/dashboard');
        } else if (user.role === 'SUPER_ADMIN') {
          router.replace('/(admin)/dashboard');
        }
      }
    }
  }, [token, user, isLoading, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NetworkProvider>
      <NotificationProvider>
        <Slot />
        <Toast config={toastConfig} />
      </NotificationProvider>
    </NetworkProvider>
  );
}
