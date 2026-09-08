import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, ScrollView } from 'react-native';
import { useNetwork } from '../../store/NetworkContext';
import { CheckCircle, User, ScanLine, ArrowLeft, Building2, Phone, Mail, Clock, Calendar, LogIn, LogOut } from 'lucide-react-native';
import api from '../../services/api';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { checkInVisitorApi, checkOutVisitorApi } from '../../services/security';

export default function ScanScreen() {
  const router = useRouter();
  const { isConnected } = useNetwork();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [token, setToken] = useState('');
  const [scanDetails, setScanDetails] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState('');

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Text className="text-xl font-bold text-gray-900 mb-2">Camera Access Required</Text>
        <Text className="text-center text-gray-600 mb-6">
          We need your permission to use the camera to scan visitor QR codes.
        </Text>
        <TouchableOpacity 
          className="bg-blue-600 px-6 py-3 rounded-lg"
          onPress={requestPermission}
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned || isScanning) return;
    setScanned(true);
    setToken(data);
    processToken(data);
  };

  const processToken = async (qrToken: string) => {
    if (!qrToken.trim()) {
      setError('QR token is invalid');
      return;
    }

    setIsScanning(true);
    setError('');
    setScanDetails(null);
    try {
      const response = await api.post('/security/scan', { token: qrToken.trim() });
      setScanDetails(response.data.details || null);
    } catch (err: any) {
      setScanDetails(null);
      setError(err?.response?.data?.error || 'Failed to scan QR code');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCheckIn = async () => {
    if (!scanDetails?.visitId) return;
    setActionLoading(true);
    try {
      await checkInVisitorApi(scanDetails.visitId);
      Alert.alert('Success', 'Visitor checked in successfully!');
      setScanDetails((prev: any) => prev ? {
        ...prev,
        status: 'CHECKED_IN',
        allowCheckIn: false,
        allowCheckOut: true,
        checkInAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      } : null);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to check in visitor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!scanDetails?.visitId) return;
    setActionLoading(true);
    try {
      await checkOutVisitorApi(scanDetails.visitId);
      Alert.alert('Success', 'Visitor checked out successfully!');
      setScanDetails((prev: any) => prev ? {
        ...prev,
        status: 'COMPLETED',
        allowCheckIn: false,
        allowCheckOut: false,
        checkOutAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      } : null);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to check out visitor');
    } finally {
      setActionLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setToken('');
    setScanDetails(null);
    setError('');
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
    <View className="flex-1 bg-gray-900">
      {!scanned ? (
        <View className="flex-1">
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          <View style={StyleSheet.absoluteFill} className="bg-black/50 justify-between px-6 pb-12">
            <View style={{ paddingTop: Math.max(insets.top, 16) }} className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => router.back()} className="bg-black/40 p-2.5 rounded-full">
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <Text className="text-white font-bold text-lg">Scan Visitor QR</Text>
              <View className="w-10" />
            </View>

            <View className="items-center">
              <View className="w-72 h-72 border-2 border-blue-400/80 rounded-3xl justify-center items-center overflow-hidden bg-black/5 shadow-2xl">
                <ScanLine color="#3b82f6" size={130} />
              </View>
            </View>

            <View />
          </View>
        </View>
      ) : (
        <View className="flex-1 bg-gray-50">
          {/* Header */}
          <View 
            className="bg-white px-4 pb-3 border-b border-gray-200 flex-row items-center justify-between"
            style={{ paddingTop: Math.max(insets.top, 16) }}
          >
            <TouchableOpacity onPress={resetScanner} className="flex-row items-center">
              <ArrowLeft color="#1f2937" size={24} className="mr-2" />
              <Text className="text-lg font-bold text-gray-900">Back to Scanner</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 40 }}>
            {isScanning ? (
              <View className="py-20 items-center justify-center">
                <ActivityIndicator size="large" color="#2563eb" className="mb-4" />
                <Text className="text-gray-600 font-semibold text-lg">Verifying Visitor Pass...</Text>
              </View>
            ) : (
              <View className="w-full">
                {error ? (
                  <View className="bg-red-50 rounded-2xl p-6 border border-red-200 items-center mb-6">
                    <Text className="text-red-600 font-bold text-xl mb-2 text-center">Invalid Pass</Text>
                    <Text className="text-red-500 text-center text-base mb-6">{error}</Text>
                    <TouchableOpacity 
                      className="bg-red-600 px-6 py-3 rounded-xl"
                      onPress={resetScanner}
                    >
                      <Text className="text-white font-bold">Try Scanning Again</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {scanDetails ? (
                  <View className="w-full bg-white rounded-3xl p-6 shadow-md border border-gray-100 mb-6">
                    {/* Status Header */}
                    <View className="flex-row items-center justify-between pb-4 border-b border-gray-100 mb-5">
                      <View>
                        <Text className="text-xs text-gray-400 uppercase font-bold tracking-wider">Pass Status</Text>
                        <Text className="text-xl font-extrabold text-gray-900 mt-0.5">{scanDetails.visitorId}</Text>
                      </View>
                      <View className={`px-3 py-1.5 rounded-full flex-row items-center ${
                        scanDetails.status === 'CHECKED_IN' ? 'bg-blue-100 border border-blue-200' :
                        scanDetails.status === 'COMPLETED' ? 'bg-purple-100 border border-purple-200' :
                        scanDetails.status === 'APPROVED' ? 'bg-emerald-100 border border-emerald-200' :
                        'bg-amber-100 border border-amber-200'
                      }`}>
                        <CheckCircle color={
                          scanDetails.status === 'CHECKED_IN' ? '#2563eb' :
                          scanDetails.status === 'COMPLETED' ? '#9333ea' :
                          scanDetails.status === 'APPROVED' ? '#16a34a' :
                          '#d97706'
                        } size={16} />
                        <Text className={`ml-1.5 font-bold text-xs uppercase ${
                          scanDetails.status === 'CHECKED_IN' ? 'text-blue-700' :
                          scanDetails.status === 'COMPLETED' ? 'text-purple-700' :
                          scanDetails.status === 'APPROVED' ? 'text-emerald-700' :
                          'text-amber-700'
                        }`}>
                          {scanDetails.status}
                        </Text>
                      </View>
                    </View>

                    {/* Visitor Card Info */}
                    <View className="flex-row items-center mb-6 bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                      <View className="w-14 h-14 rounded-full bg-blue-600 justify-center items-center mr-4 shadow-sm">
                        <User color="white" size={28} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-900">{scanDetails.visitorName}</Text>
                        <View className="flex-row items-center mt-1">
                          <Building2 color="#6b7280" size={14} className="mr-1" />
                          <Text className="text-gray-600 text-sm font-medium">{scanDetails.visitorCompany || 'Visitor'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Details Grid */}
                    <View className="space-y-4">
                      <View className="flex-row items-center border-b border-gray-50 pb-3">
                        <Phone color="#4b5563" size={18} className="mr-3" />
                        <View>
                          <Text className="text-xs text-gray-400 font-medium">Contact Phone</Text>
                          <Text className="text-base font-semibold text-gray-800">{scanDetails.visitorPhone}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center border-b border-gray-50 pb-3">
                        <Mail color="#4b5563" size={18} className="mr-3" />
                        <View>
                          <Text className="text-xs text-gray-400 font-medium">Email Address</Text>
                          <Text className="text-base font-semibold text-gray-800">{scanDetails.visitorEmail}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center border-b border-gray-50 pb-3">
                        <User color="#4b5563" size={18} className="mr-3" />
                        <View>
                          <Text className="text-xs text-gray-400 font-medium">Host Employee & Dept</Text>
                          <Text className="text-base font-semibold text-gray-800">{scanDetails.hostName} ({scanDetails.hostDepartment})</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center border-b border-gray-50 pb-3">
                        <Calendar color="#4b5563" size={18} className="mr-3" />
                        <View>
                          <Text className="text-xs text-gray-400 font-medium">Scheduled Date & Time</Text>
                          <Text className="text-base font-semibold text-gray-800">{scanDetails.date} at {scanDetails.time}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center pb-2">
                        <Clock color="#4b5563" size={18} className="mr-3" />
                        <View className="flex-1">
                          <Text className="text-xs text-gray-400 font-medium">Purpose</Text>
                          <Text className="text-base font-semibold text-gray-800">{scanDetails.purpose}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="mt-8 space-y-3">
                      {(scanDetails.allowCheckIn || scanDetails.status === 'APPROVED') && (
                        <TouchableOpacity
                          disabled={actionLoading}
                          onPress={handleCheckIn}
                          className="bg-emerald-600 py-4 rounded-xl flex-row items-center justify-center shadow-md shadow-emerald-500/20 active:opacity-90"
                        >
                          {actionLoading ? (
                            <ActivityIndicator color="white" />
                          ) : (
                            <>
                              <LogIn color="white" size={20} className="mr-2" />
                              <Text className="text-white font-bold text-lg">CONFIRM CHECK IN</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      {(scanDetails.allowCheckOut || scanDetails.status === 'CHECKED_IN') && (
                        <TouchableOpacity
                          disabled={actionLoading}
                          onPress={handleCheckOut}
                          className="bg-amber-600 py-4 rounded-xl flex-row items-center justify-center shadow-md shadow-amber-500/20 active:opacity-90"
                        >
                          {actionLoading ? (
                            <ActivityIndicator color="white" />
                          ) : (
                            <>
                              <LogOut color="white" size={20} className="mr-2" />
                              <Text className="text-white font-bold text-lg">CONFIRM CHECK OUT</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={resetScanner}
                        className="bg-gray-100 py-3.5 rounded-xl items-center border border-gray-200 mt-2"
                      >
                        <Text className="text-gray-700 font-semibold text-base">Scan Another Visitor QR</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
