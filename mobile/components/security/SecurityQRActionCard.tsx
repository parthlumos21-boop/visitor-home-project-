import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { QrCode } from 'lucide-react-native';

interface SecurityQRActionCardProps {
  onPress: () => void;
}

export const SecurityQRActionCard: React.FC<SecurityQRActionCardProps> = ({
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Scan Visitor QR Code"
      style={styles.cardContainer}
    >
      <QrCode color="#FFFFFF" size={46} strokeWidth={2} style={styles.icon} />
      <Text style={styles.heading}>SCAN VISITOR QR</Text>
      <Text style={styles.subtitle}>Verify visitor & check-in</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#2864DC',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
    ...Platform.select({
      ios: {
        shadowColor: '#2864DC',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 6px 18px rgba(40, 100, 220, 0.35)',
      },
    }),
  },
  icon: {
    marginBottom: 12,
  },
  heading: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#DBEAFE',
    textAlign: 'center',
  },
});

export default SecurityQRActionCard;
