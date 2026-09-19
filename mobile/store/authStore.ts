import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const setStorageItemAsync = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getStorageItemAsync = async (key: string) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') return localStorage.getItem(key);
    return null;
  }
  return await SecureStore.getItemAsync(key);
};

const deleteStorageItemAsync = async (key: string) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SECURITY' | 'RECEPTIONIST' | 'EMPLOYEE' | 'VISITOR';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  setAuth: async (user, token) => {
    try {
      await setStorageItemAsync('auth_token', token);
      await setStorageItemAsync('auth_user', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save auth data', e);
    }
    set({ user, token, isLoading: false });
  },
  clearAuth: async () => {
    try {
      await deleteStorageItemAsync('auth_token');
      await deleteStorageItemAsync('auth_user');
    } catch (e) {
      console.error('Failed to clear auth data', e);
    }
    set({ user: null, token: null, isLoading: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
  initializeAuth: async () => {
    try {
      const token = await getStorageItemAsync('auth_token');
      const userStr = await getStorageItemAsync('auth_user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        // Clean token of any potential quotes or whitespace
        const cleanToken = token.replace(/^"|"$/g, '').trim();
        set({ user, token: cleanToken, isLoading: false });
        return;
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    }
    set({ user: null, token: null, isLoading: false });
  }
}));
