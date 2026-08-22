import api from './axiosConfig';

export const jobCardApi = {
  getJobCards: async (params?: { page?: number; limit?: number; status?: string; search?: string; assignedTechnician?: string }) => {
    const response = await api.get('/job-cards', { params });
    return response.data;
  },

  getJobCardById: async (id: string) => {
    const response = await api.get(`/job-cards/${id}`);
    return response.data;
  },

  createJobCard: async (data: any) => {
    const response = await api.post('/job-cards', data);
    return response.data;
  },

  updateStatus: async (id: string, payload: { status: string; remarks?: string; progress?: number }) => {
    const response = await api.put(`/job-cards/${id}/status`, payload);
    return response.data;
  },

  updateJobCardStatus: async (id: string, payload: { status: string; remarks?: string; progress?: number }) => {
    const response = await api.put(`/job-cards/${id}/status`, payload);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/job-cards/${id}`, data);
    return response.data;
  },

  updateJobCard: async (id: string, data: any) => {
    const response = await api.put(`/job-cards/${id}`, data);
    return response.data;
  },

  updateInspection: async (id: string, data: any) => {
    const response = await api.put(`/job-cards/${id}/inspection`, data);
    return response.data;
  },

  getJobCardTimeline: async (id: string) => {
    const response = await api.get(`/job-cards/${id}/timeline`);
    return response.data;
  },
};
