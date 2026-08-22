import api from './axiosConfig';

export const purchaseOrderApi = {
  getPurchaseOrders: async (params?: any) => {
    const response = await api.get('/purchase-orders', { params });
    return response.data;
  },

  getPurchaseOrderById: async (id: string) => {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data;
  },

  createPurchaseOrder: async (data: any) => {
    const response = await api.post('/purchase-orders', data);
    return response.data;
  },

  updatePurchaseOrder: async (id: string, data: any) => {
    const response = await api.put(`/purchase-orders/${id}`, data);
    return response.data;
  },

  cancelPurchaseOrder: async (id: string, cancellationReason: string) => {
    const response = await api.patch(`/purchase-orders/${id}/cancel`, { cancellationReason });
    return response.data;
  },

  approvePurchaseOrder: async (id: string) => {
    const response = await api.patch(`/purchase-orders/${id}/approve`);
    return response.data;
  },

  deletePurchaseOrder: async (id: string) => {
    const response = await api.delete(`/purchase-orders/${id}`);
    return response.data;
  },

  receiveGoods: async (id: string, items: any[]) => {
    const response = await api.patch(`/purchase-orders/${id}/receive`, { items });
    return response.data;
  },

  getPurchaseOrderSummary: async () => {
    const response = await api.get('/purchase-orders/summary');
    return response.data;
  },
};