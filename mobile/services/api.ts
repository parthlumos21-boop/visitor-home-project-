import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Using 10.0.2.2 for Android emulator to access host machine's localhost
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
