import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppointmentFormHeaderProps {
  title?: string;
  onBackPress?: () => void;
}

export const AppointmentFormHeader: React.FC<AppointmentFormHeaderProps> = ({
  title = 'New Appointment',
  onBackPress,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/' as any);
    }
  };

  return (
    <View style={[styles.headerWrapper, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
      {/* Top Bar with Back Navigation and Title */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <ChevronLeft color="#17243A" size={24} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{title}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topBarTitle: {
    fontSize: 20,
    fontFamily: 'OpenSans-Bold',
    color: '#17243A',
    letterSpacing: -0.3,
  },
});

export default AppointmentFormHeader;
