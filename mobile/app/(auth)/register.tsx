/// <reference types="nativewind/types" />
import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { InputField } from '../../components/InputField';
import { CustomButton } from '../../components/CustomButton';
import { useAuthStore } from '../../store/authStore';
import { registerUser } from '../../services/auth';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // New Error State Management
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
  }>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  // Clear errors when user types
  const handleTextChange = (setter: React.Dispatch<React.SetStateAction<string>>, field: string) => (text: string) => {
    setter(text);
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverError) setServerError(null);
  };

  const handleRegister = async () => {
    setServerError(null);
    setFieldErrors({});
    let isValid = true;
    const errors: typeof fieldErrors = {};

    if (!name.trim()) {
      errors.name = 'Name is required.';
      isValid = false;
    }
    
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.trim())) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
      isValid = false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
      isValid = false;
    }
    
    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
      isValid = false;
    }

    if (!isValid) {
      setFieldErrors(errors);
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await registerUser({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
      });
      
      // Automatically log them in by setting auth state
      await setAuth(data.user, data.token);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Registration failed. Server error.';
      setServerError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 40, justifyContent: 'center', flexGrow: 1 }}>
      <View className="mb-8 mt-10">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Create Account</Text>
        <Text className="text-gray-500 text-lg">Register as a new visitor</Text>
      </View>
      
      {serverError && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex-row items-center">
          <Text className="text-red-600 font-medium flex-1">{serverError}</Text>
        </View>
      )}

      <InputField
        label="Full Name"
        placeholder="Enter your full name"
        value={name}
        onChangeText={handleTextChange(setName, 'name')}
        error={fieldErrors.name}
      />
      
      <InputField
        label="Mobile Number"
        placeholder="Enter 10-digit mobile number"
        value={phone}
        onChangeText={handleTextChange(setPhone, 'phone')}
        keyboardType="phone-pad"
        error={fieldErrors.phone}
      />
      
      <InputField
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={handleTextChange(setEmail, 'email')}
        autoCapitalize="none"
        keyboardType="email-address"
        error={fieldErrors.email}
      />
      
      <InputField
        label="Password"
        placeholder="Create a password (min 6 chars)"
        value={password}
        onChangeText={handleTextChange(setPassword, 'password')}
        secureTextEntry
        error={fieldErrors.password}
      />
      
      <CustomButton
        title="Sign Up"
        onPress={handleRegister}
        isLoading={isLoading}
        className="mt-6"
      />

      <View className="mt-8 flex-row justify-center items-center">
        <Text className="text-gray-500">Already have an account? </Text>
        <Link href="/(auth)/login" className="text-blue-600 font-bold">Sign In</Link>
      </View>
    </ScrollView>
  );
}
