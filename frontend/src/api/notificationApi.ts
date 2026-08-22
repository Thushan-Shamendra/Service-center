import api from './axiosConfig';

export const notificationApi = {
  getNotifications: async (params?: { page?: number; limit?: number; type?: string; channel?: string; status?: string; search?: string; unread?: boolean }) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  getNotificationById: async (id: string) => {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },

  sendNotification: async (data: {
    type: 'appointment_confirmation' | 'appointment_cancellation' | 'appointment_reminder' | 'vehicle_ready' | 'invoice_ready' | 'payment_reminder';
    customerId: string;
    channels: ('email' | 'sms')[];
    subject?: string;
    message: string;
    appointmentId?: string;
    jobCardId?: string;
    invoiceId?: string;
    reminderDays?: number;
  }) => {
    const response = await api.post('/notifications/send', data);
    return response.data;
  },

  getNotificationStats: async () => {
    const response = await api.get('/notifications/stats');
    return response.data;
  },

  searchCustomers: async (query: string) => {
    const response = await api.get('/customers/search', { params: { query } });
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
};