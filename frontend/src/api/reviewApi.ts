import api from './axiosConfig';

export const reviewApi = {
  getReviews: async (params?: { customer?: string; jobCard?: string; status?: string; limit?: number }) => {
    const response = await api.get('/reviews', { params });
    return response.data;
  },

  getReviewById: async (id: string) => {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  },

  createReview: async (data: {
    jobCard: string;
    vehicle: string;
    serviceQuality: number;
    mechanicPerformance: number;
    overallExperience: number;
    comments?: string;
  }) => {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  updateReview: async (id: string, data: {
    serviceQuality?: number;
    mechanicPerformance?: number;
    overallExperience?: number;
    comments?: string;
  }) => {
    const response = await api.put(`/reviews/${id}`, data);
    return response.data;
  },

  deleteReview: async (id: string) => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },

  getCustomerReviews: async (customerId: string) => {
    const response = await api.get(`/reviews/customer/${customerId}`);
    return response.data;
  },
};
