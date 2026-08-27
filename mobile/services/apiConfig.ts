import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = '5001';
const API_PATH = '/api';

const uniqueUrls = (urls: Array<string | undefined>) =>
  Array.from(new Set(urls.filter((url): url is string => Boolean(url))));

const withApiPath = (host: string) => `http://${host}:${API_PORT}${API_PATH}`;

const getExpoHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri;

  return typeof hostUri === 'string' ? hostUri.split(':')[0] : undefined;
};

const getAndroidSafeUrl = (url?: string) => {
  if (!url || Platform.OS !== 'android') {
    return url;
  }

  return url
    .replace('http://localhost:', 'http://10.0.2.2:')
    .replace('http://127.0.0.1:', 'http://10.0.2.2:');
};

export const getApiUrls = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const expoHostUrl = getExpoHost() ? withApiPath(getExpoHost() as string) : undefined;
  const platformDefaults =
    Platform.OS === 'web'
      ? ['http://localhost:5001/api']
      : Platform.OS === 'android'
        ? ['http://10.0.2.2:5001/api']
        : ['http://localhost:5001/api'];

  return uniqueUrls([
    getAndroidSafeUrl(configuredUrl),
    expoHostUrl,
    configuredUrl,
    ...platformDefaults,
  ]);
};

export const API_URLS = getApiUrls();
export const API_URL = API_URLS[0];
