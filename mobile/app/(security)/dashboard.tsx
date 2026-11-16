import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, ScrollView, Alert, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { getSecurityDashboardStats, SecurityDashboardStats } from '../../services/security';
import SecurityDashboardHeader from '../../components/security/SecurityDashboardHeader';
import SecurityWelcomeCard from '../../components/security/SecurityWelcomeCard';
import SecurityQRActionCard from '../../components/security/SecurityQRActionCard';
import SecurityOverviewSection from '../../components/security/SecurityOverviewSection';

export default function SecurityDashboard() {
  const router = useRouter();
  const { user, token, isLoading: authLoading, clearAuth } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<SecurityDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!authLoading && token) {
      fetchStats();
    } else if (!authLoading && !token) {
      setLoading(false);
    }
  }, [authLoading, token]);

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && token) {
        fetchStats(false);
      }
    }, [authLoading, token])
  );

  const fetchStats = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      const data = await getSecurityDashboardStats();
      if (mounted.current) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load security dashboard stats:', error);
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats(false);
    if (mounted.current) {
      setRefreshing(false);
    }
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

  const handleScanPress = () => {
    router.push('/(security)/scan');
  };

  const handleNavigateFilter = (filter: string) => {
    router.push(`/(security)/visitors?filter=${filter}`);
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'Security';

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: insets.bottom + 110,
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
        <SecurityDashboardHeader
          onNotificationsPress={() => {}}
          onLogoutPress={handleLogout}
          hasUnreadNotifications={true}
        />

        {/* Welcome Card */}
        <SecurityWelcomeCard userName={displayName} roleBadgeText="SECURITY" />

        {/* Overview Section */}
        <SecurityOverviewSection
          stats={stats}
          onNavigate={handleNavigateFilter}
        />

        {/* Primary QR Action Card */}
        <SecurityQRActionCard onPress={handleScanPress} />
      </ScrollView>
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
