import api from './axiosConfig';

export const purchaseReturnApi = {
  getPurchaseReturns: async (params?: any) => {
    const response = await api.get('/purchase-returns', { params });
    return response.data;
  },

  getPurchaseReturnById: async (id: string) => {
    const response = await api.get(`/purchase-returns/${id}`);
    return response.data;
  },

  createPurchaseReturn: async (data: any) => {
    const response = await api.post('/purchase-returns', data);
    return response.data;
  },

  updatePurchaseReturn: async (id: string, data: any) => {
    const response = await api.put(`/purchase-returns/${id}`, data);
    return response.data;
  },

  deletePurchaseReturn: async (id: string) => {
    const response = await api.delete(`/purchase-returns/${id}`);
    return response.data;
  },

  approvePurchaseReturn: async (id: string) => {
    const response = await api.patch(`/purchase-returns/${id}/approve`);
    return response.data;
  },

  rejectPurchaseReturn: async (id: string) => {
    const response = await api.patch(`/purchase-returns/${id}/reject`);
    return response.data;
  },

  getPurchaseReturnSummary: async () => {
    const response = await api.get('/purchase-returns/summary');
    return response.data;
  },
};