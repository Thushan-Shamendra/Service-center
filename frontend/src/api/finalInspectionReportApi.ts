import api from './axiosConfig';

export const finalInspectionReportApi = {
  uploadEvidence: async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    const response = await api.post('/final-inspection-reports/evidence', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getFinalInspectionReports: async (params?: any) => {
    const response = await api.get('/final-inspection-reports', { params });
    return response.data;
  },

  getFinalInspectionReportById: async (id: string) => {
    const response = await api.get(`/final-inspection-reports/${id}`);
    return response.data;
  },

  getReportDataForJobCard: async (jobCardId: string) => {
    const response = await api.get(`/final-inspection-reports/job-card/${jobCardId}`);
    return response.data;
  },

  createFinalInspectionReport: async (reportData: any) => {
    const response = await api.post('/final-inspection-reports', reportData);
    return response.data;
  },

  updateFinalInspectionReport: async (id: string, reportData: any) => {
    const response = await api.put(`/final-inspection-reports/${id}`, reportData);
    return response.data;
  },
};
