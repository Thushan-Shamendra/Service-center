import mongoose from 'mongoose';
import JobCard from '../models/JobCard.js';
import WorkLog from '../models/WorkLog.js';
import RoadTest from '../models/RoadTest.js';
import SparePartsRequest from '../models/SparePartsRequest.js';
import FinalInspectionReport from '../models/FinalInspectionReport.js';
import Employee from '../models/Employee.js';
import ServiceTimeline from '../models/ServiceTimeline.js';
import Notification from '../models/Notification.js';

// @desc    Get repair progress data for a job card
// @route   GET /api/repair-progress/:jobCardId
export const getRepairProgress = async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.jobCardId)
      .populate({ 
        path: 'customer', 
        populate: { path: 'user', select: 'firstName lastName mobile email' }
      })
      .populate('vehicle')
      .populate({ 
        path: 'assignedTechnician', 
        populate: { path: 'user', select: 'firstName lastName' }
      })
      .populate({ path: 'parts.item', select: 'name itemCode currentStock unit' });

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job card not found' });
    }

    // Get related data
    const [workLogs, roadTests, partsRequests, finalReport] = await Promise.all([
      WorkLog.find({ jobCard: jobCard._id })
        .populate('technician', 'firstName lastName')
        .sort({ createdAt: -1 }),
      RoadTest.find({ jobCard: jobCard._id })
        .populate('technician', 'firstName lastName')
        .sort({ createdAt: -1 }),
      SparePartsRequest.find({ jobCard: jobCard._id })
        .populate('item', 'name itemCode')
        .sort({ createdAt: -1 }),
      FinalInspectionReport.findOne({ jobCard: jobCard._id })
        .populate('approvedBy', 'firstName lastName')
    ]);

    res.status(200).json({
      success: true,
      data: {
        jobCard,
        workLogs,
        roadTests,
        partsRequests,
        finalReport
      }
    });
  } catch (error) {
    console.error('Error fetching repair progress:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update repair status with progression validation
// @route   PUT /api/repair-progress/:jobCardId/status
export const updateRepairStatus = async (req, res) => {
  try {
    const { status, remarks, progress, additionalData } = req.body;
    const jobCard = await JobCard.findById(req.params.jobCardId).populate('customer');

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job card not found' });
    }

    // Validate status progression based on wireflow
    const validStatusTransitions = {
      'pending': ['inspection_complete'],
      'inspection_complete': ['repair_started'],
      'repair_started': ['waiting_for_parts', 'repair_in_progress'],
      'waiting_for_parts': ['repair_in_progress'],
      'repair_in_progress': ['testing'],
      'testing': ['work_complete'],
      'work_complete': [], // Final state - requires final inspection report
    };

    const currentStatus = jobCard.status;
    const allowedTransitions = validStatusTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status transition from ${currentStatus} to ${status}. Allowed transitions: ${allowedTransitions.join(', ')}` 
      });
    }

    // Additional validation for specific transitions
    if (status === 'testing') {
      // Check if work has been recorded
      if (!jobCard.workPerformed || jobCard.workPerformed.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Work performed must be recorded before moving to testing phase' 
        });
      }
    }

    if (status === 'work_complete') {
      // Check if road test was passed
      const roadTests = await RoadTest.find({ jobCard: jobCard._id, result: 'pass' });
      if (roadTests.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Road test must be passed before marking work as complete' 
        });
      }
    }

    // Update job card status
    jobCard.status = status;
    jobCard.statusHistory.push({
      status,
      changedBy: req.user._id,
      remarks: remarks || `Status updated to ${status}`,
      changedAt: new Date(),
    });

    // Update progress if provided or calculate based on status
    if (progress !== undefined) {
      jobCard.progress = Math.min(100, Math.max(0, progress));
    } else {
      const progressMap = {
        'inspection_complete': 20,
        'repair_started': 35,
        'waiting_for_parts': 40,
        'repair_in_progress': 70,
        'testing': 90,
        'work_complete': 100,
      };
      jobCard.progress = progressMap[status] || jobCard.progress;
    }

    // Handle additional data based on status
    if (additionalData) {
      if (status === 'inspection_complete' && additionalData.inspectionNotes) {
        jobCard.inspectionNotes = additionalData.inspectionNotes;
        if (additionalData.problemsFound) {
          jobCard.problemsFound = additionalData.problemsFound;
        }
      }
      if (status === 'repair_started' && additionalData.assignedBay) {
        jobCard.serviceBay = additionalData.assignedBay;
      }
      if (status === 'repair_in_progress' && additionalData.workPerformed) {
        jobCard.workPerformed = additionalData.workPerformed;
      }
    }

    await jobCard.save();

    // Add service timeline event
    const eventTypeMap = {
      'inspection_complete': 'inspection_completed',
      'repair_started': 'repair_started',
      'waiting_for_parts': 'waiting_for_parts',
      'repair_in_progress': 'repair_in_progress',
      'testing': 'testing_started',
      'work_complete': 'work_completed',
    };
    
    await ServiceTimeline.create({
      jobCard: jobCard._id,
      eventType: eventTypeMap[status] || 'status_changed',
      description: `Repair status changed to ${status.replace(/_/g, ' ')}`,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
    });

    // Send notification to customer
    if (jobCard.customer?.user) {
      await Notification.create({
        user: jobCard.customer.user,
        title: `Repair Progress Update (${jobCard.jobCardNumber})`,
        description: `Your vehicle repair status is now: ${status.replace(/_/g, ' ')}.`,
        type: 'repair_update',
      });
    }

    res.status(200).json({
      success: true,
      data: jobCard,
      message: `Repair status updated to ${status.replace(/_/g, ' ')}`
    });
  } catch (error) {
    console.error('Error updating repair status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add inspection notes and evidence
// @route   POST /api/repair-progress/:jobCardId/inspection
export const addInspectionData = async (req, res) => {
  try {
    const { notes, problemsFound, evidence } = req.body;
    const jobCard = await JobCard.findById(req.params.jobCardId);

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job card not found' });
    }

    if (notes) jobCard.inspectionNotes = notes;
    if (problemsFound) jobCard.problemsFound = problemsFound;
    if (evidence && Array.isArray(evidence)) {
      jobCard.evidence = [...(jobCard.evidence || []), ...evidence];
    }

    await jobCard.save();

    res.status(200).json({
      success: true,
      data: jobCard,
      message: 'Inspection data added successfully'
    });
  } catch (error) {
    console.error('Error adding inspection data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add work performed during repair
// @route   POST /api/repair-progress/:jobCardId/work-performed
export const addWorkPerformed = async (req, res) => {
  try {
    const { workItems, progress } = req.body;
    const jobCard = await JobCard.findById(req.params.jobCardId);

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job card not found' });
    }

    if (workItems && Array.isArray(workItems)) {
      jobCard.workPerformed = [...(jobCard.workPerformed || []), ...workItems];
    }

    if (progress !== undefined) {
      jobCard.progress = Math.min(100, Math.max(0, progress));
    }

    await jobCard.save();

    res.status(200).json({
      success: true,
      data: jobCard,
      message: 'Work performed added successfully'
    });
  } catch (error) {
    console.error('Error adding work performed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request spare parts for a job
// @route   POST /api/repair-progress/:jobCardId/parts-request
export const requestParts = async (req, res) => {
  try {
    const { parts } = req.body; // Array of { item, itemName, requestedQuantity, reason, priority }
    const jobCard = await JobCard.findById(req.params.jobCardId);

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job card not found' });
    }

    // Get employee ID
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Create parts requests
    const createdRequests = [];
    for (const part of parts) {
      const sparePartsRequest = await SparePartsRequest.create({
        jobCard: jobCard._id,
        technician: employee._id,
        item: part.item,
        itemName: part.itemName,
        requestedQuantity: part.requestedQuantity,
        currentStock: part.currentStock || 0,
        reason: part.reason,
        priority: part.priority || 'medium',
      });
      createdRequests.push(sparePartsRequest);
    }

    res.status(201).json({
      success: true,
      data: createdRequests,
      message: 'Parts requested successfully'
    });
  } catch (error) {
    console.error('Error requesting parts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update repair progress percentage
// @route   PUT /api/repair-progress/:jobCardId/progress
export const updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const jobCard = await JobCard.findById(req.params.jobCardId);

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job card not found' });
    }

    if (progress < 0 || progress > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Progress must be between 0 and 100' 
      });
    }

    jobCard.progress = progress;
    await jobCard.save();

    res.status(200).json({
      success: true,
      data: jobCard,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get status-specific UI data
// @route   GET /api/repair-progress/:jobCardId/status-data
export const getStatusSpecificData = async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.jobCardId)
      .populate('vehicle')
      .populate({ 
        path: 'assignedTechnician', 
        populate: { path: 'user', select: 'firstName lastName' }
      });

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job card not found' });
    }

    let statusData = {};

    switch (jobCard.status) {
      case 'inspection_complete':
        statusData = {
          inspectionNotes: jobCard.inspectionNotes,
          problemsFound: jobCard.problemsFound,
          evidence: jobCard.evidence,
          nextActions: ['repair_started']
        };
        break;
      case 'repair_started':
        statusData = {
          serviceBay: jobCard.serviceBay,
          assignedTechnician: jobCard.assignedTechnician,
          startTime: jobCard.statusHistory?.find(h => h.status === 'repair_started')?.changedAt,
          nextActions: ['waiting_for_parts', 'repair_in_progress']
        };
        break;
      case 'waiting_for_parts':
        const partsRequests = await SparePartsRequest.find({ jobCard: jobCard._id })
          .populate('item', 'name itemCode')
          .sort({ createdAt: -1 });
        statusData = {
          partsRequests,
          nextActions: ['repair_in_progress']
        };
        break;
      case 'repair_in_progress':
        statusData = {
          workPerformed: jobCard.workPerformed,
          progress: jobCard.progress,
          nextActions: ['testing']
        };
        break;
      case 'testing':
        const roadTests = await RoadTest.find({ jobCard: jobCard._id })
          .populate('technician', 'firstName lastName')
          .sort({ createdAt: -1 });
        statusData = {
          roadTests,
          hasPassedTest: roadTests.some(rt => rt.result === 'pass'),
          nextActions: ['work_complete']
        };
        break;
      case 'work_complete':
        const finalReport = await FinalInspectionReport.findOne({ jobCard: jobCard._id });
        statusData = {
          workPerformed: jobCard.workPerformed,
          parts: jobCard.parts,
          finalReport,
          timeLogs: jobCard.timeLogs,
          nextActions: ['create_final_inspection']
        };
        break;
      default:
        statusData = {
          nextActions: []
        };
    }

    res.status(200).json({
      success: true,
      data: {
        currentStatus: jobCard.status,
        ...statusData
      }
    });
  } catch (error) {
    console.error('Error fetching status-specific data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getRepairProgress,
  updateRepairStatus,
  addInspectionData,
  addWorkPerformed,
  requestParts,
  updateProgress,
  getStatusSpecificData
};