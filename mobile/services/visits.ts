import api from './api';

export const createVisit = async (data: { purpose: string; scheduledAt: string; hostId: string }) => {
  const response = await api.post('/visits', data);
  return response.data;
};

export const getMyVisits = async () => {
  const response = await api.get('/visits/me');
  return response.data;
};

export const getPendingVisits = async () => {
  const response = await api.get('/visits/pending');
  return response.data;
};

export const approveVisit = async (visitId: string) => {
  const response = await api.post(`/visits/${visitId}/approve`);
  return response.data;
};

export const checkInVisit = async (visitId: string, token: string) => {
  const response = await api.post(`/visits/${visitId}/check-in`, { token });
  return response.data;
};

export const checkOutVisit = async (visitId: string) => {
  const response = await api.post(`/visits/${visitId}/check-out`);
  return response.data;
};

export const getVisitorInvitations = async () => {
  const response = await api.get('/visitors/my-invitations');
  return response.data;
};

export const updateInvitationStatus = async (id: string, status: string, rejectionReason?: string) => {
  const response = await api.patch(`/visitors/${id}/status`, { status, rejectionReason });
  return response.data;
};
