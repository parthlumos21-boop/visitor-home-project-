import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  className?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, error, className = '', secureTextEntry, ...props }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View className={`mb-4 ${className}`}>
      <Text className="text-gray-700 font-medium mb-1.5 ml-1">{label}</Text>
      <View className="relative justify-center">
        <TextInput
          className={`bg-white border rounded-xl px-4 py-3 text-base text-gray-900 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${secureTextEntry ? 'pr-12' : ''}`}
          placeholderTextColor="#9ca3af"
          secureTextEntry={isSecure}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            className="absolute right-4"
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color="#9ca3af" />
            ) : (
              <Eye size={20} color="#9ca3af" />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="text-red-500 text-sm mt-1 ml-1">{error}</Text>}
    </View>
  );
};
