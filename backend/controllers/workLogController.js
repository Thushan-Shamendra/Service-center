import WorkLog from '../models/WorkLog.js';
import JobCard from '../models/JobCard.js';
import Employee from '../models/Employee.js';

// Get all work logs for a technician
export const getWorkLogs = async (req, res) => {
  try {
    const { status, jobCard } = req.query;
    
    // Get employee record for current user
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found',
      });
    }
    
    const filter = { technician: employee._id };
    
    if (status) filter.status = status;
    if (jobCard) filter.jobCard = jobCard;

    const workLogs = await WorkLog.find(filter)
      .populate('jobCard', 'jobCardNumber vehicle customer')
      .populate('technician', 'name employeeId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: workLogs.length,
      data: workLogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching work logs',
      error: error.message,
    });
  }
};

// Get work log by ID
export const getWorkLogById = async (req, res) => {
  try {
    const workLog = await WorkLog.findById(req.params.id)
      .populate('jobCard')
      .populate('technician', 'name employeeId');

    if (!workLog) {
      return res.status(404).json({
        success: false,
        message: 'Work log not found',
      });
    }

    res.json({
      success: true,
      data: workLog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching work log',
      error: error.message,
    });
  }
};

// Create new work log
export const createWorkLog = async (req, res) => {
  try {
    console.log('Creating work log with data:', req.body);
    
    // Get employee record for current user
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found',
      });
    }

    const jobCard = await JobCard.findById(req.body.jobCard);
    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found',
      });
    }

    // Note: Authorization is handled at the list level (getJobCards)
    // Employees can only see jobs assigned to them in their list
    // So if they can see it in the list, they can add work logs to it

    // Use provided workLogId or let the model generate one
    const workLogData = {
      ...req.body,
      technician: employee._id,
    };
    
    // Only remove workLogId if it's not provided to let the model generate it
    if (!req.body.workLogId) {
      delete workLogData.workLogId;
    }

    console.log('Creating work log with processed data:', workLogData);
    const workLog = await WorkLog.create(workLogData);
    console.log('Work log created successfully:', workLog._id);

    // Add to job card's time logs
    await JobCard.findByIdAndUpdate(req.body.jobCard, {
      $push: {
        timeLogs: {
          type: 'repair',
          description: workLog.workDescription,
          startTime: workLog.workStartTime,
          endTime: workLog.workEndTime,
          hoursWorked: workLog.hoursWorked,
          remarks: workLog.remarks,
        },
      },
    });

    res.status(201).json({
      success: true,
      data: workLog,
    });
  } catch (error) {
    console.error('Error creating work log:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating work log',
      error: error.message,
      details: error.toString(),
    });
  }
};

// Update work log
export const updateWorkLog = async (req, res) => {
  try {
    // Get employee record for current user
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found',
      });
    }

    const workLog = await WorkLog.findById(req.params.id);

    if (!workLog) {
      return res.status(404).json({
        success: false,
        message: 'Work log not found',
      });
    }

    // Check ownership
    if (workLog.technician.toString() !== employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this work log',
      });
    }

    const updatedWorkLog = await WorkLog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedWorkLog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating work log',
      error: error.message,
    });
  }
};