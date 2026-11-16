import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FormSectionHeaderProps {
  title: string;
  showTopDivider?: boolean;
}

export const FormSectionHeader: React.FC<FormSectionHeaderProps> = ({
  title,
  showTopDivider = false,
}) => {
  return (
    <View style={styles.container}>
      {showTopDivider && <View style={styles.divider} />}
      <Text style={styles.titleText}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 20,
    marginTop: 8,
  },
  titleText: {
    fontSize: 12,
    fontFamily: 'OpenSans-Bold',
    color: '#64748B',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});

export default FormSectionHeader;
