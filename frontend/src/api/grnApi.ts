import api from './axiosConfig';

export const grnApi = {
  getGRNs: async (params?: any) => {
    const response = await api.get('/grn', { params });
    return response.data;
  },

  getGRNById: async (id: string) => {
    const response = await api.get(`/grn/${id}`);
    return response.data;
  },

  createGRN: async (data: any) => {
    const response = await api.post('/grn', data);
    return response.data;
  },

  updateGRN: async (id: string, data: any) => {
    const response = await api.put(`/grn/${id}`, data);
    return response.data;
  },

  deleteGRN: async (id: string) => {
    const response = await api.delete(`/grn/${id}`);
    return response.data;
  },

  verifyGRN: async (id: string) => {
    const response = await api.patch(`/grn/${id}/verify`);
    return response.data;
  },

  getGRNSummary: async () => {
    const response = await api.get('/grn/summary');
    return response.data;
  },
};
