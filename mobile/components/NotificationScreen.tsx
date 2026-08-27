import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Check, Clock } from 'lucide-react-native';

export default function NotificationScreen() {
  const { notifications, loading, error, refreshNotifications, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();

  const handlePress = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Attempt to route based on type
    if (notification.type.includes('APPOINTMENT')) {
      // In this system, appointments are handled mostly in approvals screen for admins, or profile/visits for employees.
      // For simplicity, we navigate to the root dashboard or a specific screen.
      // A full production app would have deep links here based on the user's role.
      // The user wants it to just route to the relevant screen. Let's just go back for now, 
      // or to the dashboard since we don't have all deep links mapped yet.
      router.back();
    } else {
      router.back();
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handlePress(item)}
      className="p-4 mb-2 rounded-xl flex-row items-start border"
      style={item.isRead ? { backgroundColor: 'white', borderColor: '#f3f4f6' } : { backgroundColor: '#eff6ff', borderColor: '#dbeafe' }}
    >
      <View className="mr-3 mt-1">
        <Bell size={20} color={item.isRead ? '#9ca3af' : '#2563eb'} />
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-semibold" style={{ color: item.isRead ? '#374151' : '#111827' }}>
            {item.title}
          </Text>
          {!item.isRead && <View className="w-2 h-2 rounded-full bg-blue-600" />}
        </View>
        <Text className="text-gray-600 text-sm leading-5 mb-2">{item.message}</Text>
        <View className="flex-row items-center">
          <Clock size={12} color="#9ca3af" />
          <Text className="text-xs text-gray-500 ml-1">
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center px-4 py-4 bg-white border-b border-gray-200 shadow-sm">
        <Text className="text-xl font-bold text-gray-900">Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead} className="flex-row items-center">
          <Check size={16} color="#4f46e5" />
          <Text className="text-indigo-600 font-semibold ml-1">Mark all read</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-center">{error}</Text>
          <TouchableOpacity onPress={refreshNotifications} className="mt-4 bg-indigo-600 px-4 py-2 rounded-lg">
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refreshNotifications} />
          }
          ListEmptyComponent={
            !loading ? (
              <View className="flex-1 justify-center items-center py-20">
                <Bell size={48} color="#d1d5db" />
                <Text className="text-gray-500 mt-4 font-medium text-lg">No notifications yet</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
