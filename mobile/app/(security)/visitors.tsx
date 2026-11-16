import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, StyleSheet, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSecurityVisits, checkInVisitorApi, checkOutVisitorApi } from '../../services/security';
import InsideNowHeader from '../../components/security/InsideNowHeader';
import RoundedSearchBar from '../../components/security/RoundedSearchBar';
import VisitorCard from '../../components/security/VisitorCard';

export default function SecurityVisitors() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { filter } = useLocalSearchParams<{ filter?: string }>();

  const [visits, setVisits] = useState<any[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const getTitle = () => {
    switch (filter) {
      case 'todays':
        return "Today's Visitors";
      case 'inside':
        return 'Inside Now';
      case 'upcoming':
        return 'Upcoming Visits';
      case 'checkedOut':
        return 'Checked Out';
      default:
        return 'Visitors';
    }
  };

  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [filter]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const data = await getSecurityVisits(filter);
      if (mounted.current) {
        setVisits(data || []);
        setFilteredVisits(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch security visits:', error);
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getSecurityVisits(filter);
      if (mounted.current) {
        setVisits(data || []);
        setFilteredVisits(data || []);
      }
    } catch (error) {
      console.error('Failed to refresh security visits:', error);
    } finally {
      if (mounted.current) {
        setRefreshing(false);
      }
    }
  }, [filter]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVisits(visits);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredVisits(
        visits.filter(
          (v) =>
            (v.visitor?.name || '').toLowerCase().includes(q) ||
            (v.host?.name || '').toLowerCase().includes(q) ||
            (v.displayId || '').toLowerCase().includes(q) ||
            (v.visitor?.phone || '').toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, visits]);

  const handleCheckIn = async (visitId: string) => {
    setActionLoadingId(visitId);
    try {
      await checkInVisitorApi(visitId);
      Alert.alert('Success', 'Visitor checked in successfully');
      fetchVisits();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to check in visitor');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckOut = async (visitId: string) => {
    setActionLoadingId(visitId);
    try {
      await checkOutVisitorApi(visitId);
      Alert.alert('Success', 'Visitor checked out successfully');
      fetchVisits();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to check out visitor');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Compact Header */}
      <InsideNowHeader title={getTitle()} />

      {/* 2. Rounded Search Bar */}
      <RoundedSearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search visitor, host, phone or ID..."
      />

      {/* 3. Scrollable Visitor List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            // CRITICAL: bottom clearance so content never collides with floating bottom navigation or system navigation
            paddingBottom: insets.bottom + 120,
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
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2864DC" />
            <Text style={styles.loadingText}>Loading visitors...</Text>
          </View>
        ) : filteredVisits.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No visitors found</Text>
          </View>
        ) : (
          filteredVisits.map((visit) => (
            <VisitorCard
              key={visit.id}
              visit={visit}
              now={now}
              isLoadingAction={actionLoadingId === visit.id}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centerContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#748094',
    fontWeight: '500',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
});
