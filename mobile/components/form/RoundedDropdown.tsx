import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';

export type DropdownOption = string | { id: string; name: string; department?: string | null };

interface RoundedDropdownProps {
  label: string;
  value?: string;
  displayValue?: string;
  placeholder?: string;
  options: DropdownOption[];
  optional?: boolean;
  loading?: boolean;
  onSelect: (option: any) => void;
}

export const RoundedDropdown: React.FC<RoundedDropdownProps> = ({
  label,
  value,
  displayValue,
  placeholder,
  options,
  optional = false,
  loading = false,
  onSelect,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const cleanLabel = label.replace(/\s*\*$/, '');
  const isRequired = !optional && label.includes('*');

  const selectedDisplay =
    displayValue ||
    (typeof value === 'string' && value ? value : '') ||
    placeholder ||
    `Select ${cleanLabel.toLowerCase()}`;

  const isPlaceholder = !displayValue && !value;

  const getOptionKey = (item: DropdownOption, index: number) => {
    if (typeof item === 'string') return `${item}-${index}`;
    return item.id || `${item.name}-${index}`;
  };

  const getOptionText = (item: DropdownOption) => {
    if (typeof item === 'string') return item;
    return item.name;
  };

  const getOptionSubtext = (item: DropdownOption) => {
    if (typeof item === 'object' && item.department) {
      return item.department;
    }
    return null;
  };

  return (
    <View style={styles.fieldWrapper}>
      {/* Label */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {cleanLabel} {isRequired && <Text style={styles.requiredStar}>*</Text>}
        </Text>
      </View>

      {/* Pill Trigger */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`Select ${cleanLabel}`}
        style={styles.triggerButton}
      >
        <Text
          numberOfLines={1}
          style={[styles.valueText, isPlaceholder && styles.placeholderText]}
        >
          {selectedDisplay}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color="#3478F6" />
        ) : (
          <ChevronDown color="#64748B" size={20} strokeWidth={2.2} />
        )}
      </TouchableOpacity>

      {/* Selection Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {cleanLabel}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
                style={styles.closeButton}
              >
                <X color="#17243A" size={22} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            {(!options || options.length === 0) ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No options available.</Text>
              </View>
            ) : (
              <FlatList
                data={options || []}
                keyExtractor={getOptionKey}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const title = getOptionText(item);
                  const subtitle = getOptionSubtext(item);
                  const isSelected =
                    (typeof item === 'string' && item === value) ||
                    (typeof item === 'object' && (item.id === value || item.name === displayValue));

                  return (
                    <TouchableOpacity
                      onPress={() => {
                        onSelect(item);
                        setModalVisible(false);
                      }}
                      activeOpacity={0.7}
                      style={[styles.optionItem, isSelected && styles.selectedOptionItem]}
                    >
                      <Text style={[styles.optionTitle, isSelected && styles.selectedOptionTitle]}>
                        {title}
                      </Text>
                      {subtitle ? (
                        <Text style={styles.optionSubtitle}>{subtitle}</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldWrapper: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 2,
  },
  label: {
    fontSize: 13.5,
    fontFamily: 'OpenSans-SemiBold',
    color: '#17243A',
  },
  requiredStar: {
    color: '#EF4444',
    fontSize: 13.5,
    fontFamily: 'OpenSans-Bold',
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 52,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  valueText: {
    flex: 1,
    fontSize: 14.5,
    color: '#17243A',
    fontFamily: 'OpenSans-Regular',
    paddingRight: 8,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '65%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'OpenSans-Bold',
    color: '#17243A',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  selectedOptionItem: {
    backgroundColor: '#EFF6FF',
  },
  optionTitle: {
    fontSize: 15,
    fontFamily: 'OpenSans-SemiBold',
    color: '#17243A',
  },
  selectedOptionTitle: {
    color: '#3478F6',
    fontFamily: 'OpenSans-Bold',
  },
  optionSubtitle: {
    fontSize: 12.5,
    fontFamily: 'OpenSans-Regular',
    color: '#718096',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: '#718096',
  },
});

export default RoundedDropdown;
