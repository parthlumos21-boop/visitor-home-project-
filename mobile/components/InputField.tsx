import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  className?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, error, className = '', ...props }) => {
  return (
    <View className={`mb-4 ${className}`}>
      <Text className="text-gray-700 font-medium mb-1.5 ml-1">{label}</Text>
      <TextInput
        className={`bg-white border rounded-xl px-4 py-3 text-base text-gray-900 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="text-red-500 text-sm mt-1 ml-1">{error}</Text>}
    </View>
  );
};
