import { Tabs } from 'expo-router';
import { Bell, CheckSquare, Home, UserCircle, Users } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { useNotifications } from '../../context/NotificationContext';

export default function AdminLayout() {
  const { unreadCount } = useNotifications();

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#2563eb',
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarItemStyle: { paddingVertical: 4 },
      headerShown: false,
      headerTitleStyle: { fontWeight: 'bold' }
    }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: 'Visitors',
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          tabBarIcon: ({ color }) => <CheckSquare color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="employees/index"
        options={{
          title: 'Employee',
          tabBarIcon: ({ color }) => <UserCircle color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="employees/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <View>
              <Bell color={color} size={24} />
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
    </Tabs>
  );
}
