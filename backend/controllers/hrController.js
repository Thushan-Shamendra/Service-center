import Attendance from '../models/Attendance.js';
import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';
import Leave from '../models/Leave.js';
import PayrollSettings from '../models/PayrollSettings.js';
import SalaryAdvance from '../models/SalaryAdvance.js';
import Loan from '../models/Loan.js';
import Counter from '../models/Counter.js';
import { generatePayslipPDF } from '../config/pdf.js';
import mongoose from 'mongoose';

// @desc    Get attendance records
// @route   GET /api/hr/attendance
export const getAttendance = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.user.role === 'employee' || req.query.self === 'true' || req.query.self === true) {
      const emp = await Employee.findOne({ user: req.user._id });
      if (emp) query.employee = emp._id;
    } else if (req.query.employee) {
      query.employee = req.query.employee;
    }

    if (req.query.status) query.status = req.query.status;

    if (req.query.date) {
      const startOfDay = new Date(req.query.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(req.query.date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (req.query.startDate && req.query.endDate) {
      const start = new Date(req.query.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      query.date = {
        $gte: start,
        $lte: end,
      };
    }

    const [records, total] = await Promise.all([
      Attendance.find(query)
        .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName' } })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: records,
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

// @desc    Record attendance check-in/out
// @route   POST /api/hr/attendance
export const recordAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, hoursWorked, overtimeHours, attendanceId } = req.body;
    
    const attDate = date ? new Date(date) : new Date();
    attDate.setHours(0, 0, 0, 0);

    // Auto-set hours worked to 0 for Absent, Leave, Holiday statuses
    const finalHoursWorked = ['absent', 'on_leave', 'holiday'].includes(status?.toLowerCase()) 
      ? 0 
      : (hoursWorked || 8);

    // Validate employeeId
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const record = await Attendance.findOneAndUpdate(
      { employee: employeeId, date: attDate },
      {
        employee: employeeId,
        date: attDate,
        status: status || 'present',
        checkIn: checkIn ? (typeof checkIn === 'string' ? new Date(checkIn) : checkIn) : null,
        checkOut: checkOut ? (typeof checkOut === 'string' ? new Date(checkOut) : checkOut) : null,
        hoursWorked: finalHoursWorked,
        overtimeHours: overtimeHours || 0,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: record, message: 'Attendance recorded' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record attendance' });
  }
};

// @desc    Update attendance record
// @route   PUT /api/hr/attendance/:id
export const updateAttendance = async (req, res) => {
  try {
    const { status, checkIn, checkOut, hoursWorked, overtimeHours, remarks } = req.body;
    
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    // Auto-set hours worked to 0 for Absent, Leave, Holiday statuses
    const finalHoursWorked = ['absent', 'on_leave', 'holiday'].includes(status?.toLowerCase()) 
      ? 0 
      : (hoursWorked || attendance.hoursWorked);

    const updateData = {
      status: status || attendance.status,
      hoursWorked: finalHoursWorked,
    };

    if (checkIn !== undefined) {
      updateData.checkIn = checkIn ? (typeof checkIn === 'string' ? new Date(checkIn) : checkIn) : null;
    }
    
    if (checkOut !== undefined) {
      updateData.checkOut = checkOut ? (typeof checkOut === 'string' ? new Date(checkOut) : checkOut) : null;
    }
    
    if (overtimeHours !== undefined) {
      updateData.overtimeHours = overtimeHours;
    }
    
    if (remarks !== undefined) {
      updateData.remarks = remarks;
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName' } });

    res.status(200).json({ success: true, data: updatedAttendance, message: 'Attendance updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update attendance' });
  }
};

// @desc    Check-in for current user (employee)
// @route   POST /api/hr/attendance/check-in
export const checkIn = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let existing = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    if (!existing) {
      // Also check by checkIn timestamp today
      existing = await Attendance.findOne({
        employee: employee._id,
        checkIn: { $gte: startOfDay, $lte: endOfDay },
      });
    }
    if (existing && existing.checkIn) {
      return res.status(400).json({ success: false, message: 'Already checked in today' });
    }

    const now = new Date();
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
    const status = isLate ? 'late' : 'present';

    const record = existing || new Attendance({
      employee: employee._id,
      date: startOfDay,
    });

    record.status = status;
    record.checkIn = now;
    if (isLate && !record.lateReason) {
      record.lateReason = 'Checked in after 09:15 AM';
    }
    await record.save();

    await record.populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName' } });

    res.status(200).json({ success: true, data: record, message: `Checked in successfully as ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check-out for current user (employee)
// @route   POST /api/hr/attendance/check-out
export const checkOut = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let record = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    // Fallback: look for an unclosed check-in from the last 24 hours
    if (!record) {
      record = await Attendance.findOne({
        employee: employee._id,
        checkIn: { $ne: null, $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        checkOut: null,
      }).sort({ date: -1 });
    }

    if (!record || !record.checkIn) {
      return res.status(400).json({ success: false, message: 'You have not checked in today' });
    }
    if (record.checkOut) {
      return res.status(400).json({ success: false, message: 'Already checked out today' });
    }

    const checkOutTime = new Date();
    // Calculate hours worked with proper precision (round to 2 decimal places)
    const hoursWorked = Math.round(((checkOutTime - new Date(record.checkIn)) / (1000 * 60 * 60)) * 100) / 100;
    const overtimeHours = Math.round(Math.max(0, hoursWorked - 8) * 100) / 100;

    record.checkOut = checkOutTime;
    record.hoursWorked = hoursWorked;
    record.overtimeHours = overtimeHours;
    await record.save();

    await record.populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName' } });

    res.status(200).json({ success: true, data: record, message: 'Checked out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payroll records
// @route   GET /api/hr/payroll
export const getPayroll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.month) query.month = parseInt(req.query.month);
    if (req.query.year) query.year = parseInt(req.query.year);
    if (req.query.status) query.status = req.query.status;

    // Scope to personal records if employee or self flag is true
    if (req.user.role === 'employee' || req.query.self === 'true' || req.query.self === true) {
      const emp = await Employee.findOne({ user: req.user._id });
      if (!emp) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
      }
      query.employee = emp._id;
    } else if (req.query.employee) {
      query.employee = req.query.employee;
    }

    const [payrolls, total] = await Promise.all([
      Payroll.find(query)
        .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payroll.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: payrolls,
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

// @desc    Get single payroll record
// @route   GET /api/hr/payroll/:id
export const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email mobile' } });

    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll record not found' });

    // Restrict employees to only their own payroll record
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      const recordEmpId = payroll.employee?._id || payroll.employee;
      if (!emp || recordEmpId.toString() !== emp._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to view another employee\'s payroll record',
        });
      }
    }

    res.status(200).json({ success: true, data: payroll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process monthly payroll with Sri Lankan EPF/ETF calculations
// @route   POST /api/hr/payroll/process
export const processPayroll = async (req, res) => {
  try {
    const { month, year, includeOvertime } = req.body;
    
    // Get both employees and managers
    const employees = await Employee.find({ status: 'active' });
    const managers = await Employee.find({ status: 'active' }); // Managers are also in Employee collection with role 'manager'
    
    // Combine employees and managers
    const allStaff = [...employees];
    
    const processedPayrolls = [];
    let payrollCount = await Counter.increment('payroll');

    for (const emp of allStaff) {
      const basic = emp.basicSalary || 50000;
      const allowances = emp.allowances || 0;
      
      // Calculate overtime from attendance
      let overtimePay = 0;
      if (includeOvertime) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const attendanceRecords = await Attendance.find({
          employee: emp._id,
          date: { $gte: startDate, $lte: endDate },
        });

        const totalOvertimeHours = attendanceRecords.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);
        const overtimeRate = (basic / 160) * 1.5; // 1.5x hourly rate for overtime
        overtimePay = Math.round(totalOvertimeHours * overtimeRate);
      }

      const grossSalary = basic + allowances + overtimePay;

      // Sri Lanka Statutory EPF / ETF with consistent rounding
      const epfEmployeeRate = 0.08; // 8%
      const epfEmployerRate = 0.12; // 12%
      const etfEmployerRate = 0.03; // 3%

      // Calculate with proper rounding to 2 decimal places for currency
      const epfEmployee = Math.round((basic * epfEmployeeRate) * 100) / 100;
      const epfEmployer = Math.round((basic * epfEmployerRate) * 100) / 100;
      const etfEmployer = Math.round((basic * etfEmployerRate) * 100) / 100;

      // ETF is employer contribution only, not deducted from employee
      const totalDeductions = epfEmployee;
      const netSalary = Math.round((grossSalary - totalDeductions) * 100) / 100;

      // Generate payroll ID for new records
      const existingPayroll = await Payroll.findOne({ employee: emp._id, month, year });
      let payrollId;
      if (!existingPayroll) {
        payrollId = `PAY-${String(payrollCount).padStart(5, '0')}`;
        payrollCount++; // Increment for next employee
      } else {
        payrollId = existingPayroll.payrollId;
      }

      // Ensure payrollId is always set for new records
      const updateData = {
        employee: emp._id,
        month,
        year,
        basicSalary: basic,
        allowances,
        overtimePay,
        grossSalary,
        epfEmployee,
        epfEmployer,
        etfEmployer,
        totalDeductions,
        netSalary,
        status: 'generated',
        paymentDate: new Date(),
      };
      
      // Only set payrollId if it's a new record (pre-save hook won't run with findOneAndUpdate)
      if (!existingPayroll) {
        updateData.payrollId = payrollId;
      }

      const payroll = await Payroll.findOneAndUpdate(
        { employee: emp._id, month, year },
        updateData,
        { upsert: true, new: true }
      );

      processedPayrolls.push(payroll);
    }

    res.status(200).json({
      success: true,
      data: processedPayrolls,
      message: `Payroll processed for ${employees.length} employees (${month}/${year})`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create individual payroll record
// @route   POST /api/hr/payroll/create
export const createPayroll = async (req, res) => {
  try {
    const { 
      employeeId, 
      month, 
      year, 
      allowances, 
      otherDeductions, 
      loanDeductions, 
      salaryAdvanceDeductions 
    } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const basic = employee.basicSalary || 50000;
    const allowancesValue = allowances || employee.allowances || 0;
    
    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);
    const settings = await PayrollSettings.findOne({ active: true }) || {};

    // Calculate overtime from attendance
    const startDate = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    
    const attendanceRecords = await Attendance.find({
      employee: employee._id,
      date: { $gte: startDate, $lte: endDate },
    });

    const totalOvertimeHours = attendanceRecords.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);
    const overtimeRateMultiplier = settings.overtimeRateMultiplier || 1.5;
    const standardHours = settings.standardWorkingHours || 160;
    const overtimeRate = (basic / standardHours) * overtimeRateMultiplier;
    const overtimePay = Math.round(totalOvertimeHours * overtimeRate);

    const grossSalary = basic + allowancesValue + overtimePay;

    // Sri Lanka Statutory EPF / ETF
    const epfEmployeeRate = settings.epfEmployeeRate || 8;
    const epfEmployerRate = settings.epfEmployerRate || 12;
    const etfEmployerRate = settings.etfEmployerRate || 3;

    const epfEmployee = Math.round(basic * (epfEmployeeRate / 100));
    const epfEmployer = Math.round(basic * (epfEmployerRate / 100));
    const etfEmployer = Math.round(basic * (etfEmployerRate / 100));

    // Get approved salary advances if not provided
    let advanceDeductions = salaryAdvanceDeductions || 0;
    if (!salaryAdvanceDeductions) {
      const approvedAdvances = await SalaryAdvance.find({
        employee: employeeId,
        status: 'approved',
        payrollStatus: { $in: ['pending_deduction', 'partially_deducted'] }
      });
      advanceDeductions = approvedAdvances.reduce((sum, advance) => sum + advance.remainingAmount, 0);
    }

    // Get active loans if not provided
    let loanDeductionsTotal = loanDeductions || 0;
    if (!loanDeductions) {
      const activeLoans = await Loan.find({
        employee: employeeId,
        status: 'active'
      });
      loanDeductionsTotal = activeLoans.reduce((sum, loan) => sum + loan.monthlyDeduction, 0);
    }

    // ETF is employer contribution only, not deducted from employee
    const totalDeductions = epfEmployee + (otherDeductions || 0) + loanDeductionsTotal + advanceDeductions;
    const netSalary = grossSalary - totalDeductions;

    // Generate payroll ID using atomic counter
    const payrollCount = await Counter.increment('payroll');
    const payrollId = `PAY-${String(payrollCount).padStart(5, '0')}`;

    const payroll = await Payroll.create({
      payrollId,
      employee: employeeId,
      month,
      year,
      basicSalary: basic,
      allowances: allowancesValue,
      overtimeHours: totalOvertimeHours,
      overtimePay,
      grossSalary,
      epfEmployee,
      epfEmployer,
      etfEmployer,
      otherDeductions: otherDeductions || 0,
      loanDeductions: loanDeductions || 0,
      salaryAdvanceDeductions: advanceDeductions,
      totalDeductions,
      netSalary,
      status: 'draft',
    });

    const populatedPayroll = await Payroll.findById(payroll._id)
      .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName' } });

    res.status(201).json({ success: true, data: populatedPayroll, message: 'Payroll record created' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create payroll' });
  }
};

// @desc    Update payroll record
// @route   PUT /api/hr/payroll/:id
export const updatePayroll = async (req, res) => {
  try {
    const { 
      allowances, 
      otherDeductions, 
      loanDeductions, 
      salaryAdvanceDeductions,
      overtimeHours: reqOvertimeHours,
      overtimePay: reqOvertimePay,
      status 
    } = req.body;

    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll record not found' });

    const employee = await Employee.findById(payroll.employee);
    const basic = (employee && employee.basicSalary) || payroll.basicSalary || 50000;
    const allowancesValue = allowances !== undefined ? Number(allowances) : (payroll.allowances || 0);
    
    const settings = await PayrollSettings.findOne({ active: true }) || {};
    const epfEmployeeRate = settings.epfEmployeeRate || 8;
    const epfEmployerRate = settings.epfEmployerRate || 12;
    const etfEmployerRate = settings.etfEmployerRate || 3;

    let overtimePay = payroll.overtimePay || 0;
    let overtimeHours = payroll.overtimeHours || 0;
    if (reqOvertimeHours !== undefined) {
      overtimeHours = Number(reqOvertimeHours) || 0;
      const overtimeRateMultiplier = settings.overtimeRateMultiplier || 1.5;
      const standardHours = settings.standardWorkingHours || 160;
      const overtimeRate = (basic / standardHours) * overtimeRateMultiplier;
      overtimePay = Math.round(overtimeHours * overtimeRate);
    } else if (reqOvertimePay !== undefined) {
      overtimePay = Number(reqOvertimePay) || 0;
    }

    const grossSalary = basic + allowancesValue + overtimePay;

    // Sri Lanka Statutory EPF / ETF
    const epfEmployee = Math.round(basic * (epfEmployeeRate / 100));
    const epfEmployer = Math.round(basic * (epfEmployerRate / 100));
    const etfEmployer = Math.round(basic * (etfEmployerRate / 100));

    // Get loan deductions if not provided
    let loanDeductionsTotal = loanDeductions !== undefined ? Number(loanDeductions) : payroll.loanDeductions;
    if (loanDeductions === undefined) {
      const activeLoans = await Loan.find({
        employee: payroll.employee,
        status: 'active'
      });
      loanDeductionsTotal = activeLoans.reduce((sum, loan) => sum + loan.monthlyDeduction, 0);
    }

    const otherDeductionsValue = otherDeductions !== undefined ? Number(otherDeductions) : (payroll.otherDeductions || 0);
    const salaryAdvanceDeductionsValue = salaryAdvanceDeductions !== undefined ? Number(salaryAdvanceDeductions) : (payroll.salaryAdvanceDeductions || 0);

    // ETF is employer contribution only, not deducted from employee
    const totalDeductions = epfEmployee + 
      otherDeductionsValue + 
      loanDeductionsTotal + 
      salaryAdvanceDeductionsValue;
    
    const netSalary = grossSalary - totalDeductions;

    payroll.basicSalary = basic;
    payroll.allowances = allowancesValue;
    payroll.overtimeHours = overtimeHours;
    payroll.overtimePay = overtimePay;
    payroll.otherDeductions = otherDeductionsValue;
    payroll.loanDeductions = loanDeductionsTotal;
    payroll.salaryAdvanceDeductions = salaryAdvanceDeductionsValue;
    payroll.epfEmployee = epfEmployee;
    payroll.epfEmployer = epfEmployer;
    payroll.etfEmployer = etfEmployer;
    payroll.grossSalary = grossSalary;
    payroll.totalDeductions = totalDeductions;
    payroll.netSalary = netSalary;
    if (status) payroll.status = status;
    
    await payroll.save();

    const populatedPayroll = await Payroll.findById(payroll._id)
      .populate({ 
        path: 'employee', 
        populate: { path: 'user', select: 'firstName lastName email role' } 
      });

    res.status(200).json({ success: true, data: populatedPayroll, message: 'Payroll updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate payslip PDF
// @route   GET /api/hr/payroll/:id/payslip
export const generatePayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate({ 
      path: 'employee', 
      populate: { path: 'user', select: 'firstName lastName' } 
    });
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll record not found' });

    // Restrict employees to only their own payslip
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      const recordEmpId = payroll.employee?._id || payroll.employee;
      if (!emp || recordEmpId.toString() !== emp._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to download another employee\'s payslip',
        });
      }
    }

    const pdfPath = await generatePayslipPDF(payroll, payroll.employee);

    // Send the PDF file as a downloadable response
    res.download(pdfPath, `payslip-${payroll.payrollId}.pdf`, (err) => {
      if (err) {
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Failed to download payslip' });
        }
      }
    });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate payslip' });
    }
  }
};

// @desc    Update payroll status (approve/paid)
// @route   PUT /api/hr/payroll/:id/status
export const updatePayrollStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll record not found' });

    payroll.status = status;
    if (status === 'paid') {
      payroll.paymentDate = new Date();
    }
    await payroll.save();

    res.status(200).json({ success: true, data: payroll, message: `Payroll status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payroll settings
// @route   GET /api/hr/payroll/settings
export const getPayrollSettings = async (req, res) => {
  try {
    let settings = await PayrollSettings.findOne({ active: true });
    if (!settings) {
      settings = await PayrollSettings.create({});
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update payroll settings
// @route   PUT /api/hr/payroll/settings
export const updatePayrollSettings = async (req, res) => {
  try {
    let settings = await PayrollSettings.findOne({ active: true });
    if (!settings) {
      settings = await PayrollSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.status(200).json({ success: true, data: settings, message: 'Payroll settings updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Calculate payroll preview for a month
// @route   POST /api/hr/payroll/calculate-preview
export const calculatePayrollPreview = async (req, res) => {
  try {
    const { month, year, includeOvertime, employeeId } = req.body;
    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);

    const query = { status: { $ne: 'inactive', $ne: 'terminated' } };
    if (employeeId) {
      query._id = employeeId;
    }
    const employees = await Employee.find(query).populate('user', 'firstName lastName email role');
    const settings = await PayrollSettings.findOne({ active: true }) || {};

    const previewData = {
      totalBasicSalary: 0,
      totalAllowances: 0,
      totalOvertime: 0,
      totalDeductions: 0,
      totalLoans: 0,
      totalAdvances: 0,
      estimatedNetPayroll: 0,
      employeeCount: employees.length,
      employees: []
    };

    for (const emp of employees) {
      const basic = emp.basicSalary || 50000;
      const allowances = emp.allowances || 0;
      
      // Calculate overtime from attendance
      let totalOvertimeHours = 0;
      let overtimePay = 0;
      if (includeOvertime !== false) {
        const startDate = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
        
        const attendanceRecords = await Attendance.find({
          employee: emp._id,
          date: { $gte: startDate, $lte: endDate },
        });

        totalOvertimeHours = attendanceRecords.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);
        const overtimeRateMultiplier = settings.overtimeRateMultiplier || 1.5;
        const standardHours = settings.standardWorkingHours || 160;
        const overtimeRate = (basic / standardHours) * overtimeRateMultiplier;
        overtimePay = Math.round(totalOvertimeHours * overtimeRate);
      }

      const grossSalary = basic + allowances + overtimePay;

      // Sri Lanka Statutory EPF / ETF (configurable)
      const epfEmployeeRate = settings.epfEmployeeRate || 8;
      const epfEmployerRate = settings.epfEmployerRate || 12;
      const etfEmployerRate = settings.etfEmployerRate || 3;

      const epfEmployee = Math.round(basic * (epfEmployeeRate / 100));
      const epfEmployer = Math.round(basic * (epfEmployerRate / 100));
      const etfEmployer = Math.round(basic * (etfEmployerRate / 100));

      // Get approved salary advances that haven't been fully deducted
      const approvedAdvances = await SalaryAdvance.find({
        employee: emp._id,
        status: 'approved',
        payrollStatus: { $in: ['pending_deduction', 'partially_deducted'] }
      });
      
      const salaryAdvanceDeductions = approvedAdvances.reduce((sum, advance) => sum + advance.remainingAmount, 0);
      
      // Get active loans for monthly deduction
      const activeLoans = await Loan.find({
        employee: emp._id,
        status: 'active'
      });
      
      const loanDeductions = activeLoans.reduce((sum, loan) => sum + loan.monthlyDeduction, 0);
      
      const otherDeductions = 0;

      const totalDeductions = epfEmployee + loanDeductions + salaryAdvanceDeductions + otherDeductions;
      const netSalary = grossSalary - totalDeductions;

      previewData.totalBasicSalary += basic;
      previewData.totalAllowances += allowances;
      previewData.totalOvertime += overtimePay;
      previewData.totalDeductions += otherDeductions;
      previewData.totalLoans += loanDeductions;
      previewData.totalAdvances += salaryAdvanceDeductions;
      previewData.estimatedNetPayroll += netSalary;

      previewData.employees.push({
        _id: emp._id,
        employeeId: emp.employeeId || emp.managerId,
        name: `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim(),
        employeeName: `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim(),
        basicSalary: basic,
        allowances,
        overtimeHours: totalOvertimeHours,
        overtimePay,
        grossSalary,
        epfEmployee,
        epfEmployer,
        etfEmployer,
        loanDeductions,
        salaryAdvanceDeductions,
        otherDeductions,
        totalDeductions,
        netSalary
      });
    }

    res.status(200).json({ success: true, data: previewData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk calculate payroll for all employees
// @route   POST /api/hr/payroll/bulk-calculate
export const bulkCalculatePayroll = async (req, res) => {
  try {
    const { month, year, includeOvertime } = req.body;
    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);

    if (isNaN(targetMonth) || isNaN(targetYear)) {
      return res.status(400).json({ success: false, message: 'Valid month and year are required' });
    }

    const employees = await Employee.find({
      status: { $ne: 'inactive', $ne: 'terminated' },
    });
    const settings = await PayrollSettings.findOne({ active: true }) || {};

    const calculatedPayrolls = [];

    for (const emp of employees) {
      const basic = emp.basicSalary || 50000;
      const allowances = emp.allowances || 0;
      
      // Calculate overtime from attendance
      let totalOvertimeHours = 0;
      let overtimePay = 0;
      if (includeOvertime !== false) {
        const startDate = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
        
        const attendanceRecords = await Attendance.find({
          employee: emp._id,
          date: { $gte: startDate, $lte: endDate },
        });

        totalOvertimeHours = attendanceRecords.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);
        const overtimeRateMultiplier = settings.overtimeRateMultiplier || 1.5;
        const standardHours = settings.standardWorkingHours || 160;
        const overtimeRate = (basic / standardHours) * overtimeRateMultiplier;
        overtimePay = Math.round(totalOvertimeHours * overtimeRate);
      }

      const grossSalary = basic + allowances + overtimePay;

      // Sri Lanka Statutory EPF / ETF (configurable)
      const epfEmployeeRate = settings.epfEmployeeRate || 8;
      const epfEmployerRate = settings.epfEmployerRate || 12;
      const etfEmployerRate = settings.etfEmployerRate || 3;

      const epfEmployee = Math.round(basic * (epfEmployeeRate / 100));
      const epfEmployer = Math.round(basic * (epfEmployerRate / 100));
      const etfEmployer = Math.round(basic * (etfEmployerRate / 100));

      // Get approved salary advances that haven't been fully deducted
      const approvedAdvances = await SalaryAdvance.find({
        employee: emp._id,
        status: 'approved',
        payrollStatus: { $in: ['pending_deduction', 'partially_deducted'] }
      });
      
      const salaryAdvanceDeductions = approvedAdvances.reduce((sum, advance) => sum + advance.remainingAmount, 0);
      
      // Get active loans for monthly deduction
      const activeLoans = await Loan.find({
        employee: emp._id,
        status: 'active'
      });
      
      const loanDeductions = activeLoans.reduce((sum, loan) => sum + loan.monthlyDeduction, 0);
      
      const otherDeductions = 0;

      const totalDeductions = epfEmployee + loanDeductions + salaryAdvanceDeductions + otherDeductions;
      const netSalary = grossSalary - totalDeductions;

      // Check existing payroll record
      const existingPayroll = await Payroll.findOne({ employee: emp._id, month: targetMonth, year: targetYear });
      if (existingPayroll && existingPayroll.status === 'processed') {
        // Do not overwrite already processed payrolls
        calculatedPayrolls.push(existingPayroll);
        continue;
      }

      let payrollId;
      if (!existingPayroll) {
        const seq = await Counter.increment('payroll');
        payrollId = `PAY-${String(seq).padStart(5, '0')}`;
      } else {
        payrollId = existingPayroll.payrollId;
      }

      const updateData = {
        employee: emp._id,
        month: targetMonth,
        year: targetYear,
        basicSalary: basic,
        allowances,
        overtimeHours: totalOvertimeHours,
        overtimePay,
        grossSalary,
        epfEmployee,
        epfEmployer,
        etfEmployer,
        otherDeductions,
        loanDeductions,
        salaryAdvanceDeductions,
        totalDeductions,
        netSalary,
        status: existingPayroll ? existingPayroll.status : 'draft',
      };
      
      if (!existingPayroll) {
        updateData.payrollId = payrollId;
      }

      const payroll = await Payroll.findOneAndUpdate(
        { employee: emp._id, month: targetMonth, year: targetYear },
        updateData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      calculatedPayrolls.push(payroll);
    }

    res.status(200).json({
      success: true,
      data: calculatedPayrolls,
      message: `Payroll records created/updated for ${calculatedPayrolls.length} employees (${targetMonth}/${targetYear})`
    });
  } catch (error) {
    console.error('Bulk calculate error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk process payroll (change status to processed)
// @route   POST /api/hr/payroll/bulk-process
export const bulkProcessPayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);
    
    const result = await Payroll.updateMany(
      { month: targetMonth, year: targetYear, status: { $in: ['calculated', 'draft'] } },
      { status: 'processed', paymentDate: new Date() }
    );

    // Update salary advance deduction status for approved advances
    const processedPayrolls = await Payroll.find({ month, year, status: 'processed' });
    
    for (const payroll of processedPayrolls) {
      // Update salary advances
      const approvedAdvances = await SalaryAdvance.find({
        employee: payroll.employee,
        status: 'approved',
        payrollStatus: { $in: ['pending_deduction', 'partially_deducted'] }
      });
      
      for (const advance of approvedAdvances) {
        const deductedAmount = Math.min(advance.remainingAmount, payroll.salaryAdvanceDeductions);
        await SalaryAdvance.findByIdAndUpdate(advance._id, {
          deductedAmount: advance.deductedAmount + deductedAmount,
          remainingAmount: advance.remainingAmount - deductedAmount,
          deductionMonth: month,
          deductionYear: year,
          payrollStatus: advance.remainingAmount - deductedAmount === 0 ? 'deducted' : 'partially_deducted'
        });
      }
      
      // Update loan repayments
      const activeLoans = await Loan.find({
        employee: payroll.employee,
        status: 'active'
      });
      
      for (const loan of activeLoans) {
        const actualDeduction = Math.min(loan.monthlyDeduction, loan.outstandingBalance);
        const newOutstanding = loan.outstandingBalance - actualDeduction;
        const newPaidAmount = loan.paidAmount + actualDeduction;
        
        const lastInstallment = loan.repaymentHistory.length > 0 
          ? Math.max(...loan.repaymentHistory.map(r => r.installmentNumber))
          : 0;
        const installmentNumber = lastInstallment + 1;
        
        loan.repaymentHistory.push({
          installmentNumber,
          payrollMonth: month,
          payrollYear: year,
          amount: actualDeduction,
          paymentDate: new Date(),
          balanceAfterPayment: newOutstanding,
          status: 'paid',
        });
        
        loan.paidAmount = newPaidAmount;
        loan.outstandingBalance = newOutstanding;
        
        if (newOutstanding === 0) {
          loan.status = 'completed';
          loan.completedDate = new Date();
        }
        
        await loan.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} payroll records processed successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get HR statistics
// @route   GET /api/hr/stats
export const getHRStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    
    // Proper date range query for today's attendance (handling timezones and late/half-day statuses)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    const presentToday = await Attendance.countDocuments({
      date: { 
        $gte: new Date(startOfDay.getTime() - 14 * 3600 * 1000), 
        $lte: new Date(endOfDay.getTime() + 14 * 3600 * 1000) 
      },
      status: { $in: ['present', 'late', 'half_day', 'half-day'] },
    });
    
    let targetMonth = req.query.month ? parseInt(req.query.month) : (now.getMonth() + 1);
    let targetYear = req.query.year ? parseInt(req.query.year) : now.getFullYear();

    // If month not specified in query, and targetMonth has 0 records, fallback to latest month with records
    if (!req.query.month) {
      const currentMonthCount = await Payroll.countDocuments({ month: targetMonth, year: targetYear });
      if (currentMonthCount === 0) {
        const latestPayroll = await Payroll.findOne({}).sort({ year: -1, month: -1 });
        if (latestPayroll) {
          targetMonth = latestPayroll.month;
          targetYear = latestPayroll.year;
        }
      }
    }
    
    const monthlyPayroll = await Payroll.aggregate([
      { $match: { month: targetMonth, year: targetYear } },
      {
        $group: {
          _id: null,
          totalGross: { $sum: '$grossSalary' },
          totalNet: { $sum: '$netSalary' },
          totalCount: { $sum: 1 },
          processedCount: {
            $sum: {
              $cond: [{ $in: ['$status', ['processed', 'paid']] }, 1, 0]
            }
          },
          draftCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'draft'] }, 1, 0]
            }
          }
        },
      },
    ]);

    // Count pending leave requests
    const pendingLeave = await Leave.countDocuments({ status: 'pending' });
    
    // Count pending advances
    const SalaryAdvance = mongoose.model('SalaryAdvance');
    const pendingAdvances = await SalaryAdvance.countDocuments({ status: 'pending' });
    
    // Count pending loans
    const Loan = mongoose.model('Loan');
    const pendingLoans = await Loan.countDocuments({ status: 'pending' });
    
    // Count active loans
    const activeLoans = await Loan.countDocuments({ status: 'active' });

    const stats = {
      totalEmployees,
      presentToday,
      pendingLeave,
      pendingAdvances,
      pendingLoans,
      activeLoans,
      payrollMonth: targetMonth,
      payrollYear: targetYear,
      monthlyPayroll: monthlyPayroll[0] || { totalGross: 0, totalNet: 0, processedCount: 0, totalCount: 0, draftCount: 0 },
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
