import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, FlatList, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ChevronDown, X, ArrowLeft, Calendar, User, Clock, FileText } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton } from '../../components/CustomButton';
import { createEmployeeInvitation } from '../../services/employee';
import { getApiErrorMessage } from '../../services/errorMessage';

// Reusable Select Component
const SelectField = ({ label, value, options, onSelect, placeholder }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <View className="mb-3 flex-1">
      {label && <Text className="text-gray-700 font-medium mb-1">{label}</Text>}
      <TouchableOpacity 
        className="flex-row justify-between items-center bg-gray-50 border border-gray-200 p-3 rounded-lg"
        onPress={() => setModalVisible(true)}
      >
        <Text className={value ? "text-black" : "text-gray-400"}>
          {value || placeholder || (label ? `Select ${label.replace(' *', '').toLowerCase()}` : 'Select')}
        </Text>
        <ChevronDown color="#9ca3af" size={20} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 h-1/2">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">{label ? `Select ${label.replace(' *', '')}` : 'Select Option'}</Text>
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
                  <Text className="text-lg text-gray-800">{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function EmployeeInvitations() {
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

  const handleSendInvitation = async () => {
    if (!fullName || !mobileNumber || !visitorType || !purpose || !validFor || !arrivalTime) {
      Alert.alert('Missing Fields', 'Please fill in all required fields marked with *');
      return;
    }

    setIsLoading(true);
    try {
      await createEmployeeInvitation({
        fullName: fullName.trim(),
        mobile: mobileNumber.trim(),
        email: emailAddress.trim() || undefined,
        company: companyName.trim() || undefined,
        visitorType,
        purpose,
        visitDate: appointmentDate.toISOString(),
        arrivalTime,
        validFor,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Success', 'New visitor saved successfully.', [
        {
          text: 'Add Another',
          onPress: resetForm,
        },
        {
          text: 'Dashboard',
          onPress: () => router.push('/(employee)/dashboard'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error, 'Failed to send invitation.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic calculations for Appointment Summary
  const expiresTime = useMemo(() => {
    if (!arrivalTime || !validFor) return '--:--';
    
    // Parse time like "10:30 AM"
    const [timeString, period] = arrivalTime.split(' ');
    if (!timeString || !period) return 'Custom';
    
    let [hoursStr, minutesStr] = timeString.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    
    if (validFor === 'Short Visit') date.setMinutes(date.getMinutes() + 30);
    else if (validFor === '1 Hour') date.setHours(date.getHours() + 1);
    else if (validFor === '2 Hours') date.setHours(date.getHours() + 2);
    else if (validFor === '4 Hours') date.setHours(date.getHours() + 4);
    else if (validFor === 'Full Day') date.setHours(date.getHours() + 8);
    else return 'Custom';

    // Format output back to 12-hour AM/PM format
    let outHours = date.getHours();
    const outMinutes = String(date.getMinutes()).padStart(2, '0');
    const outPeriod = outHours >= 12 ? 'PM' : 'AM';
    outHours = outHours % 12 || 12;

    return `${String(outHours).padStart(2, '0')}:${outMinutes} ${outPeriod}`;
  }, [arrivalTime, validFor]);

  const SectionHeader = ({ icon, title, subtitle }: any) => (
    <View className="mb-4 bg-gray-50 border border-gray-100 p-4 rounded-xl flex-row items-center">
      <View className="w-10 h-10 bg-white rounded-full items-center justify-center mr-3 shadow-sm border border-gray-100">
        {icon}
      </View>
      <View>
        <Text className="text-base font-bold text-gray-900">{title}</Text>
        <Text className="text-xs text-gray-500">{subtitle}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 pb-3 flex-row items-center" style={{ paddingTop: insets.top + 8 }}>
        <TouchableOpacity onPress={() => router.push('/(employee)/dashboard')} className="mr-3 p-2 -ml-2">
          <ArrowLeft color="#111827" size={24} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-950 flex-1">Invite Visitor</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-1">Invite a Visitor</Text>
          <Text className="text-gray-500">Create a new visitor appointment</Text>
        </View>

        {/* 👤 Visitor Information */}
        <View className="mb-6">

          <View className="mb-3">
            <Text className="text-gray-700 font-medium mb-1">Full Name *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-black"
              placeholder="Enter full name"
              placeholderTextColor="#9ca3af"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View className="mb-3">
            <Text className="text-gray-700 font-medium mb-1">Mobile Number *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-black"
              placeholder="Enter mobile no."
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={setMobileNumber}
            />
          </View>

          <View className="mb-3">
            <Text className="text-gray-700 font-medium mb-1">Email Address</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-black"
              placeholder="Enter email address"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              value={emailAddress}
              onChangeText={setEmailAddress}
            />
          </View>

          <View className="mb-3">
            <Text className="text-gray-700 font-medium mb-1">Company Name</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-black"
              placeholder="Enter company name"
              placeholderTextColor="#9ca3af"
              value={companyName}
              onChangeText={setCompanyName}
            />
          </View>

          <SelectField label="Visitor Type *" value={visitorType} options={visitorTypes} onSelect={setVisitorType} />
          <SelectField label="Purpose *" value={purpose} options={purposes} onSelect={setPurpose} />
        </View>

        {/* Form fields without Appointment Details heading */}
        <View className="mb-6">
          <View className="mb-3">
            <Text className="text-gray-700 font-medium mb-1">Appointment Date *</Text>
            <TouchableOpacity 
              className="flex-row items-center bg-gray-50 border border-gray-200 p-3 rounded-lg"
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar color="#6b7280" size={20} className="mr-3" />
              <Text className="text-gray-800 flex-1">{appointmentDate.toDateString()}</Text>
              <ChevronDown color="#9ca3af" size={20} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={appointmentDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
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
                onDismiss={() => setShowDatePicker(false)}
              />
            )}
          </View>

          <View className="mb-3">
            <Text className="text-gray-700 font-medium mb-1">Arrival Time *</Text>
            <TouchableOpacity 
              className="flex-row items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded-lg"
              onPress={() => setShowArrivalPicker(true)}
            >
              <Text className={arrivalTime ? 'text-black' : 'text-gray-400'}>
                {arrivalTime || 'Select Time'}
              </Text>
              <Clock color="#9ca3af" size={20} />
            </TouchableOpacity>
            
            {showArrivalPicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                display="default"
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
                onDismiss={() => setShowArrivalPicker(false)}
              />
            )}
          </View>

          <SelectField label="Valid For *" value={validFor} options={validForOptions} onSelect={setValidFor} />
        </View>

        {/* 📝 Additional Information */}
        <View className="mb-6">

          <View className="mb-3">
            <Text className="text-gray-700 font-medium mb-1">Notes</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-black h-24"
              placeholder="Enter additional notes..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* Actions */}
        <View className="mb-8">
          <CustomButton 
            title="Send Invitation" 
            onPress={handleSendInvitation} 
            isLoading={isLoading} 
          />
          <TouchableOpacity 
            className="mt-4 py-3 items-center justify-center rounded-lg border border-gray-300 bg-white"
            onPress={() => router.push('/(employee)/dashboard')}
            disabled={isLoading}
          >
            <Text className="text-gray-700 font-bold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
