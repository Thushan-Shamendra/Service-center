import api from './axiosConfig';

export const serviceBayApi = {
  getServiceBays: async (params?: { status?: string }) => {
    const response = await api.get('/service-bays', { params });
    return response.data;
  },

  getServiceBayById: async (id: string) => {
    const response = await api.get(`/service-bays/${id}`);
    return response.data;
  },

  createServiceBay: async (data: any) => {
    const response = await api.post('/service-bays', data);
    return response.data;
  },

  updateServiceBay: async (id: string, data: any) => {
    const response = await api.put(`/service-bays/${id}`, data);
    return response.data;
  },

  deleteServiceBay: async (id: string) => {
    const response = await api.delete(`/service-bays/${id}`);
    return response.data;
  },

  updateServiceBayStatus: async (id: string, status: string) => {
    const response = await api.put(`/service-bays/${id}/status`, { status });
    return response.data;
  },

  initializeServiceBays: async () => {
    const response = await api.post('/service-bays/initialize');
    return response.data;
  },
};
