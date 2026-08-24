import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { NetworkProvider } from '../store/NetworkContext';
import { View, ActivityIndicator } from 'react-native';

// @ts-ignore
import '../global.css';

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
      <Slot />
    </NetworkProvider>
  );
}
