import api from './axiosConfig';

export const supplierApi = {
  getSupplierSummary: async () => {
    const response = await api.get('/suppliers/summary');
    return response.data;
  },

  getAllSuppliers: async () => {
    const response = await api.get('/suppliers', { params: { limit: 1000 } });
    return response.data;
  },

  getSuppliers: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },

  getSupplierById: async (id: string) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  createSupplier: async (data: any) => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },

  updateSupplier: async (id: string, data: any) => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },

  activateSupplier: async (id: string) => {
    const response = await api.patch(`/suppliers/${id}/activate`);
    return response.data;
  },

  deactivateSupplier: async (id: string) => {
    const response = await api.patch(`/suppliers/${id}/deactivate`);
    return response.data;
  },

  deleteSupplier: async (id: string) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  },
};
