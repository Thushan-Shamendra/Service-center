import VehicleInspection from '../models/VehicleInspection.js';
import JobCard from '../models/JobCard.js';
import Employee from '../models/Employee.js';
import SparePartsRequest from '../models/SparePartsRequest.js';
import InventoryItem from '../models/InventoryItem.js';
import { upload } from '../middleware/upload.js';

// Helper function to get Employee ID from User ID
const getEmployeeId = async (userId) => {
  const employee = await Employee.findOne({ user: userId });
  return employee ? employee._id : null;
};

// Get all inspections for a technician
export const getInspections = async (req, res) => {
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

    const inspections = await VehicleInspection.find(filter)
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
      message: 'Error fetching inspections',
      error: error.message,
    });
  }
};

// Get inspection by ID
export const getInspectionById = async (req, res) => {
  try {
    const inspection = await VehicleInspection.findById(req.params.id)
      .populate('jobCard')
      .populate('technician', 'name employeeId');

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found',
      });
    }

    res.json({
      success: true,
      data: inspection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inspection',
      error: error.message,
    });
  }
};

// Create new inspection
export const createInspection = async (req, res) => {
  try {
    const employeeId = await getEmployeeId(req.user._id);
    
    if (!employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Employee record not found',
      });
    }
    
    const jobCard = await JobCard.findById(req.body.jobCard);
    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found',
      });
    }

    // Check if employee is assigned to this job card
    if (jobCard.assignedTechnician && jobCard.assignedTechnician.toString() !== employeeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create inspection for this job card',
      });
    }

    const inspection = await VehicleInspection.create({
      ...req.body,
      technician: employeeId,
    });

    // Update job card status to inspection
    await JobCard.findByIdAndUpdate(req.body.jobCard, {
      status: 'diagnosing',
      inspectionDate: new Date(),
    });

    res.status(201).json({
      success: true,
      data: inspection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating inspection',
      error: error.message,
    });
  }
};

// Update inspection
export const updateInspection = async (req, res) => {
  try {
    const employeeId = await getEmployeeId(req.user._id);
    
    if (!employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Employee record not found',
      });
    }
    
    const inspection = await VehicleInspection.findById(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found',
      });
    }

    // Check ownership - allow if user is the technician or admin/manager
    if (inspection.technician.toString() !== employeeId.toString() && 
        !['administrator', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this inspection',
      });
    }

    const updatedInspection = await VehicleInspection.findByIdAndUpdate(
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
      message: 'Error updating inspection',
      error: error.message,
    });
  }
};

// Complete inspection
export const completeInspection = async (req, res) => {
  try {
    const employeeId = await getEmployeeId(req.user._id);
    
    if (!employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Employee record not found',
      });
    }
    
    const inspection = await VehicleInspection.findById(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found',
      });
    }

    // Check ownership - allow if user is the technician or admin/manager
    if (inspection.technician.toString() !== employeeId.toString() && 
        !['administrator', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this inspection',
      });
    }

    inspection.status = 'completed';
    inspection.completedAt = new Date();
    await inspection.save();

    // Create spare parts requests for any requested parts
    if (inspection.requestedParts && inspection.requestedParts.length > 0) {
      for (const part of inspection.requestedParts) {
        const inventoryItem = await InventoryItem.findById(part.item);
        if (inventoryItem) {
          await SparePartsRequest.create({
            jobCard: inspection.jobCard,
            technician: employeeId,
            item: part.item,
            itemName: part.itemName || inventoryItem.itemName,
            requestedQuantity: part.quantity,
            currentStock: inventoryItem.quantity,
            reason: part.reason || 'Parts needed for inspection',
            priority: part.priority || 'medium',
            status: 'pending',
          });
        }
      }
    }

    // Update job card with inspection data
    await JobCard.findByIdAndUpdate(inspection.jobCard, {
      inspectionNotes: inspection.inspectionNotes,
      odometer: inspection.odometerReading,
      vehicleCondition: inspection.vehicleCondition,
      problemsFound: inspection.problemsFound.map(p => p.problem),
      recommendedRepairs: inspection.recommendedRepairs,
      status: 'pending', // Move to pending for repair assignment
    });

    res.json({
      success: true,
      data: inspection,
      message: 'Inspection completed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing inspection',
      error: error.message,
    });
  }
};

// Upload inspection media
export const uploadInspectionMedia = async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const inspection = await VehicleInspection.findById(req.params.id);
    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found',
      });
    }

    const mediaUrl = {
      type: file.mimetype.startsWith('video/') ? 'video' : 'image',
      url: file.path,
      category: req.body.category || 'general',
      description: req.body.description || '',
    };

    inspection.beforeMedia.push(mediaUrl);
    await inspection.save();

    res.json({
      success: true,
      data: inspection,
      message: 'Media uploaded successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading media',
      error: error.message,
    });
  }
};