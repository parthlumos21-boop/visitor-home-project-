import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, FlatList, Platform, Alert, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ChevronDown, X, Calendar } from 'lucide-react-native';
import { createNewAppointment } from '../../services/appointments';
import api from '../../services/api';

const SelectField = ({ label, value, options, onSelect }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-gray-700 font-medium mb-1">{label}</Text>
      <TouchableOpacity 
        className="flex-row justify-between items-center bg-gray-50 border border-gray-200 p-3 rounded-lg"
        onPress={() => setModalVisible(true)}
      >
        <Text className={value ? "text-black" : "text-gray-400"}>
          {value || `Select ${label.replace(' *', '').toLowerCase()}`}
        </Text>
        <ChevronDown color="#9ca3af" size={20} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 h-1/2">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">Select {label.replace(' *', '')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#000" size={24} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  className="p-4 border-b border-gray-100"
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                >
                  <Text className="text-lg">{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const InputField = ({ label, placeholder, optional = false, style, icon, onIconPress, ...props }: any) => (
  <View className="mb-4">
    <Text className="text-gray-700 font-medium mb-1">{label} {!optional && '*'}</Text>
    <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg pr-3">
      <TextInput 
        className="flex-1 p-3 text-base text-black"
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        style={style}
        {...props}
      />
      {icon && (
        <TouchableOpacity className="ml-2 p-1" onPress={onIconPress}>
          {icon}
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function NewRegistrationScreen() {
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hosts, setHosts] = useState<any[]>([]);

  const [form, setForm] = useState({
    fullName: '', mobile: '', email: '', company: '',
    visitorType: '', purpose: '', personToMeet: '', department: '',
    visitDate: (() => {
      const d = new Date();
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    })(),
    arrivalTime: '', vehicleNumber: '', notes: ''
  });
  const hostNames = useMemo(() => hosts.map((host) => host.name), [hosts]);

  useEffect(() => {
    const loadHosts = async () => {
      try {
        const response = await api.get('/visitors/hosts');
        setHosts(response.data || []);
      } catch (error) {
        Alert.alert('Server Error', 'Unable to load employee list.');
      }
    };

    loadHosts();
  }, []);

  const handleRegister = async () => {
    if (!form.fullName.trim() || !form.mobile.trim() || !form.purpose.trim() || !form.personToMeet.trim() || !form.visitDate.trim()) {
      Alert.alert('Missing Details', 'Please fill full name, mobile number, purpose, person to meet, and visit date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const appointment = await createNewAppointment(form);
      setForm({
        fullName: '', mobile: '', email: '', company: '',
        visitorType: '', purpose: '', personToMeet: '', department: '',
        visitDate: (() => {
          const d = new Date();
          return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
        })(),
        arrivalTime: '', vehicleNumber: '', notes: ''
      });
      router.replace({
        pathname: '/(visitor)/appointment',
        params: {
          ...form,
          appointmentId: appointment.appointmentId,
        },
      });
    } catch (error) {
      Alert.alert('Server Error', 'Unable to save appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-6">
      
      {/* BASIC DETAILS */}
      <Text className="text-sm font-bold text-gray-500 tracking-widest mb-4">BASIC DETAILS</Text>
      <InputField label="Full Name" placeholder="Enter full name" value={form.fullName} onChangeText={(t: string) => setForm({...form, fullName: t})} />
      <InputField label="Mobile Number" placeholder="Enter mobile number" keyboardType="phone-pad" value={form.mobile} onChangeText={(t: string) => setForm({...form, mobile: t})} />
      <InputField label="Email ID" placeholder="Enter email address" keyboardType="email-address" optional value={form.email} onChangeText={(t: string) => setForm({...form, email: t})} />
      <InputField label="Company" placeholder="Enter company name" optional value={form.company} onChangeText={(t: string) => setForm({...form, company: t})} />
      
      <View className="h-px bg-gray-200 my-6" />

      {/* VISIT DETAILS */}
      <Text className="text-sm font-bold text-gray-500 tracking-widest mb-4">VISIT DETAILS</Text>
      <SelectField label="Visitor Type" value={form.visitorType} options={['Contractor', 'Client', 'Interviewee', 'Vendor', 'Personal']} onSelect={(v: string) => setForm({...form, visitorType: v})} />
      <SelectField label="Purpose of Visit *" value={form.purpose} options={['Meeting', 'Delivery', 'Interview', 'Maintenance', 'Other']} onSelect={(v: string) => setForm({...form, purpose: v})} />
      <SelectField label="Person to Meet *" value={form.personToMeet} options={hostNames} onSelect={(v: string) => {
        const host = hosts.find((item) => item.name === v);
        setForm({...form, personToMeet: v, department: host?.department || ''});
      }} />
      <SelectField label="Department" value={form.department} options={[...new Set(hosts.map((host) => host.department).filter(Boolean))]} onSelect={(v: string) => setForm({...form, department: v})} />
      <InputField 
        label="Visit Date" 
        placeholder="DD-MM-YYYY" 
        value={form.visitDate} 
        onChangeText={(t: string) => setForm({...form, visitDate: t})} 
        icon={<Calendar color="#9ca3af" size={20} />} 
        onIconPress={() => setShowDatePicker(true)} 
      />
      {showDatePicker && (
        <DateTimePicker
          value={
            form.visitDate && form.visitDate.split('-').length === 3
              ? new Date(form.visitDate.split('-').reverse().join('-'))
              : new Date()
          }
          mode="date"
          display="default"
          onDismiss={() => setShowDatePicker(false)}
          onValueChange={(_event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              const d = selectedDate;
              const formatted = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
              setForm({...form, visitDate: formatted});
            }
          }}
        />
      )}
      <InputField label="Expected Arrival" placeholder="HH:MM AM/PM" optional value={form.arrivalTime} onChangeText={(t: string) => setForm({...form, arrivalTime: t})} />

      <View className="h-px bg-gray-200 my-6" />

      {/* OPTIONAL DETAILS */}
      <Text className="text-sm font-bold text-gray-500 tracking-widest mb-4">OPTIONAL DETAILS</Text>
      <InputField label="Vehicle Number" placeholder="Enter vehicle number" optional value={form.vehicleNumber} onChangeText={(t: string) => setForm({...form, vehicleNumber: t})} />
      <InputField 
        label="Notes" 
        placeholder="Add additional notes" 
        multiline 
        numberOfLines={3} 
        style={{ textAlignVertical: 'top' }}
        optional 
        value={form.notes} 
        onChangeText={(t: string) => setForm({...form, notes: t})} 
      />

      <TouchableOpacity 
        onPress={handleRegister}
        disabled={isSubmitting}
        className={`bg-blue-600 p-4 rounded-xl items-center mt-6 mb-12 shadow-sm ${isSubmitting ? 'opacity-70' : ''}`}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white font-bold text-lg tracking-wider">REGISTER VISITOR</Text>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
}
