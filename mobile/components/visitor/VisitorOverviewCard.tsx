import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface VisitorOverviewCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  onPress: () => void;
}

export const VisitorOverviewCard: React.FC<VisitorOverviewCardProps> = ({
  icon,
  value,
  label,
  onPress,
}) => {
  const displayValue = String(value ?? 0);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${displayValue}`}
      style={styles.itemContainer}
    >
      {/* Icon Squircle with Top-Right Badge */}
      <View style={styles.iconBox}>
        {icon}
        {/* Count Badge on Top-Right */}
        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1}>
            {displayValue}
          </Text>
        </View>
      </View>

      {/* Centered Label Underneath */}
      <Text style={styles.labelText} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#EDF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2864DC',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 14,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default VisitorOverviewCard;
