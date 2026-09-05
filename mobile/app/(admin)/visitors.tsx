import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CalendarDays, Clock, Plus, User, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getNewAppointments } from '../../services/appointments';
import { getApiErrorMessage } from '../../services/errorMessage';

export default function VisitorsScreen() {
  const router = useRouter();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsVisitor, setDetailsVisitor] = useState<any | null>(null);

  const loadVisitors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNewAppointments();
      setVisitors(data);
    } catch (error) {
      Alert.alert('Server Error', getApiErrorMessage(error, 'Unable to load visitors.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVisitors();
  }, [loadVisitors]);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-950">Visitors</Text>
        <TouchableOpacity
          onPress={() => router.push('/(admin)/add-visitor')}
          className="mt-4 h-12 flex-row items-center justify-center rounded-md bg-blue-600"
          activeOpacity={0.78}
        >
          <Plus color="#ffffff" size={20} />
          <Text className="ml-2 font-bold text-white">Add New Visitor</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-3 text-sm text-gray-500">Loading visitors</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {visitors.length === 0 ? (
            <Text className="mt-12 text-center text-gray-500">No visitors found.</Text>
          ) : (
            visitors.map((visitor) => (
              <View key={visitor.id} className="mb-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <View className="flex-row">
                  <View className="mr-3 h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
                    <User color="#2563eb" size={22} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-gray-950">{visitor.fullName}</Text>
                    <Text className="mt-1 text-sm text-gray-500">{visitor.company || 'No company provided'}</Text>
                    <Text className="mt-2 text-sm text-gray-700">{visitor.mobile}</Text>
                    <Text className="mt-1 text-sm text-gray-700">Meeting: {visitor.personToMeet}</Text>
                    <Text
                      className={`mt-1 text-xs font-semibold ${
                        visitor.status === 'REJECTED'
                          ? 'text-red-700'
                          : visitor.status === 'APPROVED'
                            ? 'text-emerald-700'
                            : 'text-blue-700'
                      }`}
                    >
                      {visitor.status}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setDetailsVisitor(visitor)}
                      className="mt-3 h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50"
                    >
                      <Text className="font-bold text-gray-800">View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal transparent visible={!!detailsVisitor} animationType="fade" onRequestClose={() => setDetailsVisitor(null)}>
        <Pressable className="flex-1 items-center justify-center bg-black/50 px-5" onPress={() => setDetailsVisitor(null)}>
          <Pressable className="max-h-[86%] w-full rounded-lg bg-white" onPress={(event) => event.stopPropagation()}>
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
              <Text className="text-lg font-bold text-gray-950">Visitor Details</Text>
              <TouchableOpacity className="h-10 w-10 items-center justify-center" onPress={() => setDetailsVisitor(null)}>
                <X color="#374151" size={22} />
              </TouchableOpacity>
            </View>
            <ScrollView className="shrink" contentContainerStyle={{ padding: 16 }}>
              <View className="items-center">
                <View className="h-14 w-14 items-center justify-center rounded-lg bg-blue-50">
                  <User color="#2563eb" size={28} />
                </View>
                <Text className="mt-3 text-xl font-bold text-gray-950">{detailsVisitor?.fullName}</Text>
                <Text className="mt-1 text-sm text-gray-500">{detailsVisitor?.company || 'No company provided'}</Text>
                <Text
                  className={`mt-3 rounded-full px-3 py-1 text-xs font-bold ${
                    detailsVisitor?.status === 'REJECTED'
                      ? 'bg-red-50 text-red-700'
                      : detailsVisitor?.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {detailsVisitor?.status}
                </Text>
              </View>

              <View className="mt-5 rounded-md bg-gray-50 p-4">
                <View className="flex-row items-center">
                  <CalendarDays color="#6b7280" size={18} />
                  <Text className="ml-2 text-sm font-semibold text-gray-700">{detailsVisitor?.visitDate}</Text>
                  <Text className="mx-3 text-gray-400">•</Text>
                  <Clock color="#6b7280" size={18} />
                  <Text className="ml-2 text-sm font-semibold text-gray-700">{detailsVisitor?.arrivalTime || 'Time TBD'}</Text>
                </View>
                <Text className="mt-3 text-sm text-gray-700">Meeting: {detailsVisitor?.personToMeet}</Text>
                <Text className="mt-2 text-sm text-gray-700">Purpose: {detailsVisitor?.purpose}</Text>
              </View>

              {[
                ['Mobile', detailsVisitor?.mobile],
                ['Email', detailsVisitor?.email || 'Not provided'],
                ['Visitor Type', detailsVisitor?.visitorType || 'Not provided'],
                ['Department', detailsVisitor?.department || 'Not provided'],
                ['Vehicle Number', detailsVisitor?.vehicleNumber || 'Not provided'],
                ['Notes', detailsVisitor?.notes || 'Not provided'],
              ].map(([label, value]) => (
                <View key={label} className="mt-3">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</Text>
                  <Text className="mt-1 text-base text-gray-900">{value}</Text>
                </View>
              ))}

              {detailsVisitor?.status === 'REJECTED' ? (
                <View className="mt-4 rounded-md border border-red-100 bg-red-50 p-3">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-red-700">Rejection Reason</Text>
                  <Text className="mt-1 text-base text-red-800">{detailsVisitor?.rejectionReason || 'No reason saved'}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() => setDetailsVisitor(null)}
                className="mt-5 h-12 items-center justify-center rounded-md bg-blue-600"
              >
                <Text className="font-bold text-white">Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
