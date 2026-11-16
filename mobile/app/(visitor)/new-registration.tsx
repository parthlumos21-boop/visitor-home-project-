import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Platform, Alert, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Calendar, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNewAppointment } from '../../services/appointments';
import api from '../../services/api';
import { getApiErrorMessage } from '../../services/errorMessage';
import AppointmentFormHeader from '../../components/form/AppointmentFormHeader';
import FormSectionHeader from '../../components/form/FormSectionHeader';
import RoundedTextInput from '../../components/form/RoundedTextInput';
import RoundedDropdown, { DropdownOption } from '../../components/form/RoundedDropdown';
import AppointmentSubmitButton from '../../components/form/AppointmentSubmitButton';

type HostOption = {
  id: string;
  name: string;
  email?: string | null;
  department?: string | null;
};

export default function NewRegistrationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hosts, setHosts] = useState<HostOption[]>([]);

  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    company: '',
    visitorType: '',
    purpose: '',
    personToMeet: '',
    department: '',
    visitDate: (() => {
      const d = new Date();
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    })(),
    arrivalTime: '',
    vehicleNumber: '',
    notes: '',
  });

  const selectedHost = useMemo(
    () => hosts.find((host) => host.id === form.personToMeet),
    [form.personToMeet, hosts]
  );

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
    if (
      !form.fullName.trim() ||
      !form.mobile.trim() ||
      !form.purpose.trim() ||
      !form.personToMeet.trim() ||
      !form.visitDate.trim()
    ) {
      Alert.alert(
        'Missing Details',
        'Please fill full name, mobile number, purpose, person to meet, and visit date.'
      );
      return;
    }

    if (!hosts.some((host) => host.id === form.personToMeet.trim())) {
      Alert.alert('Employee Required', 'Please select a valid employee in Person to Meet.');
      return;
    }

    setIsSubmitting(true);
    try {
      const appointment = await createNewAppointment(form);
      setForm({
        fullName: '',
        mobile: '',
        email: '',
        company: '',
        visitorType: '',
        purpose: '',
        personToMeet: '',
        department: '',
        visitDate: (() => {
          const d = new Date();
          return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
        })(),
        arrivalTime: '',
        vehicleNumber: '',
        notes: '',
      });
      router.replace({
        pathname: '/(visitor)/appointment',
        params: {
          ...form,
          appointmentId: appointment.appointmentId,
          status: appointment.status || 'PENDING',
        },
      });
    } catch (error) {
      Alert.alert('Server Error', getApiErrorMessage(error, 'Unable to save appointment. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const departmentOptions = useMemo(() => {
    const list = ['IT', 'HR', 'Admin', 'Operations', 'Sales', 'Finance'];
    hosts.forEach((h) => {
      if (h.department && !list.includes(h.department)) {
        list.push(h.department);
      }
    });
    return list;
  }, [hosts]);

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Section */}
      <AppointmentFormHeader title="New Appointment" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            // Clearance for floating bottom nav & native system controls
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
          onChangeText={(t) => setForm({ ...form, fullName: t })}
        />

        <RoundedTextInput
          label="Mobile Number"
          placeholder="Enter mobile number"
          keyboardType="phone-pad"
          value={form.mobile}
          onChangeText={(t) => setForm({ ...form, mobile: t })}
        />

        <RoundedTextInput
          label="Email ID"
          placeholder="Enter email address"
          keyboardType="email-address"
          optional
          value={form.email}
          onChangeText={(t) => setForm({ ...form, email: t })}
        />

        <RoundedTextInput
          label="Company"
          placeholder="Enter company name"
          optional
          value={form.company}
          onChangeText={(t) => setForm({ ...form, company: t })}
        />

        {/* SECTION 2: VISIT DETAILS */}
        <FormSectionHeader title="VISIT DETAILS" showTopDivider />

        <RoundedDropdown
          label="Visitor Type"
          value={form.visitorType}
          options={['Contractor', 'Client', 'Interviewee', 'Vendor', 'Personal']}
          onSelect={(val) => setForm({ ...form, visitorType: String(val) })}
        />

        <RoundedDropdown
          label="Purpose of Visit *"
          value={form.purpose}
          options={['Meeting', 'Delivery', 'Interview', 'Maintenance', 'Other']}
          onSelect={(val) => setForm({ ...form, purpose: String(val) })}
        />

        <RoundedDropdown
          label="Person to Meet *"
          value={form.personToMeet}
          displayValue={selectedHost?.name}
          options={hosts as DropdownOption[]}
          onSelect={(host: HostOption) => {
            setForm({
              ...form,
              personToMeet: host.id,
              department: host.department || '',
            });
          }}
        />

        <RoundedDropdown
          label="Department"
          value={form.department}
          options={departmentOptions}
          onSelect={(val) => setForm({ ...form, department: String(val) })}
        />

        <RoundedTextInput
          label="Visit Date"
          placeholder="DD-MM-YYYY"
          value={form.visitDate}
          onChangeText={(t) => setForm({ ...form, visitDate: t })}
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
                setForm({ ...form, visitDate: formatted });
              }
            }}
          />
        )}

        <RoundedTextInput
          label="Expected Arrival"
          placeholder="HH:MM AM/PM"
          optional
          value={form.arrivalTime}
          onChangeText={(t) => setForm({ ...form, arrivalTime: t })}
          rightIcon={<Clock color="#718096" size={20} />}
        />

        {/* SECTION 3: OPTIONAL DETAILS */}
        <FormSectionHeader title="OPTIONAL DETAILS" showTopDivider />

        <RoundedTextInput
          label="Vehicle Number"
          placeholder="Enter vehicle number"
          optional
          value={form.vehicleNumber}
          onChangeText={(t) => setForm({ ...form, vehicleNumber: t })}
        />

        <RoundedTextInput
          label="Notes"
          placeholder="Add additional notes"
          multiline
          optional
          value={form.notes}
          onChangeText={(t) => setForm({ ...form, notes: t })}
        />

        {/* Action Button */}
        <AppointmentSubmitButton
          title="New Appointment"
          loading={isSubmitting}
          onPress={handleRegister}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    backgroundColor: '#FFFFFF',
  },
});
