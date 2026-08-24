import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { User, Phone, Calendar as CalendarIcon, Clock, Handshake, Building2 } from 'lucide-react-native';

export default function VisitorAppointments() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showDetails, setShowDetails] = useState(false);

  const visitorName = params.fullName || 'No Name Provided';
  const mobile = params.mobile || 'No Mobile Provided';
  const email = params.email || 'No Email Provided';
  const company = params.company || 'No Company Provided';
  const visitDate = params.visitDate || 'No Date Provided';
  const arrivalTime = params.arrivalTime || 'TBD';
  const departureTime = 'TBD';
  const purpose = params.purpose || 'No Purpose Provided';
  const personToMeet = params.personToMeet || 'No Person Provided';
  const department = params.department || 'No Department Provided';

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-6">
      <Text className="text-sm font-bold text-gray-500 tracking-widest mb-4">Appointment Deatils</Text>

      <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Header */}
        <View className="bg-blue-50 px-5 py-4 border-b border-blue-100">
          <Text className="text-blue-800 font-bold tracking-wider">APPOINTMENT CONFIRMED</Text>
        </View>

        {/* Content */}
        <View className="p-5">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-lg font-bold text-gray-900">VIS-000125</Text>
            <View className="bg-green-100 px-3 py-1 rounded-full">
              <Text className="text-green-800 font-semibold text-xs tracking-wider">REGISTERED</Text>
            </View>
          </View>

          {/* Visitor Info */}
          <View className="mb-4">
            <View className="flex-row items-center">
              <User color="#6b7280" size={18} />
              <Text className="text-gray-700 font-medium ml-3 text-base">{visitorName}</Text>
            </View>
            <View className="flex-row items-center mt-3">
              <Phone color="#6b7280" size={18} />
              <Text className="text-gray-700 font-medium ml-3 text-base">{mobile}</Text>
            </View>
          </View>

          <View className="h-px bg-gray-100 my-4" />

          {/* Time Info */}
          <View className="mb-4">
            <View className="flex-row items-center">
              <CalendarIcon color="#6b7280" size={18} />
              <Text className="text-gray-700 font-medium ml-3 text-base">{visitDate}</Text>
            </View>
            <View className="flex-row items-center mt-3">
              <Clock color="#6b7280" size={18} />
              <Text className="text-gray-700 font-medium ml-3 text-base">{arrivalTime}</Text>
            </View>
          </View>

          <View className="h-px bg-gray-100 my-4" />

          {/* Meeting Info */}
          <View className="mb-6">
            <View className="flex-row items-center">
              <Handshake color="#6b7280" size={18} />
              <Text className="text-gray-700 font-medium ml-3 text-base">{purpose}</Text>
            </View>
            <View className="flex-row items-center mt-3">
              <User color="#6b7280" size={18} />
              <Text className="text-gray-700 font-medium ml-3 text-base">Meeting with: {personToMeet}</Text>
            </View>
            <View className="flex-row items-center mt-3">
              <Building2 color="#6b7280" size={18} />
              <Text className="text-gray-700 font-medium ml-3 text-base">{department}</Text>
            </View>
          </View>

          {showDetails && (
            <View className="mt-2 border-t border-gray-100 pt-6">
              
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <User color="#111827" size={18} />
                  <Text className="text-gray-900 font-bold tracking-wider ml-2">VISITOR DETAILS</Text>
                </View>
                <View className="pl-6">
                  <Text className="text-gray-500 text-sm">Email ID</Text>
                  <Text className="text-gray-900 font-medium text-base mb-3">{email}</Text>
                  
                  <Text className="text-gray-500 text-sm">Company</Text>
                  <Text className="text-gray-900 font-medium text-base">{company}</Text>
                </View>
              </View>

              <View>
                <View className="flex-row items-center mb-3">
                  <Clock color="#111827" size={18} />
                  <Text className="text-gray-900 font-bold tracking-wider ml-2">ADDITIONAL DETAILS</Text>
                </View>
                <View className="pl-6">
                  <Text className="text-gray-500 text-sm">Departure Time</Text>
                  <Text className="text-gray-900 font-medium text-base">{departureTime}</Text>
                </View>
              </View>
              
            </View>
          )}

          <TouchableOpacity 
            onPress={() => setShowDetails(!showDetails)}
            className="bg-gray-900 py-3 rounded-xl items-center mt-6"
          >
            <Text className="text-white font-bold tracking-wider">
              {showDetails ? 'HIDE DETAILS' : 'VIEW DETAILS'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  );
}
