import api from './axiosConfig';

export const leaveRequestApi = {
  // Get leave balance for current employee
  getLeaveBalance: () =>
    api.get('/leave-requests/balance'),

  // Get all leave requests for current employee
  getMyLeaveRequests: (params?: { status?: string; year?: string }) =>
    api.get('/leave-requests/my-requests', { params }),

  // Get leave request by ID
  getLeaveRequestById: (id: string) =>
    api.get(`/leave-requests/${id}`),

  // Create new leave request
  createLeaveRequest: (data: { leaveType: string; fromDate: string; toDate: string; reason: string; isHalfDay?: boolean; halfDayType?: string; attachments?: Array<{ type: string; url: string; name: string }> }) =>
    api.post('/leave-requests', data),

  // Update leave request
  updateLeaveRequest: (id: string, data: any) =>
    api.put(`/leave-requests/${id}`, data),

  // Cancel leave request
  cancelLeaveRequest: (id: string) =>
    api.delete(`/leave-requests/${id}`),

  // Manager/Admin: Get all leave requests
  getAllLeaveRequests: (params?: { status?: string; department?: string; year?: string }) =>
    api.get('/leave-requests/all', { params }),

  // Manager/Admin: Approve leave request
  approveLeaveRequest: (id: string, data: { adminRemarks?: string }) =>
    api.put(`/leave-requests/${id}/approve`, data),

  // Manager/Admin: Reject leave request
  rejectLeaveRequest: (id: string, data: { adminRemarks?: string }) =>
    api.put(`/leave-requests/${id}/reject`, data),
};
