import LeaveRequest from '../models/LeaveRequest.js';
import Employee from '../models/Employee.js';

// Helper function to calculate leave balance
const calculateLeaveBalance = async (employeeId) => {
  // Get leave requests to calculate used leaves
  const leaveRequests = await LeaveRequest.find({
    employee: employeeId,
    status: 'approved',
  });

  const usedLeaves = {
    annual: 0,
    sick: 0,
    casual: 0,
    compensatory: 0,
    emergency: 0,
  };

  leaveRequests.forEach(request => {
    usedLeaves[request.leaveType] += request.totalDays;
  });

  const totalLeaves = {
    annual: 20,
    sick: 12,
    casual: 10,
    compensatory: 2,
    emergency: 2,
  };

  const remainingLeaves = {
    annual: totalLeaves.annual - usedLeaves.annual,
    sick: totalLeaves.sick - usedLeaves.sick,
    casual: totalLeaves.casual - usedLeaves.casual,
    compensatory: totalLeaves.compensatory - usedLeaves.compensatory,
    emergency: totalLeaves.emergency - usedLeaves.emergency,
  };

  const leaveBalance = {
    annual: { total: totalLeaves.annual, used: usedLeaves.annual, remaining: remainingLeaves.annual },
    sick: { total: totalLeaves.sick, used: usedLeaves.sick, remaining: remainingLeaves.sick },
    casual: { total: totalLeaves.casual, used: usedLeaves.casual, remaining: remainingLeaves.casual },
    compensatory: { total: totalLeaves.compensatory, used: usedLeaves.compensatory, remaining: remainingLeaves.compensatory },
    emergency: { total: totalLeaves.emergency, used: usedLeaves.emergency, remaining: remainingLeaves.emergency },
  };

  return leaveBalance;
};

// Get leave balance for current employee
export const getLeaveBalance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const leaveBalance = await calculateLeaveBalance(employee._id);

    res.json({
      success: true,
      data: leaveBalance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leave balance',
      error: error.message,
    });
  }
};

// Get all leave requests for current employee
export const getLeaveRequests = async (req, res) => {
  try {
    const { status, year } = req.query;
    const employee = await Employee.findOne({ user: req.user.id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const filter = { employee: employee._id };
    
    if (status) filter.status = status;
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      filter.createdAt = { $gte: startDate, $lte: endDate };
    }

    const leaveRequests = await LeaveRequest.find(filter)
      .populate('employee', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName')
      .populate('rejectedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leaveRequests.length,
      data: leaveRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leave requests',
      error: error.message,
    });
  }
};

// Get leave request by ID
export const getLeaveRequestById = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    
    if (!employee && req.user.role !== 'administrator' && req.user.role !== 'manager') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId department designation')
      .populate('approvedBy', 'firstName lastName')
      .populate('rejectedBy', 'firstName lastName');

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    // Check ownership or admin access
    if (employee && leaveRequest.employee._id.toString() !== employee._id.toString() && req.user.role !== 'administrator' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this leave request',
      });
    }

    res.json({
      success: true,
      data: leaveRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leave request',
      error: error.message,
    });
  }
};

// Create new leave request
export const createLeaveRequest = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, isHalfDay, halfDayType, reason, attachments } = req.body;

    const employee = await Employee.findOne({ user: req.user.id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Validate dates
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'To date must be after from date',
      });
    }

    // Get current leave balance
    const leaveBalance = await calculateLeaveBalance(employee._id);

    // Check if sufficient balance
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = isHalfDay ? 0.5 : diffDays;

    if (leaveBalance[leaveType].remaining < totalDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${leaveType} leave balance. Available: ${leaveBalance[leaveType].remaining} days`,
      });
    }

    // Check for overlapping requests
    const overlappingRequests = await LeaveRequest.find({
      employee: employee._id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (overlappingRequests.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have a leave request for these dates',
      });
    }

    const leaveRequestData = {
      employee: employee._id,
      leaveType,
      startDate: fromDate,
      endDate: toDate,
      totalDays,
      isHalfDay,
      reason,
      attachments,
      leaveBalance,
    };

    // Only include halfDayType when it's actually a half-day request
    if (isHalfDay && halfDayType) {
      leaveRequestData.halfDayType = halfDayType;
    }

    const leaveRequest = await LeaveRequest.create(leaveRequestData);

    res.status(201).json({
      success: true,
      data: leaveRequest,
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating leave request',
      error: error.message,
    });
  }
};

// Update leave request (only pending requests)
export const updateLeaveRequest = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    // Check ownership
    if (leaveRequest.employee.toString() !== employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this leave request',
      });
    }

    // Only allow updating pending requests
    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only update pending requests',
      });
    }

    const updateData = { ...req.body };

    // Only include halfDayType when it's actually a half-day request
    if (!updateData.isHalfDay || !updateData.halfDayType) {
      delete updateData.halfDayType;
    }

    const updatedLeaveRequest = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedLeaveRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating leave request',
      error: error.message,
    });
  }
};

// Cancel leave request
export const cancelLeaveRequest = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    // Check ownership
    if (leaveRequest.employee.toString() !== employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this leave request',
      });
    }

    // Only allow cancelling pending requests
    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending requests',
      });
    }

    leaveRequest.status = 'cancelled';
    await leaveRequest.save();

    res.json({
      success: true,
      data: leaveRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling leave request',
      error: error.message,
    });
  }
};

// Manager/Admin: Get all leave requests
export const getAllLeaveRequests = async (req, res) => {
  try {
    const { status, department, year } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      filter.createdAt = { $gte: startDate, $lte: endDate };
    }

    const leaveRequests = await LeaveRequest.find(filter)
      .populate('employee', 'firstName lastName employeeId department designation')
      .populate('approvedBy', 'firstName lastName')
      .populate('rejectedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leaveRequests.length,
      data: leaveRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leave requests',
      error: error.message,
    });
  }
};

// Manager/Admin: Approve leave request
export const approveLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only approve pending requests',
      });
    }

    leaveRequest.status = 'approved';
    leaveRequest.approvedBy = req.user.id;
    leaveRequest.approvedAt = new Date();
    leaveRequest.adminRemarks = req.body.adminRemarks || '';
    await leaveRequest.save();

    res.json({
      success: true,
      data: leaveRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving leave request',
      error: error.message,
    });
  }
};

// Manager/Admin: Reject leave request
export const rejectLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only reject pending requests',
      });
    }

    leaveRequest.status = 'rejected';
    leaveRequest.rejectedBy = req.user.id;
    leaveRequest.rejectedAt = new Date();
    leaveRequest.adminRemarks = req.body.adminRemarks || '';
    await leaveRequest.save();

    res.json({
      success: true,
      data: leaveRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting leave request',
      error: error.message,
    });
  }
};
