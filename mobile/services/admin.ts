import api from './api';

export interface AdminDashboardStats {
  totalVisits: number;
  pendingApprovals: number;
  currentlyInside: number;
  appointmentsToday: number;
  adminName: string;
  totalEmployees?: number;
  totalSecurity?: number;
  employeesByDept?: Record<string, number>;
}

export interface AdminEmployee {
  id: string;
  name: string;
  email: string;
}

export const getAdminDashboard = async (): Promise<AdminDashboardStats> => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const getAdminEmployees = async (): Promise<AdminEmployee[]> => {
  const response = await api.get('/employees');
  return response.data;
};


