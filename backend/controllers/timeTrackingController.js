import TimeLog from '../models/TimeLog.js';
import JobCard from '../models/JobCard.js';

// Get all time logs for a technician
export const getTimeLogs = async (req, res) => {
  try {
    const { status, jobCard, date } = req.query;
    const filter = { technician: req.user.id };
    
    if (status) filter.status = status;
    if (jobCard) filter.jobCard = jobCard;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.recordDate = { $gte: startDate, $lt: endDate };
    }

    const timeLogs = await TimeLog.find(filter)
      .populate('jobCard', 'jobCardNumber vehicle customer')
      .populate('technician', 'name employeeId')
      .sort({ recordDate: -1 });

    res.json({
      success: true,
      count: timeLogs.length,
      data: timeLogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching time logs',
      error: error.message,
    });
  }
};

// Get time log by ID
export const getTimeLogById = async (req, res) => {
  try {
    const timeLog = await TimeLog.findById(req.params.id)
      .populate('jobCard')
      .populate('technician', 'name employeeId');

    if (!timeLog) {
      return res.status(404).json({
        success: false,
        message: 'Time log not found',
      });
    }

    res.json({
      success: true,
      data: timeLog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching time log',
      error: error.message,
    });
  }
};

// Create new time log
export const createTimeLog = async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.body.jobCard);
    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found',
      });
    }

    // Validate job card assignment
    if (jobCard.assignedTechnician?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to log time for this job card',
      });
    }

    const timeLog = await TimeLog.create({
      ...req.body,
      technician: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: timeLog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating time log',
      error: error.message,
    });
  }
};

// Update time log
export const updateTimeLog = async (req, res) => {
  try {
    const timeLog = await TimeLog.findById(req.params.id);

    if (!timeLog) {
      return res.status(404).json({
        success: false,
        message: 'Time log not found',
      });
    }

    // Check ownership
    if (timeLog.technician.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this time log',
      });
    }

    const updatedTimeLog = await TimeLog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedTimeLog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating time log',
      error: error.message,
    });
  }
};

// Get daily time summary
export const getDailyTimeSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const timeLogs = await TimeLog.find({
      technician: req.user.id,
      recordDate: { $gte: startDate, $lt: endDate },
    });

    const summary = {
      inspection: { hours: 0, minutes: 0 },
      repair: { hours: 0, minutes: 0 },
      waiting: { hours: 0, minutes: 0 },
      testing: { hours: 0, minutes: 0 },
      break: { hours: 0, minutes: 0 },
      total: 0,
    };

    timeLogs.forEach(log => {
      summary.inspection.hours += log.inspectionTime?.hours || 0;
      summary.inspection.minutes += log.inspectionTime?.minutes || 0;
      summary.repair.hours += log.repairTime?.hours || 0;
      summary.repair.minutes += log.repairTime?.minutes || 0;
      summary.waiting.hours += log.waitingTime?.hours || 0;
      summary.waiting.minutes += log.waitingTime?.minutes || 0;
      summary.testing.hours += log.testingTime?.hours || 0;
      summary.testing.minutes += log.testingTime?.minutes || 0;
      summary.break.hours += log.breakTime?.hours || 0;
      summary.break.minutes += log.breakTime?.minutes || 0;
      // Round total working hours to 2 decimal places for precision
      summary.total += Math.round((log.totalWorkingHours || 0) * 100) / 100;
    });

    // Convert excess minutes to hours
    const convertMinutes = (hours, minutes) => {
      const totalMinutes = (hours * 60) + minutes;
      return {
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
      };
    };

    summary.inspection = convertMinutes(summary.inspection.hours, summary.inspection.minutes);
    summary.repair = convertMinutes(summary.repair.hours, summary.repair.minutes);
    summary.waiting = convertMinutes(summary.waiting.hours, summary.waiting.minutes);
    summary.testing = convertMinutes(summary.testing.hours, summary.testing.minutes);
    summary.break = convertMinutes(summary.break.hours, summary.break.minutes);

    res.json({
      success: true,
      data: {
        date: targetDate,
        summary,
        timeLogs,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching daily time summary',
      error: error.message,
    });
  }
};