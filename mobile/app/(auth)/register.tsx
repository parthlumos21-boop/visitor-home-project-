/// <reference types="nativewind/types" />
import React, { useState } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { Link } from 'expo-router';
import { Lock, Mail, Phone, User } from 'lucide-react-native';
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
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f1f5f9' }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 40, justifyContent: 'center', flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
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
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 22, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: '#2563eb' }}
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

        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: '#1e293b', fontSize: 24, fontWeight: '900', lineHeight: 29 }}>Create Account</Text>
          <Text style={{ color: '#64748b', fontSize: 14, fontWeight: '600', marginTop: 4 }}>Register as a new visitor</Text>
        </View>
        
        {serverError && (
          <View style={{ marginBottom: 16, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fff5f5', padding: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#dc2626' }}>{serverError}</Text>
          </View>
        )}

        <InputField
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={handleTextChange(setName, 'name')}
          error={fieldErrors.name}
          inputClassName="bg-slate-50 border-slate-200 min-h-12"
          leftIcon={<User color="#2563eb" size={17} />}
        />
        
        <InputField
          label="Mobile Number"
          placeholder="Enter 10-digit mobile number"
          value={phone}
          onChangeText={handleTextChange(setPhone, 'phone')}
          keyboardType="phone-pad"
          error={fieldErrors.phone}
          inputClassName="bg-slate-50 border-slate-200 min-h-12"
          leftIcon={<Phone color="#2563eb" size={17} />}
        />
        
        <InputField
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={handleTextChange(setEmail, 'email')}
          autoCapitalize="none"
          keyboardType="email-address"
          error={fieldErrors.email}
          inputClassName="bg-slate-50 border-slate-200 min-h-12"
          leftIcon={<Mail color="#2563eb" size={17} />}
        />
        
        <InputField
          label="Password"
          placeholder="Create a password (min 6 chars)"
          value={password}
          onChangeText={handleTextChange(setPassword, 'password')}
          secureTextEntry
          error={fieldErrors.password}
          inputClassName="bg-slate-50 border-slate-200 min-h-12"
          leftIcon={<Lock color="#2563eb" size={17} />}
        />
        
        <CustomButton
          title="Sign Up"
          onPress={handleRegister}
          isLoading={isLoading}
          className="mt-4 py-4 shadow-lg shadow-blue-500"
        />

        <View className="mt-6 flex-row justify-center items-center">
          <Text style={{ color: '#6b7280', fontSize: 13 }}>Already have an account? </Text>
          <Link href="/(auth)/login" style={{ color: '#2563eb', fontWeight: '700', fontSize: 13 }}>Sign In</Link>
        </View>
      </View>
    </ScrollView>
  );
}
