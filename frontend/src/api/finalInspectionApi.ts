import api from './axiosConfig';

export const finalInspectionApi = {
  // Get all final inspections for current technician
  getFinalInspections: (params?: { status?: string; jobCard?: string }) =>
    api.get('/final-inspections', { params }),

  // Get final inspection by ID
  getFinalInspectionById: (id: string) =>
    api.get(`/final-inspections/${id}`),

  // Create new final inspection
  createFinalInspection: (data: any) =>
    api.post('/final-inspections', data),

  // Update final inspection
  updateFinalInspection: (id: string, data: any) =>
    api.put(`/final-inspections/${id}`, data),

  // Submit final inspection
  submitFinalInspection: (id: string) =>
    api.put(`/final-inspections/${id}/submit`),
};