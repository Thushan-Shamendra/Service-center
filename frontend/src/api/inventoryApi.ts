import api from './axiosConfig';

export const inventoryApi = {
  getStockMovements: async (params?: { page?: number; limit?: number; date?: string; category?: string; status?: string; search?: string }) => {
    const response = await api.get('/inventory/movements', { params });
    return response.data;
  },

  getStockMovementById: async (id: string) => {
    const response = await api.get(`/inventory/movements/${id}`);
    return response.data;
  },

  getInventoryStats: async () => {
    const response = await api.get('/inventory/summary');
    return response.data;
  },

  getLowStockItems: async () => {
    const response = await api.get('/inventory', { params: { lowStock: true } });
    return response.data;
  },

  getInventory: async (params?: { page?: number; limit?: number; lowStock?: boolean; outOfStock?: boolean; category?: string; search?: string }) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  getInventoryItems: async (params?: any) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  getInventoryItemById: async (id: string) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  getInventorySummary: async () => {
    const response = await api.get('/inventory/summary');
    return response.data;
  },

  getMovementHistory: async (params?: { page?: number; limit?: number; itemId?: string; date?: string; category?: string }) => {
    const response = await api.get('/inventory/movement-history', { params });
    return response.data;
  },

  createInventoryItem: async (data: any) => {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  updateInventoryItem: async (id: string, data: any) => {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },

  deleteInventoryItem: async (id: string) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },

  adjustStock: async (id: string, data: { quantity: number; reason: string; type: 'addition' | 'deduction' | 'adjustment' }) => {
    const response = await api.post(`/inventory/${id}/adjust`, data);
    return response.data;
  },
};