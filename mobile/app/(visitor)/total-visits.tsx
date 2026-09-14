import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Calendar, Clock, Handshake, Building2, User as UserIcon, Check, ArrowRight } from 'lucide-react-native';
import { getMyVisitorVisits } from '../../services/visits';
import QRCode from 'react-native-qrcode-svg';

export default function TotalVisits() {
  const router = useRouter();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const data = await getMyVisitorVisits('total');
      setVisits(data || []);
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

  const getQrValue = (visit: any) => visit.qrCode?.token || visit.displayId || visit.id;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-blue-700 bg-blue-50';
      case 'PENDING': return 'text-amber-700 bg-amber-50';
      case 'CHECKED_IN': return 'text-emerald-700 bg-emerald-50';
      case 'COMPLETED': return 'text-gray-700 bg-gray-100';
      case 'REJECTED': return 'text-red-700 bg-red-50';
      case 'CANCELLED': return 'text-gray-500 bg-gray-50';
      default: return 'text-gray-700 bg-gray-100';
    }
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
            <View
              key={visit.id}
              className="bg-white rounded-2xl mb-5 shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Top Bar */}
              <View className="flex-row items-center p-3 border-b border-gray-100 bg-gray-50">
                <Check color="#22c55e" size={18} style={{ marginRight: 8 }} />
                <Text className="font-bold text-gray-900 text-sm">
                  {visit.status === 'COMPLETED' ? 'Visit Completed' : 'Appointment Confirmed'}
                </Text>
              </View>
              
              <View className="p-4">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1 pr-4">
                    <Text className="font-bold text-gray-900 text-lg mb-2">{visit.displayId || 'Visit ID unavailable'}</Text>
                    <View className="flex-row items-center bg-blue-50 rounded-full px-3 py-1 self-start border border-blue-100">
                      <Calendar color="#2563eb" size={12} className="mr-2" />
                      <Text className="text-xs text-blue-700 font-bold tracking-wide">
                        {new Date(visit.scheduledAt).toLocaleDateString()} at {new Date(visit.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                  <View className={`rounded-full px-3 py-1 ${getStatusColor(visit.status)} shadow-sm`}>
                    <Text className="text-[10px] font-bold uppercase tracking-wider">{visit.status}</Text>
                  </View>
                </View>

                <View className="bg-gray-50 rounded-2xl p-4 mb-4 flex-row items-center border border-gray-100">
                  <TouchableOpacity className="items-center mr-4 bg-white p-2 rounded-xl shadow-sm border border-gray-100" activeOpacity={0.78} onPress={() => openDetails(visit)}>
                    <QRCode value={getQrValue(visit)} size={76} />
                    <Text className="mt-2 text-[10px] text-blue-600 font-bold uppercase tracking-wider">Show QR</Text>
                  </TouchableOpacity>

                  <View className="flex-1 justify-center gap-2">
                    <View className="flex-row items-center">
                      <Building2 color="#6b7280" size={16} className="mr-2" />
                      <Text className="text-gray-800 font-semibold text-sm flex-shrink">Host: {visit.host?.name || 'Unknown Host'}</Text>
                    </View>
                    {visit.createdByName ? (
                      <View className="flex-row items-center mt-1">
                        <UserIcon color="#6b7280" size={16} className="mr-2" />
                        <Text className="text-gray-800 font-semibold text-sm flex-shrink">Invited by: {visit.createdByName}</Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center mt-1">
                        <UserIcon color="#6b7280" size={16} className="mr-2" />
                        <Text className="text-gray-800 font-semibold text-sm flex-shrink">Visitor: {visit.visitor?.name || 'Unknown Visitor'}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {visit.purpose && (
                  <View className="flex-row items-start mb-5 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                    <Handshake color="#6b7280" size={16} className="mr-3 mt-0.5" />
                    <Text className="text-gray-600 flex-1 text-sm leading-5">{visit.purpose}</Text>
                  </View>
                )}

                <TouchableOpacity 
                  onPress={() => openDetails(visit)}
                  className="flex-row justify-center items-center py-2 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <Text className="font-bold text-blue-600 text-sm mr-2">View All Details</Text>
                  <ArrowRight color="#2563eb" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
