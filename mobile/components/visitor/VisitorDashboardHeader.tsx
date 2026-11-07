import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Shield, Bell, LogOut } from 'lucide-react-native';

interface VisitorDashboardHeaderProps {
  onNotificationsPress?: () => void;
  onLogoutPress: () => void;
  hasUnreadNotifications?: boolean;
}

export const VisitorDashboardHeader: React.FC<VisitorDashboardHeaderProps> = ({
  onNotificationsPress,
  onLogoutPress,
  hasUnreadNotifications = true,
}) => {
  return (
    <View style={styles.container}>
      {/* Left: Shield logo + App Name + Subtitle */}
      <View style={styles.leftSection}>
        <View style={styles.shieldWrapper}>
          <Shield color="#FFFFFF" size={20} strokeWidth={2.2} />
        </View>
        <View>
          <Text style={styles.appTitle}>Visitor</Text>
          <Text style={styles.appSubtitle}>Smart Visitor Management</Text>
        </View>
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
          <Bell color="#475569" size={19} />
          {hasUnreadNotifications && <View style={styles.notificationDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onLogoutPress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Logout"
          style={styles.actionButton}
        >
          <LogOut color="#475569" size={19} />
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
  shieldWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2864DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#2864DC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  appTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#172033',
    letterSpacing: -0.3,
    lineHeight: 25,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#707985',
    lineHeight: 16,
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
    borderColor: '#E9EDF3',
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

export default VisitorDashboardHeader;
