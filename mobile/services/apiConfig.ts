import Constants from 'expo-constants';
import { Platform, NativeModules } from 'react-native';

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

const getBundleHost = () => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (typeof scriptURL === 'string') {
    const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
    return match ? match[1] : undefined;
  }
  return undefined;
};

export const getApiUrls = () => {
  // 1. Dynamic environment variable (set dynamically on Expo start / .env)
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  // 2. Dynamic Expo host detected at runtime from Expo Go / Dev Client
  const expoHost = getExpoHost();
  const expoHostUrl = expoHost ? withApiPath(expoHost) : undefined;

  // 3. Dynamic Metro bundle host extracted from scriptURL (physical phone / simulator)
  const bundleHost = getBundleHost();
  const bundleHostUrl =
    bundleHost && bundleHost !== 'localhost' && bundleHost !== '127.0.0.1'
      ? withApiPath(bundleHost)
      : undefined;

  // 4. Platform-specific emulator & local fallbacks (No hardcoded manual IPs)
  const platformDefaults =
    Platform.OS === 'android'
      ? [
          withApiPath('10.0.2.2'), // Android emulator loopback to development host
          withApiPath('localhost'),
        ]
      : [withApiPath('localhost')];

  return uniqueUrls([
    configuredUrl,
    expoHostUrl,
    bundleHostUrl,
    ...platformDefaults,
  ]);
};

export const API_URLS = getApiUrls();
export const API_URL = API_URLS[0];
export const API_ORIGIN = withoutApiPath(API_URL);
