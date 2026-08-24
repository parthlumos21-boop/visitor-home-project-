/// <reference types="nativewind/types" />
import React, { useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { InputField } from '../../components/InputField';
import { CustomButton } from '../../components/CustomButton';
import { useAuthStore } from '../../store/authStore';
import { loginUser } from '../../services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    
    setIsLoading(true);
    try {
      // In real scenario, backend returns { token, user: { id, email, role, ... } }
      const data = await loginUser(email, password);
      await setAuth(data.user, data.token);
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid credentials or server error.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 40, justifyContent: 'center', flexGrow: 1 }}>
      <View className="mb-8 mt-10">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Visitor Gate</Text>
        <Text className="text-gray-500 text-lg">Sign in to your account</Text>
      </View>
      
      <InputField
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <InputField
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <CustomButton
        title="Sign In"
        onPress={handleLogin}
        isLoading={isLoading}
        className="mt-6"
      />

      <View className="mt-8 flex-row justify-center items-center">
        <Text className="text-gray-500">Don't have an account? </Text>
        <Link href="/(auth)/register" className="text-blue-600 font-bold">Sign Up</Link>
      </View>
    </ScrollView>
  );
}
