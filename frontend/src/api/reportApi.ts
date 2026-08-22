import api from './axiosConfig';

export const reportApi = {
  getServiceReport: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/reports/service', { params });
    return response.data;
  },

  getSalesReport: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/reports/sales', { params });
    return response.data;
  },

  getInventoryReport: async () => {
    const response = await api.get('/reports/inventory');
    return response.data;
  },

  getCustomerReport: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/reports/customers', { params });
    return response.data;
  },

  getEmployeePerformance: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/reports/employees', { params });
    return response.data;
  },

  getAppointmentReport: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/reports/appointments', { params });
    return response.data;
  },

  getVehicleReport: async () => {
    const response = await api.get('/reports/vehicles');
    return response.data;
  },

  getDashboardReport: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },
};
