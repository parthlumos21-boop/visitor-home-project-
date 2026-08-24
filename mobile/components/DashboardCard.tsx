import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  onPress?: () => void;
  colorClass?: string; // e.g., 'bg-blue-500'
}

export function DashboardCard({ title, value, icon, onPress, colorClass = 'bg-white' }: DashboardCardProps) {
  const content = (
    <View className={`rounded-2xl p-4 shadow-sm border border-gray-100 ${colorClass === 'bg-white' ? 'bg-white' : colorClass}`}>
      <View className="flex-row justify-between items-start mb-2">
        <Text className={`text-sm font-medium ${colorClass === 'bg-white' ? 'text-gray-500' : 'text-white/80'}`}>
          {title}
        </Text>
        {icon && <View>{icon}</View>}
      </View>
      <Text className={`text-3xl font-bold ${colorClass === 'bg-white' ? 'text-gray-900' : 'text-white'}`}>
        {value}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-1 min-w-[45%] m-1">
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View className="flex-1 min-w-[45%] m-1">
      {content}
    </View>
  );
}
