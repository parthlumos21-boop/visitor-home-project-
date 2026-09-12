import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, User, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getEmployeeVisits } from '../../services/employee';
import { StatusBadge } from '../../components/StatusBadge';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const titles: Record<string, string> = {
  my: 'My Visitors',
  upcoming: 'Upcoming Today',
  inside: 'Currently Inside',
  recent: 'Recent Visits',
};

export default function EmployeeVisitors() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filter?: string }>();
  const filter = typeof params.filter === 'string' ? params.filter : 'recent';
  const title = titles[filter] || 'Recent Visits';

  const [visits, setVisits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsVisit, setDetailsVisit] = useState<any | null>(null);
  const { user } = useAuthStore();
  const [renewingId, setRenewingId] = useState<string | null>(null);

  const handleRenew = async (visitId: string) => {
    try {
      setRenewingId(visitId);
      await api.put(`/new-appointments/${visitId}/renew`, {
        approverId: user?.id,
        approverName: user?.name
      });
      alert('Success: Appointment renewed successfully. The visitor can now reuse this pass.');
      await loadVisits();
      if (detailsVisit?.id === visitId) {
        setDetailsVisit(null);
      }
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.error || 'Failed to renew appointment.'));
    } finally {
      setRenewingId(null);
    }
  };

  const loadVisits = useCallback(async () => {
    setError(null);
    try {
      const data = await getEmployeeVisits(filter);
      const seen = new Set();
      const deduplicated = (data || []).filter((visit: any) => {
        if (!visit.scheduledAt) return true;
        const dateStr = new Date(visit.scheduledAt || Date.now()).toISOString().split('T')[0];
        const vName = (visit.visitor?.name || '').toLowerCase().trim();
        const hName = (visit.host?.name || '').toLowerCase().trim();
        const key = `${vName}-${hName}-${dateStr}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setVisits(deduplicated);
    } catch (err) {
      setError('Failed to load visits');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setIsLoading(true);
    loadVisits();
  }, [loadVisits]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVisits();
    setRefreshing(false);
  }, [loadVisits]);

  const emptyText = useMemo(() => {
    if (filter === 'my') return 'No visitors have been added yet.';
    if (filter === 'upcoming') return 'No visitors are scheduled for today.';
    if (filter === 'inside') return 'No visitors are currently inside.';
    return 'No recent visits found.';
  }, [filter]);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-200 px-4 pb-3 flex-row items-center" style={{ paddingTop: insets.top + 8 }}>
        <TouchableOpacity onPress={() => router.push('/(employee)/dashboard')} className="mr-3 p-2 -ml-2">
          <ArrowLeft color="#111827" size={24} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-950 flex-1">{title}</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-3 text-sm text-gray-500">Loading visits</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
        >
          {error ? (
            <View className="rounded-lg border border-red-100 bg-red-50 p-4">
              <Text className="font-semibold text-red-700">{error}</Text>
              <TouchableOpacity onPress={loadVisits} className="mt-3 h-11 justify-center rounded-md bg-red-600 px-4">
                <Text className="text-center font-semibold text-white">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : visits.length === 0 ? (
            <View className="mt-10 items-center">
              <Text className="text-base text-gray-500">{emptyText}</Text>
            </View>
          ) : (
            visits.map((visit) => (
              <TouchableOpacity 
                key={visit.id} 
                className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                activeOpacity={0.7}
                onPress={() => setDetailsVisit(visit)}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-lg font-bold text-gray-950">{visit.visitor?.name || 'Visitor'}</Text>
                    <Text className="mt-1 text-sm font-semibold text-blue-700">{visit.displayId || 'VIS-000000'}</Text>
                    <Text className="mt-1 text-sm text-gray-600">{visit.visitor?.phone || 'No mobile saved'}</Text>
                  </View>
                  <StatusBadge status={visit.status} />
                </View>

                <View className="mt-4 gap-3">
                  <View className="flex-row items-center">
                    <Calendar color="#6b7280" size={18} />
                    <Text className="ml-2 text-gray-700">{new Date(visit.scheduledAt).toLocaleDateString()}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Clock color="#6b7280" size={18} />
                    <Text className="ml-2 text-gray-700">
                      {new Date(visit.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <User color="#6b7280" size={18} />
                    <Text className="ml-2 text-gray-700">{visit.purpose}</Text>
                  </View>
                </View>
                <View className="mt-4 h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 flex-row">
                  <Text className="font-bold text-blue-600 mr-2">View All Details</Text>
                  <ArrowLeft color="#2563eb" size={16} style={{transform: [{rotate: '180deg'}]}} />
                </View>

                {visit.status === 'EXPIRED' && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRenew(visit.id);
                    }}
                    disabled={renewingId === visit.id}
                    className={`mt-3 h-10 items-center justify-center rounded-md border border-blue-600 bg-blue-50 flex-row ${renewingId === visit.id ? 'opacity-70' : ''}`}
                  >
                    {renewingId === visit.id && <ActivityIndicator color="#2563eb" size="small" className="mr-2" />}
                    <Text className="font-bold text-blue-700">{renewingId === visit.id ? 'Renewing...' : 'Renew Appointment'}</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <Modal transparent visible={!!detailsVisit} animationType="fade" onRequestClose={() => setDetailsVisit(null)}>
        <Pressable className="flex-1 items-center justify-center bg-black/50 px-5" onPress={() => setDetailsVisit(null)}>
          <Pressable className="max-h-[86%] w-full rounded-lg bg-white" onPress={(event) => event.stopPropagation()}>
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
              <Text className="text-lg font-bold text-gray-950">Visitor Details</Text>
              <TouchableOpacity className="h-10 w-10 items-center justify-center" onPress={() => setDetailsVisit(null)}>
                <X color="#374151" size={22} />
              </TouchableOpacity>
            </View>
            <ScrollView className="shrink" contentContainerStyle={{ padding: 16 }}>
              <View className="items-center">
                <View className="h-14 w-14 items-center justify-center rounded-lg bg-blue-50">
                  <User color="#2563eb" size={28} />
                </View>
                <Text className="mt-3 text-xl font-bold text-gray-950">{detailsVisit?.visitor?.name || 'Visitor'}</Text>
                <Text className="mt-1 text-sm text-gray-500">{detailsVisit?.displayId || 'VIS-000000'}</Text>
                {detailsVisit ? <StatusBadge status={detailsVisit.status} className="mt-3" /> : null}
              </View>

              {[
                ['Mobile', detailsVisit?.visitor?.phone || 'Not provided'],
                ['Email', detailsVisit?.visitor?.email || 'Not provided'],
                ['Purpose', detailsVisit?.purpose || 'Not provided'],
                ['Visit Date', detailsVisit ? new Date(detailsVisit.scheduledAt).toLocaleDateString() : 'Not provided'],
                ['Arrival Time', detailsVisit ? new Date(detailsVisit.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not provided'],
                ['Host', detailsVisit?.host?.name || 'Employee'],
                ['Department', detailsVisit?.host?.department || 'Not provided'],
              ].map(([label, value]) => (
                <View key={label} className="mt-3">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</Text>
                  <Text className="mt-1 text-base text-gray-900">{value}</Text>
                </View>
              ))}

              {detailsVisit?.status === 'EXPIRED' && (
                <TouchableOpacity
                  onPress={() => handleRenew(detailsVisit.id)}
                  disabled={renewingId === detailsVisit.id}
                  className={`mt-5 h-12 items-center justify-center rounded-md bg-blue-600 flex-row ${renewingId === detailsVisit.id ? 'opacity-70' : ''}`}
                >
                  {renewingId === detailsVisit.id && <ActivityIndicator color="#ffffff" size="small" className="mr-2" />}
                  <Text className="font-bold text-white">{renewingId === detailsVisit.id ? 'Renewing...' : 'Renew Appointment'}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setDetailsVisit(null)}
                className={`mt-3 h-12 items-center justify-center rounded-md ${detailsVisit?.status === 'EXPIRED' ? 'bg-gray-200' : 'bg-blue-600'}`}
              >
                <Text className={`font-bold ${detailsVisit?.status === 'EXPIRED' ? 'text-gray-800' : 'text-white'}`}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
