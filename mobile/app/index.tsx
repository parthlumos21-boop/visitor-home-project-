/// <reference types="nativewind/types" />
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}
