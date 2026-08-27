import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, Clock, X } from 'lucide-react-native';
import { createNewAppointment } from '../../services/appointments';
import { getAdminEmployees, AdminEmployee } from '../../services/admin';
import { logMobileActivity } from '../../services/activityLogger';
import { getApiErrorMessage } from '../../services/errorMessage';

const visitorTypes = ['Contractor', 'Client', 'Interviewee', 'Vendor', 'Personal'];
const purposes = ['Meeting', 'Delivery', 'Interview', 'Maintenance', 'Other'];
const validForOptions = ['Today', '1 Hour', '2 Hours', '4 Hours', 'Full Day'];

const todayDate = () => {
  const date = new Date();
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
};

const emptyForm = {
  fullName: '',
  mobile: '',
  email: '',
  company: '',
  visitorType: '',
  purpose: '',
  personToMeet: '',
  visitDate: todayDate(),
  arrivalTime: '',
  validFor: '',
  notes: '',
};

type FormKey = keyof typeof emptyForm;

function SelectField({
  label,
  value,
  placeholder,
  options,
  loading,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  loading?: boolean;
  onSelect: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-gray-800">{label}</Text>
      <TouchableOpacity
        className="h-12 flex-row items-center justify-between rounded-md border border-gray-300 bg-white px-3"
        onPress={() => setVisible(true)}
        activeOpacity={0.78}
      >
        <Text className={`text-base ${value ? 'text-gray-950' : 'text-gray-400'}`}>{value || placeholder}</Text>
        {loading ? <ActivityIndicator color="#2563eb" /> : <ChevronDown color="#6b7280" size={20} />}
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[58%] rounded-t-lg bg-white p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-950">{label}</Text>
              <TouchableOpacity className="h-11 w-11 items-center justify-center" onPress={() => setVisible(false)}>
                <X color="#374151" size={22} />
              </TouchableOpacity>
            </View>
            {options.length === 0 ? (
              <Text className="py-6 text-center text-gray-500">No options found.</Text>
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="border-b border-gray-100 py-4"
                    onPress={() => {
                      onSelect(item);
                      setVisible(false);
                    }}
                  >
                    <Text className="text-base text-gray-950">{item}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-gray-800">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`rounded-md border border-gray-300 bg-white px-3 text-base text-gray-950 ${multiline ? 'min-h-[96px] py-3' : 'h-12'}`}
      />
    </View>
  );
}

export default function AddVisitorScreen() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);

  const employeeNames = useMemo(() => employees.map((employee) => employee.name), [employees]);

  const loadEmployees = useCallback(async () => {
    try {
      setEmployeesLoading(true);
      const data = await getAdminEmployees();
      setEmployees(data);
    } catch (error) {
      Alert.alert('Server Error', getApiErrorMessage(error, 'Unable to load employee list.'));
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const updateField = (key: FormKey, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const saveVisitor = async () => {
    if (!form.fullName.trim() || !form.mobile.trim() || !form.visitorType.trim() || !form.purpose.trim() || !form.personToMeet.trim() || !form.arrivalTime.trim() || !form.validFor.trim()) {
      Alert.alert('Missing Details', 'Please fill all required visitor and visit details.');
      return;
    }

    setSaving(true);
    try {
      const notes = [`Valid For: ${form.validFor}`, form.notes.trim()].filter(Boolean).join('\n');
      await createNewAppointment({
        fullName: form.fullName,
        mobile: form.mobile,
        email: form.email,
        company: form.company,
        visitorType: form.visitorType,
        purpose: form.purpose,
        personToMeet: form.personToMeet,
        visitDate: form.visitDate,
        arrivalTime: form.arrivalTime,
        notes,
      });
      logMobileActivity({
        event: 'admin_new_visitor_created',
        screen: 'Admin Add Visitor',
        action: 'Add Visitor',
        message: 'Admin added new visitor',
        metadata: { fullName: form.fullName, mobile: form.mobile, personToMeet: form.personToMeet },
      });
      router.replace('/(admin)/visitors');
    } catch (error) {
      Alert.alert('Server Error', getApiErrorMessage(error, 'Unable to add new visitor.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center border-b border-gray-200 bg-white px-4 pb-4 pt-12">
        <TouchableOpacity className="mr-2 h-11 w-11 items-center justify-center" onPress={() => router.back()}>
          <ArrowLeft color="#111827" size={23} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-950">Add New Visitor</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 34 }}>
        <InputField label="Full Name *" placeholder="Enter full name" value={form.fullName} onChangeText={(value) => updateField('fullName', value)} />
        <InputField label="Mobile No. *" placeholder="Enter mobile number" keyboardType="phone-pad" value={form.mobile} onChangeText={(value) => updateField('mobile', value)} />
        <InputField label="Email" placeholder="Enter email address" keyboardType="email-address" value={form.email} onChangeText={(value) => updateField('email', value)} />
        <InputField label="Company" placeholder="Enter company name" value={form.company} onChangeText={(value) => updateField('company', value)} />

        <SelectField label="Visitor Type *" placeholder="Select visitor type" value={form.visitorType} options={visitorTypes} onSelect={(value) => updateField('visitorType', value)} />
        <SelectField label="Purpose of Visit *" placeholder="Select purpose" value={form.purpose} options={purposes} onSelect={(value) => updateField('purpose', value)} />
        <SelectField label="Person to Meet *" placeholder="Select employee" value={form.personToMeet} options={employeeNames} loading={employeesLoading} onSelect={(value) => updateField('personToMeet', value)} />

        <View className="mb-4 flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-2 text-sm font-semibold text-gray-800">Arrival Time *</Text>
            <TouchableOpacity className="h-12 flex-row items-center justify-between rounded-md border border-gray-300 bg-white px-3" onPress={() => setShowArrivalPicker(true)}>
              <Text className={`text-base ${form.arrivalTime ? 'text-gray-950' : 'text-gray-400'}`}>{form.arrivalTime || 'Select Time'}</Text>
              <Clock color="#6b7280" size={19} />
            </TouchableOpacity>
          </View>
          <View className="flex-1">
            <SelectField label="Valid For *" placeholder="Select Valid" value={form.validFor} options={validForOptions} onSelect={(value) => updateField('validFor', value)} />
          </View>
        </View>

        {showArrivalPicker ? (
          <DateTimePicker
            value={new Date()}
            mode="time"
            display="default"
            onChange={(_event, selectedDate) => {
              setShowArrivalPicker(Platform.OS === 'ios');
              if (selectedDate) {
                let hours = selectedDate.getHours();
                const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
                const period = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12;
                updateField('arrivalTime', `${String(hours).padStart(2, '0')}:${minutes} ${period}`);
              }
            }}
          />
        ) : null}

        <InputField label="Notes" placeholder="Add any additional notes..." multiline value={form.notes} onChangeText={(value) => updateField('notes', value)} />

        <TouchableOpacity
          onPress={saveVisitor}
          disabled={saving}
          className={`mt-3 h-12 flex-row items-center justify-center rounded-md bg-blue-600 ${saving ? 'opacity-70' : ''}`}
          activeOpacity={0.78}
        >
          {saving ? <ActivityIndicator color="#ffffff" /> : <Text className="text-base font-bold text-white">+ Add Visitor</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
