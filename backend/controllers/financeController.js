import FinancialEntry from '../models/FinancialEntry.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Payroll from '../models/Payroll.js';
import BankAccount from '../models/BankAccount.js';
import CashRegister from '../models/CashRegister.js';
import Payable from '../models/Payable.js';
import BankTransaction from '../models/BankTransaction.js';

// @desc    Get financial entries (expenses, income, journal)
// @route   GET /api/finance/entries
export const getFinancialEntries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.type) query.entryType = req.query.type;
    if (req.query.category) query.category = req.query.category;
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const [entries, total] = await Promise.all([
      FinancialEntry.find(query)
        .populate('createdBy', 'firstName lastName')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      FinancialEntry.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single financial entry
// @route   GET /api/finance/entries/:id
export const getFinancialEntryById = async (req, res) => {
  try {
    const entry = await FinancialEntry.findById(req.params.id).populate('createdBy', 'firstName lastName');
    if (!entry) return res.status(404).json({ success: false, message: 'Financial entry not found' });

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create financial entry (Expense, Income, Journal)
// @route   POST /api/finance/entries
export const createFinancialEntry = async (req, res) => {
  try {
    const { entryType, category, description, amount, lineItems, paymentMethod, referenceNumber, date } = req.body;

    const entry = await FinancialEntry.create({
      entryType,
      category,
      description,
      amount: amount || 0,
      lineItems: lineItems || [],
      paymentMethod,
      referenceNumber,
      date: date || new Date(),
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: entry, message: 'Financial entry created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update financial entry
// @route   PUT /api/finance/entries/:id
export const updateFinancialEntry = async (req, res) => {
  try {
    const entry = await FinancialEntry.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!entry) return res.status(404).json({ success: false, message: 'Financial entry not found' });

    res.status(200).json({ success: true, data: entry, message: 'Financial entry updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete financial entry
// @route   DELETE /api/finance/entries/:id
export const deleteFinancialEntry = async (req, res) => {
  try {
    const entry = await FinancialEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Financial entry not found' });

    res.status(200).json({ success: true, message: 'Financial entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get financial dashboard statistics
// @route   GET /api/finance/dashboard
export const getFinanceDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Monthly income from invoices
    const monthlyIncome = await Invoice.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]);

    // Monthly expenses
    const monthlyExpenses = await FinancialEntry.aggregate([
      { $match: { entryType: 'expense', date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Yearly income
    const yearlyIncome = await Invoice.aggregate([
      { $match: { createdAt: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]);

    // Yearly expenses
    const yearlyExpenses = await FinancialEntry.aggregate([
      { $match: { entryType: 'expense', date: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Outstanding payments
    const outstandingPayments = await Invoice.aggregate([
      { $match: { paymentStatus: { $ne: 'paid' } } },
      { $group: { _id: null, total: { $sum: '$outstandingBalance' } } },
    ]);

    // Payroll for current month
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const monthlyPayroll = await Payroll.aggregate([
      { $match: { month: currentMonth, year: currentYear } },
      { $group: { _id: null, total: { $sum: '$netSalary' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        monthlyIncome: monthlyIncome[0]?.total || 0,
        monthlyExpenses: monthlyExpenses[0]?.total || 0,
        monthlyNet: (monthlyIncome[0]?.total || 0) - (monthlyExpenses[0]?.total || 0) - (monthlyPayroll[0]?.total || 0),
        yearlyIncome: yearlyIncome[0]?.total || 0,
        yearlyExpenses: yearlyExpenses[0]?.total || 0,
        outstandingPayments: outstandingPayments[0]?.total || 0,
        monthlyPayroll: monthlyPayroll[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get comprehensive financial management dashboard
// @route   GET /api/finance/management-dashboard
export const getFinancialManagementDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Total Revenue (from invoices + other income)
    const invoiceRevenue = await Invoice.aggregate([
      { $match: { createdAt: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]);

    const otherIncome = await FinancialEntry.aggregate([
      { $match: { entryType: 'income', date: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalRevenue = (invoiceRevenue[0]?.total || 0) + (otherIncome[0]?.total || 0);

    // Total Expenses
    const totalExpenses = await FinancialEntry.aggregate([
      { $match: { entryType: 'expense', date: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Add payroll expenses
    const payrollExpenses = await Payroll.aggregate([
      { $match: { paymentDate: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$netSalary' } } },
    ]);

    const grandTotalExpenses = (totalExpenses[0]?.total || 0) + (payrollExpenses[0]?.total || 0);

    // Net Profit
    const netProfit = totalRevenue - grandTotalExpenses;

    // Bank Balance
    const bankAccounts = await BankAccount.find({ isActive: true });
    const totalBankBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);

    // Cash Balance
    const cashRegisters = await CashRegister.find({ isActive: true });
    const totalCashBalance = cashRegisters.reduce((sum, register) => sum + register.balance, 0);

    // Payables
    const payables = await Payable.find({ status: { $in: ['pending', 'partial', 'overdue'] } });
    const totalPayables = payables.reduce((sum, payable) => sum + payable.outstandingBalance, 0);

    // Monthly data for chart (last 6 months)
    const monthlyData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      // Monthly revenue
      const monthInvoiceRevenue = await Invoice.aggregate([
        { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]);
      
      const monthOtherIncome = await FinancialEntry.aggregate([
        { $match: { entryType: 'income', date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      
      const monthRevenue = (monthInvoiceRevenue[0]?.total || 0) + (monthOtherIncome[0]?.total || 0);
      
      // Monthly expenses
      const monthExpenses = await FinancialEntry.aggregate([
        { $match: { entryType: 'expense', date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      
      const monthPayrollExpenses = await Payroll.aggregate([
        { $match: { paymentDate: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$netSalary' } } },
      ]);
      
      const monthTotalExpenses = (monthExpenses[0]?.total || 0) + (monthPayrollExpenses[0]?.total || 0);
      
      monthlyData.push({
        month: `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear()}`,
        revenue: monthRevenue,
        expenses: monthTotalExpenses
      });
    }

    // Recent transactions
    const recentExpenses = await FinancialEntry.find({ entryType: 'expense' })
      .sort({ date: -1 })
      .limit(3);

    const recentIncome = await FinancialEntry.find({ entryType: 'income' })
      .sort({ date: -1 })
      .limit(3);

    const recentBankTransactions = await BankTransaction.find()
      .populate('bankAccount', 'bankName accountNumber')
      .sort({ createdAt: -1 })
      .limit(3);

    // Combine recent transactions
    const recentTransactions = [
      ...recentExpenses.map(t => ({ ...t.toObject(), type: 'expense' })),
      ...recentIncome.map(t => ({ ...t.toObject(), type: 'income' })),
      ...recentBankTransactions.map(t => ({ ...t.toObject(), type: 'bank' })),
    ].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses: grandTotalExpenses,
        netProfit,
        bankBalance: totalBankBalance,
        cashBalance: totalCashBalance,
        payables: totalPayables,
        recentTransactions,
        bankAccountsCount: bankAccounts.length,
        cashRegistersCount: cashRegisters.length,
        payablesCount: payables.length,
        monthlyData
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get financial report by category
// @route   GET /api/finance/report/category
export const getCategoryReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = {};
    
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const report = await FinancialEntry.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get cash flow report
// @route   GET /api/finance/report/cash-flow
export const getCashFlowReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = {};
    
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const income = await FinancialEntry.aggregate([
      { $match: { ...matchQuery, entryType: 'income' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const expenses = await FinancialEntry.aggregate([
      { $match: { ...matchQuery, entryType: 'expense' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const invoiceIncome = await Invoice.aggregate([
      { $match: { createdAt: { $gte: new Date(startDate || new Date().setMonth(new Date().getMonth() - 1)), $lte: new Date(endDate || new Date()) } } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountPaid' },
        },
      },
    ]);

    const payrollExpenses = await Payroll.aggregate([
      { $match: { paymentDate: { $gte: new Date(startDate || new Date().setMonth(new Date().getMonth() - 1)), $lte: new Date(endDate || new Date()) } } },
      {
        $group: {
          _id: null,
          total: { $sum: '$netSalary' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalIncome: (income[0]?.total || 0) + (invoiceIncome[0]?.total || 0),
        totalExpenses: (expenses[0]?.total || 0) + (payrollExpenses[0]?.total || 0),
        netCashFlow: (income[0]?.total || 0) + (invoiceIncome[0]?.total || 0) - (expenses[0]?.total || 0) - (payrollExpenses[0]?.total || 0),
        breakdown: {
          directIncome: income[0]?.total || 0,
          invoiceIncome: invoiceIncome[0]?.total || 0,
          directExpenses: expenses[0]?.total || 0,
          payrollExpenses: payrollExpenses[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bank Account Management
export const getBankAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.find({ isActive: true }).sort({ bankName: 1 });
    res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBankAccount = async (req, res) => {
  try {
    const account = await BankAccount.create(req.body);
    res.status(201).json({ success: true, data: account, message: 'Bank account created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBankAccount = async (req, res) => {
  try {
    const account = await BankAccount.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!account) return res.status(404).json({ success: false, message: 'Bank account not found' });
    res.status(200).json({ success: true, data: account, message: 'Bank account updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cash Register Management
export const getCashRegisters = async (req, res) => {
  try {
    const registers = await CashRegister.find({ isActive: true }).sort({ location: 1 });
    res.status(200).json({ success: true, data: registers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCashRegister = async (req, res) => {
  try {
    const register = await CashRegister.create(req.body);
    res.status(201).json({ success: true, data: register, message: 'Cash register created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCashRegister = async (req, res) => {
  try {
    const register = await CashRegister.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!register) return res.status(404).json({ success: false, message: 'Cash register not found' });
    res.status(200).json({ success: true, data: register, message: 'Cash register updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Payables Management
export const getPayables = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.supplier) query.supplier = req.query.supplier;

    const [payables, total] = await Promise.all([
      Payable.find(query)
        .populate('supplier', 'name contactPerson email')
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limit),
      Payable.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: payables,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPayable = async (req, res) => {
  try {
    const payable = await Payable.create(req.body);
    const populatedPayable = await Payable.findById(payable._id).populate('supplier', 'name contactPerson email');
    res.status(201).json({ success: true, data: populatedPayable, message: 'Payable created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePayable = async (req, res) => {
  try {
    const payable = await Payable.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payable) return res.status(404).json({ success: false, message: 'Payable not found' });
    const populatedPayable = await Payable.findById(payable._id).populate('supplier', 'name contactPerson email');
    res.status(200).json({ success: true, data: populatedPayable, message: 'Payable updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bank Transactions
export const getBankTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.bankAccount) query.bankAccount = req.query.bankAccount;
    if (req.query.transactionType) query.transactionType = req.query.transactionType;

    const [transactions, total] = await Promise.all([
      BankTransaction.find(query)
        .populate('bankAccount', 'bankName accountNumber')
        .populate('performedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BankTransaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBankTransaction = async (req, res) => {
  try {
    const { bankAccount, transactionType, amount, description, referenceNumber, relatedTo, relatedId } = req.body;

    const account = await BankAccount.findById(bankAccount);
    if (!account) return res.status(404).json({ success: false, message: 'Bank account not found' });

    let balanceAfter = account.balance;
    if (transactionType === 'deposit') {
      balanceAfter += amount;
    } else if (transactionType === 'withdrawal') {
      if (account.balance < amount) {
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
      }
      balanceAfter -= amount;
    }

    const transaction = await BankTransaction.create({
      bankAccount,
      transactionType,
      amount,
      balanceAfter,
      description,
      referenceNumber,
      relatedTo,
      relatedId,
      performedBy: req.user._id,
    });

    // Update account balance
    account.balance = balanceAfter;
    await account.save();

    const populatedTransaction = await BankTransaction.findById(transaction._id)
      .populate('bankAccount', 'bankName accountNumber')
      .populate('performedBy', 'firstName lastName');

    res.status(201).json({ success: true, data: populatedTransaction, message: 'Bank transaction recorded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
