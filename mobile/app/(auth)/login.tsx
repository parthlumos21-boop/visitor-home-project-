/// <reference types="nativewind/types" />
import React, { useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import { Link } from 'expo-router';
import { InputField } from '../../components/InputField';
import { CustomButton } from '../../components/CustomButton';
import { useAuthStore } from '../../store/authStore';
import { loginUser } from '../../services/auth';
import { logMobileActivity } from '../../services/activityLogger';

const ADMIN_EMAIL = 'keval@swatiswitchgears.com';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { setAuth } = useAuthStore();
  const normalizedEmail = email.trim().toLowerCase();
  const isAdminEmail = normalizedEmail === ADMIN_EMAIL;
  const isAdminEmailTyping = normalizedEmail.length > 0 && ADMIN_EMAIL.startsWith(normalizedEmail);
  const showAdminPreview = isAdminEmail || isAdminEmailTyping;

  const handleLogin = async () => {
    setLoginError('');

    if (!email || !password) {
      setLoginError('Please enter both email and password.');
      Alert.alert('Credential Error', 'Please enter both email and password.');
      logMobileActivity({
        event: 'login_validation_error',
        screen: 'Login',
        action: 'Sign In',
        message: 'Email or password missing',
        metadata: { email: normalizedEmail || null },
      });
      return;
    }
    
    setIsLoading(true);
    try {
      logMobileActivity({
        event: 'login_attempt',
        screen: 'Login',
        action: 'Sign In',
        message: 'Login attempt started',
        metadata: { email: normalizedEmail },
      });
      const data = await loginUser(normalizedEmail, password);
      await setAuth(data.user, data.token);
      logMobileActivity({
        event: 'login_success',
        screen: 'Login',
        action: 'Sign In',
        message: 'Login successful',
        metadata: { email: normalizedEmail, role: data.user?.role },
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setLoginError('Invalid email or password. Please check your credentials.');
        Alert.alert('Credential Error', 'Invalid email or password. Please check your credentials.');
        logMobileActivity({
          event: 'login_credential_error',
          screen: 'Login',
          action: 'Sign In',
          status: 401,
          message: 'Invalid login credentials',
          metadata: { email: normalizedEmail },
        });
      } else if (axios.isAxiosError(error) && error.response) {
        const serverMessage = error.response.data?.error || 'Server failed to process login.';
        setLoginError(serverMessage);
        Alert.alert('Server Error', serverMessage);
        logMobileActivity({
          event: 'login_server_error',
          screen: 'Login',
          action: 'Sign In',
          status: error.response.status,
          message: error.response.data?.error || 'Server failed to process login',
          metadata: { email: normalizedEmail },
        });
      } else {
        setLoginError('Unable to connect to the server. Please check backend is running.');
        Alert.alert('Server Error', 'Unable to connect to the server. Please check backend is running.');
        logMobileActivity({
          event: 'login_network_error',
          screen: 'Login',
          action: 'Sign In',
          status: 'NETWORK_ERROR',
          message: 'Unable to connect to server',
          metadata: { email: normalizedEmail },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 40, justifyContent: 'center', flexGrow: 1 }}>
      <View className="mb-8 mt-10">
        <Text className="text-3xl font-bold text-gray-900 mb-2">{showAdminPreview ? 'Admin' : 'Visitor Gate'}</Text>
        <Text className="text-gray-500 text-lg">
          {showAdminPreview ? 'Sign in as super admin' : 'Sign in to your account'}
        </Text>
        {showAdminPreview ? (
          <Text className="mt-2 text-sm font-semibold text-blue-700">{ADMIN_EMAIL}</Text>
        ) : null}
      </View>
      
      <InputField
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={(text: string) => {
          setEmail(text);
          setLoginError('');
        }}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <InputField
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={(text: string) => {
          setPassword(text);
          setLoginError('');
        }}
        secureTextEntry
      />

      {loginError ? (
        <View className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <Text className="text-sm font-semibold text-red-700">{loginError}</Text>
        </View>
      ) : null}
      
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
