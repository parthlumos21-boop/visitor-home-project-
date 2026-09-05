import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, ActionSheetIOS, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Search, Plus, MoreVertical, UserCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getEmployees, Employee, deactivateEmployee } from '../../../services/employee';

const DEPARTMENTS = ['All Departments', 'Marketing Dept', 'Electrical Design', 'Mechanical Dept', 'Production & QC', 'Dispatch'];

export default function EmployeeList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState(params.department?.toString() || 'All Departments');

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEmployees(selectedDept === 'All Departments' ? undefined : selectedDept);
      setEmployees(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }, [selectedDept]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMenuPress = (employee: Employee) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'View Details', 'Edit Employee', 'Deactivate'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 3,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) router.push(`/(admin)/employees/${employee.id}`);
          if (buttonIndex === 2) router.push(`/(admin)/employees/edit/${employee.id}`); // Optional edit screen
          if (buttonIndex === 3) confirmDeactivate(employee);
        }
      );
    } else {
      Alert.alert(
        'Employee Actions',
        `Manage ${employee.name}`,
        [
          { text: 'View Details', onPress: () => router.push(`/(admin)/employees/${employee.id}`) },
          { text: 'Deactivate', onPress: () => confirmDeactivate(employee), style: 'destructive' },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const confirmDeactivate = (employee: Employee) => {
    Alert.alert('Deactivate Employee', `Are you sure you want to deactivate ${employee.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Deactivate', 
        style: 'destructive',
        onPress: async () => {
          try {
            await deactivateEmployee(employee.id);
            Alert.alert('Success', 'Employee deactivated');
            fetchEmployees();
          } catch (error) {
            Alert.alert('Error', 'Failed to deactivate employee');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: Employee }) => (
    <View className="flex-row items-center bg-white p-4 mb-3 rounded-lg border border-gray-200">
      <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-4">
        <UserCircle color="#6b7280" size={32} />
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center">
          <Text className="text-base font-bold text-gray-900">{item.name}</Text>
          <View className={`px-2 py-1 rounded text-xs ${item.status === 'ACTIVE' ? 'bg-green-100' : 'bg-red-100'}`}>
            <Text className={`text-xs font-semibold ${item.status === 'ACTIVE' ? 'text-green-700' : 'text-red-700'}`}>
              ● {item.status}
            </Text>
          </View>
        </View>
        <Text className="text-sm text-gray-500 mt-1">{item.employeeId || 'No ID'} • {item.role}</Text>
        <Text className="text-sm text-blue-600 mt-1">{item.department || 'No Department'}</Text>
      </View>
      <TouchableOpacity 
        className="p-2 ml-2"
        onPress={() => handleMenuPress(item)}
      >
        <MoreVertical color="#9ca3af" size={20} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-200 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center px-4 justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <ChevronLeft color="#111827" size={28} />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">Employees</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(admin)/employees/new')} className="bg-blue-50 px-3 py-2 rounded-md flex-row items-center">
            <Plus color="#2563eb" size={18} />
            <Text className="text-blue-700 font-semibold ml-1">Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="p-4">
        <View className="flex-row items-center bg-white rounded-lg border border-gray-300 px-3 h-12 mb-4">
          <Search color="#9ca3af" size={20} />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-800"
            placeholder="Search employee..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View className="mb-4">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={DEPARTMENTS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedDept(item)}
                className={`px-4 py-2 rounded-full mr-2 border ${selectedDept === item ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-300'}`}
              >
                <Text className={`font-semibold ${selectedDept === item ? 'text-white' : 'text-gray-600'}`}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
        ) : (
          <FlatList
            data={filteredEmployees}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View className="items-center justify-center py-10">
                <Text className="text-gray-500 text-base">No employees found.</Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
