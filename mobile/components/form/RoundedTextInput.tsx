import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps, Platform } from 'react-native';

interface RoundedTextInputProps extends TextInputProps {
  label: string;
  optional?: boolean;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export const RoundedTextInput: React.FC<RoundedTextInputProps> = ({
  label,
  optional = false,
  rightIcon,
  onRightIconPress,
  multiline = false,
  style,
  ...rest
}) => {
  return (
    <View style={styles.fieldWrapper}>
      {/* Label above input */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label} {!optional && <Text style={styles.requiredStar}>*</Text>}
        </Text>
      </View>

      {/* Input container */}
      <View
        style={[
          styles.inputContainer,
          multiline && styles.multilineContainer,
        ]}
      >
        <TextInput
          placeholderTextColor="#9CA3AF"
          multiline={multiline}
          style={[styles.input, multiline && styles.multilineInput, style]}
          {...rest}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            activeOpacity={0.7}
            style={styles.iconButton}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  multilineContainer: {
    height: 'auto',
    minHeight: 88,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: '#17243A',
    fontFamily: 'OpenSans-Regular',
    height: '100%',
    paddingVertical: 0,
  },
  multilineInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  iconButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default RoundedTextInput;
