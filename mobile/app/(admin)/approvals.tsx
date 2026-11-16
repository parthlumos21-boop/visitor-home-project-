import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CalendarDays, Check, Clock, Eye, Hourglass, User, X, ChevronRight, Building2, Target, UserCheck, CircleDashed } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  approveNewAppointment,
  getNewAppointments,
  rejectNewAppointment,
} from '../../services/appointments';
import { logMobileActivity } from '../../services/activityLogger';

interface NewAppointment {
  id: string;
  appointmentId: string;
  fullName: string;
  mobile: string;
  email?: string | null;
  company?: string | null;
  visitorType?: string | null;
  purpose: string;
  personToMeet: string;
  department?: string | null;
  visitDate: string;
  arrivalTime?: string | null;
  vehicleNumber?: string | null;
  notes?: string | null;
  status: string;
  decidedByName?: string | null;
}

const formatDateLabel = (visitDate: string) => {
  const [day, month, year] = visitDate.split('-').map(Number);
  const visit = day && month && year ? new Date(year, month - 1, day) : null;
  const today = new Date();

  if (
    visit &&
    visit.getDate() === today.getDate() &&
    visit.getMonth() === today.getMonth() &&
    visit.getFullYear() === today.getFullYear()
  ) {
    return 'Today';
  }

  return visitDate;
};

export default function ApprovalsScreen() {
  const [appointments, setAppointments] = useState<NewAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED'>('PENDING');

  const [approvedVisitorName, setApprovedVisitorName] = useState('');
  const [rejectTarget, setRejectTarget] = useState<NewAppointment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonDetails, setRejectReasonDetails] = useState('');
  const [detailsTarget, setDetailsTarget] = useState<NewAppointment | null>(null);

  const params = useLocalSearchParams<{ appointmentId?: string }>();

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNewAppointments();
      setAppointments(data || []);
      logMobileActivity({
        event: 'admin_approval_list_loaded',
        screen: 'Admin Approvals',
        message: 'All new appointments loaded',
        metadata: { count: data.length },
      });
    } catch (error) {
      Alert.alert('Server Error', 'Unable to load approval requests.');
      logMobileActivity({
        event: 'admin_approval_list_error',
        screen: 'Admin Approvals',
        message: 'Unable to load all new appointments',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Deep linking support: auto-open details if appointmentId is passed
  useEffect(() => {
    if (params.appointmentId && appointments.length > 0 && !detailsTarget && !rejectTarget) {
      const target = appointments.find((a) => a.appointmentId === params.appointmentId);
      if (target) {
        setDetailsTarget(target);
        if (target.status === 'APPROVED') {
          setActiveTab('APPROVED');
        } else {
          setActiveTab('PENDING');
        }
      }
    }
  }, [params.appointmentId, appointments]);

  const updateAppointmentStatus = (id: string, newStatus: string) => {
    setAppointments((current) =>
      current.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  const handleApprove = async (appointment: NewAppointment) => {
    setActionLoading(true);
    try {
      await approveNewAppointment(appointment.id);
      updateAppointmentStatus(appointment.id, 'APPROVED');
      logMobileActivity({
        event: 'admin_appointment_approved',
        screen: 'Admin Approvals',
        action: 'Approve',
        message: 'New appointment approved',
        metadata: {
          appointmentId: appointment.appointmentId,
          visitorName: appointment.fullName,
        },
      });
      setApprovedVisitorName(appointment.fullName);
      setDetailsTarget(null);
    } catch (error) {
      Alert.alert('Server Error', 'Unable to approve appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmApprove = (appointment: NewAppointment) => {
    Alert.alert(
      'Approve Appointment?',
      `${appointment.fullName}'s request will be approved for the scheduled visit.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => handleApprove(appointment) },
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectTarget) return;

    const finalReason = [rejectReason, rejectReasonDetails].filter(Boolean).join(' - ');
    if (!finalReason.trim()) {
      Alert.alert('Reason Required', 'Please select or enter a reason for rejection.');
      return;
    }

    setActionLoading(true);
    try {
      await rejectNewAppointment(rejectTarget.id, finalReason);
      updateAppointmentStatus(rejectTarget.id, 'REJECTED');
      logMobileActivity({
        event: 'admin_appointment_rejected',
        screen: 'Admin Approvals',
        action: 'Reject',
        message: 'New appointment rejected',
        metadata: {
          appointmentId: rejectTarget.appointmentId,
          visitorName: rejectTarget.fullName,
          reason: finalReason,
        },
      });
      setRejectTarget(null);
      setDetailsTarget(null);
      setRejectReason('');
      setRejectReasonDetails('');
    } catch (error) {
      Alert.alert('Server Error', 'Unable to reject appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingAppointments = appointments.filter((a) => a.status === 'REGISTERED');
  const approvedAppointments = appointments.filter((a) => a.status === 'APPROVED');
  const displayedAppointments = activeTab === 'PENDING' ? pendingAppointments : approvedAppointments;

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-950">Visitor Approval Request</Text>
      </View>

      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row rounded-lg bg-gray-100 p-1">
          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-md py-2"
            style={activeTab === 'PENDING' ? { backgroundColor: 'white', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 } : undefined}
            onPress={() => setActiveTab('PENDING')}
          >
            <Text className="font-semibold" style={{ color: activeTab === 'PENDING' ? '#2563eb' : '#4b5563' }}>Pending ({pendingAppointments.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-md py-2"
            style={activeTab === 'APPROVED' ? { backgroundColor: 'white', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 } : undefined}
            onPress={() => setActiveTab('APPROVED')}
          >
            <Text className="font-semibold" style={{ color: activeTab === 'APPROVED' ? '#059669' : '#4b5563' }}>Approved ({approvedAppointments.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-4 pt-4 pb-1">
        <Text className="text-lg font-bold text-gray-900">Visitor Requests</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-3 text-sm text-gray-500">Loading appointments</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {displayedAppointments.length === 0 ? (
            <View className="mt-16 items-center">
              <Text className="text-base font-semibold text-gray-700">No {activeTab.toLowerCase()} appointments</Text>
            </View>
          ) : (
            displayedAppointments.map((appointment) => {
              if (activeTab === 'APPROVED') {
                return (
                  <View key={appointment.id} className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <View className="mb-3 flex-row items-start justify-between border-b border-gray-100 pb-3">
                        <View className="flex-1 pr-3">
                          <Text className="text-lg font-bold text-emerald-700 uppercase">{appointment.fullName} APPROVED</Text>
                          <Text className="mt-1 text-xs text-emerald-600">Approved by: {appointment.decidedByName || 'Admin'}</Text>
                          <View className="mt-2 flex-row items-center">
                            <Clock color="#6b7280" size={16} />
                          <Text className="ml-2 text-sm font-semibold text-gray-600">
                            {appointment.arrivalTime || 'Time TBD'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <Text className="text-sm font-semibold text-gray-500 mb-4">Appointment ID: {appointment.appointmentId}</Text>
                    
                    <View className="mb-4">
                      <Text className="text-base text-gray-800">Mobile: {appointment.mobile}</Text>
                      {appointment.company && <Text className="text-base text-gray-800">Company: {appointment.company}</Text>}
                    </View>
                    
                    <View className="mb-4">
                      <Text className="text-base text-gray-800">Visit Date: {appointment.visitDate}</Text>
                    </View>
                    
                    <View className="flex-row justify-end">
                      <TouchableOpacity
                        onPress={() => setDetailsTarget(appointment)}
                        className="flex-row items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-4 py-2"
                        activeOpacity={0.78}
                      >
                        <Text className="font-bold text-gray-800">View Details</Text>
                        <ChevronRight color="#374151" size={18} style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }

              // PENDING view rendering
              return (
                <View key={appointment.id} className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <View className="mb-3 border-b border-gray-100 pb-3">
                    <Text className="text-lg font-bold text-gray-900">Visitor Approval</Text>
                  </View>

                  <View className="mb-4">
                    <View className="mb-2 flex-row items-center">
                      <View className="w-6 items-center justify-center mr-2"><User color="#2563eb" size={18} /></View>
                      <Text className="text-base text-gray-700 w-28">Visitor Name:</Text>
                      <Text className="flex-1 text-base font-semibold text-gray-950">{appointment.fullName}</Text>
                    </View>
                    <View className="mb-2 flex-row items-center">
                      <View className="w-6 items-center justify-center mr-2"><Building2 color="#2563eb" size={18} /></View>
                      <Text className="text-base text-gray-700 w-28">Company:</Text>
                      <Text className="flex-1 text-base font-semibold text-gray-950">{appointment.company || 'N/A'}</Text>
                    </View>
                    <View className="mb-2 flex-row items-center">
                      <View className="w-6 items-center justify-center mr-2"><Target color="#2563eb" size={18} /></View>
                      <Text className="text-base text-gray-700 w-28">Purpose:</Text>
                      <Text className="flex-1 text-base font-semibold text-gray-950">{appointment.purpose}</Text>
                    </View>
                    <View className="mb-2 flex-row items-center">
                      <View className="w-6 items-center justify-center mr-2"><UserCheck color="#2563eb" size={18} /></View>
                      <Text className="text-base text-gray-700 w-28">Meet With:</Text>
                      <Text className="flex-1 text-base font-semibold text-gray-950">{appointment.personToMeet}</Text>
                    </View>
                    <View className="mb-2 flex-row items-center">
                      <View className="w-6 items-center justify-center mr-2"><CalendarDays color="#2563eb" size={18} /></View>
                      <Text className="text-base text-gray-700 w-28">Date:</Text>
                      <Text className="flex-1 text-base font-semibold text-gray-950">{formatDateLabel(appointment.visitDate)}</Text>
                    </View>
                    <View className="mb-2 flex-row items-center">
                      <View className="w-6 items-center justify-center mr-2"><Clock color="#2563eb" size={18} /></View>
                      <Text className="text-base text-gray-700 w-28">Time:</Text>
                      <Text className="flex-1 text-base font-semibold text-gray-950">{appointment.arrivalTime || 'TBD'}</Text>
                    </View>
                    <View className="mb-2 flex-row items-center">
                      <View className="w-6 items-center justify-center mr-2"><CircleDashed color="#2563eb" size={18} /></View>
                      <Text className="text-base text-gray-700 w-28">Status:</Text>
                      <Text className="flex-1 text-base font-bold text-amber-500">Pending</Text>
                    </View>
                  </View>

                  <View className="mt-2 flex-row">
                    <TouchableOpacity
                      onPress={() => setRejectTarget(appointment)}
                      className="mr-3 h-12 flex-1 flex-row items-center justify-center rounded-md border border-gray-300 bg-white"
                      activeOpacity={0.78}
                    >
                      <X color="#1f2937" size={18} style={{ marginRight: 6 }} />
                      <Text className="font-bold text-gray-800">REJECT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmApprove(appointment)}
                      className="h-12 flex-1 flex-row items-center justify-center rounded-md bg-emerald-600"
                      activeOpacity={0.78}
                    >
                      <Check color="#ffffff" size={18} style={{ marginRight: 6 }} />
                      <Text className="font-bold text-white">APPROVE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
      <Modal transparent visible animationType="fade" onRequestClose={() => setRejectTarget(null)}>
        <Pressable style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 24 }} onPress={() => setRejectTarget(null)}>
          <Pressable style={{ width: '100%', maxWidth: 384, borderRadius: 8, backgroundColor: '#fff', padding: 20 }} onPress={(event) => event.stopPropagation()}>
            <View className="items-end">
              <TouchableOpacity className="h-10 w-10 items-center justify-center" onPress={() => setRejectTarget(null)}>
                <X color="#374151" size={22} />
              </TouchableOpacity>
            </View>
            <Text className="text-center text-xl font-bold text-gray-950 mb-4">Reject Visitor Request</Text>
            
            <View className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-100">
              <Text className="text-base font-semibold text-gray-800">Visitor: {rejectTarget?.fullName}</Text>
              <Text className="text-sm text-gray-600 mt-1">Company: {rejectTarget?.company || 'N/A'}</Text>
            </View>

            <Text className="text-sm font-semibold text-gray-700">Reject Reason *</Text>
            
            <View className="mt-2 mb-4">
              {["Host Unavailable", "Invalid Details", "Reschedule Requested", "Other"].map(reason => (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setRejectReason(reason)}
                  className={`mb-2 p-3 rounded-md border ${rejectReason === reason ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                >
                  <Text style={{ color: rejectReason === reason ? '#1d4ed8' : '#374151', fontWeight: rejectReason === reason ? 'bold' : 'normal' }}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-sm font-semibold text-gray-700">Reason Details (Optional)</Text>
            <TextInput
              value={rejectReasonDetails}
              onChangeText={setRejectReasonDetails}
              placeholder="Enter additional details..."
              placeholderTextColor="#9ca3af"
              multiline
              style={{
                marginTop: 8,
                minHeight: 80,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#d1d5db',
                backgroundColor: '#f9fafb',
                padding: 12,
                fontSize: 15,
                color: '#030712',
                textAlignVertical: 'top'
              }}
            />
            <View className="mt-6 flex-row">
              <TouchableOpacity
                onPress={() => {
                  setRejectTarget(null);
                  setRejectReason('');
                  setRejectReasonDetails('');
                }}
                className="mr-3 h-12 flex-1 items-center justify-center rounded-md border border-gray-300"
              >
                <Text className="font-bold text-gray-800">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReject}
                disabled={actionLoading}
                className="h-12 flex-1 items-center justify-center rounded-md bg-red-600"
                style={actionLoading ? { opacity: 0.7 } : undefined}
              >
                <Text className="font-bold text-white">Reject Request</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      )}

      {/* Details Modal */}
      {detailsTarget && (
      <Modal transparent visible animationType="fade" onRequestClose={() => setDetailsTarget(null)}>
        <Pressable style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 20 }} onPress={() => setDetailsTarget(null)}>
          <Pressable style={{ maxHeight: '88%', width: '100%', borderRadius: 8, backgroundColor: '#fff' }} onPress={(event) => event.stopPropagation()}>
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
              <Text className="text-lg font-bold text-gray-950">Approval Details</Text>
              <TouchableOpacity className="h-10 w-10 items-center justify-center" onPress={() => setDetailsTarget(null)}>
                <X color="#374151" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <View className="rounded-lg border border-gray-200 bg-white p-4">
                <View className="flex-row items-start">
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                    <User color="#2563eb" size={24} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-gray-950">{detailsTarget?.fullName}</Text>
                    <Text className="mt-1 text-sm text-gray-500">{detailsTarget?.company || 'No company provided'}</Text>
                  </View>
                  <View className="rounded-full bg-amber-50 px-3 py-1">
                    <Text className="text-xs font-bold text-amber-700">{detailsTarget?.status || 'REGISTERED'}</Text>
                  </View>
                </View>

                <View className="mt-5 rounded-md bg-gray-50 p-4">
                  <View className="flex-row items-start">
                    <View className="flex-1 flex-row items-center">
                      <CalendarDays color="#6b7280" size={18} />
                      <Text className="ml-2 flex-1 text-sm font-semibold text-gray-700">
                        {detailsTarget ? formatDateLabel(detailsTarget.visitDate) : ''}
                      </Text>
                    </View>
                    <Text className="mx-2 text-gray-400">-</Text>
                    <View className="flex-1 flex-row items-center">
                      <Clock color="#6b7280" size={18} />
                      <Text className="ml-2 flex-1 text-sm font-semibold text-gray-700">
                        {detailsTarget?.arrivalTime || 'Time TBD'}
                      </Text>
                    </View>
                  </View>
                  <View className="mt-3 flex-row items-center">
                    <User color="#6b7280" size={18} />
                    <Text className="ml-2 text-sm font-semibold text-gray-700">Meeting: {detailsTarget?.personToMeet}</Text>
                  </View>
                </View>

                {[
                  ['Appointment ID', detailsTarget?.appointmentId],
                  ['Mobile', detailsTarget?.mobile],
                  ['Email', detailsTarget?.email || 'Not provided'],
                  ['Visitor Type', detailsTarget?.visitorType || 'Not provided'],
                  ['Purpose', detailsTarget?.purpose],
                  ['Department', detailsTarget?.department || 'Not provided'],
                  ['Vehicle Number', detailsTarget?.vehicleNumber || 'Not provided'],
                  ['Notes', detailsTarget?.notes || 'Not provided'],
                ].map(([label, value]) => (
                  <View key={label} className="mt-3">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</Text>
                    <Text className="mt-1 text-base text-gray-900">{value}</Text>
                  </View>
                ))}
              </View>

              {activeTab === 'PENDING' && (
                <View className="mt-5 flex-row">
                  <TouchableOpacity
                    onPress={() => detailsTarget && setRejectTarget(detailsTarget)}
                    className="mr-3 h-12 flex-1 items-center justify-center rounded-md border border-red-200 bg-red-50"
                    activeOpacity={0.78}
                  >
                    <Text className="font-bold text-red-700">Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => detailsTarget && confirmApprove(detailsTarget)}
                    className="h-12 flex-1 flex-row items-center justify-center rounded-md bg-emerald-600"
                    activeOpacity={0.78}
                  >
                    <Text className="font-bold text-white">Approve</Text>
                    <Check color="#ffffff" size={18} />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      )}

      {/* Success Modal */}
      {approvedVisitorName ? (
      <Modal transparent visible animationType="fade" onRequestClose={() => setApprovedVisitorName('')}>
        <Pressable style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 24 }} onPress={() => setApprovedVisitorName('')}>
          <Pressable style={{ width: '100%', maxWidth: 384, borderRadius: 8, backgroundColor: '#fff', padding: 24 }} onPress={(event) => event.stopPropagation()}>
            <View className="items-center">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <Check color="#059669" size={30} />
              </View>
              <Text className="mt-6 text-center text-xl font-bold text-gray-950">Visitor Request Approved</Text>
              <Text className="mt-4 text-center text-base leading-6 text-gray-600">
                {approvedVisitorName} has been approved for the scheduled visit.
              </Text>
              <TouchableOpacity
                onPress={() => setApprovedVisitorName('')}
                className="mt-6 h-12 min-w-[120px] items-center justify-center rounded-md bg-blue-600 px-6"
              >
                <Text className="font-bold text-white">Done</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      ) : null}
    </View>
  );
}
