import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Calendar, Clock, Handshake, Building2, User as UserIcon } from 'lucide-react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function TotalVisits() {
  const router = useRouter();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      console.log("Fetching visits from:", `${API_URL}/visitors`);
      const res = await fetch(`${API_URL}/visitors`);
      if (res.ok) {
        const data = await res.json();
        setVisits(data);
      } else {
        console.error("Failed to fetch visits:", res.status);
      }
    } catch (err) {
      console.error("Error fetching visits. Ensure backend is running:", err);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (visit: any) => {
    // Navigate to the dedicated visit details page
    // @ts-ignore
    router.push(`/(visitor)/visit-details/${visit.id}`);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 flex-row items-center border-b border-gray-100 shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2">
          <ArrowLeft color="#111827" size={24} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Total Visits</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Search */}
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3 mb-2 border border-gray-200">
          <Search color="#9ca3af" size={20} className="mr-2" />
          <TextInput 
            placeholder="Search visits..." 
            className="flex-1 text-base text-gray-800"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <Text className="text-gray-500 mb-6 font-medium">Showing {visits.length} visits</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : visits.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">No visits found in database.</Text>
        ) : (
          visits.map((visit) => (
            <View key={visit.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4 shadow-sm flex-1">
              {/* Top Bar */}
              <View className="flex-row items-center p-3 border-b border-gray-100 bg-gray-50">
                <Text className="text-green-500 font-bold mr-2">✓</Text>
                <Text className="font-bold text-gray-900 text-sm">
                  {visit.status === 'COMPLETED' ? 'Visit Completed' : 'Appointment Confirmed'}
                </Text>
              </View>
              
              <View className="p-4">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="font-bold text-gray-900 text-lg">{visit.displayId || 'VIS-000000'}</Text>
                  <Text className="text-blue-700 font-bold text-sm tracking-wider">[ {visit.status} ]</Text>
                </View>

                <View className="flex-row items-center mb-2">
                  <UserIcon color="#6b7280" size={18} className="mr-3" />
                  <Text className="text-gray-700 font-medium">{visit.visitor?.name || 'Unknown Visitor'}</Text>
                </View>
                <View className="flex-row items-center mb-5">
                  <Building2 color="#6b7280" size={18} className="mr-3" />
                  <Text className="text-gray-700 font-medium">Host: {visit.host?.name || 'Unknown Host'}</Text>
                </View>

                <View className="flex-row items-center mb-2">
                  <Calendar color="#6b7280" size={18} className="mr-3" />
                  <Text className="text-gray-700">
                    {new Date(visit.scheduledAt).toLocaleDateString()}
                  </Text>
                </View>
                <View className="flex-row items-center mb-5">
                  <Clock color="#6b7280" size={18} className="mr-3" />
                  <Text className="text-gray-700">
                    {new Date(visit.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <View className="flex-row items-center mb-6">
                  <Handshake color="#6b7280" size={18} className="mr-3" />
                  <Text className="text-gray-700">{visit.purpose}</Text>
                </View>

                <TouchableOpacity 
                  onPress={() => openDetails(visit)}
                  className="flex-row justify-end items-center"
                >
                  <Text className="font-bold text-blue-600 text-base mr-1">View Details</Text>
                  <Text className="font-bold text-blue-600 text-lg">→</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
