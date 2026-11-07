import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users, Calendar, History } from 'lucide-react-native';
import VisitorOverviewCard from './VisitorOverviewCard';

interface VisitorStats {
  totalVisits: number;
  appointmentRequests: number;
  visitHistory: number;
}

interface VisitorOverviewSectionProps {
  stats: VisitorStats;
  onNavigate: (route: string) => void;
}

export const VisitorOverviewSection: React.FC<VisitorOverviewSectionProps> = ({
  stats,
  onNavigate,
}) => {
  return (
    <View style={styles.cardContainer}>
      {/* Title */}
      <Text style={styles.title}>Overview</Text>

      {/* 3 Overview Items in a Row */}
      <View style={styles.itemsRow}>
        {/* Item 1: Total Visits */}
        <VisitorOverviewCard
          icon={<Users color="#2864DC" size={24} strokeWidth={2.2} />}
          value={stats.totalVisits || 0}
          label="Total Visits"
          onPress={() => onNavigate('total-visits')}
        />

        {/* Item 2: Appointments */}
        <VisitorOverviewCard
          icon={<Calendar color="#2864DC" size={24} strokeWidth={2.2} />}
          value={stats.appointmentRequests || 0}
          label="Appointments"
          onPress={() => onNavigate('appointment-requests')}
        />

        {/* Item 3: Visit History */}
        <VisitorOverviewCard
          icon={<History color="#2864DC" size={24} strokeWidth={2.2} />}
          value={stats.visitHistory || 0}
          label="Visit History"
          onPress={() => onNavigate('visit-history')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E9EDF3',
    padding: 18,
    marginBottom: 24,
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172033',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  itemsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});

export default VisitorOverviewSection;
