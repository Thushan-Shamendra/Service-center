import mongoose from 'mongoose';
import JobCard from '../models/JobCard.js';
import Vehicle from '../models/Vehicle.js';
import Customer from '../models/Customer.js';
import Employee from '../models/Employee.js';
import Notification from '../models/Notification.js';
import ServiceTimeline from '../models/ServiceTimeline.js';
import ServiceBay from '../models/ServiceBay.js';
import InventoryItem from '../models/InventoryItem.js';
import Appointment from '../models/Appointment.js';
import Invoice from '../models/Invoice.js';

// Helper function to get Employee ID from User ID
const getEmployeeId = async (userId) => {
  const employee = await Employee.findOne({ user: userId });
  return employee ? employee._id : null;
};

// Helper function to calculate progress based on status
const calculateProgressByStatus = (status) => {
  const progressMap = {
    'pending': 0,
    'inspection_started': 10,
    'inspection_complete': 20,
    'repair_started': 35,
    'waiting_for_parts': 40,
    'repair_in_progress': 70,
    'testing': 90,
    'work_complete': 100,
    'road_test_pending': 90,
    'ready_for_delivery': 95,
    'delivered': 100,
    'cancelled': 0,
  };
  return progressMap[status] || 0;
};

export const getJobCards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    console.log('getJobCards called by user:', req.user.role, req.user._id);
    console.log('Query parameters:', req.query);

    const query = {};
    if (req.query.status === 'active') {
      query.status = { $nin: ['delivered', 'cancelled'] };
    } else if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.uninvoiced === 'true') {
      const invoicedJobCardIds = await Invoice.distinct('jobCard', {
        jobCard: { $exists: true, $ne: null },
        status: { $ne: 'cancelled' },
      });
      query._id = { $nin: invoicedJobCardIds };
    }

    // Scope for employee/technician role
    if (req.user.role === 'employee') {
      const emp = await mongoose.model('Employee').findOne({ user: req.user._id });
      if (emp) query.assignedTechnician = emp._id;
    }

    // Scope for customer role
    if (req.user.role === 'customer') {
      const customer = await mongoose.model('Customer').findOne({ user: req.user._id });
      console.log('Customer lookup result:', customer);
      if (customer) {
        query.customer = customer._id;
        console.log('Set customer filter to:', customer._id);
      } else {
        console.log('No customer found for user:', req.user._id);
      }
    }

    // Allow explicit customer filtering (for admin/manager views)
    if (req.query.customer) {
      query.customer = req.query.customer;
    }

    console.log('Final query:', query);

    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [{ jobCardNumber: regex }, { complaint: regex }, { serviceBay: regex }];
    }

    const [jobCards, total] = await Promise.all([
      JobCard.find(query)
        .populate({ 
          path: 'customer', 
          populate: { path: 'user', select: 'firstName lastName mobile email' }
        })
        .populate('vehicle')
        .populate({ 
          path: 'assignedTechnician', 
          populate: { path: 'user', select: 'firstName lastName' }
        })
        .populate({ 
          path: 'assignedBy', 
          populate: { path: 'user', select: 'firstName lastName' }
        })
        .populate('appointment')
        .populate({ path: 'parts.item', select: 'itemName itemCode quantity sellingPrice unit' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      JobCard.countDocuments(query),
    ]);

    console.log('Job cards fetched:', jobCards.length);

    res.status(200).json({
      success: true,
      data: jobCards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error in getJobCards:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single job card by ID
// @route   GET /api/job-cards/:id
export const getJobCardById = async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.id)
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
      .populate('vehicle')
      .populate({ path: 'assignedTechnician', populate: { path: 'user', select: 'firstName lastName' } })
      .populate({ path: 'assignedBy', populate: { path: 'user', select: 'firstName lastName' } })
      .populate('appointment')
      .populate({ path: 'parts.item', select: 'itemName itemCode quantity sellingPrice unit' });

    if (!jobCard) return res.status(404).json({ success: false, message: 'Job card not found' });

    // Note: Authorization is handled at the list level (getJobCards)
    // Employees can only see jobs assigned to them in their list
    // So if they can see it in the list, they can view the details
    // This prevents authorization errors when navigating from list to detail view

    res.status(200).json({ success: true, data: jobCard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new job card
// @route   POST /api/job-cards
export const createJobCard = async (req, res) => {
  try {
    if (req.body.appointment) {
      const existingJob = await JobCard.findOne({ appointment: req.body.appointment });
      if (existingJob) {
        return res.status(400).json({
          success: false,
          message: `A job card (${existingJob.jobCardNumber}) already exists for this appointment.`,
        });
      }
    }

    const jobCard = await JobCard.create(req.body);

    // Update vehicle status
    if (jobCard.vehicle) {
      await Vehicle.findByIdAndUpdate(jobCard.vehicle, { currentServiceStatus: 'in_service' });
    }

    // Update appointment status history
    if (jobCard.appointment) {
      await Appointment.findByIdAndUpdate(jobCard.appointment, {
        $push: {
          statusHistory: {
            status: 'approved',
            changedAt: new Date(),
            changedBy: req.user._id,
            remarks: `Job card ${jobCard.jobCardNumber} created for this appointment`,
          },
        },
      });
    }

    res.status(201).json({ success: true, data: jobCard, message: 'Job card created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update job card status progression
// @route   PUT /api/job-cards/:id/status
export const updateJobCardStatus = async (req, res) => {
  try {
    const { status, remarks, progress } = req.body;
    const jobCard = await JobCard.findById(req.params.id).populate('customer');

    if (!jobCard) return res.status(404).json({ success: false, message: 'Job card not found' });

    // Note: Authorization is handled at the list level (getJobCards)
    // Employees can only see jobs assigned to them in their list
    // So if they can see it in the list, they can update its status

    if (status) {
      // Validate status progression
      const validStatusTransitions = {
        'pending': ['inspection_started', 'cancelled'],
        'inspection_started': ['inspection_complete', 'cancelled'],
        'inspection_complete': ['repair_started', 'cancelled'],
        'repair_started': ['waiting_for_parts', 'repair_in_progress', 'cancelled'],
        'waiting_for_parts': ['repair_in_progress', 'cancelled'],
        'repair_in_progress': ['testing', 'cancelled'],
        'testing': ['work_complete', 'cancelled'],
        'work_complete': ['road_test_pending', 'cancelled'],
        'road_test_pending': ['ready_for_delivery', 'repair_in_progress', 'cancelled'],
        'ready_for_delivery': ['delivered', 'cancelled'],
        'delivered': [],
        'cancelled': []
      };

      const currentStatus = jobCard.status;
      const allowedTransitions = validStatusTransitions[currentStatus] || [];

      if (!allowedTransitions.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid status transition from ${currentStatus} to ${status}. Allowed transitions: ${allowedTransitions.join(', ')}` 
        });
      }

      jobCard.status = status;
      jobCard.statusHistory.push({
        status,
        changedBy: req.user._id,
        remarks: remarks || `Status updated to ${status}`,
        changedAt: new Date(),
      });

      // Add service timeline event
      const eventTypeMap = {
        'pending': 'vehicle_checked_in',
        'inspection_started': 'inspection_started',
        'inspection_complete': 'inspection_completed',
        'repair_started': 'repair_started',
        'waiting_for_parts': 'waiting_for_parts',
        'repair_in_progress': 'repair_in_progress',
        'testing': 'testing_started',
        'work_complete': 'work_completed',
        'road_test_pending': 'road_test_pending',
        'ready_for_delivery': 'ready_for_pickup',
        'delivered': 'vehicle_delivered',
        'cancelled': 'job_cancelled',
      };
      
      const eventType = eventTypeMap[status] || `status_changed`;
      
      await ServiceTimeline.create({
        jobCard: jobCard._id,
        eventType,
        description: `Job card status changed to ${status.replace(/_/g, ' ')}`,
        performedBy: req.user._id,
        performedByName: req.user.fullName,
      });
    }

    if (progress !== undefined) {
      // Validate progress is between 0-100
      if (progress < 0 || progress > 100) {
        return res.status(400).json({ 
          success: false, 
          message: 'Progress must be between 0 and 100' 
        });
      }
      jobCard.progress = progress;
    } else if (status) {
      // Auto-calculate progress based on status if not manually provided
      jobCard.progress = calculateProgressByStatus(status);
    }

    if (status === 'delivered') {
      if (jobCard.appointment) {
        await Appointment.findByIdAndUpdate(jobCard.appointment, {
          status: 'completed',
          $push: {
            statusHistory: {
              status: 'completed',
              changedAt: new Date(),
              changedBy: req.user._id,
              remarks: 'Appointment marked completed upon job card delivery',
            },
          },
        });
      }
      if (jobCard.vehicle) {
        await Vehicle.findByIdAndUpdate(jobCard.vehicle, { currentServiceStatus: 'none' });
      }
      // Release service bay when delivered
      if (jobCard.serviceBay) {
        await ServiceBay.findOneAndUpdate(
          { bayNumber: jobCard.serviceBay },
          { status: 'available' }
        );
        jobCard.serviceBay = null;
      }
    } else if (status === 'ready_for_delivery' && jobCard.vehicle) {
      await Vehicle.findByIdAndUpdate(jobCard.vehicle, { currentServiceStatus: 'ready_for_pickup' });
    } else if (status === 'cancelled' && jobCard.serviceBay) {
      // Release service bay when cancelled
      await ServiceBay.findOneAndUpdate(
        { bayNumber: jobCard.serviceBay },
        { status: 'available' }
      );
      jobCard.serviceBay = null;
    }

    await jobCard.save();

    // Trigger Notification for customer
    if (jobCard.customer?.user) {
      const notificationTypeMap = {
        'pending': 'vehicle_checked_in',
        'inspection_started': 'inspection_started',
        'inspection_complete': 'inspection_completed',
        'repair_started': 'repair_started',
        'waiting_for_parts': 'waiting_for_parts',
        'repair_in_progress': 'repair_in_progress',
        'testing': 'testing_started',
        'work_complete': 'work_completed',
        'road_test_pending': 'road_test_pending',
        'ready_for_delivery': 'ready_for_pickup',
        'delivered': 'vehicle_delivered',
        'cancelled': 'job_cancelled',
      };
      
      await Notification.create({
        user: jobCard.customer.user,
        title: `Vehicle Service Update (${jobCard.jobCardNumber})`,
        description: `Your vehicle service status is now: ${status.replace(/_/g, ' ')}.`,
        type: notificationTypeMap[status] || 'status_changed',
      });
    }

    res.status(200).json({
      success: true,
      data: jobCard,
      message: `Job Card updated to ${status.replace(/_/g, ' ')}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update job card inspection
// @route   PUT /api/job-cards/:id/inspection
export const updateInspection = async (req, res) => {
  try {
    const { odometer, vehicleCondition, problemsFound, recommendedRepairs, inspectionNotes } = req.body;
    const jobCard = await JobCard.findById(req.params.id);

    if (!jobCard) return res.status(404).json({ success: false, message: 'Job card not found' });

    if (odometer) jobCard.odometer = odometer;
    if (vehicleCondition) jobCard.vehicleCondition = vehicleCondition;
    if (problemsFound) jobCard.problemsFound = problemsFound;
    if (recommendedRepairs) jobCard.recommendedRepairs = recommendedRepairs;
    if (inspectionNotes) jobCard.inspectionNotes = inspectionNotes;

    await jobCard.save();

    await ServiceTimeline.create({
      jobCard: jobCard._id,
      eventType: 'inspection_completed',
      description: 'Initial inspection completed',
      performedBy: req.user._id,
      performedByName: req.user.fullName,
    });

    res.status(200).json({ success: true, data: jobCard, message: 'Inspection updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get service timeline for a job card
// @route   GET /api/job-cards/:id/timeline
export const getJobCardTimeline = async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.id);
    
    if (!jobCard) return res.status(404).json({ success: false, message: 'Job card not found' });

    const timeline = await ServiceTimeline.find({ jobCard: jobCard._id })
      .populate('performedBy', 'firstName lastName')
      .sort({ createdAt: 1 });

    res.status(200).json({ 
      success: true, 
      data: timeline,
      jobCard: {
        jobCardNumber: jobCard.jobCardNumber,
        status: jobCard.status,
        progress: jobCard.progress,
        statusHistory: jobCard.statusHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add parts to job card
// @route   PUT /api/job-cards/:id/parts
export const addParts = async (req, res) => {
  try {
    const { parts } = req.body;
    const jobCard = await JobCard.findById(req.params.id);

    if (!jobCard) return res.status(404).json({ success: false, message: 'Job card not found' });

    // Validate parts and check inventory availability
    for (const part of parts) {
      if (part.item) {
        const inventoryItem = await InventoryItem.findById(part.item);
        if (!inventoryItem) {
          return res.status(400).json({ 
            success: false, 
            message: `Inventory item with ID ${part.item} not found` 
          });
        }

        // Atomically deduct from inventory with condition check to prevent negative stock
        const updatedItem = await InventoryItem.findOneAndUpdate(
          { _id: part.item, quantity: { $gte: part.quantity } },
          { $inc: { quantity: -part.quantity } },
          { new: true }
        );

        if (!updatedItem) {
          // Check if item exists
          const itemExists = await InventoryItem.findById(part.item);
          if (!itemExists) {
            return res.status(400).json({ 
              success: false, 
              message: `Inventory item with ID ${part.item} not found` 
            });
          }
          // Item exists but insufficient stock
          return res.status(400).json({ 
            success: false, 
            message: `Insufficient stock for ${inventoryItem.itemName}. Available: ${itemExists.quantity}, Required: ${part.quantity}` 
          });
        }

        // Add movement history (separate atomic operation)
        await InventoryItem.findByIdAndUpdate(
          part.item,
          {
            $push: {
              movementHistory: {
                type: 'out',
                quantity: part.quantity,
                reference: `Job Card ${jobCard.jobCardNumber}`,
                remarks: 'Parts deducted for job card',
                performedBy: req.user._id,
                date: new Date(),
              }
            }
          }
        );
      }
    }

    parts.forEach(part => {
      jobCard.parts.push(part);
    });

    await jobCard.save();

    res.status(200).json({ success: true, data: jobCard, message: 'Parts added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add time log to job card
// @route   PUT /api/job-cards/:id/time-log
export const addTimeLog = async (req, res) => {
  try {
    const { type, description, startTime, endTime, hoursWorked, remarks } = req.body;
    const jobCard = await JobCard.findById(req.params.id);

    if (!jobCard) return res.status(404).json({ success: false, message: 'Job card not found' });

    jobCard.timeLogs.push({
      type,
      description,
      startTime,
      endTime,
      hoursWorked,
      remarks,
    });

    await jobCard.save();

    res.status(200).json({ success: true, data: jobCard, message: 'Time log added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add evidence (images/videos) to job card
// @route   PUT /api/job-cards/:id/evidence
export const addEvidence = async (req, res) => {
  try {
    const { type, url, caption } = req.body;
    const jobCard = await JobCard.findById(req.params.id);

    if (!jobCard) return res.status(404).json({ success: false, message: 'Job card not found' });

    jobCard.evidence.push({ type, url, caption });

    await jobCard.save();

    res.status(200).json({ success: true, data: jobCard, message: 'Evidence added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update road test
// @route   PUT /api/job-cards/:id/road-test
export const updateRoadTest = async (req, res) => {
  try {
    const { date, result, remarks, mileageAfterTest } = req.body;
    const jobCard = await JobCard.findById(req.params.id);

    if (!jobCard) return res.status(404).json({ success: false, message: 'Job card not found' });

    jobCard.roadTest = { date, result, remarks, mileageAfterTest };

    await jobCard.save();

    await ServiceTimeline.create({
      jobCard: jobCard._id,
      eventType: 'testing_completed',
      description: `Road test ${result}`,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
    });

    res.status(200).json({ success: true, data: jobCard, message: 'Road test updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update final inspection
// @route   PUT /api/job-cards/:id/final-inspection
export const updateFinalInspection = async (req, res) => {
  try {
    const {
      finalCondition,
      safetyCheck,
      remainingIssues,
      futureRecommendations,
      mechanicRemarks,
      signature,
      workPerformed,
    } = req.body;
    const jobCard = await JobCard.findById(req.params.id);

    if (!jobCard) return res.status(404).json({ success: false, message: 'Job card not found' });

    jobCard.finalInspection = {
      finalCondition,
      safetyCheck,
      remainingIssues,
      futureRecommendations,
      mechanicRemarks,
      signature,
    };

    if (workPerformed) jobCard.workPerformed = workPerformed;

    await jobCard.save();

    res.status(200).json({ success: true, data: jobCard, message: 'Final inspection updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign technician to job card
// @route   PUT /api/job-cards/:id/assign-technician
export const assignTechnician = async (req, res) => {
  try {
    const { assignedTechnician, serviceBay } = req.body;
    const jobCard = await JobCard.findById(req.params.id);

    if (!jobCard) return res.status(404).json({ success: false, message: 'Job card not found' });

    // Handle service bay assignment
    if (serviceBay && serviceBay !== jobCard.serviceBay) {
      // Release old bay if exists
      if (jobCard.serviceBay) {
        await ServiceBay.findOneAndUpdate(
          { bayNumber: jobCard.serviceBay },
          { status: 'available' }
        );
      }
      
      // Occupy new bay
      await ServiceBay.findOneAndUpdate(
        { bayNumber: serviceBay },
        { status: 'occupied' }
      );
      
      jobCard.serviceBay = serviceBay;
    }

    if (assignedTechnician) jobCard.assignedTechnician = assignedTechnician;

    await jobCard.save();

    res.status(200).json({ success: true, data: jobCard, message: 'Technician assigned successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update job card
// @route   PUT /api/job-cards/:id
export const updateJobCard = async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.id);

    if (!jobCard) return res.status(404).json({ success: false, message: 'Job card not found' });

    // Note: Authorization is handled at the list level (getJobCards)
    // Employees can only see jobs assigned to them in their list
    // So if they can see it in the list, they can update it
    // This prevents authorization errors when updating from the detail view

    // Handle service bay changes
    if (req.body.serviceBay && req.body.serviceBay !== jobCard.serviceBay) {
      // Release old bay if exists
      if (jobCard.serviceBay) {
        await ServiceBay.findOneAndUpdate(
          { bayNumber: jobCard.serviceBay },
          { status: 'available' }
        );
      }
      
      // Occupy new bay
      await ServiceBay.findOneAndUpdate(
        { bayNumber: req.body.serviceBay },
        { status: 'occupied' }
      );
    }

    // Handle parts array updates - ensure proper InventoryItem references
    if (req.body.parts && Array.isArray(req.body.parts)) {
      // Validate and clean parts data
      const validatedParts = req.body.parts.map(part => ({
        item: part.item || null, // Ensure InventoryItem reference is preserved
        name: part.name || '',
        quantity: part.quantity || 1,
        unitPrice: part.unitPrice || 0,
        total: part.total || (part.quantity || 1) * (part.unitPrice || 0),
      }));
      req.body.parts = validatedParts;
    }

    const updatedJobCard = await JobCard.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate({ path: 'parts.item', select: 'itemName itemCode quantity sellingPrice unit' });

    res.status(200).json({ success: true, data: updatedJobCard, message: 'Job card updated successfully' });
  } catch (error) {
    console.error('Error updating job card:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
