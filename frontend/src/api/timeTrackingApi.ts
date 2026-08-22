import api from './axiosConfig';

export const timeTrackingApi = {
  // Get all time logs for current technician
  getTimeLogs: async (params?: { status?: string; jobCard?: string; date?: string }) => {
    const response = await api.get('/time-tracking', { params });
    return response.data;
  },

  // Get time log by ID
  getTimeLogById: async (id: string) => {
    const response = await api.get(`/time-tracking/${id}`);
    return response.data;
  },

  // Create new time log
  createTimeLog: async (data: any) => {
    const response = await api.post('/time-tracking', data);
    return response.data;
  },

  // Update time log
  updateTimeLog: async (id: string, data: any) => {
    const response = await api.put(`/time-tracking/${id}`, data);
    return response.data;
  },

  // Get daily time summary
  getDailyTimeSummary: async (date?: string) => {
    const response = await api.get('/time-tracking/daily-summary', { params: { date } });
    return response.data;
  },
};