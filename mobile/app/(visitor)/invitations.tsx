import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Alert, RefreshControl, Modal, TextInput } from 'react-native';
import { Clock, User, Calendar, Check, X, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { getVisitorInvitations, updateInvitationStatus } from '../../services/visits';

export default function VisitorInvitations() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);

  // Rejection modal state
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInvitations = async () => {
    try {
      const data = await getVisitorInvitations();
      setInvitations(data || []);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInvitations();
    setRefreshing(false);
  }, []);

  const handleAccept = async (id: string) => {
    try {
      Alert.alert('Accepting', 'Accepting invitation...');
      await updateInvitationStatus(id, 'APPROVED');
      Alert.alert('Success', 'Invitation accepted successfully!');
      loadInvitations();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept invitation');
    }
  };

  const handleRejectPress = (id: string) => {
    setRejectId(id);
    setRejectReason('');
    setIsRejectModalVisible(true);
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }
    if (!rejectId) return;

    try {
      setIsSubmitting(true);
      await updateInvitationStatus(rejectId, 'REJECTED', rejectReason);
      setIsRejectModalVisible(false);
      Alert.alert('Success', 'Invitation rejected.');
      loadInvitations();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-16 pb-4 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Pending invitations</Text>
      </View>

      <ScrollView 
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
      >
        {invitations.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20 mt-10">
             <View className="bg-gray-100 p-6 rounded-full mb-4">
               <Calendar color="#9ca3af" size={48} />
             </View>
             <Text className="text-xl font-bold text-gray-800 mb-2">No pending invitations</Text>
             <Text className="text-gray-500 text-center px-6">You don't have any pending invitations right now.</Text>
          </View>
        ) : (
          invitations.map((invitation) => (
            <View key={invitation.id} className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-blue-200">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900">You're Invited!</Text>
                  <Text className="text-sm font-semibold text-blue-700">{invitation.displayId}</Text>
                </View>
                <View className="bg-blue-100 px-3 py-1 rounded-full">
                  <Text className="text-xs font-bold text-blue-800">NEW</Text>
                </View>
              </View>
              
              <View className="gap-2 mb-4">
                <View className="flex-row items-center">
                  <User color="#4b5563" size={16} />
                  <Text className="ml-2 text-gray-700">Invited by: <Text className="font-bold">{invitation.host?.name}</Text></Text>
                </View>
                <View className="flex-row items-center">
                  <Calendar color="#4b5563" size={16} />
                  <Text className="ml-2 text-gray-700">{new Date(invitation.scheduledAt).toLocaleDateString()}</Text>
                </View>
                <View className="flex-row items-center">
                  <Clock color="#4b5563" size={16} />
                  <Text className="ml-2 text-gray-700">
                    {new Date(invitation.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-end space-x-3 gap-3 border-t border-gray-100 pt-4 mt-2">
                <TouchableOpacity 
                  onPress={() => handleRejectPress(invitation.id)}
                  className="bg-red-50 px-4 py-2 rounded-lg flex-row items-center"
                >
                  <X color="#ef4444" size={16} className="mr-1" />
                  <Text className="text-red-600 font-bold ml-1">Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleAccept(invitation.id)}
                  className="bg-green-600 px-4 py-2 rounded-lg flex-row items-center shadow-sm"
                >
                  <Check color="#ffffff" size={16} className="mr-1" />
                  <Text className="text-white font-bold ml-1">Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Reject Reason Modal */}
      <Modal visible={isRejectModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white w-full rounded-2xl p-6 shadow-xl">
            <Text className="text-xl font-bold text-gray-900 mb-2">Reject Invitation</Text>
            <Text className="text-gray-600 mb-4">Please provide a reason for declining this invitation.</Text>
            
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 min-h-[100px] mb-6"
              placeholder="e.g., I have another meeting..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              value={rejectReason}
              onChangeText={setRejectReason}
              editable={!isSubmitting}
            />

            <View className="flex-row justify-end space-x-3 gap-3">
              <TouchableOpacity 
                onPress={() => setIsRejectModalVisible(false)}
                className="px-5 py-3 rounded-xl bg-gray-100"
                disabled={isSubmitting}
              >
                <Text className="text-gray-700 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={submitReject}
                className="px-5 py-3 rounded-xl bg-red-600"
                disabled={isSubmitting}
              >
                <Text className="text-white font-bold">{isSubmitting ? 'Submitting...' : 'Confirm Reject'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
