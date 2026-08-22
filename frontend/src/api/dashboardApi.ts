import api from './axiosConfig';

export const dashboardApi = {
  getAdminSummary: async () => {
    const response = await api.get('/dashboard/admin');
    return response.data;
  },

  getManagerSummary: async () => {
    const response = await api.get('/dashboard/manager');
    return response.data;
  },

  getEmployeeSummary: async () => {
    const response = await api.get('/dashboard/employee');
    return response.data;
  },

  getCustomerSummary: async () => {
    const response = await api.get('/dashboard/customer');
    return response.data;
  },

  getChartData: async (type: string) => {
    const response = await api.get(`/dashboard/charts/${type}`);
    return response.data;
  },

  // Manager-specific dashboard data
  getWorkshopBays: async () => {
    const response = await api.get('/dashboard/manager/workshop-bays');
    return response.data;
  },

  getTodaysAppointments: async () => {
    const response = await api.get('/dashboard/manager/todays-appointments');
    return response.data;
  },

  getRecentJobCards: async () => {
    const response = await api.get('/dashboard/manager/recent-job-cards');
    return response.data;
  },

  getManagerAlerts: async () => {
    const response = await api.get('/dashboard/manager/alerts');
    return response.data;
  },

  // Alias for reports page
  getAdminStats: async () => {
    const response = await api.get('/dashboard/admin');
    return response.data;
  },

  // Report API methods
  getSalesReport: async (filters: any) => {
    const response = await api.get('/reports/sales', { params: filters });
    return response.data;
  },

  getInventoryReport: async (filters: any) => {
    const response = await api.get('/reports/inventory', { params: filters });
    return response.data;
  },

  getCustomerReport: async (filters: any) => {
    const response = await api.get('/reports/customers', { params: filters });
    return response.data;
  },

  getServiceReport: async (filters: any) => {
    const response = await api.get('/reports/services', { params: filters });
    return response.data;
  },

  getEmployeeReport: async (filters: any) => {
    const response = await api.get('/reports/employees', { params: filters });
    return response.data;
  },

  getWorkshopReport: async (filters: any) => {
    const response = await api.get('/reports/workshop', { params: filters });
    return response.data;
  },
};
