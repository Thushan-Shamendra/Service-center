import api from './axiosConfig';

export const partsRequestApi = {
  getPartsRequests: async (params?: { page?: number; limit?: number; status?: string; date?: string; technician?: string; category?: string; search?: string }) => {
    const response = await api.get('/spare-parts', { params });
    return response.data;
  },

  getPartsRequestById: async (id: string) => {
    const response = await api.get(`/spare-parts/${id}`);
    return response.data;
  },

  approveRequest: async (id: string, data: {
    approvedQuantity: number;
    remarks?: string;
    managerRemarks?: string;
    stockMovementId?: string;
  }) => {
    const response = await api.put(`/spare-parts/${id}/approve`, data);
    return response.data;
  },

  rejectRequest: async (id: string, data: { rejectionReason: string }) => {
    const response = await api.put(`/spare-parts/${id}/reject`, data);
    return response.data;
  },

  approveMultiple: async (ids: string[], data: { remarks?: string }) => {
    const response = await api.post('/spare-parts/approve-multiple', { ids, ...data });
    return response.data;
  },

  rejectMultiple: async (ids: string[], data: { rejectionReason: string }) => {
    const response = await api.post('/spare-parts/reject-multiple', { ids, ...data });
    return response.data;
  },

  getPartsRequestStats: async () => {
    const response = await api.get('/spare-parts/stats');
    return response.data;
  },
};