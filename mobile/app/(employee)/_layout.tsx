import React from 'react';
import { Tabs } from 'expo-router';
import type { ReactNode } from 'react';
import { LayoutDashboard, Users, Bell, User, CheckCircle } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { useNotifications } from '../../context/NotificationContext';
import EmployeeBottomTabBar from '../../components/employee/EmployeeBottomTabBar';

const iconBox = (icon: ReactNode) => (
  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
    {icon}
  </View>
);

export default function EmployeeLayout() {
  const { unreadCount } = useNotifications();

  return (
    <Tabs
      tabBar={(props) => <EmployeeBottomTabBar {...props} />}
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
      {/* 1. Dashboard */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => iconBox(<LayoutDashboard color={color} size={22} />),
        }}
      />

      {/* 2. My Visitors */}
      <Tabs.Screen
        name="visitors"
        options={{
          title: 'My Visitors',
          tabBarIcon: ({ color }) => iconBox(<Users color={color} size={22} />),
        }}
      />

      {/* 3. Approvals */}
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          tabBarIcon: ({ color }) => iconBox(<CheckCircle color={color} size={22} />),
        }}
      />

      {/* 4. Alerts */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Bell color={color} size={22} />
              {unreadCount > 0 && (
                <View
                  className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-[2px]"
                  style={{ zIndex: 10 }}
                >
                  <Text className="text-white text-[10px] font-bold" style={{ textAlign: 'center' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      {/* 5. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => iconBox(<User color={color} size={22} />),
        }}
      />

      {/* Auxiliary screens */}
      <Tabs.Screen
        name="new-appointment"
        options={{
          href: null,
          title: 'New Appointment',
        }}
      />
    </Tabs>
  );
}
