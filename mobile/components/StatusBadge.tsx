import React from 'react';
import { View, Text } from 'react-native';

export type VisitStatus = 'PENDING' | 'APPROVED' | 'CHECKED_IN' | 'COMPLETED' | 'REJECTED';

interface StatusBadgeProps {
  status: VisitStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'PENDING':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
      case 'APPROVED':
        return { bg: 'bg-green-100', text: 'text-green-800' };
      case 'CHECKED_IN':
        return { bg: 'bg-blue-100', text: 'text-blue-800' };
      case 'COMPLETED':
        return { bg: 'bg-gray-100', text: 'text-gray-800' };
      case 'REJECTED':
        return { bg: 'bg-red-100', text: 'text-red-800' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800' };
    }
  };

  const styles = getStatusStyles();

  return (
    <View className={`px-2.5 py-1 rounded-full self-start ${styles.bg} ${className}`}>
      <Text className={`text-xs font-semibold tracking-wide ${styles.text}`}>
        {status.replace('_', ' ')}
      </Text>
    </View>
  );
}
