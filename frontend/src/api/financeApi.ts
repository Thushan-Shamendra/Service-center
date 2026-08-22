import api from './axiosConfig';

export const financeApi = {
  getEntries: async (params?: { page?: number; limit?: number; type?: string }) => {
    const response = await api.get('/finance/entries', { params });
    return response.data;
  },

  createEntry: async (data: {
    entryType: 'expense' | 'income' | 'journal' | 'bank_transaction' | 'cash_register';
    category?: string;
    description: string;
    amount?: number;
    lineItems?: Array<{ account: string; debit: number; credit: number }>;
    paymentMethod?: string;
    referenceNumber?: string;
  }) => {
    const response = await api.post('/finance/entries', data);
    return response.data;
  },

  getManagementDashboard: async () => {
    const response = await api.get('/finance/management-dashboard');
    return response.data;
  },

  getBankAccounts: async () => {
    const response = await api.get('/finance/bank-accounts');
    return response.data;
  },

  createBankAccount: async (data: {
    accountNumber: string;
    bankName: string;
    accountType?: string;
    branch?: string;
    balance?: number;
    currency?: string;
    notes?: string;
  }) => {
    const response = await api.post('/finance/bank-accounts', data);
    return response.data;
  },

  updateBankAccount: async (id: string, data: any) => {
    const response = await api.put(`/finance/bank-accounts/${id}`, data);
    return response.data;
  },

  getCashRegisters: async () => {
    const response = await api.get('/finance/cash-registers');
    return response.data;
  },

  createCashRegister: async (data: {
    location: string;
    balance?: number;
    currency?: string;
    notes?: string;
  }) => {
    const response = await api.post('/finance/cash-registers', data);
    return response.data;
  },

  updateCashRegister: async (id: string, data: any) => {
    const response = await api.put(`/finance/cash-registers/${id}`, data);
    return response.data;
  },

  createCashRegisterTransaction: async (data: {
    cashRegister: string;
    transactionType: 'cash_in' | 'cash_out';
    amount: number;
    description: string;
    cashier: string;
  }) => {
    const response = await api.post('/finance/cash-register-transactions', data);
    return response.data;
  },

  getCashRegisterTransactions: async (params?: { page?: number; limit?: number; cashRegister?: string }) => {
    const response = await api.get('/finance/cash-register-transactions', { params });
    return response.data;
  },

  getPayables: async (params?: { page?: number; limit?: number; status?: string; supplier?: string }) => {
    const response = await api.get('/finance/payables', { params });
    return response.data;
  },

  createPayable: async (data: {
    supplier: string;
    referenceNumber: string;
    referenceType?: string;
    amount: number;
    dueDate?: string;
    notes?: string;
  }) => {
    const response = await api.post('/finance/payables', data);
    return response.data;
  },

  updatePayable: async (id: string, data: any) => {
    const response = await api.put(`/finance/payables/${id}`, data);
    return response.data;
  },

  getBankTransactions: async (params?: { page?: number; limit?: number; bankAccount?: string; transactionType?: string }) => {
    const response = await api.get('/finance/bank-transactions', { params });
    return response.data;
  },

  createBankTransaction: async (data: {
    bankAccount: string;
    transactionType: 'deposit' | 'withdrawal' | 'transfer';
    amount: number;
    description: string;
    referenceNumber?: string;
    relatedTo?: string;
    relatedId?: string;
  }) => {
    const response = await api.post('/finance/bank-transactions', data);
    return response.data;
  },

  getExpenses: async (params?: { page?: number; limit?: number; category?: string; vendor?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get('/finance/expenses', { params });
    return response.data;
  },

  createExpense: async (data: {
    category: string;
    vendor?: string;
    description: string;
    amount: number;
    tax?: number;
    paymentMethod: string;
    date?: string;
    invoiceFile?: File;
    referenceNumber?: string;
  }) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    const response = await api.post('/finance/expenses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateExpense: async (id: string, data: any) => {
    const response = await api.put(`/finance/expenses/${id}`, data);
    return response.data;
  },

  deleteExpense: async (id: string) => {
    const response = await api.delete(`/finance/expenses/${id}`);
    return response.data;
  },

  getVendors: async () => {
    const response = await api.get('/finance/vendors');
    return response.data;
  },

  getCustomers: async () => {
    const response = await api.get('/customers');
    return response.data;
  },

  // Accounting API endpoints
  getChartOfAccounts: async (params?: { type?: string; status?: string; search?: string }) => {
    const response = await api.get('/accounting/chart-of-accounts', { params });
    return response.data;
  },

  createChartOfAccount: async (data: {
    code: string;
    name: string;
    type: string;
    parent?: string;
    description?: string;
  }) => {
    const response = await api.post('/accounting/chart-of-accounts', data);
    return response.data;
  },

  updateChartOfAccount: async (code: string, data: any) => {
    const response = await api.put(`/accounting/chart-of-accounts/${code}`, data);
    return response.data;
  },

  deleteChartOfAccount: async (code: string) => {
    const response = await api.delete(`/accounting/chart-of-accounts/${code}`);
    return response.data;
  },

  getJournalEntries: async (params?: { status?: string; startDate?: string; endDate?: string; search?: string }) => {
    const response = await api.get('/accounting/journal-entries', { params });
    return response.data;
  },

  createJournalEntry: async (data: {
    entryDate: string;
    narration: string;
    lineItems: Array<{
      account: string;
      accountCode: string;
      debit: number;
      credit: number;
      description?: string;
    }>;
    status?: string;
  }) => {
    const response = await api.post('/accounting/journal-entries', data);
    return response.data;
  },

  updateJournalEntry: async (entryNumber: string, data: any) => {
    const response = await api.put(`/accounting/journal-entries/${entryNumber}`, data);
    return response.data;
  },

  deleteJournalEntry: async (entryNumber: string) => {
    const response = await api.delete(`/accounting/journal-entries/${entryNumber}`);
    return response.data;
  },

  getGeneralLedger: async (params: { accountCode: string; startDate?: string; endDate?: string }) => {
    const response = await api.get('/accounting/general-ledger', { params });
    return response.data;
  },

  getTrialBalance: async (params?: { asOfDate?: string }) => {
    const response = await api.get('/accounting/trial-balance', { params });
    return response.data;
  },

  getProfitLoss: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/accounting/profit-loss', { params });
    return response.data;
  },

  getBalanceSheet: async (params?: { asOfDate?: string }) => {
    const response = await api.get('/accounting/balance-sheet', { params });
    return response.data;
  },

  // Report API methods
  getFinancialReport: async (filters: any) => {
    const response = await api.get('/reports/financial', { params: filters });
    return response.data;
  },

  getTaxReport: async (filters: any) => {
    const response = await api.get('/reports/tax', { params: filters });
    return response.data;
  },
};
