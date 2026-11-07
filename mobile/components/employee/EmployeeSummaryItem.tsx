import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface EmployeeSummaryItemProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  onPress: () => void;
}

export const EmployeeSummaryItem: React.FC<EmployeeSummaryItemProps> = ({
  icon,
  value,
  label,
  onPress,
}) => {
  const displayValue = String(value ?? 0).padStart(2, '0');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${displayValue}`}
      style={styles.itemContainer}
    >
      {/* Icon Squircle */}
      <View style={styles.iconBox}>
        {icon}
      </View>

      {/* Large Numerical Value */}
      <Text style={styles.valueText} numberOfLines={1}>
        {displayValue}
      </Text>

      {/* Centered Label Underneath */}
      <Text style={styles.labelText} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EDF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  valueText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#172033',
    letterSpacing: -0.4,
    lineHeight: 26,
    marginBottom: 4,
    textAlign: 'center',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#748094',
    textAlign: 'center',
  },
});

export default EmployeeSummaryItem;
