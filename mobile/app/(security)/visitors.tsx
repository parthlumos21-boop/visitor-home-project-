import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Search, User, Phone, Calendar, Clock, LogIn, LogOut, CheckCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSecurityVisits, checkInVisitorApi, checkOutVisitorApi } from '../../services/security';

export default function SecurityVisitors() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { filter } = useLocalSearchParams<{ filter?: string }>();

  const [visits, setVisits] = useState<any[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const getTitle = () => {
    switch (filter) {
      case 'todays': return "Today's Visitors";
      case 'inside': return 'Inside Now';
      case 'upcoming': return 'Upcoming Visits';
      case 'checkedOut': return 'Checked Out';
      default: return 'Security Visitor Log';
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVisits();
    }, [filter])
  );

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const data = await getSecurityVisits(filter);
      setVisits(data || []);
      setFilteredVisits(data || []);
    } catch (error) {
      console.error('Failed to fetch security visits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVisits(visits);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredVisits(
        visits.filter(v => 
          (v.visitor?.name || '').toLowerCase().includes(q) ||
          (v.host?.name || '').toLowerCase().includes(q) ||
          (v.displayId || '').toLowerCase().includes(q) ||
          (v.visitor?.phone || '').toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, visits]);

  const handleCheckIn = async (visitId: string) => {
    setActionLoadingId(visitId);
    try {
      await checkInVisitorApi(visitId);
      Alert.alert('Success', 'Visitor checked in successfully');
      fetchVisits();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to check in visitor');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckOut = async (visitId: string) => {
    setActionLoadingId(visitId);
    try {
      await checkOutVisitorApi(visitId);
      Alert.alert('Success', 'Visitor checked out successfully');
      fetchVisits();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to check out visitor');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View 
        className="bg-white px-4 pb-3 border-b border-gray-200 flex-row items-center justify-between"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft color="#1f2937" size={24} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">{getTitle()}</Text>
        </View>
      </View>

      <View className="p-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
          <Search color="#9ca3af" size={20} className="mr-2" />
          <TextInput
            placeholder="Search visitor, host, phone or ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-gray-900 text-base py-1"
          />
        </View>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 30 }}>
        {loading ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : filteredVisits.length === 0 ? (
          <View className="py-16 items-center justify-center">
            <Text className="text-gray-400 font-semibold text-base">No visitors found</Text>
          </View>
        ) : (
          filteredVisits.map((visit) => {
            const scheduled = visit.scheduledAt ? new Date(visit.scheduledAt) : new Date();
            const dateStr = scheduled.toLocaleDateString('en-IN');
            const timeStr = scheduled.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

            return (
              <View key={visit.id} className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-start mb-3 border-b border-gray-100 pb-3">
                  <View>
                    <Text className="text-xs text-gray-400 font-bold uppercase">{visit.displayId || 'VISIT'}</Text>
                    <Text className="text-lg font-bold text-gray-900">{visit.visitor?.name || 'Visitor'}</Text>
                  </View>
                  <View className={`px-2.5 py-1 rounded-full ${
                    visit.status === 'CHECKED_IN' ? 'bg-blue-100' :
                    visit.status === 'COMPLETED' ? 'bg-purple-100' :
                    visit.status === 'APPROVED' ? 'bg-emerald-100' : 'bg-amber-100'
                  }`}>
                    <Text className={`text-xs font-bold uppercase ${
                      visit.status === 'CHECKED_IN' ? 'text-blue-700' :
                      visit.status === 'COMPLETED' ? 'text-purple-700' :
                      visit.status === 'APPROVED' ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {visit.status}
                    </Text>
                  </View>
                </View>

                <View className="space-y-1.5 mb-4">
                  <Text className="text-gray-600 text-sm"><Text className="font-semibold text-gray-800">Phone:</Text> {visit.visitor?.phone || 'N/A'}</Text>
                  <Text className="text-gray-600 text-sm"><Text className="font-semibold text-gray-800">Host:</Text> {visit.host?.name || 'N/A'} ({visit.host?.department || 'General'})</Text>
                  <Text className="text-gray-600 text-sm"><Text className="font-semibold text-gray-800">Time:</Text> {dateStr} at {timeStr}</Text>
                  <Text className="text-gray-600 text-sm"><Text className="font-semibold text-gray-800">Purpose:</Text> {visit.purpose}</Text>
                </View>

                {visit.status === 'APPROVED' && !visit.checkInAt && (
                  <TouchableOpacity
                    disabled={actionLoadingId === visit.id}
                    onPress={() => handleCheckIn(visit.id)}
                    className="bg-emerald-600 py-3 rounded-xl flex-row items-center justify-center shadow-sm"
                  >
                    {actionLoadingId === visit.id ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <LogIn color="white" size={18} className="mr-1.5" />
                        <Text className="text-white font-bold text-sm">CHECK IN</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {visit.status === 'CHECKED_IN' && (
                  <TouchableOpacity
                    disabled={actionLoadingId === visit.id}
                    onPress={() => handleCheckOut(visit.id)}
                    className="bg-amber-600 py-3 rounded-xl flex-row items-center justify-center shadow-sm"
                  >
                    {actionLoadingId === visit.id ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <LogOut color="white" size={18} className="mr-1.5" />
                        <Text className="text-white font-bold text-sm">CHECK OUT</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
