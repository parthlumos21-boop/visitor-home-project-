import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users, UserCheck, Shield } from 'lucide-react-native';
import SecurityOverviewItem from './SecurityOverviewItem';

interface SecurityStats {
  todaysVisitors?: number;
  insideNow?: number;
  checkedOut?: number;
}

interface SecurityOverviewSectionProps {
  stats: SecurityStats | null;
  onNavigate: (filter: string) => void;
}

export const SecurityOverviewSection: React.FC<SecurityOverviewSectionProps> = ({
  stats,
  onNavigate,
}) => {
  return (
    <View style={styles.cardContainer}>
      {/* Title matching reference image */}
      <Text style={styles.title}>Overview</Text>

      {/* 3 Overview Items in a Row matching reference image */}
      <View style={styles.itemsRow}>
        {/* Item 1: Today's Visitors (Users icon) */}
        <SecurityOverviewItem
          icon={<Users color="#2864DC" size={24} strokeWidth={2.2} />}
          value={stats?.todaysVisitors ?? 0}
          label="Today's Visitors"
          iconBgColor="#EDF3FF"
          badgeBgColor="#2864DC"
          onPress={() => onNavigate('todays')}
        />

        {/* Item 2: Inside Now (UserCheck icon) */}
        <SecurityOverviewItem
          icon={<UserCheck color="#2864DC" size={24} strokeWidth={2.2} />}
          value={stats?.insideNow ?? 0}
          label="Inside Now"
          iconBgColor="#EDF3FF"
          badgeBgColor="#2864DC"
          onPress={() => onNavigate('inside')}
        />

        {/* Item 3: Checked Out (Shield icon matching reference image) */}
        <SecurityOverviewItem
          icon={<Shield color="#2864DC" size={24} strokeWidth={2.2} />}
          value={stats?.checkedOut ?? 0}
          label="Checked Out"
          iconBgColor="#EDF3FF"
          badgeBgColor="#2864DC"
          onPress={() => onNavigate('checkedOut')}
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
    marginBottom: 20,
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

export default SecurityOverviewSection;
