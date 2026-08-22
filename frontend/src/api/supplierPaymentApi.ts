import api from './axiosConfig';

export const supplierPaymentApi = {
  getSupplierPayments: async (params?: any) => {
    const response = await api.get('/supplier-payments', { params });
    return response.data;
  },

  getSupplierPaymentById: async (id: string) => {
    const response = await api.get(`/supplier-payments/${id}`);
    return response.data;
  },

  createSupplierPayment: async (data: any) => {
    const response = await api.post('/supplier-payments', data);
    return response.data;
  },

  updateSupplierPayment: async (id: string, data: any) => {
    const response = await api.put(`/supplier-payments/${id}`, data);
    return response.data;
  },

  deleteSupplierPayment: async (id: string) => {
    const response = await api.delete(`/supplier-payments/${id}`);
    return response.data;
  },

  getSupplierPaymentSummary: async () => {
    const response = await api.get('/supplier-payments/summary');
    return response.data;
  },
};