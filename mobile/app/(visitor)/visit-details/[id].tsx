import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Calendar as CalendarIcon, Clock, Handshake, Building2, User as UserIcon, Phone } from 'lucide-react-native';
import api from '../../../services/api';

export default function VisitDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVisitDetails();
    }
  }, [id]);

  const fetchVisitDetails = async () => {
    try {
      // Fetch all and filter for simplicity, or ideally have a GET /visitors/:id endpoint
      // We will fetch all and find the matching one since we know /visitors returns all.
      const response = await api.get('/visitors');
      const found = response.data.find((v: any) => v.id === id);
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
        {/* Status Card */}
        <View className="bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-6 items-center">
          <Text className="text-blue-800 font-bold mb-2 uppercase tracking-widest text-xs">CURRENT STATUS</Text>
          <Text className="text-blue-900 font-black text-2xl tracking-wide">{visit.status}</Text>
        </View>

        {/* Details Section */}
        <View className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-6">
          
          {/* Formatted ID */}
          <View className="mb-6 border-b border-gray-100 pb-4">
            <Text className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">Visitor ID</Text>
            <Text className="text-gray-900 text-lg font-bold">{visit.displayId || 'VIS-000000'}</Text>
          </View>

          {/* Visitor Info */}
          <View className="mb-6 border-b border-gray-100 pb-4">
            <Text className="text-gray-400 text-xs font-bold mb-3 uppercase tracking-wider">Visitor Information</Text>
            <View className="flex-row items-center mb-3">
              <UserIcon color="#9ca3af" size={20} className="mr-3" />
              <Text className="text-gray-800 font-medium text-base">{visit.visitor?.name || 'N/A'}</Text>
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
              <Text className="text-gray-800 font-medium text-base">{visit.host?.name || 'N/A'}</Text>
            </View>
            <View className="flex-row items-center">
              <Handshake color="#9ca3af" size={20} className="mr-3" />
              <Text className="text-gray-800 font-medium text-base">{visit.purpose || 'N/A'}</Text>
            </View>
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
