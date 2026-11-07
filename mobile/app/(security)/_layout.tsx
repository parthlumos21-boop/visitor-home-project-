import React from 'react';
import { Tabs } from 'expo-router';
import { Home, QrCode, Users, User } from 'lucide-react-native';
import { View } from 'react-native';
import type { ReactNode } from 'react';
import SecurityBottomTabBar from '../../components/security/SecurityBottomTabBar';

const iconBox = (icon: ReactNode) => (
  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
    {icon}
  </View>
);

export default function SecurityLayout() {
  return (
    <Tabs
      tabBar={(props) => <SecurityBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#F7F8FA' },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      {/* 1. Home */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => iconBox(<Home color={color} size={22} />),
        }}
      />

      {/* 2. Scan QR */}
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan QR',
          tabBarIcon: ({ color }) => iconBox(<QrCode color={color} size={22} />),
        }}
      />

      {/* 3. Visitors */}
      <Tabs.Screen
        name="visitors"
        options={{
          title: 'Visitors',
          tabBarIcon: ({ color }) => iconBox(<Users color={color} size={22} />),
        }}
      />

      {/* 4. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => iconBox(<User color={color} size={22} />),
        }}
      />

      {/* Auxiliary screens */}
      <Tabs.Screen
        name="history"
        options={{
          href: null,
          title: 'History',
        }}
      />
    </Tabs>
  );
}
