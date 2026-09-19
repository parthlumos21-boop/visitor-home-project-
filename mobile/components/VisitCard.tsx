import React from 'react';
import { View, Text } from 'react-native';

interface VisitCardProps {
  visitorName: string;
  hostName: string;
  scheduledAt: string;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'CHECKED_IN' | 'COMPLETED' | 'REJECTED';
}

export const VisitCard: React.FC<VisitCardProps> = ({
  visitorName,
  hostName,
  scheduledAt,
  purpose,
  status,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CHECKED_IN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-bold text-gray-900">{visitorName}</Text>
        <View className={`px-2.5 py-1 rounded-full border ${getStatusColor()}`}>
          <Text className="text-xs font-semibold">{status}</Text>
        </View>
      </View>
      <View className="mb-2">
        <Text className="text-gray-500 text-sm">Host</Text>
        <Text className="text-gray-800 font-medium">{hostName}</Text>
      </View>
      <View className="flex-row justify-between">
        <View>
          <Text className="text-gray-500 text-sm">Time</Text>
          <Text className="text-gray-800 font-medium">
            {new Date(scheduledAt).toLocaleString()}
          </Text>
        </View>
        <View>
          <Text className="text-gray-500 text-sm">Purpose</Text>
          <Text className="text-gray-800 font-medium">{purpose}</Text>
        </View>
      </View>
    </View>
  );
};
