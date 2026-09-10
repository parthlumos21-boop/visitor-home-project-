/// <reference types="nativewind/types" />
import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, Image, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Link } from 'expo-router';
import { User, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { loginUser } from '../../services/auth';
import { logMobileActivity } from '../../services/activityLogger';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { setAuth } = useAuthStore();
  
  const normalizedEmail = email.trim().toLowerCase();

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
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f1f5f9' }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── WHITE CARD with blue accent ── */}
      <View
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          padding: 28,
          shadowColor: '#2563eb',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 6,
        }}
      >
        {/* ── Logo + Visitor Management — parallel, same level, centered ── */}
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: '#2563eb' }}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: 72, height: 72 }}
            resizeMode="contain"
          />
          <View style={{ marginLeft: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#1e293b', letterSpacing: 0.2, lineHeight: 27 }}>
              Visitor
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#2563eb', letterSpacing: 0.2, lineHeight: 27 }}>
              Management
            </Text>
          </View>
        </View>

        {/* ── Username / Email ── */}
        <View style={{ marginBottom: 14 }}>
          <Text style={{ color: '#374151', fontWeight: '600', fontSize: 12, marginBottom: 7, letterSpacing: 0.1 }}>
            Username / Email
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, minHeight: 42 }}>
            <User color="#2563eb" size={16} />
            <TextInput
              style={{ flex: 1, minWidth: 0, marginLeft: 9, fontSize: 13, color: '#111827', paddingVertical: 0 }}
              placeholder="Enter username or email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={(text) => { setEmail(text); setLoginError(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* ── Password ── */}
        <View style={{ marginBottom: 22 }}>
          <Text style={{ color: '#374151', fontWeight: '600', fontSize: 12, marginBottom: 7, letterSpacing: 0.1 }}>
            Password
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, minHeight: 42 }}>
            <Lock color="#2563eb" size={16} />
            <TextInput
              style={{ flex: 1, minWidth: 0, marginLeft: 9, fontSize: 13, color: '#111827', paddingVertical: 0 }}
              placeholder="Enter password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={(text) => { setPassword(text); setLoginError(''); }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {showPassword
                ? <EyeOff color="#6b7280" size={16} />
                : <Eye color="#6b7280" size={16} />
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Error ── */}
        {loginError ? (
          <View style={{ marginBottom: 14, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fff5f5', padding: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#dc2626' }}>{loginError}</Text>
          </View>
        ) : null}

        {/* ── LOGIN Button ── */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.85}
          style={{
            backgroundColor: '#2563eb',
            borderRadius: 14,
            paddingVertical: 13,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isLoading ? 0.75 : 1,
            shadowColor: '#2563eb',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 6,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12, letterSpacing: 0.8 }}>SIGN IN</Text>
          )}
        </TouchableOpacity>

        {/* ── Sign Up ── */}
        <View style={{ marginTop: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#6b7280', fontSize: 13 }}>Don't have an account? </Text>
          <Link href="/(auth)/register" style={{ color: '#2563eb', fontWeight: '700', fontSize: 13 }}>Sign Up</Link>
        </View>
      </View>

    </ScrollView>
  );
}
