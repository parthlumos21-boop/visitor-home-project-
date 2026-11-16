import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Users, Calendar, User as UserIcon } from 'lucide-react-native';
import { View } from 'react-native';
import type { ReactNode } from 'react';
import VisitorBottomTabBar from '../../components/visitor/VisitorBottomTabBar';

const iconBox = (icon: ReactNode) => (
  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
    {icon}
  </View>
);

export default function VisitorLayout() {
  return (
    <Tabs
      tabBar={(props) => <VisitorBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#F5F5F5' },
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

      {/* 2. Visits */}
      <Tabs.Screen
        name="total-visits"
        options={{
          title: 'Visits',
          tabBarIcon: ({ color }) => iconBox(<Users color={color} size={22} />),
        }}
      />

      {/* 3. Appointments */}
      <Tabs.Screen
        name="appointment-requests"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color }) => iconBox(<Calendar color={color} size={22} />),
        }}
      />

      {/* 4. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => iconBox(<UserIcon color={color} size={22} />),
        }}
      />

      {/* Auxiliary screens kept accessible via push navigation */}
      <Tabs.Screen
        name="new-registration"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
          title: 'New Appointment',
        }}
      />

      <Tabs.Screen
        name="visit-history"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
          title: 'Visit History',
        }}
      />

      <Tabs.Screen
        name="visit-details/[id]"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
          title: 'Visit Details',
        }}
      />

      <Tabs.Screen
        name="appointment"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
          title: 'Appointment Pass',
        }}
      />

      <Tabs.Screen
        name="invitations"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
          title: 'Invitations',
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
          title: 'Alerts',
        }}
      />
    </Tabs>
  );
}
