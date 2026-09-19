import { AxiosError } from 'axios';
import { API_URLS } from './apiConfig';

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ error?: string; message?: string }>;
  const serverMessage = axiosError.response?.data?.error || axiosError.response?.data?.message;

  if (serverMessage) {
    return serverMessage;
  }

  if (!axiosError.response) {
    return `${fallback} Check that the backend is running and your phone is on the same Wi-Fi. Tried: ${API_URLS.join(', ')}`;
  }

  return fallback;
};
