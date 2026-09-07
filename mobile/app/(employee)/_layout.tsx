import { Tabs } from 'expo-router';
import type { ReactNode } from 'react';
import { LayoutDashboard, Users, CalendarPlus, Bell, User, CheckCircle } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { useNotifications } from '../../context/NotificationContext';

export default function EmployeeLayout() {
  const { unreadCount } = useNotifications();

  const iconBox = (icon: ReactNode) => (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </View>
  );

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#2563eb',
      tabBarInactiveTintColor: '#6b7280',
      tabBarStyle: {
        height: 70,
        paddingTop: 7,
        paddingBottom: 12,
        borderTopColor: '#e5e7eb',
      },
      tabBarLabelStyle: {
        fontSize: 11,
        lineHeight: 13,
        fontWeight: '600',
        marginTop: 3,
        marginBottom: 0,
      },
      tabBarIconStyle: {
        marginTop: 2,
      },
      tabBarItemStyle: {
        height: 50,
        paddingTop: 2,
        paddingBottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
      },
      tabBarAllowFontScaling: false,
      tabBarLabelPosition: 'below-icon',
      headerShown: false,
      headerTitleStyle: { fontWeight: 'bold' }
    }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => iconBox(<LayoutDashboard color={color} size={23} />),
        }}
      />
      <Tabs.Screen
        name="invitations"
        options={{
          title: 'New Visitor',
          tabBarIcon: ({ color }) => iconBox(<CalendarPlus color={color} size={23} />),
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: 'My Visitors',
          tabBarIcon: ({ color }) => iconBox(<Users color={color} size={23} />),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          tabBarIcon: ({ color }) => iconBox(<CheckCircle color={color} size={23} />),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Bell color={color} size={23} />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-[2px]" style={{ zIndex: 10 }}>
                  <Text className="text-white text-[10px] font-bold" style={{ textAlign: 'center' }}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => iconBox(<User color={color} size={23} />),
        }}
      />
    </Tabs>
  );
}
