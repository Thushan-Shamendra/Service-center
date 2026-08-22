import api from './axiosConfig';

export const customerApi = {
  getCustomers: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  getCustomerById: async (id: string) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  createCustomer: async (data: any) => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  updateCustomer: async (id: string, data: any) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  getCustomerVehicles: async (id: string) => {
    const response = await api.get(`/customers/${id}/vehicles`);
    return response.data;
  },

  getCustomerServiceHistory: async (id: string) => {
    const response = await api.get(`/customers/${id}/service-history`);
    return response.data;
  },

  getCustomerInvoices: async (id: string) => {
    const response = await api.get(`/customers/${id}/invoices`);
    return response.data;
  },

  getCustomerAppointments: async (id: string) => {
    const response = await api.get(`/customers/${id}/appointments`);
    return response.data;
  },
};
