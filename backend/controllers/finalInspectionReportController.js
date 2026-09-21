import mongoose from 'mongoose';
import FinalInspectionReport from '../models/FinalInspectionReport.js';
import JobCard from '../models/JobCard.js';
import SparePartsRequest from '../models/SparePartsRequest.js';
import RoadTest from '../models/RoadTest.js';
import Employee from '../models/Employee.js';

// Get final inspection reports for a technician
export const getFinalInspectionReports = async (req, res) => {
  try {
    const { jobCard } = req.query;
    const employee = await Employee.findOne({ user: req.user.id });
    const filter = { technician: { $in: [req.user.id, ...(employee ? [employee._id] : [])] } };
    
    if (jobCard) filter.jobCard = jobCard;

    const reports = await FinalInspectionReport.find(filter)
      .populate('jobCard', 'jobCardNumber vehicle customer')
      .populate('technician', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching final inspection reports',
      error: error.message,
    });
  }
};

// Get final inspection report by ID (supports report _id, jobCard ID, or reportId string)
export const getFinalInspectionReportById = async (req, res) => {
  try {
    const { id } = req.params;
    let report = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      // 1. Try finding by report _id
      report = await FinalInspectionReport.findById(id)
        .populate({
          path: 'jobCard',
          populate: [
            { path: 'vehicle' },
            { path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } },
            { path: 'assignedTechnician', populate: { path: 'user', select: 'firstName lastName' } }
          ]
        })
        .populate({
          path: 'technician',
          populate: { path: 'user', select: 'firstName lastName mobile email' }
        });

      // 2. If not found, try finding by jobCard id
      if (!report) {
        report = await FinalInspectionReport.findOne({ jobCard: id })
          .sort({ createdAt: -1 })
          .populate({
            path: 'jobCard',
            populate: [
              { path: 'vehicle' },
              { path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } },
              { path: 'assignedTechnician', populate: { path: 'user', select: 'firstName lastName' } }
            ]
          })
          .populate({
            path: 'technician',
            populate: { path: 'user', select: 'firstName lastName mobile email' }
          });
      }
    }

    // 3. If still not found, try finding by reportId string (e.g. FIN-2026-...)
    if (!report) {
      report = await FinalInspectionReport.findOne({ reportId: id })
        .populate({
          path: 'jobCard',
          populate: [
            { path: 'vehicle' },
            { path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } },
            { path: 'assignedTechnician', populate: { path: 'user', select: 'firstName lastName' } }
          ]
        })
        .populate({
          path: 'technician',
          populate: { path: 'user', select: 'firstName lastName mobile email' }
        });
    }

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Final inspection report not found',
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching final inspection report',
      error: error.message,
    });
  }
};

// Create new final inspection report
export const createFinalInspectionReport = async (req, res) => {
  try {
    const mechanicRemarks = typeof req.body.mechanicRemarks === 'string' ? req.body.mechanicRemarks.trim() : '';
    const fields = {};
    if (!mechanicRemarks) fields.mechanicRemarks = 'Please enter mechanic remarks';
    else if (mechanicRemarks.length > 500) fields.mechanicRemarks = 'Mechanic remarks must be 500 characters or fewer';
    if (Object.keys(fields).length) {
      return res.status(400).json({ success: false, message: fields.mechanicRemarks, errors: fields });
    }
    const hours = req.body.reportSummary?.totalHours;
    if (hours !== undefined && (typeof hours !== 'number' || !Number.isFinite(hours) || hours < 0)) {
      return res.status(400).json({ success: false, message: 'Total hours must be a non-negative number' });
    }
    const jobCard = await JobCard.findById(req.body.jobCard);
    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found',
      });
    }

    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) {
      return res.status(400).json({ success: false, message: 'Your account does not have an employee profile. Please contact your manager.' });
    }

    // Generate report ID
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const reportId = `FIN-${dateStr}-${randomNum}`;

    // Handle enhanced report data structure
    const reportData = {
      ...req.body,
      reportId,
      technician: employee._id,
      mechanicRemarks,
      completionDate: new Date(),
    };

    // Accept both report line items and the populated job card parts used by the form.
    if (Array.isArray(req.body.partsReplaced)) {
      reportData.partsReplaced = req.body.partsReplaced.map(part => ({
        itemName: part.itemName ?? part.name ?? part.item?.name,
        partNumber: part.partNumber ?? part.item?.itemCode,
        quantity: part.quantity,
        status: part.status,
        cost: part.cost ?? part.total ?? 0,
        serialNumber: part.serialNumber,
      }));
    }

    // Calculate totals if provided in report summary
    if (req.body.reportSummary) {
      reportData.totalPartsCost = req.body.reportSummary.totalPartsCost || 0;
      reportData.laborCost = req.body.reportSummary.laborCost || 0;
      reportData.totalCost = req.body.reportSummary.totalCost || 0;
      reportData.timeSummary = {
        ...reportData.timeSummary,
        totalHours: req.body.reportSummary.totalHours || 0,
      };
    }

    // Handle safety check structure
    if (req.body.safetyCheck) {
      reportData.safetyCheck = {
        overallStatus: req.body.safetyCheck.overallStatus || 'pass',
        checkedItems: req.body.safetyCheck.checkedItems || [],
      };
    }

    // Handle road test result structure
    if (req.body.roadTestResult) {
      reportData.roadTestResult = {
        result: req.body.roadTestResult.result || 'pending',
        remarks: req.body.roadTestResult.remarks || '',
        testDate: req.body.roadTestResult.testDate || new Date(),
      };
    }

    const report = await FinalInspectionReport.create(reportData);

    // Update job card status if report is submitted
    if (req.body.status === 'submitted' || req.body.status === 'completed') {
      await JobCard.findByIdAndUpdate(req.body.jobCard, {
        status: 'ready_for_delivery',
        finalInspectionReport: report._id,
      });
    }

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.fromEntries(Object.entries(error.errors).map(([field, issue]) => [field, issue.message]));
      return res.status(400).json({ success: false, message: Object.values(errors).join('; '), errors });
    }
    console.error('Error creating final inspection report:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating final inspection report',
      error: error.message,
    });
  }
};

// Update final inspection report
export const updateFinalInspectionReport = async (req, res) => {
  try {
    const report = await FinalInspectionReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Final inspection report not found',
      });
    }

    // Check ownership
    const employee = await Employee.findOne({ user: req.user.id });
    if (report.technician.toString() !== req.user.id && report.technician.toString() !== employee?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report',
      });
    }

    const updatedReport = await FinalInspectionReport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Update job card status if report is submitted
    if (req.body.status === 'submitted' || req.body.status === 'completed') {
      await JobCard.findByIdAndUpdate(report.jobCard, {
        status: 'completed',
        finalInspectionReport: report._id,
      });
    }

    res.json({
      success: true,
      data: updatedReport,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating final inspection report',
      error: error.message,
    });
  }
};

// Get report data for job card (for form pre-fill)
export const getReportDataForJobCard = async (req, res) => {
  try {
    const { jobCardId } = req.params;

    const [jobCard, partsRequests, roadTest] = await Promise.all([
      JobCard.findById(jobCardId)
        .populate('vehicle')
        .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
        .populate({ path: 'assignedTechnician', populate: { path: 'user', select: 'firstName lastName' } }),
      SparePartsRequest.find({ jobCard: jobCardId, status: 'issued' }).populate('item', 'itemName itemCode'),
      RoadTest.findOne({ jobCard: jobCardId }).sort({ createdAt: -1 }).populate('technician', 'name'),
    ]);

    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found',
      });
    }

    const partsReplaced = partsRequests.map((request) => ({
      itemName: request.itemName,
      partNumber: request.item?.itemCode || 'N/A',
      quantity: request.approvedQuantity,
      status: 'Installed',
      cost: 0,
    }));

    res.json({
      success: true,
      data: {
        jobCard,
        partsReplaced,
        roadTest,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching report data',
      error: error.message,
    });
  }
};
