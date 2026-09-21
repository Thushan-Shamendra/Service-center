import api from './axiosConfig';

// Request cancellation controller map for managing abort controllers
const abortControllers = new Map<string, AbortController>();

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Sleep function for retry delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced API wrapper with error handling, retry logic, and cancellation support
const apiWithRetry = async (
  apiCall: () => Promise<any>,
  context: string,
  retries: number = MAX_RETRIES
): Promise<any> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await apiCall();
      return response.data;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on client errors (4xx) except 429 (Too Many Requests)
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
        throw error;
      }
      
      // Don't retry on cancellation
      if (error.name === 'CanceledError' || error.message?.includes('cancel')) {
        throw error;
      }
      
      // Log retry attempt
      console.warn(`Retry attempt ${attempt + 1}/${retries} for ${context}:`, error.message);
      
      // Wait before retrying (except on last attempt)
      if (attempt < retries) {
        await sleep(RETRY_DELAY * (attempt + 1)); // Exponential backoff
      }
    }
  }
  
  // All retries failed
  throw lastError;
};

// Helper to generate request key for cancellation
const generateRequestKey = (endpoint: string, params?: any): string => {
  return `${endpoint}-${JSON.stringify(params || {})}`;
};

// Cancel previous request with same key
const cancelPreviousRequest = (key: string) => {
  const controller = abortControllers.get(key);
  if (controller) {
    controller.abort();
    abortControllers.delete(key);
  }
};

// Create new abort controller for request
const createRequestController = (key: string): AbortController => {
  cancelPreviousRequest(key);
  const controller = new AbortController();
  abortControllers.set(key, controller);
  return controller;
};

export const hrApi = {
  getAttendance: async (params?: { employee?: string; date?: string; startDate?: string; endDate?: string; status?: string }) => {
    const key = generateRequestKey('/hr/attendance', params);
    const controller = createRequestController(key);
    
    return apiWithRetry(
      () => api.get('/hr/attendance', { params, signal: controller.signal }),
      'getAttendance'
    );
  },

  recordAttendance: async (data: { employeeId: string; date?: string; status?: string; hoursWorked?: number; checkIn?: string; checkOut?: string; overtimeHours?: number }) => {
    return apiWithRetry(
      () => api.post('/hr/attendance', data),
      'recordAttendance'
    );
  },

  updateAttendance: async (id: string, data: { status?: string; checkIn?: string; checkOut?: string; hoursWorked?: number; overtimeHours?: number; remarks?: string }) => {
    return apiWithRetry(
      () => api.put(`/hr/attendance/${id}`, data),
      'updateAttendance'
    );
  },

  checkIn: async () => {
    return apiWithRetry(
      () => api.post('/hr/attendance/check-in'),
      'checkIn'
    );
  },

  checkOut: async () => {
    return apiWithRetry(
      () => api.post('/hr/attendance/check-out'),
      'checkOut'
    );
  },

  getPayroll: async (params?: { month?: number; year?: number }) => {
    const key = generateRequestKey('/hr/payroll', params);
    const controller = createRequestController(key);
    
    return apiWithRetry(
      () => api.get('/hr/payroll', { params, signal: controller.signal }),
      'getPayroll'
    );
  },

  createPayroll: async (data: { employeeId: string; month: number; year: number; allowances?: number; otherDeductions?: number; loanDeductions?: number; salaryAdvanceDeductions?: number }) => {
    return apiWithRetry(
      () => api.post('/hr/payroll', data),
      'createPayroll'
    );
  },

  updatePayroll: async (id: string, data: { allowances?: number; otherDeductions?: number; loanDeductions?: number; salaryAdvanceDeductions?: number; status?: string }) => {
    return apiWithRetry(
      () => api.put(`/hr/payroll/${id}`, data),
      'updatePayroll'
    );
  },

  processPayroll: async (month: number, year: number, includeOvertime?: boolean) => {
    return apiWithRetry(
      () => api.post('/hr/payroll/process', { month, year, includeOvertime }),
      'processPayroll'
    );
  },

  getPayrollSettings: async () => {
    return apiWithRetry(
      () => api.get('/hr/payroll/settings'),
      'getPayrollSettings'
    );
  },

  updatePayrollSettings: async (data: any) => {
    return apiWithRetry(
      () => api.put('/hr/payroll/settings', data),
      'updatePayrollSettings'
    );
  },

  calculatePayrollPreview: async (data: { month: number; year: number; includeOvertime?: boolean }) => {
    return apiWithRetry(
      () => api.post('/hr/payroll/calculate-preview', data),
      'calculatePayrollPreview'
    );
  },

  bulkCalculatePayroll: async (data: { month: number; year: number; includeOvertime?: boolean }) => {
    return apiWithRetry(
      () => api.post('/hr/payroll/bulk-calculate', data),
      'bulkCalculatePayroll'
    );
  },

  bulkProcessPayroll: async (data: { month: number; year: number }) => {
    return apiWithRetry(
      () => api.post('/hr/payroll/bulk-process', data),
      'bulkProcessPayroll'
    );
  },

  getHRStats: async () => {
    return apiWithRetry(
      () => api.get('/hr/stats'),
      'getHRStats'
    );
  },

  // Leave API functions
  getLeaveRequests: async (params?: { employee?: string; status?: string; leaveType?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    const key = generateRequestKey('/hr/leave', params);
    const controller = createRequestController(key);
    
    return apiWithRetry(
      () => api.get('/hr/leave', { params, signal: controller.signal }),
      'getLeaveRequests'
    );
  },

  getLeaveById: async (id: string) => {
    return apiWithRetry(
      () => api.get(`/hr/leave/${id}`),
      'getLeaveById'
    );
  },

  createLeaveRequest: async (data: { employeeId: string; leaveType: string; startDate: string; endDate: string; reason: string; isHalfDay?: boolean; halfDayType?: string }) => {
    return apiWithRetry(
      () => api.post('/hr/leave', data),
      'createLeaveRequest'
    );
  },

  updateLeaveStatus: async (id: string, data: { status: string; remarks?: string }) => {
    return apiWithRetry(
      () => api.put(`/hr/leave/${id}/status`, data),
      'updateLeaveStatus'
    );
  },

  getLeaveStats: async () => {
    return apiWithRetry(
      () => api.get('/hr/leave/stats'),
      'getLeaveStats'
    );
  },

  deleteLeaveRequest: async (id: string) => {
    return apiWithRetry(
      () => api.delete(`/hr/leave/${id}`),
      'deleteLeaveRequest'
    );
  },

  // Salary Advance API functions
  getSalaryAdvances: async (params?: { employee?: string; status?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    const key = generateRequestKey('/hr/salary-advances', params);
    const controller = createRequestController(key);
    
    return apiWithRetry(
      () => api.get('/hr/salary-advances', { params, signal: controller.signal }),
      'getSalaryAdvances'
    );
  },

  getSalaryAdvanceById: async (id: string) => {
    return apiWithRetry(
      () => api.get(`/hr/salary-advances/${id}`),
      'getSalaryAdvanceById'
    );
  },

  createSalaryAdvance: async (data: { employeeId: string; requestedAmount: number; reason: string }) => {
    return apiWithRetry(
      () => api.post('/hr/salary-advances', data),
      'createSalaryAdvance'
    );
  },

  updateAdvanceStatus: async (id: string, data: { status: string; rejectionReason?: string }) => {
    return apiWithRetry(
      () => api.put(`/hr/salary-advances/${id}/status`, data),
      'updateAdvanceStatus'
    );
  },

  getAdvanceStats: async () => {
    return apiWithRetry(
      () => api.get('/hr/salary-advances/stats'),
      'getAdvanceStats'
    );
  },

  deleteSalaryAdvance: async (id: string) => {
    return apiWithRetry(
      () => api.delete(`/hr/salary-advances/${id}`),
      'deleteSalaryAdvance'
    );
  },

  updateAdvanceDeduction: async (id: string, data: { deductedAmount?: number; deductionMonth?: number; deductionYear?: number; payrollStatus?: string }) => {
    return apiWithRetry(
      () => api.put(`/hr/salary-advances/${id}/deduction`, data),
      'updateAdvanceDeduction'
    );
  },

  // Loan API functions
  getLoans: async (params?: { employee?: string; status?: string; staffType?: string; page?: number; limit?: number }) => {
    const key = generateRequestKey('/hr/loans', params);
    const controller = createRequestController(key);
    
    return apiWithRetry(
      () => api.get('/hr/loans', { params, signal: controller.signal }),
      'getLoans'
    );
  },

  getLoanById: async (id: string) => {
    return apiWithRetry(
      () => api.get(`/hr/loans/${id}`),
      'getLoanById'
    );
  },

  createLoan: async (data: { employeeId: string; loanAmount: number; interestRate: number; installments: number; status?: string }) => {
    return apiWithRetry(
      () => api.post('/hr/loans', data),
      'createLoan'
    );
  },

  updateLoanStatus: async (id: string, data: { status: string; rejectionReason?: string }) => {
    return apiWithRetry(
      () => api.put(`/hr/loans/${id}/status`, data),
      'updateLoanStatus'
    );
  },

  getLoanStats: async () => {
    return apiWithRetry(
      () => api.get('/hr/loans/stats'),
      'getLoanStats'
    );
  },

  updateLoanRepayment: async (id: string, data: { amount: number; payrollMonth: number; payrollYear: number }) => {
    return apiWithRetry(
      () => api.put(`/hr/loans/${id}/repayment`, data),
      'updateLoanRepayment'
    );
  },

  deleteLoan: async (id: string) => {
    return apiWithRetry(
      () => api.delete(`/hr/loans/${id}`),
      'deleteLoan'
    );
  },

  updateLoan: async (id: string, data: { loanAmount?: number; interestRate?: number; installments?: number }) => {
    return apiWithRetry(
      () => api.put(`/hr/loans/${id}`, data),
      'updateLoan'
    );
  },

  generatePayslip: async (id: string) => {
    return apiWithRetry(
      () => api.get(`/hr/payroll/${id}/payslip`, {
        responseType: 'blob'
      }),
      'generatePayslip'
    );
  },

  downloadPayslipPDF: async (id: string) => {
    try {
      const response = await apiWithRetry(
        () => api.get(`/hr/payroll/${id}/payslip`, {
          responseType: 'blob'
        }),
        'downloadPayslipPDF'
      );
      
      // Check if we got a proper PDF response
      if (response.type === 'application/json') {
        // Error response came back as JSON
        const text = await response.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Failed to generate payslip');
      }
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response;
    } catch (error: any) {
      console.error('Download payslip error:', error);
      throw error;
    }
  },

  // Cancel all pending requests (useful for component unmount)
  cancelAllRequests: () => {
    abortControllers.forEach((controller) => controller.abort());
    abortControllers.clear();
  },

  // Cancel specific request
  cancelRequest: (key: string) => {
    cancelPreviousRequest(key);
  },
};
