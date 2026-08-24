import { Tabs, useRouter } from 'expo-router';
import { Home, Calendar, Bell, User as UserIcon, LogOut } from 'lucide-react-native';
import { TouchableOpacity, Text, View, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function VisitorLayout() {
  const router = useRouter();
  const clearAuth = useAuthStore(state => state.clearAuth);
  const user = useAuthStore(state => state.user);

  console.log("✅ MOBILE APP CONNECTED AND RUNNING (LAYOUT MOUNTED)!");

  const handleLogout = () => {
    try {
      console.log("Logout button clicked");
      Alert.alert(
        "Logout",
        "Are you sure you want to log out?",
        [
          { text: "Cancel", style: "cancel", onPress: () => console.log("Logout cancelled") },
          { 
            text: "Logout", 
            style: "destructive", 
            onPress: async () => {
              try {
                console.log("Processing logout...");
                await clearAuth();
                console.log("Logout successful, redirecting to login...");
                router.replace('/');
              } catch (err) {
                console.error("Error during logout process:", err);
              }
            } 
          }
        ]
      );
    } catch (err) {
      console.error("Error showing logout alert:", err);
    }
  };

  const displayName = user?.name || "John";

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#2563eb',
      headerShown: false,
      headerTitleStyle: { fontWeight: 'bold' },
      headerRight: () => (
        <View className="flex-row items-center mr-4">
          <Text className="mr-3 font-semibold text-gray-700">{displayName}</Text>
          <TouchableOpacity onPress={handleLogout}>
            <LogOut color="#ef4444" size={24} />
          </TouchableOpacity>
        </View>
      )
    }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="new-registration"
        options={{
          href: null,
          title: 'New Appoitment',
        }}
      />
      <Tabs.Screen
        name="total-visits"
        options={{
          href: null,
          title: 'Total Visits',
        }}
      />
      <Tabs.Screen
        name="appointment-requests"
        options={{
          href: null,
          title: 'Appointment Requests',
        }}
      />
      <Tabs.Screen
        name="visit-history"
        options={{
          href: null,
          title: 'Visit History',
        }}
      />
      <Tabs.Screen
        name="visit-details/[id]"
        options={{
          href: null,
          title: 'Visit Details',
        }}
      />
      <Tabs.Screen
        name="appointment"
        options={{
          title: 'Appointment',
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <Bell color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <UserIcon color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
