import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = '5001';
const API_PATH = '/api';

const uniqueUrls = (urls: Array<string | undefined>) =>
  Array.from(new Set(urls.filter((url): url is string => Boolean(url))));

const withApiPath = (host: string) => `http://${host}:${API_PORT}${API_PATH}`;
const withoutApiPath = (url: string) => url.replace(/\/api\/?$/, '');

const getExpoHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri;

  return typeof hostUri === 'string' ? hostUri.split(':')[0] : undefined;
};

const androidLocalUrls =
  Platform.OS === 'android'
    ? [
        withApiPath('192.168.10.161'),
        withApiPath('10.0.2.2'),
        withApiPath('localhost'),
      ]
    : [];

export const getApiUrls = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const expoHostUrl = getExpoHost() ? withApiPath(getExpoHost() as string) : undefined;
  const platformDefaults = Platform.OS === 'ios' ? [withApiPath('localhost')] : androidLocalUrls;

  return uniqueUrls([
    expoHostUrl,
    configuredUrl,
    ...platformDefaults,
  ]);
};

export const API_URLS = getApiUrls();
export const API_URL = API_URLS[0];
export const API_ORIGIN = withoutApiPath(API_URL);
