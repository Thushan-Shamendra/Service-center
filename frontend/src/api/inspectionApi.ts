import api from './axiosConfig';

export const inspectionApi = {
  // Get all inspections for current technician
  getInspections: (params?: { status?: string; jobCard?: string }) =>
    api.get('/inspections', { params }),

  // Get inspection by ID
  getInspectionById: (id: string) =>
    api.get(`/inspections/${id}`),

  // Create new inspection
  createInspection: (data: any) =>
    api.post('/inspections', data),

  // Update inspection
  updateInspection: (id: string, data: any) =>
    api.put(`/inspections/${id}`, data),

  // Complete inspection
  completeInspection: (id: string) =>
    api.put(`/inspections/${id}/complete`),

  // Upload inspection media
  uploadMedia: (id: string, formData: FormData) =>
    api.post(`/inspections/${id}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};