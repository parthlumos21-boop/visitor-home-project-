import api from './api';

export interface LoginPreview {
  exists: boolean;
  name?: string;
  role?: 'SUPER_ADMIN' | 'SECURITY' | 'RECEPTIONIST' | 'EMPLOYEE' | 'VISITOR';
}

export const loginUser = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const previewLoginUser = async (email: string): Promise<LoginPreview> => {
  const response = await api.get('/auth/preview', { params: { email } });
  return response.data;
};

export const registerUser = async (data: { name: string; email: string; phone: string; password: string }) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};
