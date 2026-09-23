import SalaryAdvance from '../models/SalaryAdvance.js';
import Employee from '../models/Employee.js';
import PayrollSettings from '../models/PayrollSettings.js';
import Counter from '../models/Counter.js';

// @desc    Get all salary advance requests
// @route   GET /api/hr/salary-advances
export const getSalaryAdvances = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // If user is an employee or requesting own records, only return their own salary advances
    if (req.user.role === 'employee' || req.query.self === 'true' || req.query.self === true) {
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
    }

    if (req.query.status) query.status = req.query.status;
    if (req.query.startDate && req.query.endDate) {
      query.requestedDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const [advances, total] = await Promise.all([
      SalaryAdvance.find(query)
        .populate({ 
          path: 'employee', 
          populate: { path: 'user', select: 'firstName lastName email mobile' } 
        })
        .populate('approvedBy', 'firstName lastName')
        .sort({ requestedDate: -1 })
        .skip(skip)
        .limit(limit),
      SalaryAdvance.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: advances,
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

// @desc    Get single salary advance request
// @route   GET /api/hr/salary-advances/:id
export const getSalaryAdvanceById = async (req, res) => {
  try {
    const advance = await SalaryAdvance.findById(req.params.id)
      .populate({ 
        path: 'employee', 
        populate: { path: 'user', select: 'firstName lastName email mobile' } 
      })
      .populate('approvedBy', 'firstName lastName');

    if (!advance) return res.status(404).json({ success: false, message: 'Salary advance request not found' });

    res.status(200).json({ success: true, data: advance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new salary advance request
// @route   POST /api/hr/salary-advances
export const createSalaryAdvance = async (req, res) => {
  try {
    const { employeeId, requestedAmount, reason } = req.body;

    let targetEmployeeId = employeeId;

    // If user is an employee or self-application (no employeeId provided), auto-detect their own employee profile
    if (req.user.role === 'employee' || !employeeId) {
      const emp = await Employee.findOne({ user: req.user._id });
      if (!emp) {
        return res.status(404).json({ success: false, message: 'Employee profile not found' });
      }
      targetEmployeeId = emp._id;

      // Check for existing pending request
      const existingPending = await SalaryAdvance.findOne({
        employee: emp._id,
        status: 'pending',
      });
      if (existingPending) {
        return res.status(400).json({
          success: false,
          message: `You already have a pending salary advance request (${existingPending.advanceId}) under review.`,
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

    // Get payroll settings for validation
    const settings = await PayrollSettings.findOne({ active: true }) || {};
    const maxAdvancePercentage = settings.maxAdvancePercentage || 30;
    const maxAdvanceAmount = settings.maxAdvanceAmount || 50000;

    // Calculate maximum allowed advance
    const maxByPercentage = (currentSalary * maxAdvancePercentage) / 100;
    const maxAllowed = Math.min(maxByPercentage, maxAdvanceAmount);

    // Validate requested amount
    if (requestedAmount > maxAllowed) {
      return res.status(400).json({ 
        success: false, 
        message: `Requested amount exceeds the permitted salary advance limit of LKR ${maxAllowed.toLocaleString()}`,
        maxAllowed
      });
    }

    if (requestedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Requested amount must be greater than 0' });
    }

    // Validate reason
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    // Generate advance ID using atomic counter
    const advanceCount = await Counter.increment('salaryAdvance');
    const advanceId = `ADV-${String(advanceCount).padStart(5, '0')}`;
    
    const advance = await SalaryAdvance.create({
      advanceId,
      employee: targetEmployeeId,
      currentSalary,
      requestedAmount,
      reason,
      status: 'pending',
      requestedDate: new Date(),
    });

    const populatedAdvance = await SalaryAdvance.findById(advance._id)
      .populate({ 
        path: 'employee', 
        populate: { path: 'user', select: 'firstName lastName email' } 
      });

    res.status(201).json({ success: true, data: populatedAdvance, message: 'Salary advance request submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Update salary advance status (approve/reject)
// @route   PUT /api/hr/salary-advances/:id/status
export const updateAdvanceStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const advance = await SalaryAdvance.findById(req.params.id);

    if (!advance) return res.status(404).json({ success: false, message: 'Salary advance request not found' });

    if (advance.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Salary advance request already processed' });
    }

    advance.status = status;
    advance.approvedBy = req.user._id;
    advance.approvedDate = new Date();
    
    if (status === 'rejected') {
      advance.rejectionReason = rejectionReason;
      advance.payrollStatus = 'pending_deduction';
    } else if (status === 'approved') {
      advance.remainingAmount = advance.requestedAmount;
      advance.payrollStatus = 'pending_deduction';
    }
    
    await advance.save();

    const populatedAdvance = await SalaryAdvance.findById(advance._id)
      .populate({ 
        path: 'employee', 
        populate: { path: 'user', select: 'firstName lastName' } 
      })
      .populate('approvedBy', 'firstName lastName');

    res.status(200).json({ 
      success: true, 
      data: populatedAdvance, 
      message: `Salary advance request ${status}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get salary advance statistics
// @route   GET /api/hr/salary-advances/stats
export const getAdvanceStats = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'employee' || req.query.self === 'true' || req.query.self === true) {
      const employee = await Employee.findOne({ user: req.user._id });
      if (employee) {
        filter.employee = employee._id;
      }
    }

    const total = await SalaryAdvance.countDocuments(filter);
    const pending = await SalaryAdvance.countDocuments({ ...filter, status: 'pending' });
    const approved = await SalaryAdvance.countDocuments({ ...filter, status: 'approved' });
    const rejected = await SalaryAdvance.countDocuments({ ...filter, status: 'rejected' });

    const stats = {
      total,
      pending,
      approved,
      rejected,
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete salary advance request
// @route   DELETE /api/hr/salary-advances/:id
export const deleteSalaryAdvance = async (req, res) => {
  try {
    const advance = await SalaryAdvance.findById(req.params.id);

    if (!advance) return res.status(404).json({ success: false, message: 'Salary advance request not found' });

    if (advance.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only delete pending salary advance requests' });
    }

    await advance.deleteOne();

    res.status(200).json({ success: true, message: 'Salary advance request deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update payroll deduction status for advance
// @route   PUT /api/hr/salary-advances/:id/deduction
export const updateAdvanceDeduction = async (req, res) => {
  try {
    const { deductedAmount, deductionMonth, deductionYear, payrollStatus } = req.body;
    const advance = await SalaryAdvance.findById(req.params.id);

    if (!advance) return res.status(404).json({ success: false, message: 'Salary advance request not found' });

    if (advance.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Can only deduct from approved salary advances' });
    }

    advance.deductedAmount = deductedAmount || advance.deductedAmount;
    advance.remainingAmount = advance.requestedAmount - advance.deductedAmount;
    advance.deductionMonth = deductionMonth;
    advance.deductionYear = deductionYear;
    if (payrollStatus) advance.payrollStatus = payrollStatus;
    
    await advance.save();

    const populatedAdvance = await SalaryAdvance.findById(advance._id)
      .populate({ 
        path: 'employee', 
        populate: { path: 'user', select: 'firstName lastName' } 
      });

    res.status(200).json({ success: true, data: populatedAdvance, message: 'Advance deduction updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
