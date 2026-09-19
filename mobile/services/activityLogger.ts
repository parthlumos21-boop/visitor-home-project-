import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_URLS } from './apiConfig';

interface ActivityPayload {
  event: string;
  screen?: string;
  action?: string;
  method?: string;
  url?: string;
  status?: number | string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export const logMobileActivity = (payload: ActivityPayload) => {
  const { user } = useAuthStore.getState();
  const logPayload = {
    time: new Date().toISOString(),
    ...payload,
    userEmail: user?.email,
    userRole: user?.role,
  };

  console.log('[Mobile Activity]', logPayload);

  const logToNextUrl = (index: number) => {
    const baseUrl = API_URLS[index];

    if (!baseUrl) {
      return;
    }

    axios
      .post(`${baseUrl}/activity`, logPayload, {
        timeout: 3000,
        headers: { 'Content-Type': 'application/json' },
      })
      .catch(() => {
        logToNextUrl(index + 1);
      });
  };

  logToNextUrl(0);
};
