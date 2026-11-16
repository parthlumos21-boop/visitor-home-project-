import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';

interface AppointmentSubmitButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
}

export const AppointmentSubmitButton: React.FC<AppointmentSubmitButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  title = 'New Appointment',
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[styles.button, (disabled || loading) && styles.disabledButton]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#3478F6',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#3478F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(52, 120, 246, 0.35)',
      },
    }),
  },
  disabledButton: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'OpenSans-Bold',
    letterSpacing: 0.4,
  },
});

export default AppointmentSubmitButton;
