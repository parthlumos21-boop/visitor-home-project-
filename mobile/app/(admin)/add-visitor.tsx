import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Calendar, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNewAppointment } from '../../services/appointments';
import { getAdminEmployees, AdminEmployee } from '../../services/admin';
import { logMobileActivity } from '../../services/activityLogger';
import { getApiErrorMessage } from '../../services/errorMessage';
import AppointmentFormHeader from '../../components/form/AppointmentFormHeader';
import FormSectionHeader from '../../components/form/FormSectionHeader';
import RoundedTextInput from '../../components/form/RoundedTextInput';
import RoundedDropdown from '../../components/form/RoundedDropdown';
import AppointmentSubmitButton from '../../components/form/AppointmentSubmitButton';

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

export default function AddVisitorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(emptyForm);
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
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
    if (
      !form.fullName.trim() ||
      !form.mobile.trim() ||
      !form.visitorType.trim() ||
      !form.purpose.trim() ||
      !form.personToMeet.trim() ||
      !form.arrivalTime.trim() ||
      !form.validFor.trim()
    ) {
      Alert.alert('Missing Details', 'Please fill all required appointment details.');
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
        event: 'admin_new_appointment_created',
        screen: 'Admin New Appointment',
        action: 'New Appointment',
        message: 'Admin created new appointment',
        metadata: { fullName: form.fullName, mobile: form.mobile, personToMeet: form.personToMeet },
      });
      Alert.alert('Success', 'Appointment created successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(admin)/dashboard'),
        },
      ]);
    } catch (error) {
      Alert.alert('Server Error', getApiErrorMessage(error, 'Unable to create new appointment.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Section - Clean single top bar */}
      <AppointmentFormHeader
        title="New Appointment"
        onBackPress={() => router.replace('/(admin)/dashboard')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 120,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: BASIC DETAILS */}
        <FormSectionHeader title="BASIC DETAILS" />

        <RoundedTextInput
          label="Full Name"
          placeholder="Enter full name"
          value={form.fullName}
          onChangeText={(value) => updateField('fullName', value)}
        />

        <RoundedTextInput
          label="Mobile Number"
          placeholder="Enter mobile number"
          keyboardType="phone-pad"
          value={form.mobile}
          onChangeText={(value) => updateField('mobile', value)}
        />

        <RoundedTextInput
          label="Email ID"
          placeholder="Enter email address"
          keyboardType="email-address"
          optional
          value={form.email}
          onChangeText={(value) => updateField('email', value)}
        />

        <RoundedTextInput
          label="Company"
          placeholder="Enter company name"
          optional
          value={form.company}
          onChangeText={(value) => updateField('company', value)}
        />

        {/* SECTION DIVIDER */}
        <View style={styles.divider} />

        {/* SECTION 2: VISIT DETAILS */}
        <FormSectionHeader title="VISIT DETAILS" />

        <RoundedDropdown
          label="Visitor Type *"
          placeholder="Select visitor type"
          value={form.visitorType}
          options={visitorTypes}
          onSelect={(value) => updateField('visitorType', String(value))}
        />

        <RoundedDropdown
          label="Purpose of Visit *"
          placeholder="Select purpose"
          value={form.purpose}
          options={purposes}
          onSelect={(value) => updateField('purpose', String(value))}
        />

        <RoundedDropdown
          label="Person to Meet *"
          placeholder="Select employee"
          value={form.personToMeet}
          options={employeeNames}
          loading={employeesLoading}
          onSelect={(value) => updateField('personToMeet', String(value))}
        />

        {/* Visit Date */}
        <RoundedTextInput
          label="Visit Date"
          placeholder="DD-MM-YYYY"
          value={form.visitDate}
          editable={false}
          rightIcon={<Calendar color="#3478F6" size={20} />}
          onRightIconPress={() => setShowDatePicker(true)}
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
                updateField('visitDate', formatted);
              }
            }}
          />
        )}

        {/* Expected Arrival */}
        <RoundedTextInput
          label="Expected Arrival"
          placeholder="Select arrival time"
          value={form.arrivalTime}
          editable={false}
          rightIcon={<Clock color="#3478F6" size={20} />}
          onRightIconPress={() => setShowArrivalPicker(true)}
        />

        {showArrivalPicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            display="default"
            onDismiss={() => setShowArrivalPicker(false)}
            onValueChange={(_event, selectedDate) => {
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
        )}

        <RoundedDropdown
          label="Valid For *"
          placeholder="Select valid duration"
          value={form.validFor}
          options={validForOptions}
          onSelect={(value) => updateField('validFor', String(value))}
        />

        {/* SECTION DIVIDER */}
        <View style={styles.divider} />

        {/* SECTION 3: OPTIONAL DETAILS */}
        <FormSectionHeader title="OPTIONAL DETAILS" />

        <RoundedTextInput
          label="Notes"
          placeholder="Add additional notes"
          optional
          multiline
          numberOfLines={3}
          value={form.notes}
          onChangeText={(value) => updateField('notes', value)}
        />

        {/* SUBMIT BUTTON */}
        <AppointmentSubmitButton
          title="New Appointment"
          onPress={saveVisitor}
          loading={saving}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#F5F5F5',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 18,
  },
});
