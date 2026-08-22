import api from './axiosConfig';

export const sparePartsApi = {
  getSparePartsRequests: async (params?: { page?: number; limit?: number; status?: string; jobCard?: string }) => {
    const response = await api.get('/spare-parts', { params });
    return response.data;
  },

  getSparePartsRequestById: async (id: string) => {
    const response = await api.get(`/spare-parts/${id}`);
    return response.data;
  },

  getSparePartsByJobCard: async (jobCardId: string) => {
    const response = await api.get(`/spare-parts/job-card/${jobCardId}`);
    return response.data;
  },

  createSparePartsRequest: async (requestData: any) => {
    const response = await api.post('/spare-parts', requestData);
    return response.data;
  },

  updateSparePartsRequest: async (id: string, requestData: any) => {
    const response = await api.put(`/spare-parts/${id}`, requestData);
    return response.data;
  },

  approveSparePartsRequest: async (id: string) => {
    const response = await api.put(`/spare-parts/${id}/approve`);
    return response.data;
  },

  rejectSparePartsRequest: async (id: string, rejectionReason: string) => {
    const response = await api.put(`/spare-parts/${id}/reject`, { rejectionReason });
    return response.data;
  },

  issueSpareParts: async (id: string, issueData: any) => {
    const response = await api.put(`/spare-parts/${id}/issue`, issueData);
    return response.data;
  },

  recordPartsUsage: async (id: string, usageData: { usedQuantity: number; usageType: 'full' | 'partial' }) => {
    const response = await api.put(`/spare-parts/${id}/record-usage`, usageData);
    return response.data;
  },

  deleteSparePartsRequest: async (id: string) => {
    const response = await api.delete(`/spare-parts/${id}`);
    return response.data;
  },
};