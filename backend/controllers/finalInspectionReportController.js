import FinalInspectionReport from '../models/FinalInspectionReport.js';
import JobCard from '../models/JobCard.js';
import SparePartsRequest from '../models/SparePartsRequest.js';
import RoadTest from '../models/RoadTest.js';

// Get final inspection reports for a technician
export const getFinalInspectionReports = async (req, res) => {
  try {
    const { jobCard } = req.query;
    const filter = { technician: req.user.id };
    
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

// Get final inspection report by ID
export const getFinalInspectionReportById = async (req, res) => {
  try {
    const report = await FinalInspectionReport.findById(req.params.id)
      .populate('jobCard')
      .populate('technician', 'firstName lastName');

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
    const jobCard = await JobCard.findById(req.body.jobCard);
    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found',
      });
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
      technician: req.user.id,
      completionDate: new Date(),
    };

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
    if (report.technician.toString() !== req.user.id) {
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
      JobCard.findById(jobCardId).populate('vehicle', 'make model year registrationNumber').populate('customer', 'name'),
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
