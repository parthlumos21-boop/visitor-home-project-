import React, { useState, useMemo } from 'react';
import { View, ScrollView, Platform, Alert, StyleSheet, TouchableOpacity, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Calendar, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNewAppointment } from '../../services/appointments';
import { getApiErrorMessage } from '../../services/errorMessage';
import AppointmentFormHeader from '../../components/form/AppointmentFormHeader';
import FormSectionHeader from '../../components/form/FormSectionHeader';
import RoundedTextInput from '../../components/form/RoundedTextInput';
import RoundedDropdown from '../../components/form/RoundedDropdown';
import AppointmentSubmitButton from '../../components/form/AppointmentSubmitButton';

export default function EmployeeNewAppointment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [visitorType, setVisitorType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [validFor, setValidFor] = useState('');
  const [notes, setNotes] = useState('');

  // Date and Time State
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [arrivalTime, setArrivalTime] = useState('');
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);

  const visitorTypes = ['Client', 'Vendor', 'Interviewee', 'Contractor', 'Personal'];
  const purposes = ['Meeting', 'Interview', 'Delivery', 'Maintenance', 'Other'];
  const validForOptions = ['Short Visit', '1 Hour', '2 Hours', '4 Hours', 'Full Day', 'Custom'];

  const resetForm = () => {
    setFullName('');
    setMobileNumber('');
    setEmailAddress('');
    setCompanyName('');
    setVisitorType('');
    setPurpose('');
    setValidFor('');
    setNotes('');
    setAppointmentDate(new Date());
    setArrivalTime('');
  };

  const handleCreateAppointment = async () => {
    if (!fullName || !mobileNumber || !visitorType || !purpose || !validFor || !arrivalTime) {
      Alert.alert('Missing Fields', 'Please fill in all required fields marked with *');
      return;
    }

    setIsLoading(true);
    try {
      const { useAuthStore } = require('../../store/authStore');
      const currentUser = useAuthStore.getState().user;
      const hostName = currentUser?.name || 'Unknown Host';

      const created = await createNewAppointment({
        fullName: fullName.trim(),
        mobile: mobileNumber.trim(),
        email: emailAddress.trim() || undefined,
        company: companyName.trim() || undefined,
        visitorType,
        purpose,
        personToMeet: hostName,
        visitDate: appointmentDate.toISOString(),
        arrivalTime,
        notes: notes.trim() || undefined,
      });
      const isApproved = created?.visit?.status === 'APPROVED';
      Alert.alert('Success', isApproved ? 'Visit approved and added to the visitor process.' : 'Appointment submitted for approval.', [
        {
          text: 'Add Another',
          onPress: resetForm,
        },
        {
          text: isApproved ? 'Visitor Process' : 'Dashboard',
          onPress: () => router.push(isApproved ? '/(employee)/visitors?filter=recent' : '/(employee)/dashboard'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error, 'Failed to create appointment.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Section - Clean single top bar */}
      <AppointmentFormHeader
        title="New Appointment"
        onBackPress={() => router.push('/(employee)/dashboard')}
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
          value={fullName}
          onChangeText={setFullName}
        />

        <RoundedTextInput
          label="Mobile Number"
          placeholder="Enter mobile number"
          keyboardType="phone-pad"
          value={mobileNumber}
          onChangeText={setMobileNumber}
        />

        <RoundedTextInput
          label="Email ID"
          placeholder="Enter email address"
          keyboardType="email-address"
          optional
          value={emailAddress}
          onChangeText={setEmailAddress}
        />

        <RoundedTextInput
          label="Company"
          placeholder="Enter company name"
          optional
          value={companyName}
          onChangeText={setCompanyName}
        />

        {/* SECTION DIVIDER */}
        <View style={styles.divider} />

        {/* SECTION 2: VISIT DETAILS */}
        <FormSectionHeader title="VISIT DETAILS" />

        <RoundedDropdown
          label="Visitor Type *"
          value={visitorType}
          options={visitorTypes}
          onSelect={(val) => setVisitorType(String(val))}
        />

        <RoundedDropdown
          label="Purpose of Visit *"
          value={purpose}
          options={purposes}
          onSelect={(val) => setPurpose(String(val))}
        />

        {/* Visit Date */}
        <RoundedTextInput
          label="Visit Date"
          placeholder="Select visit date"
          value={appointmentDate.toDateString()}
          editable={false}
          rightIcon={<Calendar color="#3478F6" size={20} />}
          onRightIconPress={() => setShowDatePicker(true)}
        />

        {showDatePicker && (
          <DateTimePicker
            value={appointmentDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onDismiss={() => setShowDatePicker(false)}
            onValueChange={(eventOrDate: any, possibleDate?: any) => {
              setShowDatePicker(Platform.OS === 'ios');
              let d: Date | null = null;
              if (eventOrDate instanceof Date) d = eventOrDate;
              else if (possibleDate instanceof Date) d = possibleDate;
              else if (eventOrDate?.nativeEvent?.timestamp) d = new Date(eventOrDate.nativeEvent.timestamp);
              else if (typeof eventOrDate === 'number' || typeof eventOrDate === 'string') d = new Date(eventOrDate);

              if (d && !isNaN(d.getTime())) {
                setAppointmentDate(d);
              }
            }}
          />
        )}

        {/* Expected Arrival */}
        <RoundedTextInput
          label="Expected Arrival"
          placeholder="Select arrival time"
          value={arrivalTime}
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
            onValueChange={(eventOrDate: any, possibleDate?: any) => {
              setShowArrivalPicker(Platform.OS === 'ios');
              let d: Date | null = null;
              if (eventOrDate instanceof Date) d = eventOrDate;
              else if (possibleDate instanceof Date) d = possibleDate;
              else if (eventOrDate?.nativeEvent?.timestamp) d = new Date(eventOrDate.nativeEvent.timestamp);
              else if (typeof eventOrDate === 'number' || typeof eventOrDate === 'string') d = new Date(eventOrDate);

              if (d && !isNaN(d.getTime())) {
                let hours = d.getHours();
                const minutes = String(d.getMinutes()).padStart(2, '0');
                const period = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12;
                setArrivalTime(`${String(hours).padStart(2, '0')}:${minutes} ${period}`);
              }
            }}
          />
        )}

        <RoundedDropdown
          label="Valid For *"
          value={validFor}
          options={validForOptions}
          onSelect={(val) => setValidFor(String(val))}
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
          value={notes}
          onChangeText={setNotes}
        />

        {/* SUBMIT BUTTON */}
        <AppointmentSubmitButton
          title="New Appointment"
          onPress={handleCreateAppointment}
          loading={isLoading}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 18,
  },
});
