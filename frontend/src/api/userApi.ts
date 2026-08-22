import api from './axiosConfig';

export const userApi = {
  getUsers: async (params?: { page?: number; limit?: number; role?: string; search?: string; status?: string }) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getNextUserId: async (role: string) => {
    const response = await api.get('/users/next-id', { params: { role } });
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: any) => {
    const response = await api.post('/users', userData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  toggleUserStatus: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}/delete`);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const isFormData = data instanceof FormData;
    const response = await api.put('/users/profile', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.put('/users/change-password', data);
    return response.data;
  },
};
