import React, { useState, useEffect, useRef } from 'react';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar as CalendarIcon, Clock, Handshake, Building2, User as UserIcon, Phone, Download, Share2, Check } from 'lucide-react-native';
import { getMyVisitorVisits } from '../../../services/visits';
import QRCode from 'react-native-qrcode-svg';

export default function VisitDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const viewRef = useRef<any>(null);

  useEffect(() => {
    if (id) {
      fetchVisitDetails();
    }
  }, [id]);

  const handleSharePass = async () => {
    if (!visit || !viewRef.current) return;
    try {
      const uri = await viewRef.current.capture();
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Visitor Pass',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error: any) {
      Alert.alert('Share Error', error.message);
    }
  };

  const handleDownloadPass = async () => {
    try {
      if (!viewRef.current) return;
      const uri = await viewRef.current.capture();
      // On Expo Go, the safest way to "download" an image cross-platform without custom native modules is 
      // to open the share sheet and let the user tap "Save Image".
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Save Visitor Pass',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available');
      }
    } catch (error: any) {
      Alert.alert('Download Error', error.message);
    }
  };

  const fetchVisitDetails = async () => {
    try {
      const res = await getMyVisitorVisits(undefined, 1, 1000);
      const found = res.data?.find((v: any) => v.id === id);
      setVisit(found);
    } catch (err) {
      console.error("Error fetching visit details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!visit) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="bg-white px-4 pt-12 pb-4 flex-row items-center border-b border-gray-100 shadow-sm">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2">
            <ArrowLeft color="#111827" size={24} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Details Not Found</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Could not load details for this visit.</Text>
        </View>
      </View>
    );
  }

  const qrValue = visit.qrCode?.token || visit.displayId || visit.id;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 flex-row items-center border-b border-gray-100 shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2">
          <ArrowLeft color="#111827" size={24} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Visit Details</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 mb-4 flex-row items-center justify-between">
          <Text className="text-gray-900 font-bold">Appointment Confirmed</Text>
          <Text className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 font-bold uppercase">{visit.status}</Text>
        </View>

        <ViewShot ref={viewRef} options={{ format: 'png', quality: 0.9 }} style={{ marginBottom: 16, backgroundColor: '#f9fafb' }}>
        <View className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm items-center">
          <View className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <QRCode value={qrValue} size={148} />
          </View>
          <Text className="mt-3 text-2xl font-black text-gray-950">{visit.displayId || 'Visit ID unavailable'}</Text>
          <Text className="mt-1 text-sm text-gray-600">Show this QR code at the gate</Text>

          
        </View>

        {/* Details Section */}
        <View className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-6">
          
          {/* Formatted ID */}
          <View className="mb-6 border-b border-gray-100 pb-4">
            <Text className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">Visitor ID</Text>
            <Text className="text-gray-900 text-lg font-bold">{visit.displayId || 'Visit ID unavailable'}</Text>
          </View>

          {/* Visitor Info */}
          <View className="mb-6 border-b border-gray-100 pb-4">
            <Text className="text-gray-400 text-xs font-bold mb-3 uppercase tracking-wider">Visitor Information</Text>
            <View className="flex-row items-center mb-3">
              <UserIcon color="#9ca3af" size={20} className="mr-3" />
              <Text className="min-w-0 flex-1 text-gray-800 font-medium text-base" numberOfLines={3}>{visit.visitor?.name || 'N/A'}</Text>
            </View>
            <View className="flex-row items-center">
              <Phone color="#9ca3af" size={20} className="mr-3" />
              <Text className="text-gray-800 font-medium text-base">{visit.visitor?.phone || 'N/A'}</Text>
            </View>
          </View>

          {/* Host Info */}
          <View className="mb-6 border-b border-gray-100 pb-4">
            <Text className="text-gray-400 text-xs font-bold mb-3 uppercase tracking-wider">Host Employee</Text>
            <View className="flex-row items-center mb-3">
              <Building2 color="#9ca3af" size={20} className="mr-3" />
              <Text className="min-w-0 flex-1 text-gray-800 font-medium text-base" numberOfLines={3}>{visit.host?.name || 'N/A'}</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Handshake color="#9ca3af" size={20} className="mr-3" />
              <Text className="min-w-0 flex-1 text-gray-800 font-medium text-base" numberOfLines={4}>{visit.purpose || 'N/A'}</Text>
            </View>
            {visit.decidedByName && (
              <View className="flex-row items-center">
                <Check color="#22c55e" size={20} className="mr-3" />
                <Text className="min-w-0 flex-1 text-emerald-600 font-bold text-base" numberOfLines={3}>Approved by {visit.decidedByName}</Text>
              </View>
            )}
          </View>

          {/* Time Info */}
          <View className="mb-2">
            <Text className="text-gray-400 text-xs font-bold mb-3 uppercase tracking-wider">Schedule</Text>
            <View className="flex-row items-center mb-3">
              <CalendarIcon color="#9ca3af" size={20} className="mr-3" />
              <Text className="text-gray-800 font-medium text-base">
                {new Date(visit.scheduledAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Clock color="#9ca3af" size={20} className="mr-3" />
              <Text className="text-gray-800 font-medium text-base">
                {new Date(visit.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

        </View>
        </ViewShot>
        <View className="mt-2 mb-6 flex-row">
            <TouchableOpacity onPress={handleDownloadPass} className="h-11 flex-1 flex-row items-center justify-center rounded-lg border border-blue-600 bg-white px-3 mr-4">
              <Download color="#2563eb" size={18} />
              <Text className="ml-2 font-bold text-blue-700">Download QR</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSharePass} className="h-11 flex-1 flex-row items-center justify-center rounded-lg border border-blue-600 bg-white px-3">
              <Share2 color="#2563eb" size={18} />
              <Text className="ml-2 font-bold text-blue-700">Share QR</Text>
            </TouchableOpacity>
          </View>

        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-gray-900 rounded-xl py-4 items-center mb-10 shadow-md"
        >
          <Text className="text-white font-bold text-base">Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
