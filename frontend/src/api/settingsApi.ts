import api from './axiosConfig';

export const settingsApi = {
  getCompanyInfo: async () => {
    const response = await api.get('/settings/company');
    return response.data;
  },

  updateCompanyInfo: async (data: any) => {
    const response = await api.put('/settings/company', data);
    return response.data;
  },

  getWorkingHours: async () => {
    const response = await api.get('/settings/working-hours');
    return response.data;
  },

  updateWorkingHours: async (data: any) => {
    const response = await api.put('/settings/working-hours', data);
    return response.data;
  },

  getHolidays: async () => {
    const response = await api.get('/settings/holidays');
    return response.data;
  },

  addHoliday: async (data: any) => {
    const response = await api.post('/settings/holidays', data);
    return response.data;
  },

  updateHoliday: async (id: string, data: any) => {
    const response = await api.put(`/settings/holidays/${id}`, data);
    return response.data;
  },

  deleteHoliday: async (id: string) => {
    const response = await api.delete(`/settings/holidays/${id}`);
    return response.data;
  },

  getTaxSettings: async () => {
    const response = await api.get('/settings/tax');
    return response.data;
  },

  updateTaxSettings: async (data: any) => {
    const response = await api.put('/settings/tax', data);
    return response.data;
  },

  getBranding: async () => {
    const response = await api.get('/settings/branding');
    return response.data;
  },

  updateBranding: async (data: any) => {
    const response = await api.put('/settings/branding', data);
    return response.data;
  },

  getSystemConfiguration: async () => {
    const response = await api.get('/settings/system');
    return response.data;
  },

  updateSystemConfiguration: async (data: any) => {
    const response = await api.put('/settings/system', data);
    return response.data;
  },

  createBackup: async () => {
    const response = await api.post('/settings/backup');
    return response.data;
  },

  getBackupStatus: async () => {
    const response = await api.get('/settings/backup/status');
    return response.data;
  },
};
