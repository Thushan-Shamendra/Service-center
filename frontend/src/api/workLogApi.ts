import api from './axiosConfig';

export const workLogApi = {
  // Get all work logs for current technician
  getWorkLogs: (params?: { status?: string; jobCard?: string }) =>
    api.get('/work-logs', { params }),

  // Get work log by ID
  getWorkLogById: (id: string) =>
    api.get(`/work-logs/${id}`),

  // Create new work log
  createWorkLog: (data: any) =>
    api.post('/work-logs', data),

  // Update work log
  updateWorkLog: (id: string, data: any) =>
    api.put(`/work-logs/${id}`, data),
};