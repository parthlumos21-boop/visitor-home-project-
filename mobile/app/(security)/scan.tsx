import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNetwork } from '../../store/NetworkContext';
import { QrCode } from 'lucide-react-native';

export default function ScanScreen() {
  const { isConnected } = useNetwork();
  const [hasPermission, setHasPermission] = useState<boolean | null>(true); // Placeholder for expo-camera

  if (!isConnected) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Text className="text-red-500 font-bold text-xl mb-2">Offline Error</Text>
        <Text className="text-center text-gray-600">
          QR validation is strictly server-authoritative. You cannot scan passes while offline.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black justify-center items-center">
      {/* Placeholder for Camera View */}
      <View className="border-2 border-white/50 w-64 h-64 rounded-xl flex justify-center items-center">
        <QrCode color="white" size={64} opacity={0.5} />
      </View>
      
      <Text className="text-white mt-8 text-lg">Align QR code within frame to scan</Text>
      
      <TouchableOpacity 
        className="mt-12 bg-blue-600 px-8 py-4 rounded-full"
        onPress={() => Alert.alert('Test Scan', 'Mocking a successful QR scan...')}
      >
        <Text className="text-white font-bold text-lg">Simulate Scan</Text>
      </TouchableOpacity>
    </View>
  );
}
