import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, CalendarPlus, Clock } from 'lucide-react-native';
import EmployeeSummaryItem from './EmployeeSummaryItem';

interface EmployeeStats {
  approvals?: number;
  newVisitors?: number;
  myVisitors?: number;
}

interface EmployeeDailySummaryProps {
  stats: EmployeeStats;
  onNavigate: (route: string) => void;
}

export const EmployeeDailySummary: React.FC<EmployeeDailySummaryProps> = ({
  stats,
  onNavigate,
}) => {
  return (
    <View style={styles.container}>
      {/* Section Header with vertical blue accent */}
      <View style={styles.headerRow}>
        <View style={styles.blueAccent} />
        <Text style={styles.sectionTitle}>Daily Summary</Text>
      </View>

      {/* Shared White Card Container with 3 Columns */}
      <View style={styles.cardContainer}>
        {/* Column 1: Approvals */}
        <EmployeeSummaryItem
          icon={<Check color="#2864DC" size={24} strokeWidth={2.4} />}
          value={stats.approvals || 0}
          label="Approvals"
          onPress={() => onNavigate('approvals')}
        />

        {/* Divider 1 */}
        <View style={styles.verticalDivider} />

        {/* Column 2: New Visitor */}
        <EmployeeSummaryItem
          icon={<CalendarPlus color="#2864DC" size={24} strokeWidth={2.2} />}
          value={stats.newVisitors || 0}
          label="New Visitor"
          onPress={() => onNavigate('new-appointment')}
        />

        {/* Divider 2 */}
        <View style={styles.verticalDivider} />

        {/* Column 3: My Visitors */}
        <EmployeeSummaryItem
          icon={<Clock color="#2864DC" size={24} strokeWidth={2.2} />}
          value={stats.myVisitors || 0}
          label="My Visitors"
          onPress={() => onNavigate('visitors')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  blueAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#2864DC',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172033',
    letterSpacing: -0.2,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E9EDF4',
    paddingVertical: 18,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  verticalDivider: {
    width: 1,
    height: 54,
    backgroundColor: '#F1F5F9',
  },
});

export default EmployeeDailySummary;
