import api from './axiosConfig';

export const invoiceApi = {
  getInvoices: async (params?: { page?: number; limit?: number; status?: string; paymentStatus?: string; search?: string; jobCardId?: string; customer?: string }) => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  getInvoiceById: async (id: string) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  createInvoice: async (data: any) => {
    const response = await api.post('/invoices', data);
    return response.data;
  },

  updateInvoice: async (id: string, data: any) => {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  },

  approveInvoice: async (id: string, payload: { approvedBy: string; remarks?: string }) => {
    const response = await api.put(`/invoices/${id}/approve`, payload);
    return response.data;
  },

  rejectInvoice: async (id: string, payload: { rejectionReason: string }) => {
    const response = await api.put(`/invoices/${id}/reject`, payload);
    return response.data;
  },

  // Payment operations
  recordPayment: async (invoiceId: string, data: {
    amount: number;
    paymentMethod: 'cash' | 'card' | 'bank_transfer';
    referenceNumber?: string;
    paymentDate: string;
  }) => {
    const response = await api.post(`/invoices/${invoiceId}/payments`, data);
    return response.data;
  },

  getPaymentHistory: async (invoiceId: string) => {
    const response = await api.get(`/invoices/${invoiceId}/payments`);
    return response.data;
  },

  getInvoiceStats: async () => {
    const response = await api.get('/invoices/stats');
    return response.data;
  },
};