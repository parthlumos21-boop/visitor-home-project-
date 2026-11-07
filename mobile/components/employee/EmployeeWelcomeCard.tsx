import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield } from 'lucide-react-native';

interface EmployeeWelcomeCardProps {
  userName?: string;
  roleBadgeText?: string;
}

export const EmployeeWelcomeCard: React.FC<EmployeeWelcomeCardProps> = ({
  userName = 'Employee',
  roleBadgeText = 'EMPLOYEE',
}) => {
  return (
    <View style={styles.cardContainer}>
      {/* Background Watermark Shield */}
      <View style={styles.watermarkWrapper} pointerEvents="none">
        <Shield color="#2864DC" size={110} strokeWidth={1.5} />
      </View>

      {/* Left content: Greeting + Subtitle */}
      <View style={styles.textContainer}>
        <Text style={styles.welcomeHeading} numberOfLines={1}>
          Welcome, {userName}
        </Text>
        <Text style={styles.welcomeSubtitle}>
          Here is your daily summary
        </Text>
      </View>

      {/* Right: Badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{roleBadgeText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E9EDF4',
    borderLeftWidth: 5,
    borderLeftColor: '#2864DC',
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  watermarkWrapper: {
    position: 'absolute',
    right: -14,
    bottom: -22,
    opacity: 0.05,
    zIndex: 0,
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
    zIndex: 1,
  },
  welcomeHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172033',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  welcomeSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#748094',
  },
  badge: {
    backgroundColor: '#2864DC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 1,
    shadowColor: '#2864DC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.1,
  },
});

export default EmployeeWelcomeCard;
