import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo) {
    console.log('Skipping push notification registration in Expo Go.');
    return null;
  }

  const Notifications = await import('expo-notifications');

  if (Platform.OS === 'android') {
    console.log('📱 [Push Config] Attempting to configure MAX lock screen channel...');
    await Notifications.setNotificationChannelAsync('max', {
      name: 'max',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
    });
    console.log('✅ [Push Config] Successfully locked channel [max] to MAX importance & PUBLIC lock screen!');
  }

  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) {
    console.log('Expo project ID not found; cannot create push token');
    return null;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Expo Push Token:', token);
    return token;
  } catch (e) {
    console.log('Error getting push token', e);
    return null;
  }
}
