import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  variant = 'primary',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-200 border border-gray-300';
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-blue-600';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary':
        return 'text-gray-800';
      default:
        return 'text-white';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      className={`py-3 px-4 rounded-xl flex-row justify-center items-center ${getVariantStyles()} ${
        isLoading ? 'opacity-70' : ''
      } ${className}`}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#374151' : '#ffffff'} className="mr-2" />
      ) : null}
      <Text className={`font-semibold text-lg ${getTextColor()}`}>{title}</Text>
    </TouchableOpacity>
  );
};
