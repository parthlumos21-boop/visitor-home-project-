import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Plus, ArrowLeft, UserCheck, Phone, Mail, UserX, Edit3, KeyRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSecurityGuards, createSecurityGuard, updateSecurityGuard, deactivateSecurityGuard, SecurityGuard } from '../../../services/security';

export default function AdminSecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [guards, setGuards] = useState<SecurityGuard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuard, setEditingGuard] = useState<SecurityGuard | null>(null);

  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [designation, setDesignation] = useState('Security Guard');
  const [saving, setSaving] = useState(false);

  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    fetchGuards();
  }, []);

  const fetchGuards = async () => {
    setLoading(true);
    try {
      const data = await getSecurityGuards();
      if (mounted.current) {
        setGuards(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch security guards:', error);
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const openCreateModal = () => {
    setEditingGuard(null);
    setName('');
    setEmployeeId('');
    setPhone('');
    setEmail('');
    setPassword('');
    setDesignation('Security Guard');
    setIsModalOpen(true);
  };

  const openEditModal = (guard: SecurityGuard) => {
    setEditingGuard(guard);
    setName(guard.name || '');
    setEmployeeId(guard.employeeId || '');
    setPhone(guard.phone || '');
    setEmail(guard.email || '');
    setPassword('');
    setDesignation(guard.designation || 'Security Guard');
    setIsModalOpen(true);
  };

  const handleSaveGuard = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Validation Error', 'Name and Email are required.');
      return;
    }
    if (!editingGuard && (!password.trim() || password.length < 6)) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      if (editingGuard) {
        await updateSecurityGuard(editingGuard.id, {
          name: name.trim(),
          employeeId: employeeId.trim() || null,
          phone: phone.trim() || null,
          email: email.trim(),
          designation: designation.trim() || null,
        });
        Alert.alert('Success', 'Security Guard updated successfully.');
      } else {
        await createSecurityGuard({
          name: name.trim(),
          employeeId: employeeId.trim() || null,
          phone: phone.trim() || null,
          email: email.trim(),
          password: password.trim(),
          designation: designation.trim() || 'Security Guard',
          status: 'ACTIVE',
        });
        Alert.alert('Success', 'Security Guard created successfully.');
      }
      setIsModalOpen(false);
      fetchGuards();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to save security guard');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = (guard: SecurityGuard) => {
    Alert.alert(
      'Deactivate Guard',
      `Are you sure you want to deactivate ${guard.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivateSecurityGuard(guard.id);
              Alert.alert('Success', 'Security Guard deactivated.');
              fetchGuards();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to deactivate guard.');
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View 
        className="bg-white px-4 pb-3 border-b border-gray-200 flex-row items-center justify-between"
        style={{ paddingTop: Math.max(insets.top, 16) + 8 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft color="#1f2937" size={24} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Security Management</Text>
        </View>

        <TouchableOpacity 
          onPress={openCreateModal}
          className="bg-emerald-600 px-3.5 py-2 rounded-xl flex-row items-center shadow-sm"
        >
          <Plus color="white" size={18} className="mr-1" />
          <Text className="text-white font-bold text-sm">Add Guard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mb-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-emerald-600 items-center justify-center mr-3">
            <Shield color="white" size={22} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900">Security Personnel</Text>
            <Text className="text-xs text-gray-600">Active Gate Security Guards & Credentials</Text>
          </View>
        </View>

        {loading ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color="#059669" />
          </View>
        ) : guards.length === 0 ? (
          <View className="py-16 items-center justify-center bg-white rounded-2xl border border-gray-200 p-6">
            <Shield color="#9ca3af" size={48} className="mb-3" />
            <Text className="text-gray-500 font-semibold text-base">No Security Guards found</Text>
            <TouchableOpacity onPress={openCreateModal} className="mt-4 bg-emerald-600 px-4 py-2.5 rounded-xl">
              <Text className="text-white font-bold">Add Security Personnel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          guards.map((guard) => (
            <View key={guard.id} className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center mr-3">
                    <UserCheck color="#059669" size={22} />
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-gray-900">{guard.name}</Text>
                    <Text className="text-xs text-gray-500 font-medium">{guard.designation || 'Security Guard'}</Text>
                  </View>
                </View>
                <View className={`px-2.5 py-1 rounded-full ${guard.status === 'ACTIVE' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  <Text className={`text-xs font-bold uppercase ${guard.status === 'ACTIVE' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {guard.status}
                  </Text>
                </View>
              </View>

              <View className="mt-3 space-y-1.5 mb-4">
                {guard.employeeId && (
                  <Text className="text-gray-600 text-sm"><Text className="font-semibold text-gray-800">Guard ID:</Text> {guard.employeeId}</Text>
                )}
                <Text className="text-gray-600 text-sm"><Text className="font-semibold text-gray-800">Email:</Text> {guard.email}</Text>
                <Text className="text-gray-600 text-sm"><Text className="font-semibold text-gray-800">Phone:</Text> {guard.phone || 'N/A'}</Text>
              </View>

              <View className="flex-row justify-end space-x-2 pt-2 border-t border-gray-50">
                <TouchableOpacity onPress={() => openEditModal(guard)} className="bg-blue-50 px-3 py-2 rounded-xl flex-row items-center mr-2">
                  <Edit3 color="#2563eb" size={16} className="mr-1" />
                  <Text className="text-blue-600 font-bold text-xs">Edit</Text>
                </TouchableOpacity>
                {guard.status === 'ACTIVE' && (
                  <TouchableOpacity onPress={() => handleDeactivate(guard)} className="bg-red-50 px-3 py-2 rounded-xl flex-row items-center">
                    <UserX color="#dc2626" size={16} className="mr-1" />
                    <Text className="text-red-600 font-bold text-xs">Deactivate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal for Creating / Editing Security Guard */}
      <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={() => setIsModalOpen(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              {editingGuard ? 'Edit Security Guard' : 'Add Security Guard'}
            </Text>

            <TextInput
              placeholder="Full Name *"
              value={name}
              onChangeText={setName}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-3"
            />
            <TextInput
              placeholder="Employee / Guard ID"
              value={employeeId}
              onChangeText={setEmployeeId}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-3"
            />
            <TextInput
              placeholder="Email Address *"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-3"
            />
            <TextInput
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-3"
            />

            {!editingGuard && (
              <TextInput
                placeholder="Password *"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
              />
            )}

            <View className="flex-row justify-end space-x-3 mt-2">
              <TouchableOpacity onPress={() => setIsModalOpen(false)} className="px-5 py-3 rounded-xl border border-gray-300 mr-2">
                <Text className="font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={saving} onPress={handleSaveGuard} className="bg-emerald-600 px-6 py-3 rounded-xl flex-row items-center">
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="font-bold text-white">Save Guard</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
