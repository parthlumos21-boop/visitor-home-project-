import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface VisitorDetailsListProps {
  phone?: string | null;
  host?: string | null;
  time?: string | null;
  purpose?: string | null;
  inside?: string | null;
  out?: string | null;
  duration?: string | null;
}

export const VisitorDetailsList: React.FC<VisitorDetailsListProps> = ({
  phone,
  host,
  time,
  purpose,
  inside,
  out,
  duration,
}) => {
  const fields = [
    { label: 'Phone', value: phone || 'N/A' },
    { label: 'Host', value: host || 'N/A' },
    { label: 'Time', value: time || 'N/A' },
    { label: 'Purpose', value: purpose || 'General Visit' },
    { label: 'Inside', value: inside || null },
    { label: 'Out', value: out || null },
    { label: 'Duration', value: duration || null },
  ];

  return (
    <View style={styles.listContainer}>
      {fields.map((field, idx) => {
        if (!field.value) return null;

        return (
          <View key={field.label + idx} style={styles.row}>
            <Text style={styles.labelText}>{field.label}:</Text>
            <Text style={styles.valueText} numberOfLines={2}>
              {field.value}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  labelText: {
    width: 72,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#172033',
  },
  valueText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    color: '#748094',
    lineHeight: 18,
  },
});

export default VisitorDetailsList;
