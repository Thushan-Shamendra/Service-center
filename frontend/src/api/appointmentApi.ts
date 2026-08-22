import axios from './axiosConfig';

export const appointmentApi = {
  getAppointments: async (params?: any) => {
    const response = await axios.get('/appointments', { params });
    return response.data;
  },

  getAppointmentById: async (id: string) => {
    const response = await axios.get(`/appointments/${id}`);
    return response.data;
  },

  createAppointment: async (data: any) => {
    const response = await axios.post('/appointments', data);
    return response.data;
  },

  updateAppointment: async (id: string, data: any) => {
    const response = await axios.put(`/appointments/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, data: any) => {
    const response = await axios.put(`/appointments/${id}/status`, data);
    return response.data;
  },

  deleteAppointment: async (id: string) => {
    const response = await axios.delete(`/appointments/${id}`);
    return response.data;
  },

  getAvailableTimeSlots: async (date: string) => {
    const response = await axios.get('/appointments/available-slots', { params: { date } });
    return response.data;
  },

  getAvailableTechnicians: async (date?: string, time?: string) => {
    const params: any = {};
    if (date) params.date = date;
    if (time) params.time = time;
    const response = await axios.get('/appointments/available-technicians', { params });
    return response.data;
  },
};
