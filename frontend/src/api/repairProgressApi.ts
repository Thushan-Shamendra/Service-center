import axios from './axiosConfig';

export const repairProgressApi = {
  // Get complete repair progress data
  getRepairProgress: async (jobCardId: string) => {
    const response = await axios.get(`/repair-progress/${jobCardId}`);
    return response.data;
  },

  // Update repair status
  updateRepairStatus: async (jobCardId: string, data: {
    status: string;
    remarks?: string;
    progress?: number;
    additionalData?: any;
  }) => {
    const response = await axios.put(`/repair-progress/${jobCardId}/status`, data);
    return response.data;
  },

  // Add inspection data
  addInspectionData: async (jobCardId: string, data: {
    notes?: string;
    problemsFound?: string[];
    evidence?: any[];
  }) => {
    const response = await axios.post(`/repair-progress/${jobCardId}/inspection`, data);
    return response.data;
  },

  // Add work performed
  addWorkPerformed: async (jobCardId: string, data: {
    workItems?: string[];
    progress?: number;
  }) => {
    const response = await axios.post(`/repair-progress/${jobCardId}/work-performed`, data);
    return response.data;
  },

  // Request spare parts
  requestParts: async (jobCardId: string, parts: Array<{
    item: string;
    itemName: string;
    requestedQuantity: number;
    currentStock?: number;
    reason: string;
    priority?: string;
  }>) => {
    const response = await axios.post(`/repair-progress/${jobCardId}/parts-request`, { parts });
    return response.data;
  },

  // Update progress percentage
  updateProgress: async (jobCardId: string, progress: number) => {
    const response = await axios.put(`/repair-progress/${jobCardId}/progress`, { progress });
    return response.data;
  },

  // Get status-specific UI data
  getStatusSpecificData: async (jobCardId: string) => {
    const response = await axios.get(`/repair-progress/${jobCardId}/status-data`);
    return response.data;
  }
};