import express from 'express';
import ChartOfAccounts from '../models/ChartOfAccounts.js';
import JournalEntry from '../models/JournalEntry.js';
import FinancialEntry from '../models/FinancialEntry.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('administrator', 'manager'));

// ==================== CHART OF ACCOUNTS ROUTES ====================

// Get all accounts with filtering
router.get('/chart-of-accounts', async (req, res) => {
  try {
    const { type, status, search } = req.query;
    
    let query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const accounts = await ChartOfAccounts.find(query).sort({ code: 1 });
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single account by code
router.get('/chart-of-accounts/:code', async (req, res) => {
  try {
    const account = await ChartOfAccounts.findOne({ code: req.params.code });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new account
router.post('/chart-of-accounts', async (req, res) => {
  try {
    const account = new ChartOfAccounts(req.body);
    await account.save();
    res.status(201).json({ success: true, data: account });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update account
router.put('/chart-of-accounts/:code', async (req, res) => {
  try {
    const account = await ChartOfAccounts.findOneAndUpdate(
      { code: req.params.code },
      req.body,
      { new: true, runValidators: true }
    );
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete account
router.delete('/chart-of-accounts/:code', async (req, res) => {
  try {
    const account = await ChartOfAccounts.findOneAndDelete({ code: req.params.code });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== JOURNAL ENTRIES ROUTES ====================

// Get all journal entries
router.get('/journal-entries', async (req, res) => {
  try {
    const { status, startDate, endDate, search } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.entryDate = {};
      if (startDate) query.entryDate.$gte = new Date(startDate);
      if (endDate) query.entryDate.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { entryNumber: { $regex: search, $options: 'i' } },
        { narration: { $regex: search, $options: 'i' } }
      ];
    }

    const entries = await JournalEntry.find(query)
      .sort({ entryDate: -1, createdAt: -1 })
      .populate('createdBy', 'name email');
    
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single journal entry
router.get('/journal-entries/:entryNumber', async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({ entryNumber: req.params.entryNumber })
      .populate('createdBy', 'name email');
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new journal entry
router.post('/journal-entries', async (req, res) => {
  try {
    const entry = new JournalEntry(req.body);
    await entry.save();
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update journal entry
router.put('/journal-entries/:entryNumber', async (req, res) => {
  try {
    const entry = await JournalEntry.findOneAndUpdate(
      { entryNumber: req.params.entryNumber },
      req.body,
      { new: true, runValidators: true }
    );
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete journal entry
router.delete('/journal-entries/:entryNumber', async (req, res) => {
  try {
    const entry = await JournalEntry.findOneAndDelete({ entryNumber: req.params.entryNumber });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }
    res.json({ success: true, message: 'Journal entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== GENERAL LEDGER ROUTES ====================

// Get general ledger for specific account
router.get('/general-ledger', async (req, res) => {
  try {
    const { accountCode, startDate, endDate } = req.query;
    
    if (!accountCode) {
      return res.status(400).json({ success: false, message: 'Account code is required' });
    }

    // Get journal entries for this account
    let query = {
      'lineItems.accountCode': accountCode,
      status: 'Posted'
    };
    
    if (startDate || endDate) {
      query.entryDate = {};
      if (startDate) query.entryDate.$gte = new Date(startDate);
      if (endDate) query.entryDate.$lte = new Date(endDate);
    }

    const journalEntries = await JournalEntry.find(query)
      .sort({ entryDate: 1 });

    // Get financial entries for this account
    let financeQuery = { category: accountCode };
    if (startDate || endDate) {
      financeQuery.date = {};
      if (startDate) financeQuery.date.$gte = new Date(startDate);
      if (endDate) financeQuery.date.$lte = new Date(endDate);
    }

    const financialEntries = await FinancialEntry.find(financeQuery)
      .sort({ date: 1 });

    // Combine and calculate running balance
    const allTransactions = [];
    let runningBalance = 0;

    // Process journal entries
    for (const entry of journalEntries) {
      const lineItem = entry.lineItems.find(item => item.accountCode === accountCode);
      if (lineItem) {
        const debit = lineItem.debit || 0;
        const credit = lineItem.credit || 0;
        
        // Determine balance impact based on account type
        const account = await ChartOfAccounts.findOne({ code: accountCode });
        const isAssetOrExpense = account && (account.type === 'Asset' || account.type === 'Expense');
        
        if (isAssetOrExpense) {
          runningBalance += debit - credit;
        } else {
          runningBalance += credit - debit;
        }

        allTransactions.push({
          date: entry.entryDate,
          reference: entry.entryNumber,
          description: entry.narration,
          debit,
          credit,
          balance: runningBalance
        });
      }
    }

    // Process financial entries
    financialEntries.forEach(entry => {
      const amount = entry.amount || 0;
      const isExpense = entry.entryType === 'expense';
      
      if (isExpense) {
        runningBalance -= amount;
      } else {
        runningBalance += amount;
      }

      allTransactions.push({
        date: entry.date,
        reference: entry.voucherNumber,
        description: entry.description,
        debit: isExpense ? amount : 0,
        credit: !isExpense ? amount : 0,
        balance: runningBalance
      });
    });

    // Sort by date
    allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ success: true, data: allTransactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== TRIAL BALANCE ROUTES ====================

// Get trial balance as of specific date
router.get('/trial-balance', async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const dateFilter = asOfDate ? new Date(asOfDate) : new Date();

    // Get all active accounts
    const accounts = await ChartOfAccounts.find({ status: 'Active' });
    
    const trialBalance = [];

    for (const account of accounts) {
      // Calculate balance from journal entries
      const journalQuery = {
        'lineItems.accountCode': account.code,
        status: 'Posted',
        entryDate: { $lte: dateFilter }
      };

      const journalEntries = await JournalEntry.find(journalQuery);
      
      let debitTotal = 0;
      let creditTotal = 0;

      journalEntries.forEach(entry => {
        const lineItem = entry.lineItems.find(item => item.accountCode === account.code);
        if (lineItem) {
          debitTotal += lineItem.debit || 0;
          creditTotal += lineItem.credit || 0;
        }
      });

      // Calculate net balance
      let netBalance = 0;
      if (account.type === 'Asset' || account.type === 'Expense') {
        netBalance = debitTotal - creditTotal;
      } else {
        netBalance = creditTotal - debitTotal;
      }

      if (netBalance !== 0) {
        trialBalance.push({
          account: account.name,
          code: account.code,
          type: account.type,
          debit: (account.type === 'Asset' || account.type === 'Expense') && netBalance > 0 ? netBalance : 0,
          credit: (account.type !== 'Asset' && account.type !== 'Expense') && netBalance > 0 ? netBalance : 0
        });
      }
    }

    const totalDebit = trialBalance.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = trialBalance.reduce((sum, item) => sum + item.credit, 0);

    res.json({ 
      success: true, 
      data: trialBalance,
      summary: {
        totalDebit,
        totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== PROFIT & LOSS ROUTES ====================

// Get profit & loss statement for period
router.get('/profit-loss', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Get revenue and expense accounts
    const revenueAccounts = await ChartOfAccounts.find({ type: 'Income', status: 'Active' });
    const expenseAccounts = await ChartOfAccounts.find({ type: 'Expense', status: 'Active' });

    const revenue = [];
    const expenses = [];

    // Calculate revenue
    for (const account of revenueAccounts) {
      const journalQuery = {
        'lineItems.accountCode': account.code,
        status: 'Posted',
        entryDate: { $gte: start, $lte: end }
      };

      const journalEntries = await JournalEntry.find(journalQuery);
      let creditTotal = 0;
      let debitTotal = 0;

      journalEntries.forEach(entry => {
        const lineItem = entry.lineItems.find(item => item.accountCode === account.code);
        if (lineItem) {
          creditTotal += lineItem.credit || 0;
          debitTotal += lineItem.debit || 0;
        }
      });

      const netRevenue = creditTotal - debitTotal;
      if (netRevenue > 0) {
        revenue.push({
          account: account.name,
          amount: netRevenue
        });
      }
    }

    // Calculate expenses
    for (const account of expenseAccounts) {
      const journalQuery = {
        'lineItems.accountCode': account.code,
        status: 'Posted',
        entryDate: { $gte: start, $lte: end }
      };

      const journalEntries = await JournalEntry.find(journalQuery);
      let debitTotal = 0;
      let creditTotal = 0;

      journalEntries.forEach(entry => {
        const lineItem = entry.lineItems.find(item => item.accountCode === account.code);
        if (lineItem) {
          debitTotal += lineItem.debit || 0;
          creditTotal += lineItem.credit || 0;
        }
      });

      const netExpense = debitTotal - creditTotal;
      if (netExpense > 0) {
        expenses.push({
          account: account.name,
          amount: netExpense
        });
      }
    }

    const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    res.json({ 
      success: true, 
      data: {
        revenue,
        expenses,
        totalRevenue,
        totalExpenses,
        netProfit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== BALANCE SHEET ROUTES ====================

// Get balance sheet as of specific date
router.get('/balance-sheet', async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const dateFilter = asOfDate ? new Date(asOfDate) : new Date();

    // Get all accounts
    const accounts = await ChartOfAccounts.find({ status: 'Active' });
    
    const assets = [];
    const liabilities = [];
    const equity = [];

    for (const account of accounts) {
      // Calculate balance from journal entries
      const journalQuery = {
        'lineItems.accountCode': account.code,
        status: 'Posted',
        entryDate: { $lte: dateFilter }
      };

      const journalEntries = await JournalEntry.find(journalQuery);
      
      let debitTotal = 0;
      let creditTotal = 0;

      journalEntries.forEach(entry => {
        const lineItem = entry.lineItems.find(item => item.accountCode === account.code);
        if (lineItem) {
          debitTotal += lineItem.debit || 0;
          creditTotal += lineItem.credit || 0;
        }
      });

      // Calculate net balance
      let netBalance = 0;
      if (account.type === 'Asset' || account.type === 'Expense') {
        netBalance = debitTotal - creditTotal;
      } else {
        netBalance = creditTotal - debitTotal;
      }

      if (netBalance !== 0) {
        const accountData = {
          account: account.name,
          amount: Math.abs(netBalance)
        };

        if (account.type === 'Asset') {
          assets.push(accountData);
        } else if (account.type === 'Liability') {
          liabilities.push(accountData);
        } else if (account.type === 'Equity') {
          equity.push(accountData);
        }
      }
    }

    // Add retained earnings (net profit from income statement)
    // This would typically be calculated from profit/loss over time
    equity.push({
      account: 'Retained Earnings',
      amount: 0 // This should be calculated from historical P&L
    });

    const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
    const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0);

    res.json({ 
      success: true, 
      data: {
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilities,
        totalEquity,
        isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;