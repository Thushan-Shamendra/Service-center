import api from './axiosConfig';

export const activityApi = {
  getActivities: async (params?: { page?: number; limit?: number; type?: string; module?: string }) => {
    const response = await api.get('/activities', { params });
    return response.data;
  },

  logActivity: async (data: { action: string; details?: string; type?: string; module?: string }) => {
    const response = await api.post('/activities', data);
    return response.data;
  },

  getAllActivities: async (params?: { page?: number; limit?: number; user?: string; type?: string; module?: string }) => {
    const response = await api.get('/activities/all', { params });
    return response.data;
  },
};