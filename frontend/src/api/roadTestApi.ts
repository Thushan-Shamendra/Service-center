import api from './axiosConfig';

export const roadTestApi = {
  // Get all road tests for current technician
  getRoadTests: (params?: { result?: string; jobCard?: string }) =>
    api.get('/road-tests', { params }),

  // Get road test by ID
  getRoadTestById: (id: string) =>
    api.get(`/road-tests/${id}`),

  // Create new road test
  createRoadTest: (data: any) =>
    api.post('/road-tests', data),

  // Update road test
  updateRoadTest: (id: string, data: any) =>
    api.put(`/road-tests/${id}`, data),

  // Get jobs ready for road test
  getJobsReadyForRoadTest: () =>
    api.get('/road-tests/ready-for-test'),

  // Upload evidence files
  uploadEvidence: (formData: FormData) =>
    api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};