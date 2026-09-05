import api from './api';

export interface Employee {
  id: string;
  employeeId: string | null;
  name: string;
  email: string;
  password?: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  status: string;
  role: string;
}

export interface EmployeeDetails extends Employee {
  activity: {
    totalAppointments: number;
    approved: number;
    rejected: number;
    completed: number;
  };
}

export const getEmployees = async (department?: string): Promise<Employee[]> => {
  const params = department && department !== 'All Departments' ? { department } : {};
  const response = await api.get('/employees', { params });
  return response.data;
};

export const getEmployeeById = async (id: string): Promise<EmployeeDetails> => {
  const response = await api.get(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (data: Partial<Employee>): Promise<{ id: string; message: string }> => {
  const response = await api.post('/employees', data);
  return response.data;
};

export const updateEmployee = async (id: string, data: Partial<Employee>): Promise<{ message: string }> => {
  const response = await api.patch(`/employees/${id}`, data);
  return response.data;
};

export const deactivateEmployee = async (id: string): Promise<{ message: string }> => {
  const response = await api.patch(`/employees/${id}/deactivate`);
  return response.data;
};
