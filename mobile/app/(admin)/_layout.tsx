import { Tabs } from 'expo-router';
import { Bell, CheckSquare, Home, Shield, UserCircle, Users } from 'lucide-react-native';
import { View, Text } from 'react-native';
import type { ReactNode } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import CustomBottomTabBar from '../../components/navigation/CustomBottomTabBar';

const iconBox = (icon: ReactNode) => (
  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
    {icon}
  </View>
);

export default function AdminLayout() {
  const { unreadCount } = useNotifications();

  return (
    <Tabs
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#f9fafb' },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => iconBox(<Home color={color} size={23} />),
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: 'Visitors',
          tabBarIcon: ({ color }) => iconBox(<Users color={color} size={23} />),
        }}
      />
      <Tabs.Screen
        name="security/index"
        options={{
          title: 'Security',
          tabBarIcon: ({ color }) => iconBox(<Shield color={color} size={23} />),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24 }}>
              <Bell color={color} size={23} />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-[2px]">
                  <Text className="text-white text-[10px] font-bold">{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="employees/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => iconBox(<UserCircle color={color} size={23} />),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="employees/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="add-visitor"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="total-visits"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="visit-details/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
