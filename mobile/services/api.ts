import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { logMobileActivity } from './activityLogger';
import { API_URL, API_URLS } from './apiConfig';

const api = axios.create({
  baseURL: API_URL,
  timeout: 4000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    let token = useAuthStore.getState().token;
    if (token && config.headers) {
      // Remove any surrounding quotes and whitespace that might cause invalid token errors
      token = token.replace(/^"|"$/g, '').trim();
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (!String(config.url || '').includes('/activity')) {
      logMobileActivity({
        event: 'api_request',
        method: config.method?.toUpperCase(),
        url: `${config.baseURL || API_URL}${config.url || ''}`,
        message: 'Mobile API request started',
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (!String(response.config.url || '').includes('/activity')) {
      logMobileActivity({
        event: 'api_response',
        method: response.config.method?.toUpperCase(),
        url: `${response.config.baseURL || API_URL}${response.config.url || ''}`,
        status: response.status,
        message: 'Mobile API request completed',
      });
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    if (error.response?.status === 401) {
      await useAuthStore.getState().clearAuth();
    }

    const currentRetryIndex =
      typeof config?.__apiFallbackIndex === 'number'
        ? config.__apiFallbackIndex
        : API_URLS.indexOf(config?.baseURL || API_URL);
    const currentIndex = currentRetryIndex >= 0 ? currentRetryIndex : 0;
    const nextBaseUrl = API_URLS[currentIndex + 1];

    if (config && !error.response && nextBaseUrl) {
      config.__apiFallbackIndex = currentIndex + 1;
      config.baseURL = nextBaseUrl;
      return api.request(config);
    }

    if (config && !String(config.url || '').includes('/activity')) {
      logMobileActivity({
        event: 'api_error',
        method: config.method?.toUpperCase(),
        url: `${config.baseURL || API_URL}${config.url || ''}`,
        status: error.response?.status || 'NETWORK_ERROR',
        message: error.response?.data?.error || error.message || 'Mobile API request failed',
      });
    }

    return Promise.reject(error);
  }
);

export default api;
