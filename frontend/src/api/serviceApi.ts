import api from './axiosConfig';

export const serviceApi = {
  getCategories: async () => {
    const response = await api.get('/services/categories');
    return response.data;
  },

  createCategory: async (data: { name: string; description?: string; icon?: string }) => {
    const response = await api.post('/services/categories', data);
    return response.data;
  },

  getServices: async (params?: { page?: number; limit?: number; category?: string; search?: string; status?: string; sortBy?: string; sortOrder?: string }) => {
    const response = await api.get('/services', { params });
    return response.data;
  },

  getServiceById: async (id: string) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  createService: async (serviceData: any) => {
    const response = await api.post('/services', serviceData);
    return response.data;
  },

  updateService: async (id: string, serviceData: any) => {
    const response = await api.put(`/services/${id}`, serviceData);
    return response.data;
  },

  deleteService: async (id: string) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },

  toggleServiceStatus: async (id: string) => {
    const response = await api.patch(`/services/${id}/toggle-status`);
    return response.data;
  },
};
