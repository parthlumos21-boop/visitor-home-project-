import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface VisitorFloatingActionButtonProps {
  onPress: () => void;
}

export const VisitorFloatingActionButton: React.FC<VisitorFloatingActionButtonProps> = ({
  onPress,
}) => {
  const insets = useSafeAreaInsets();

  // Dynamic calculation to ensure FAB floats cleanly above the floating capsule bottom navigation:
  // - Floating tab bar height: 64px
  // - Floating tab bar bottom offset: insets.bottom + (Platform.OS === 'android' ? 6 : 4)
  // - Margin between FAB and capsule bar: 14px
  const bottomOffset =
    insets.bottom > 0
      ? insets.bottom + (Platform.OS === 'android' ? 6 : 4)
      : 14;

  const fabBottomPosition = bottomOffset + 64 + 14;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel="Create Appointment"
      style={[
        styles.fab,
        {
          bottom: fabBottomPosition,
        },
      ]}
    >
      <Plus color="#FFFFFF" size={26} strokeWidth={2.6} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2864DC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
    ...Platform.select({
      ios: {
        shadowColor: '#2864DC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 14px rgba(40, 100, 220, 0.4)',
      },
    }),
  },
});

export default VisitorFloatingActionButton;
