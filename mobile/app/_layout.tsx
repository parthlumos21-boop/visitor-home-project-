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
    <View className="bg-white rounded-2xl mx-4 p-4 shadow-lg w-[92%] mt-2 border border-gray-100">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View className="h-6 w-6 rounded-full bg-blue-600 items-center justify-center mr-2">
            <Text className="text-white text-xs font-bold">C</Text>
          </View>
          <Text className="text-gray-500 font-semibold text-xs tracking-wider">COLLAB.IO DEMO</Text>
        </View>
        <Text className="text-gray-400 text-xs">now</Text>
      </View>
      <Text className="text-black font-bold text-[15px] mb-1" numberOfLines={1}>{text1}</Text>
      <Text className="text-gray-700 text-sm leading-5" numberOfLines={3}>{text2}</Text>
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
