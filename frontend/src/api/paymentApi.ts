import api from './axiosConfig';

export const paymentApi = {
  getPayments: async (params?: { page?: number; limit?: number; status?: string; paymentMethod?: string; customer?: string; invoice?: string }) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  getPaymentById: async (id: string) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  createPayment: async (paymentData: any) => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },

  refundPayment: async (id: string, refundData: { refundAmount?: number; refundReason?: string }) => {
    const response = await api.put(`/payments/${id}/refund`, refundData);
    return response.data;
  },

  updatePayment: async (id: string, paymentData: any) => {
    const response = await api.put(`/payments/${id}`, paymentData);
    return response.data;
  },

  getPaymentStats: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/payments/stats', { params });
    return response.data;
  },
};
