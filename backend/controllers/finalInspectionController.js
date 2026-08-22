import FinalInspection from '../models/FinalInspection.js';
import JobCard from '../models/JobCard.js';
import RoadTest from '../models/RoadTest.js';
import Employee from '../models/Employee.js';

// Helper function to get Employee ID from User ID
const getEmployeeId = async (userId) => {
  const employee = await Employee.findOne({ user: userId });
  return employee ? employee._id : null;
};

// Get all final inspections for a technician
export const getFinalInspections = async (req, res) => {
  try {
    const { status, jobCard } = req.query;
    const employeeId = await getEmployeeId(req.user._id);
    
    if (!employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Employee record not found',
      });
    }
    
    const filter = { technician: employeeId };
    
    if (status) filter.status = status;
    if (jobCard) filter.jobCard = jobCard;

    const inspections = await FinalInspection.find(filter)
      .populate('jobCard', 'jobCardNumber vehicle customer')
      .populate('technician', 'name employeeId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: inspections.length,
      data: inspections,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching final inspections',
      error: error.message,
    });
  }
};

// Get final inspection by ID
export const getFinalInspectionById = async (req, res) => {
  try {
    const inspection = await FinalInspection.findById(req.params.id)
      .populate('jobCard')
      .populate('technician', 'name employeeId')
      .populate('roadTestResult.performedBy', 'name employeeId');

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Final inspection not found',
      });
    }

    res.json({
      success: true,
      data: inspection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching final inspection',
      error: error.message,
    });
  }
};

// Create new final inspection
export const createFinalInspection = async (req, res) => {
  try {
    const employeeId = await getEmployeeId(req.user._id);
    
    if (!employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Employee record not found',
      });
    }
    
    const jobCard = await JobCard.findById(req.body.jobCard)
      .populate('vehicle')
      .populate('customer');

    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found',
      });
    }

    // Validate job card assignment
    if (jobCard.assignedTechnician?.toString() !== employeeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create final inspection for this job card',
      });
    }

    // Check if road test was completed and passed
    if (jobCard.roadTest?.result !== 'pass') {
      return res.status(400).json({
        success: false,
        message: 'Job card must have a passed road test before final inspection',
      });
    }

    // Load latest road test result
    const latestRoadTest = await RoadTest.findOne({ jobCard: req.body.jobCard })
      .sort({ createdAt: -1 });

    if (latestRoadTest) {
      req.body.roadTestResult = {
        roadTestId: latestRoadTest.roadTestId,
        testDate: latestRoadTest.testDate,
        performedBy: latestRoadTest.technician,
        result: latestRoadTest.result,
        mileageAfterTest: latestRoadTest.mileageAfterTest,
        remarks: latestRoadTest.remarks,
      };
    }

    // Load parts from job card
    if (jobCard.parts && jobCard.parts.length > 0) {
      req.body.partsReplaced = jobCard.parts.map(part => ({
        itemCode: part.item?.itemCode || 'N/A',
        itemName: part.name,
        quantityUsed: part.quantity,
        source: 'inventory',
      }));
    }

    // Load work performed from job card
    if (jobCard.workPerformed && jobCard.workPerformed.length > 0) {
      req.body.workPerformed = {
        completedServices: jobCard.workPerformed,
        additionalWorkCompleted: jobCard.inspectionNotes || '',
      };
    }

    const inspection = await FinalInspection.create({
      ...req.body,
      technician: employeeId,
    });

    res.status(201).json({
      success: true,
      data: inspection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating final inspection',
      error: error.message,
    });
  }
};

// Update final inspection
export const updateFinalInspection = async (req, res) => {
  try {
    const employeeId = await getEmployeeId(req.user._id);
    
    if (!employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Employee record not found',
      });
    }
    
    const inspection = await FinalInspection.findById(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Final inspection not found',
      });
    }

    // Check ownership and status - allow if user is the technician or admin/manager
    if (inspection.technician.toString() !== employeeId.toString() && 
        !['administrator', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this final inspection',
      });
    }

    if (inspection.status === 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a submitted final inspection',
      });
    }

    const updatedInspection = await FinalInspection.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedInspection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating final inspection',
      error: error.message,
    });
  }
};

// Submit final inspection
export const submitFinalInspection = async (req, res) => {
  try {
    const employeeId = await getEmployeeId(req.user._id);
    
    if (!employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Employee record not found',
      });
    }
    
    const inspection = await FinalInspection.findById(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Final inspection not found',
      });
    }

    // Check ownership - allow if user is the technician or admin/manager
    if (inspection.technician.toString() !== employeeId.toString() && 
        !['administrator', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this final inspection',
      });
    }

    // Validation checks
    if (inspection.safetyCheck.result === 'fail' && !inspection.remainingIssues) {
      return res.status(400).json({
        success: false,
        message: 'Remaining issues are required when safety check fails',
      });
    }

    if (inspection.finalVehicleCondition === 'needs_further_repair' && !inspection.remainingIssues) {
      return res.status(400).json({
        success: false,
        message: 'Remaining issues are required when vehicle needs further repair',
      });
    }

    if (!inspection.technicianSignature?.signatureData) {
      return res.status(400).json({
        success: false,
        message: 'Technician signature is required',
      });
    }

    inspection.status = 'submitted';
    inspection.submittedAt = new Date();
    await inspection.save();

    // Update job card status
    await JobCard.findByIdAndUpdate(inspection.jobCard, {
      finalInspection: {
        finalCondition: inspection.finalVehicleCondition,
        safetyCheck: inspection.safetyCheck.result,
        remainingIssues: inspection.remainingIssues,
        futureRecommendations: inspection.futureRecommendations?.additionalRecommendations,
        mechanicRemarks: inspection.mechanicRemarks,
        signature: inspection.technicianSignature.signatureData,
      },
      status: 'ready_for_delivery',
    });

    res.json({
      success: true,
      data: inspection,
      message: 'Final inspection submitted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting final inspection',
      error: error.message,
    });
  }
};