import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useNetwork } from '../../store/NetworkContext';
import { CheckCircle, QrCode, User } from 'lucide-react-native';
import api from '../../services/api';

export default function ScanScreen() {
  const { isConnected } = useNetwork();
  const [hasPermission, setHasPermission] = useState<boolean | null>(true); // Placeholder for expo-camera
  const [token, setToken] = useState('');
  const [scanDetails, setScanDetails] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  const scanToken = async () => {
    if (!token.trim()) {
      setError('QR token is required');
      return;
    }

    setIsScanning(true);
    setError('');
    try {
      const response = await api.post('/security/scan', { token: token.trim() });
      setScanDetails(response.data.details || null);
    } catch (err: any) {
      setScanDetails(null);
      setError(err?.response?.data?.error || 'Failed to scan QR code');
    } finally {
      setIsScanning(false);
    }
  };

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
    <View className="flex-1 bg-black justify-center items-center px-5">
      {/* Placeholder for Camera View */}
      <View className="border-2 border-white/50 w-64 h-64 rounded-xl flex justify-center items-center">
        <QrCode color="white" size={64} opacity={0.5} />
      </View>
      
      <Text className="text-white mt-8 text-lg">Align QR code within frame to scan</Text>

      <TextInput
        className="mt-6 w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-gray-900"
        placeholder="Paste QR token for test scan"
        placeholderTextColor="#9ca3af"
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
      />
      
      <TouchableOpacity 
        className="mt-12 bg-blue-600 px-8 py-4 rounded-full"
        onPress={scanToken}
        disabled={isScanning}
      >
        {isScanning ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-bold text-lg">Scan QR</Text>}
      </TouchableOpacity>

      {error ? <Text className="mt-4 text-center font-bold text-red-300">{error}</Text> : null}

      {scanDetails ? (
        <View className="mt-6 w-full rounded-2xl bg-white p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <User color="#111827" size={22} />
              <Text className="ml-2 text-lg font-bold text-gray-950">Visitor Details</Text>
            </View>
            <View className="flex-row items-center rounded-full bg-emerald-100 px-3 py-1">
              <CheckCircle color="#16a34a" size={18} />
              <Text className="ml-1 font-bold text-emerald-700">Verified</Text>
            </View>
          </View>

          {[
            ['Visitor ID', scanDetails.visitorId],
            ['Host Name', scanDetails.hostName],
            ['Date', scanDetails.date],
            ['Time', scanDetails.time],
            ['Purpose', scanDetails.purpose],
          ].map(([label, value]) => (
            <View key={label} className="mb-2 flex-row items-start">
              <Text className="w-[92px] text-base text-gray-700">{label}</Text>
              <Text className="px-2 text-base text-gray-500">:</Text>
              <Text className="min-w-0 flex-1 text-base font-semibold text-gray-950" numberOfLines={3}>{value || 'N/A'}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
