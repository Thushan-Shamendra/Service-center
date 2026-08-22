import api from './axiosConfig';

export const quotationApi = {
  getQuotations: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const response = await api.get('/quotations', { params });
    return response.data;
  },

  getQuotationById: async (id: string) => {
    const response = await api.get(`/quotations/${id}`);
    return response.data;
  },

  createQuotation: async (data: any) => {
    const response = await api.post('/quotations', data);
    return response.data;
  },

  updateQuotation: async (id: string, data: any) => {
    const response = await api.put(`/quotations/${id}`, data);
    return response.data;
  },

  approveQuotation: async (id: string, payload: { approvedBy: string; remarks?: string }) => {
    const response = await api.put(`/quotations/${id}/approve`, payload);
    return response.data;
  },

  rejectQuotation: async (id: string, payload: { rejectionReason: string }) => {
    const response = await api.put(`/quotations/${id}/reject`, payload);
    return response.data;
  },

  convertToInvoice: async (id: string, payload: { varianceReason?: string; confirmApproval?: boolean }) => {
    const response = await api.post(`/quotations/${id}/convert-to-invoice`, payload);
    return response.data;
  },
};