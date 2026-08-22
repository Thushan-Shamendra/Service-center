import api from './axiosConfig';

export const vehicleApi = {
  getVehicles: async (params?: { page?: number; limit?: number; customer?: string; search?: string; fuelType?: string; status?: string }) => {
    // Add cache-busting timestamp to prevent 304 responses
    const cacheBuster = { _t: Date.now() };
    const response = await api.get('/vehicles', { params: { ...params, ...cacheBuster } });
    return response.data;
  },

  getVehicleById: async (id: string) => {
    const cacheBuster = { _t: Date.now() };
    const response = await api.get(`/vehicles/${id}`, { params: cacheBuster });
    return response.data;
  },

  registerVehicle: async (vehicleData: any) => {
    const response = await api.post('/vehicles', vehicleData);
    return response.data;
  },

  updateVehicle: async (id: string, vehicleData: any) => {
    const response = await api.put(`/vehicles/${id}`, vehicleData);
    return response.data;
  },

  deleteVehicle: async (id: string) => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },
};
