import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';

interface VisitorProfileHeaderProps {
  displayId?: string | null;
  name?: string | null;
  status?: string | null;
}

export const VisitorProfileHeader: React.FC<VisitorProfileHeaderProps> = ({
  displayId = 'VISIT',
  name = 'Visitor',
  status = 'CHECKED_IN',
}) => {
  const getBadgeStyle = (statusVal?: string | null) => {
    switch (statusVal) {
      case 'CHECKED_IN':
        return { bg: '#EDF3FF', text: '#2864DC' };
      case 'COMPLETED':
        return { bg: '#F2ECFF', text: '#9060D9' };
      case 'APPROVED':
        return { bg: '#E8F8EF', text: '#20A568' };
      case 'EXPIRED':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#FEF3C7', text: '#D97706' };
    }
  };

  const badgeTheme = getBadgeStyle(status);

  return (
    <View style={styles.headerContainer}>
      {/* Left: Avatar + (ID & Name) */}
      <View style={styles.leftSection}>
        <View style={styles.avatarBox}>
          <User color="#2864DC" size={22} strokeWidth={2.2} />
        </View>
        <View style={styles.textColumn}>
          <Text style={styles.idText} numberOfLines={1}>
            {displayId || 'VISIT'}
          </Text>
          <Text style={styles.nameText} numberOfLines={1}>
            {name || 'Visitor'}
          </Text>
        </View>
      </View>

      {/* Right: Status Badge */}
      <View style={[styles.badge, { backgroundColor: badgeTheme.bg }]}>
        <Text style={[styles.badgeText, { color: badgeTheme.text }]}>
          {status || 'UNKNOWN'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textColumn: {
    flex: 1,
  },
  idText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#748094',
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  nameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#172033',
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

export default VisitorProfileHeader;
