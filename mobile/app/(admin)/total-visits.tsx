import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, Calendar, Clock, User, Building2, Handshake, Search, ChevronRight } from 'lucide-react-native';
import { getSecurityVisits } from '../../services/security';
import { getApiErrorMessage } from '../../services/errorMessage';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminTotalVisits() {
  const router = useRouter();
  const { filter } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const ITEMS_PER_PAGE = 6;

  const handleRenew = (visitId: string) => {
    Alert.alert(
      'Renew Appointment',
      'Are you sure you want to renew this appointment for today?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Renew',
          style: 'default',
          onPress: async () => {
            try {
              setRenewingId(visitId);
              await api.put(`/new-appointments/${visitId}/renew`, {
                approverId: user?.id,
                approverName: user?.name
              });
              Alert.alert('Success', 'Appointment has been renewed for today!');
              loadVisits();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to renew appointment');
            } finally {
              setRenewingId(null);
            }
          }
        }
      ]
    );
  };

  const loadVisits = useCallback(async (showLoader = true) => {
    try {
      setError('');
      if (showLoader) {
        setLoading(true);
      }
      const selectedFilter = typeof filter === 'string' ? filter : undefined;
      const data = await getSecurityVisits(selectedFilter);
      
      const seen = new Set();
      const deduplicated = (data || []).filter((visit: any) => {
        const dateStr = new Date(visit.scheduledAt || Date.now()).toISOString().split('T')[0];
        const vName = (visit.visitor?.name || '').toLowerCase().trim();
        const hName = (visit.host?.name || '').toLowerCase().trim();
        const key = `${vName}-${hName}-${dateStr}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      setVisits(deduplicated);
      console.log('[Admin Total Visits]', {
        filter: selectedFilter || 'all',
        count: data?.length || 0,
        source: 'postgres',
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load visits.'));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  useFocusEffect(
    useCallback(() => {
      loadVisits(false);
    }, [loadVisits])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadVisits(false);
    setRefreshing(false);
  }, [loadVisits]);

  const totalPages = Math.ceil(visits.length / ITEMS_PER_PAGE);
  const displayedVisits = visits.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getQrValue = (visit: any) => visit.qrCode?.token || visit.displayId || visit.id;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-blue-700 bg-blue-50';
      case 'PENDING': return 'text-amber-700 bg-amber-50';
      case 'CHECKED_IN': return 'text-emerald-700 bg-emerald-50';
      case 'COMPLETED': return 'text-gray-700 bg-gray-100';
      case 'REJECTED': return 'text-red-700 bg-red-50';
      case 'CANCELLED': return 'text-gray-500 bg-gray-50';
      case 'EXPIRED': return 'text-red-700 bg-red-100';
      case 'RENEWED': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-200" style={{ paddingTop: Math.max(insets.top, 16) + 8 }}>
        <View className="flex-row items-center px-4 pb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <ArrowLeft color="#1f2937" size={24} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-950">Total Visits</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
      >
        {loading ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-3 text-sm text-gray-500">Loading visits...</Text>
          </View>
        ) : error ? (
          <View className="mt-8 rounded-lg border border-red-100 bg-red-50 p-4">
            <Text className="text-base font-semibold text-red-700">{error}</Text>
            <TouchableOpacity onPress={() => loadVisits()} className="mt-3 h-11 justify-center rounded-md bg-red-600 px-4">
              <Text className="text-center font-semibold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : visits.length === 0 ? (
          <View className="py-10 items-center justify-center">
            <Text className="text-center text-gray-500">No visits found in database.</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between pb-8">
            {displayedVisits.map((visit) => (
              <TouchableOpacity
                key={visit.id}
                onPress={() => router.push(`/(admin)/visit-details/${visit.id}`)}
                activeOpacity={0.7}
                className="w-full bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 pr-2">
                    <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>
                      {visit.visitor?.name || 'Unknown Visitor'}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
                      {visit.visitor?.company || 'No company'}
                    </Text>
                  </View>
                  <View className={`rounded-full px-2 py-0.5 ${getStatusColor(visit.status)}`}>
                    <Text className="text-[10px] font-bold uppercase tracking-wider">{visit.status}</Text>
                  </View>
                </View>

                <View className="flex-row items-start mt-2">
                  <View className="min-w-0 flex-1 pr-3">
                    <View className="flex-row items-center mb-1.5">
                      <User color="#6b7280" size={16} className="mr-2" />
                      <Text className="text-gray-700 text-xs" numberOfLines={1}>
                        Host: {visit.host?.name || 'N/A'}
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-1.5">
                      <Building2 color="#6b7280" size={16} className="mr-2" />
                      <Text className="text-gray-700 text-xs" numberOfLines={1}>
                        {visit.host?.department || 'N/A'}
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-1.5">
                      <Calendar color="#6b7280" size={16} className="mr-2" />
                      <Text className="text-gray-700 text-xs" numberOfLines={1}>
                        {formatDate(visit.scheduledAt)}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Clock color="#6b7280" size={16} className="mr-2" />
                      <Text className="text-gray-700 text-xs" numberOfLines={1}>
                        {formatTime(visit.scheduledAt)}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    className="w-[90px] items-center"
                    activeOpacity={0.78}
                    onPress={() => router.push(`/(admin)/visit-details/${visit.id}`)}
                  >
                    <View className="rounded-lg border border-gray-100 bg-white p-1.5 shadow-sm">
                      <QRCode value={getQrValue(visit)} size={74} />
                    </View>
                    <Text className="mt-1 text-[10px] text-gray-500 text-center">Tap QR</Text>
                  </TouchableOpacity>
                </View>

                <View className="mt-2 pt-2 border-t border-gray-100 flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1 mr-2">
                    <Handshake color="#6b7280" size={14} className="mr-2" />
                    <Text className="text-gray-600 text-xs flex-1" numberOfLines={1}>
                      {visit.purpose || 'No purpose specified'}
                    </Text>
                  </View>
                  <View
                    className="flex-row items-center"
                  >
                    <Text className="font-bold text-blue-600 text-xs mr-1">View All Details</Text>
                    <ArrowRight color="#2563eb" size={14} />
                  </View>
                </View>

                {visit.status === 'EXPIRED' && (
                  <View className="mt-3 pt-3 border-t border-gray-100">
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRenew(visit.id);
                      }}
                      disabled={renewingId === visit.id}
                      className={`bg-blue-600 rounded-lg py-1.5 px-3 items-center flex-row justify-center ${renewingId === visit.id ? 'opacity-70' : ''}`}
                    >
                      {renewingId === visit.id && <ActivityIndicator color="#ffffff" size="small" className="mr-2" />}
                      <Text className="text-white font-bold text-xs">{renewingId === visit.id ? 'Renewing...' : 'Renew Appointment'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View className="w-full flex-row justify-between items-center mt-4 mb-4">
                <TouchableOpacity
                  onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg border border-gray-200 ${currentPage === 1 ? 'bg-gray-100 opacity-50' : 'bg-white'}`}
                >
                  <Text className="text-sm font-semibold text-gray-700">Previous</Text>
                </TouchableOpacity>
                <Text className="text-sm text-gray-600 font-medium">
                  Page {currentPage} of {totalPages}
                </Text>
                <TouchableOpacity
                  onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg border border-gray-200 ${currentPage === totalPages ? 'bg-gray-100 opacity-50' : 'bg-white'}`}
                >
                  <Text className="text-sm font-semibold text-gray-700">Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
