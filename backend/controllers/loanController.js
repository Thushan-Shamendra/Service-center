import Loan from '../models/Loan.js';
import Employee from '../models/Employee.js';
import Counter from '../models/Counter.js';

// @desc    Get all loans
// @route   GET /api/hr/loans
export const getLoans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // If user is an employee, only return their own loans
    if (req.user.role === 'employee') {
      const currentEmployee = await Employee.findOne({ user: req.user._id });
      if (!currentEmployee) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { page: 1, limit, total: 0, pages: 0 },
        });
      }
      query.employee = currentEmployee._id;
    } else {
      if (req.query.employee) query.employee = req.query.employee;
      if (req.query.staffType) {
        const employee = await Employee.findOne({ 
          $or: [
            { employeeId: req.query.staffType },
            { managerId: req.query.staffType }
          ]
        });
        if (employee) query.employee = employee._id;
      }
    }

    if (req.query.status) query.status = req.query.status;

    const [loans, total] = await Promise.all([
      Loan.find(query)
        .populate({ 
          path: 'employee', 
          populate: { path: 'user', select: 'firstName lastName email mobile' } 
        })
        .populate('approvedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Loan.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: loans,
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

// @desc    Get single loan
// @route   GET /api/hr/loans/:id
export const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate({ 
        path: 'employee', 
        populate: { path: 'user', select: 'firstName lastName email mobile' } 
      })
      .populate('approvedBy', 'firstName lastName');

    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

    res.status(200).json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new loan
// @route   POST /api/hr/loans
export const createLoan = async (req, res) => {
  try {
    const { 
      employeeId, 
      loanAmount, 
      interestRate, 
      installments,
      status 
    } = req.body;

    let targetEmployeeId = employeeId;

    // If user is an employee, auto-detect their own employee profile
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      if (!emp) {
        return res.status(404).json({ success: false, message: 'Employee profile not found' });
      }
      targetEmployeeId = emp._id;

      // Check if employee already has a pending loan request
      const existingPending = await Loan.findOne({
        employee: emp._id,
        status: 'pending',
      });
      if (existingPending) {
        return res.status(400).json({
          success: false,
          message: `You already have a loan application (${existingPending.loanId}) pending approval.`,
        });
      }
    }

    // Validate employee ID
    if (!targetEmployeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    // Validate employee
    const employee = await Employee.findById(targetEmployeeId).populate('user');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const currentSalary = employee.basicSalary || 50000;
    const staffId = employee.employeeId || employee.managerId || 'EMP';

    // Check for existing active loans
    const existingActiveLoan = await Loan.findOne({
      employee: targetEmployeeId,
      status: { $in: ['active', 'approved'] }
    });

    if (existingActiveLoan) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee already has an active loan',
        existingLoan: existingActiveLoan.loanId,
        outstandingBalance: existingActiveLoan.outstandingBalance
      });
    }

    const parsedLoanAmount = Number(loanAmount);
    const parsedInstallments = parseInt(installments);
    // Standard interest rate: 10%
    const rate = req.user.role === 'employee' ? 10 : (interestRate !== undefined && interestRate !== null ? Number(interestRate) : 10);

    // Validate inputs
    if (!parsedLoanAmount || parsedLoanAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Loan amount must be greater than 0' });
    }

    if (rate < 0) {
      return res.status(400).json({ success: false, message: 'Interest rate cannot be negative' });
    }

    if (!parsedInstallments || parsedInstallments <= 0) {
      return res.status(400).json({ success: false, message: 'Installments must be greater than 0' });
    }

    const interestAmount = Math.round(parsedLoanAmount * (rate / 100));
    const totalRepayable = parsedLoanAmount + interestAmount;
    const monthlyDeduction = Math.round(totalRepayable / parsedInstallments);

    // Generate loan ID using atomic counter
    const loanCount = await Counter.increment('loan');
    const loanId = `LN-${String(loanCount).padStart(5, '0')}`;

    const loanStatus = req.user.role === 'employee' ? 'pending' : (status || 'pending');

    const loan = await Loan.create({
      loanId,
      employee: targetEmployeeId,
      staffId,
      currentSalary,
      loanAmount: parsedLoanAmount,
      interestRate: rate,
      interestAmount,
      totalRepayable,
      installments: parsedInstallments,
      monthlyDeduction,
      paidAmount: 0,
      outstandingBalance: totalRepayable,
      status: loanStatus,
    });

    const populatedLoan = await Loan.findById(loan._id)
      .populate({ 
        path: 'employee', 
        populate: { path: 'user', select: 'firstName lastName email' } 
      });

    res.status(201).json({ success: true, data: populatedLoan, message: 'Loan application submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Update loan status
// @route   PUT /api/hr/loans/:id/status
export const updateLoanStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const loan = await Loan.findById(req.params.id);

    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

    if (loan.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot modify completed loan' });
    }

    loan.status = status;
    loan.approvedBy = req.user._id;
    loan.approvedDate = new Date();
    
    if (status === 'rejected') {
      loan.rejectionReason = rejectionReason;
    } else if (status === 'approved') {
      loan.status = 'active';
    }
    
    await loan.save();

    const populatedLoan = await Loan.findById(loan._id)
      .populate({ 
        path: 'employee', 
        populate: { path: 'user', select: 'firstName lastName' } 
      })
      .populate('approvedBy', 'firstName lastName');

    res.status(200).json({ 
      success: true, 
      data: populatedLoan, 
      message: `Loan ${status} successfully` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get loan statistics
// @route   GET /api/hr/loans/stats
export const getLoanStats = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (employee) {
        filter.employee = employee._id;
      }
    }

    const activeLoans = await Loan.countDocuments({ ...filter, status: 'active' });
    const pendingLoans = await Loan.countDocuments({ ...filter, status: 'pending' });
    const completedLoans = await Loan.countDocuments({ ...filter, status: 'completed' });
    
    const matchFilter = { status: 'active' };
    if (filter.employee) {
      matchFilter.employee = filter.employee;
    }

    const outstandingResult = await Loan.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, total: { $sum: '$outstandingBalance' } } }
    ]);
    const totalOutstanding = outstandingResult[0]?.total || 0;

    // Calculate this month's repayments
    const monthlyRepayments = await Loan.aggregate([
      { $match: matchFilter },
      { $project: { monthlyDeduction: 1 } },
      { $group: { _id: null, total: { $sum: '$monthlyDeduction' } } }
    ]);
    const monthlyTotal = monthlyRepayments[0]?.total || 0;

    const stats = {
      activeLoans,
      totalOutstanding,
      pendingLoans,
      completedLoans,
      monthlyRepayments: monthlyTotal,
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update loan repayment
// @route   PUT /api/hr/loans/:id/repayment
export const updateLoanRepayment = async (req, res) => {
  try {
    const { amount, payrollMonth, payrollYear } = req.body;
    const loan = await Loan.findById(req.params.id);

    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

    if (loan.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Can only make repayments on active loans' });
    }

    if (amount > loan.outstandingBalance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Deduction exceeds outstanding balance',
        outstandingBalance: loan.outstandingBalance,
        requestedAmount: amount
      });
    }

    // Calculate final deduction if amount exceeds outstanding
    const actualDeduction = Math.min(amount, loan.outstandingBalance);
    const newOutstanding = loan.outstandingBalance - actualDeduction;
    const newPaidAmount = loan.paidAmount + actualDeduction;

    // Determine installment number
    const lastInstallment = loan.repaymentHistory.length > 0 
      ? Math.max(...loan.repaymentHistory.map(r => r.installmentNumber))
      : 0;
    const installmentNumber = lastInstallment + 1;

    // Add repayment history
    loan.repaymentHistory.push({
      installmentNumber,
      payrollMonth,
      payrollYear,
      amount: actualDeduction,
      paymentDate: new Date(),
      balanceAfterPayment: newOutstanding,
      status: 'paid',
    });

    loan.paidAmount = newPaidAmount;
    loan.outstandingBalance = newOutstanding;

    // Check if loan is completed
    if (newOutstanding === 0) {
      loan.status = 'completed';
      loan.completedDate = new Date();
    }

    await loan.save();

    const populatedLoan = await Loan.findById(loan._id)
      .populate({ 
        path: 'employee', 
        populate: { path: 'user', select: 'firstName lastName' } 
      });

    res.status(200).json({ 
      success: true, 
      data: populatedLoan, 
      message: 'Loan repayment recorded successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete loan
// @route   DELETE /api/hr/loans/:id
export const deleteLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

    if (loan.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only delete pending loans' });
    }

    await loan.deleteOne();

    res.status(200).json({ success: true, message: 'Loan deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update loan details
// @route   PUT /api/hr/loans/:id
export const updateLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

    if (loan.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only edit pending loans. Active loans require adjustment process.' 
      });
    }

    const { loanAmount, interestRate, installments } = req.body;

    if (loanAmount !== undefined) loan.loanAmount = loanAmount;
    if (interestRate !== undefined) loan.interestRate = interestRate;
    if (installments !== undefined) loan.installments = installments;

    // Recalculate values
    loan.interestAmount = Math.round(loan.loanAmount * (loan.interestRate / 100));
    loan.totalRepayable = loan.loanAmount + loan.interestAmount;
    loan.monthlyDeduction = Math.round(loan.totalRepayable / loan.installments);
    loan.outstandingBalance = loan.totalRepayable;

    await loan.save();

    const populatedLoan = await Loan.findById(loan._id)
      .populate({ 
        path: 'employee', 
        populate: { path: 'user', select: 'firstName lastName' } 
      });

    res.status(200).json({ success: true, data: populatedLoan, message: 'Loan updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
