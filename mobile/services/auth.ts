import api from './api';

export const loginUser = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (data: { name: string; email: string; phone: string; password: string }) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};
