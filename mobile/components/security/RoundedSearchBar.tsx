import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';

interface RoundedSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const RoundedSearchBar: React.FC<RoundedSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search visitor, host, phone or ID...',
}) => {
  return (
    <View style={styles.searchWrapper}>
      <View style={styles.searchContainer}>
        <Search color="#9CA3AF" size={20} strokeWidth={2} style={styles.icon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          style={styles.input}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAF2',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#DDE3ED',
    height: 52,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: '#172033',
    fontWeight: '500',
    height: '100%',
    paddingVertical: 0,
  },
});

export default RoundedSearchBar;
