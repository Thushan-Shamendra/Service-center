import Leave from '../models/Leave.js';
import Employee from '../models/Employee.js';

// @desc    Get all leave requests
// @route   GET /api/hr/leave
export const getLeaveRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.employee) query.employee = req.query.employee;
    if (req.query.status) query.status = req.query.status;
    if (req.query.leaveType) query.leaveType = req.query.leaveType;
    if (req.query.startDate && req.query.endDate) {
      query.startDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const [leaves, total] = await Promise.all([
      Leave.find(query)
        .populate({ 
          path: 'employee', 
          populate: { path: 'user', select: 'firstName lastName' } 
        })
        .populate('reviewedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Leave.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: leaves,
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

// @desc    Get single leave request
// @route   GET /api/hr/leave/:id
export const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate({ 
        path: 'employee', 
        populate: { path: 'user', select: 'firstName lastName email mobile' } 
      })
      .populate('reviewedBy', 'firstName lastName');

    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

    res.status(200).json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new leave request
// @route   POST /api/hr/leave
export const createLeaveRequest = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    // Validate employee
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      employee: employeeId,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      status: 'pending',
    });

    const populatedLeave = await Leave.findById(leave._id)
      .populate({ 
        path: 'employee', 
        populate: { path: 'user', select: 'firstName lastName' } 
      });

    res.status(201).json({ success: true, data: populatedLeave, message: 'Leave request created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update leave request status (approve/reject)
// @route   PUT /api/hr/leave/:id/status
export const updateLeaveStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Leave request already processed' });
    }

    leave.status = status;
    leave.remarks = remarks || leave.remarks;
    leave.reviewedBy = req.user._id;
    leave.reviewedDate = new Date();
    await leave.save();

    const populatedLeave = await Leave.findById(leave._id)
      .populate({ 
        path: 'employee', 
        populate: { path: 'user', select: 'firstName lastName' } 
      })
      .populate('reviewedBy', 'firstName lastName');

    res.status(200).json({ 
      success: true, 
      data: populatedLeave, 
      message: `Leave request ${status}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get leave statistics
// @route   GET /api/hr/leave/stats
export const getLeaveStats = async (req, res) => {
  try {
    const pending = await Leave.countDocuments({ status: 'pending' });
    const approved = await Leave.countDocuments({ status: 'approved' });
    const rejected = await Leave.countDocuments({ status: 'rejected' });

    const stats = {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete leave request
// @route   DELETE /api/hr/leave/:id
export const deleteLeaveRequest = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only delete pending leave requests' });
    }

    await leave.deleteOne();

    res.status(200).json({ success: true, message: 'Leave request deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
