import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronLeft, Search, UserCircle, UserRoundPlus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getEmployees, Employee, createEmployee } from '../../../services/employee';

const DEPARTMENTS = ['All Departments', 'Marketing Dept', 'Electrical Design', 'Mechanical Dept', 'Production & QC', 'Dispatch'];
const COMPANIES = ['Lumos', 'Swati'];

export default function EmployeeList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState(params.department?.toString() || 'All Departments');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    company: '',
    role: 'EMPLOYEE',
    department: 'Marketing Dept',
    status: 'ACTIVE',
  });

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

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setForm({
      name: '',
      phone: '',
      email: '',
      password: '',
      company: '',
      role: 'EMPLOYEE',
      department: 'Marketing Dept',
      status: 'ACTIVE',
    });
  };

  const closeAddForm = () => {
    resetForm();
    setCompanyOpen(false);
    setDepartmentOpen(false);
    setShowAddForm(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.email || !form.password || !form.company || !form.department) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (form.password.trim().length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    try {
      setSaving(true);
      await createEmployee({
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.department,
        status: form.status,
      });
      closeAddForm();
      await fetchEmployees();
      Alert.alert('Success', 'Employee added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add employee');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: Employee }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(admin)/employees/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.name}`}
      className="flex-row items-center bg-white p-4 mb-3 rounded-lg border border-gray-200"
      activeOpacity={0.75}
    >
      <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-4">
        <UserCircle color="#6b7280" size={32} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-gray-900">{item.name}</Text>
        <Text className="text-sm text-gray-500 mt-1">{item.role}</Text>
        <Text className="text-sm text-blue-600 mt-1">{item.department || 'No Department'}</Text>
      </View>
      <Text className="text-sm font-semibold text-blue-700 ml-3">View</Text>
    </TouchableOpacity>
  );

  const renderForm = () => (
    <FlatList
      data={[]}
      keyExtractor={(_, index) => String(index)}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120 }}
      renderItem={null}
      ListHeaderComponent={
        <View className="bg-white border border-gray-200 rounded-lg p-4">
          <Text className="text-base font-bold text-gray-900 mb-4">Add Employee</Text>

          <View className="mb-3">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Full Name *</Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-lg px-4 h-12 text-base"
              placeholder="Enter employee full name"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />
          </View>

          <View className="mb-3">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Mobile Number *</Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-lg px-4 h-12 text-base"
              placeholder="+91 Enter mobile number"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
            />
          </View>

          <View className="mb-3">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Email Address *</Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-lg px-4 h-12 text-base"
              placeholder="employee@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
            />
          </View>

          <View className="mb-3">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Password *</Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-lg px-4 h-12 text-base"
              placeholder="Enter employee password"
              secureTextEntry
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
            />
          </View>

          <View className="mb-3">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Company *</Text>
            <TouchableOpacity
              onPress={() => {
                setCompanyOpen((value) => !value);
                setDepartmentOpen(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Select company"
              className="bg-white border border-gray-300 rounded-lg px-4 h-12 flex-row items-center justify-between"
              activeOpacity={0.75}
            >
              <Text className={`text-base ${form.company ? 'text-gray-900' : 'text-gray-400'}`}>
                {form.company || 'Select company'}
              </Text>
              <ChevronDown color="#6b7280" size={20} />
            </TouchableOpacity>

            {companyOpen && (
              <View className="mt-2 rounded-lg border border-gray-200 bg-white overflow-hidden">
                {COMPANIES.map((company, index) => (
                  <TouchableOpacity
                    key={company}
                    onPress={() => {
                      setForm({ ...form, company });
                      setCompanyOpen(false);
                    }}
                    className={`h-11 justify-center px-4 ${index !== COMPANIES.length - 1 ? 'border-b border-gray-100' : ''}`}
                    activeOpacity={0.75}
                  >
                    <Text className={`text-base ${form.company === company ? 'font-bold text-blue-700' : 'font-medium text-gray-800'}`}>
                      {company}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Department *</Text>
            <TouchableOpacity
              onPress={() => {
                setDepartmentOpen((value) => !value);
                setCompanyOpen(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Select department"
              className="bg-white border border-gray-300 rounded-lg px-4 h-12 flex-row items-center justify-between"
              activeOpacity={0.75}
            >
              <Text className="text-base text-gray-900">{form.department}</Text>
              <ChevronDown color="#6b7280" size={20} />
            </TouchableOpacity>

            {departmentOpen && (
              <View className="mt-2 rounded-lg border border-gray-200 bg-white overflow-hidden">
                {DEPARTMENTS.filter((dept) => dept !== 'All Departments').map((dept, index, options) => (
                  <TouchableOpacity
                    key={dept}
                    onPress={() => {
                      setForm({ ...form, department: dept });
                      setDepartmentOpen(false);
                    }}
                    className={`h-11 justify-center px-4 ${index !== options.length - 1 ? 'border-b border-gray-100' : ''}`}
                    activeOpacity={0.75}
                  >
                    <Text className={`text-base ${form.department === dept ? 'font-bold text-blue-700' : 'font-medium text-gray-800'}`}>
                      {dept}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View className="flex-row">
            <TouchableOpacity onPress={closeAddForm} className="flex-1 h-12 bg-white border border-gray-300 rounded-lg items-center justify-center mr-3">
              <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Add employee"
              className={`flex-1 h-12 rounded-lg items-center justify-center ${saving ? 'bg-blue-400' : 'bg-blue-600'}`}
            >
              <Text className="text-white font-semibold text-base">{saving ? 'Adding...' : 'Add Employee'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
    />
  );

  const renderListHeader = () => (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <View className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-1 mr-3">
          <Text className="text-xs text-gray-500 font-semibold">Total Employees</Text>
          <Text className="text-2xl font-bold text-gray-900 mt-1">{employees.length}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddForm(true)}
          accessibilityRole="button"
          accessibilityLabel="Open add employee form"
          className="bg-blue-50 px-3 h-14 rounded-md flex-row items-center border border-blue-100"
          activeOpacity={0.75}
        >
          <UserRoundPlus color="#2563eb" size={18} />
          <Text className="text-blue-700 font-semibold ml-1">Add</Text>
        </TouchableOpacity>
      </View>

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
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + 64}
    >
      <View className="bg-white border-b border-gray-200 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center px-4 justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => (showAddForm ? closeAddForm() : router.back())} className="mr-3">
              <ChevronLeft color="#111827" size={28} />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">{showAddForm ? 'Add Employee' : 'Employees'}</Text>
          </View>
        </View>
      </View>

      {showAddForm ? (
        renderForm()
      ) : (
        <View className="flex-1 p-4">
          {loading ? (
            <View>
              {renderListHeader()}
              <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
            </View>
          ) : (
            <FlatList
              data={filteredEmployees}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ListHeaderComponent={renderListHeader()}
              contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={() => (
                <View className="items-center justify-center py-10">
                  <Text className="text-gray-500 text-base">No employees found.</Text>
                </View>
              )}
            />
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
