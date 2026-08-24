import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, Handshake, Building2, User as UserIcon } from 'lucide-react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function VisitHistory() {
  const router = useRouter();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const res = await fetch(`${API_URL}/visitors`);
      if (res.ok) {
        const data = await res.json();
        // Filter for completed/past visits if needed, currently showing all
        setVisits(data);
      }
    } catch (err) {
      console.error("Error fetching visits:", err);
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
        <Text className="text-xl font-bold text-gray-900">Visit History</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="text-gray-500 mb-6">Your previous completed visits</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : visits.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">No history found in database.</Text>
        ) : (
          visits.map((visit) => (
            <View key={visit.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4 shadow-sm">
              <View className="flex-row items-center p-4 border-b border-gray-100">
                <Text className="text-green-500 font-bold mr-2">✓</Text>
                <Text className="font-bold text-gray-900 text-base">VISIT {visit.status}</Text>
              </View>
              <View className="p-4">
                <Text className="font-bold text-gray-800 text-lg mb-4">{visit.displayId || 'VIS-000000'}</Text>
                <View className="flex-row items-center mb-3">
                  <Calendar color="#6b7280" size={18} className="mr-3" />
                  <Text className="text-gray-700">{new Date(visit.scheduledAt).toLocaleDateString()}</Text>
                </View>
                <View className="flex-row items-center mb-3">
                  <Clock color="#6b7280" size={18} className="mr-3" />
                  <Text className="text-gray-700">
                    {new Date(visit.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View className="flex-row items-center mb-3">
                  <Handshake color="#6b7280" size={18} className="mr-3" />
                  <Text className="text-gray-700">{visit.purpose}</Text>
                </View>
                <View className="flex-row items-center mb-4">
                  <UserIcon color="#6b7280" size={18} className="mr-3" />
                  <Text className="text-gray-700">Met with {visit.host?.name || 'Unknown'}</Text>
                </View>
                
                <TouchableOpacity 
                  onPress={() => openDetails(visit)}
                  className="bg-gray-50 py-3 rounded-xl border border-gray-200 items-center"
                >
                  <Text className="font-bold text-gray-700">VIEW DETAILS</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
