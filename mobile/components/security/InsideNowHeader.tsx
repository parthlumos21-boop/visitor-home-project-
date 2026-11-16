import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface InsideNowHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export const InsideNowHeader: React.FC<InsideNowHeaderProps> = ({
  title,
  showBackButton = true,
  onBackPress,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
      <View style={styles.contentRow}>
        {showBackButton && (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <ChevronLeft color="#172033" size={24} strokeWidth={2.4} />
          </TouchableOpacity>
        )}
        <Text style={[styles.titleText, !showBackButton && styles.titleWithoutBack]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAF2',
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'OpenSans-Bold',
    color: '#172033',
    letterSpacing: -0.3,
    flex: 1,
  },
  titleWithoutBack: {
    marginLeft: 4,
  },
});

export default InsideNowHeader;
