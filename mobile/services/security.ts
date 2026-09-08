import api from './api';

export interface SecurityGuard {
  id: string;
  employeeId: string | null;
  name: string;
  email: string;
  password?: string;
  phone: string | null;
  designation: string | null;
  status: string;
  role: string;
}

export const getSecurityGuards = async (): Promise<SecurityGuard[]> => {
  const response = await api.get('/security/guards');
  return response.data;
};

export const createSecurityGuard = async (data: Partial<SecurityGuard>): Promise<{ id: string; message: string }> => {
  const response = await api.post('/security/guards', data);
  return response.data;
};

export const updateSecurityGuard = async (id: string, data: Partial<SecurityGuard>): Promise<{ message: string }> => {
  const response = await api.patch(`/security/guards/${id}`, data);
  return response.data;
};

export const deactivateSecurityGuard = async (id: string): Promise<{ message: string }> => {
  const response = await api.patch(`/security/guards/${id}/deactivate`);
  return response.data;
};


export interface SecurityDashboardStats {
  todaysVisitors: number;
  insideNow: number;
  upcoming: number;
  checkedOut: number;
}

export const getSecurityDashboardStats = async (): Promise<SecurityDashboardStats> => {
  const response = await api.get('/security/dashboard');
  return response.data;
};

export const getSecurityVisits = async (filter?: string) => {
  const response = await api.get('/security/visits', { params: filter ? { filter } : undefined });
  return response.data;
};

export const checkInVisitorApi = async (visitId: string) => {
  const response = await api.post('/security/checkin', { visitId });
  return response.data;
};

export const checkOutVisitorApi = async (visitId: string) => {
  const response = await api.post('/security/checkout', { visitId });
  return response.data;
};
