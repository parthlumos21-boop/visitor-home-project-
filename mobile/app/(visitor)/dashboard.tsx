import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Alert, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { getMyVisitorStats } from '../../services/visits';
import VisitorDashboardHeader from '../../components/visitor/VisitorDashboardHeader';
import VisitorWelcomeCard from '../../components/visitor/VisitorWelcomeCard';
import VisitorOverviewSection from '../../components/visitor/VisitorOverviewSection';
import VisitorFloatingActionButton from '../../components/visitor/VisitorFloatingActionButton';

export default function VisitorDashboard() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    totalVisits: 0,
    appointmentRequests: 0,
    visitHistory: 0,
  });

  const loadStats = async () => {
    try {
      const data = await getMyVisitorStats();
      setStats({
        totalVisits: data?.totalVisits || 0,
        appointmentRequests: data?.appointmentRequests || 0,
        visitHistory: data?.visitHistory || 0,
      });
    } catch (err) {
      console.error('Error fetching visitor stats:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearAuth();
            router.replace('/(auth)/login');
          } catch (err) {
            console.error('Error logging out:', err);
          }
        },
      },
    ]);
  };

  const handleNavigate = (routeName: string) => {
    try {
      router.push(`/(visitor)/${routeName}` as any);
    } catch (err) {
      console.error(`Error navigating to ${routeName}:`, err);
    }
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'Visitor';

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            // Sufficient bottom padding so scrolling content clears both the floating pill bar and the FAB
            paddingBottom: insets.bottom + 140,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2864DC']}
            tintColor="#2864DC"
          />
        }
      >
        {/* Header Section */}
        <VisitorDashboardHeader
          onNotificationsPress={() => handleNavigate('notifications')}
          onLogoutPress={handleLogout}
          hasUnreadNotifications={true}
        />

        {/* Welcome Card */}
        <VisitorWelcomeCard userName={displayName} roleBadgeText="VISITOR" />

        {/* Overview Section */}
        <VisitorOverviewSection stats={stats} onNavigate={handleNavigate} />
      </ScrollView>

      {/* Floating Action Button (Create Appointment) */}
      <VisitorFloatingActionButton
        onPress={() => handleNavigate('new-registration')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
});
