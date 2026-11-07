import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { User, Bell, LogOut } from 'lucide-react-native';

interface EmployeeDashboardHeaderProps {
  onNotificationsPress?: () => void;
  onLogoutPress: () => void;
  hasUnreadNotifications?: boolean;
}

export const EmployeeDashboardHeader: React.FC<EmployeeDashboardHeaderProps> = ({
  onNotificationsPress,
  onLogoutPress,
  hasUnreadNotifications = true,
}) => {
  return (
    <View style={styles.container}>
      {/* Left: Avatar + Divider + Employee Title */}
      <View style={styles.leftSection}>
        <View style={styles.avatarWrapper}>
          <User color="#475569" size={22} strokeWidth={2.2} />
        </View>
        <View style={styles.divider} />
        <Text style={styles.appTitle}>Employee</Text>
      </View>

      {/* Right: Notification Bell + Logout */}
      <View style={styles.rightSection}>
        <TouchableOpacity
          onPress={onNotificationsPress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          style={styles.actionButton}
        >
          <Bell color="#2864DC" size={20} />
          {hasUnreadNotifications && <View style={styles.notificationDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onLogoutPress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Logout"
          style={styles.actionButton}
        >
          <LogOut color="#2864DC" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1.5,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#172033',
    letterSpacing: -0.3,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EDF4',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});

export default EmployeeDashboardHeader;
