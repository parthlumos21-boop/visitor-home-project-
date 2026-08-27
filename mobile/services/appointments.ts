import api from './api';

export interface NewAppointmentPayload {
  fullName: string;
  mobile: string;
  email?: string;
  company?: string;
  visitorType?: string;
  purpose: string;
  personToMeet: string;
  department?: string;
  visitDate: string;
  arrivalTime?: string;
  vehicleNumber?: string;
  notes?: string;
}

export const createNewAppointment = async (data: NewAppointmentPayload) => {
  const response = await api.post('/new-appointments', data);
  return response.data;
};

export const getPendingNewAppointments = async () => {
  const response = await api.get('/new-appointments');
  return response.data;
};

export const getNewAppointments = async () => {
  const response = await api.get('/new-appointments?all=true');
  return response.data;
};

export const approveNewAppointment = async (id: string) => {
  const response = await api.patch(`/new-appointments/${id}/approve`);
  return response.data;
};

export const rejectNewAppointment = async (id: string, reason: string) => {
  const response = await api.patch(`/new-appointments/${id}/reject`, { reason });
  return response.data;
};
