import ServiceBay from '../models/ServiceBay.js';
import JobCard from '../models/JobCard.js';

// @desc    Get all service bays
// @route   GET /api/service-bays
export const getServiceBays = async (req, res) => {
  try {
    const query = { isActive: true };
    if (req.query.status) query.status = req.query.status;

    const serviceBays = await ServiceBay.find(query).sort({ bayNumber: 1 });

    // Get current assignments for each occupied bay
    const baysWithAssignments = await Promise.all(
      serviceBays.map(async (bay) => {
        if (bay.status === 'occupied') {
          const assignment = await JobCard.findOne({
            serviceBay: bay.bayNumber,
            status: { $nin: ['delivered', 'cancelled'] },
          })
            .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
            .populate('vehicle')
            .populate({ path: 'assignedTechnician', populate: { path: 'user', select: 'firstName lastName' } });
          
          return {
            ...bay.toObject(),
            currentAssignment: assignment,
          };
        }
        return bay;
      })
    );

    res.status(200).json({
      success: true,
      data: baysWithAssignments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single service bay by ID
// @route   GET /api/service-bays/:id
export const getServiceBayById = async (req, res) => {
  try {
    const serviceBay = await ServiceBay.findById(req.params.id);

    if (!serviceBay) {
      return res.status(404).json({ success: false, message: 'Service bay not found' });
    }

    // Get current assignment if occupied
    let currentAssignment = null;
    if (serviceBay.status === 'occupied') {
      currentAssignment = await JobCard.findOne({
        serviceBay: serviceBay.bayNumber,
        status: { $nin: ['delivered', 'cancelled'] },
      })
        .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
        .populate('vehicle')
        .populate({ path: 'assignedTechnician', populate: { path: 'user', select: 'firstName lastName' } });
    }

    res.status(200).json({
      success: true,
      data: {
        ...serviceBay.toObject(),
        currentAssignment,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new service bay
// @route   POST /api/service-bays
export const createServiceBay = async (req, res) => {
  try {
    const serviceBay = await ServiceBay.create(req.body);

    res.status(201).json({
      success: true,
      data: serviceBay,
      message: 'Service bay created successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update service bay
// @route   PUT /api/service-bays/:id
export const updateServiceBay = async (req, res) => {
  try {
    const serviceBay = await ServiceBay.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!serviceBay) {
      return res.status(404).json({ success: false, message: 'Service bay not found' });
    }

    res.status(200).json({
      success: true,
      data: serviceBay,
      message: 'Service bay updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete service bay
// @route   DELETE /api/service-bays/:id
export const deleteServiceBay = async (req, res) => {
  try {
    const serviceBay = await ServiceBay.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!serviceBay) {
      return res.status(404).json({ success: false, message: 'Service bay not found' });
    }

    res.status(200).json({
      success: true,
      data: serviceBay,
      message: 'Service bay deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update service bay status
// @route   PUT /api/service-bays/:id/status
export const updateServiceBayStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const serviceBay = await ServiceBay.findById(req.params.id);

    if (!serviceBay) {
      return res.status(404).json({ success: false, message: 'Service bay not found' });
    }

    serviceBay.status = status;
    await serviceBay.save();

    res.status(200).json({
      success: true,
      data: serviceBay,
      message: 'Service bay status updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Initialize default service bays
// @route   POST /api/service-bays/initialize
export const initializeServiceBays = async (req, res) => {
  try {
    const defaultBays = [
      { bayNumber: 'B01', name: 'Bay 1', status: 'available' },
      { bayNumber: 'B02', name: 'Bay 2', status: 'available' },
      { bayNumber: 'B03', name: 'Bay 3', status: 'available' },
      { bayNumber: 'B04', name: 'Bay 4', status: 'available' },
    ];

    const createdBays = await ServiceBay.insertMany(
      defaultBays.map((bay) => ({
        ...bay,
        isActive: true,
      }))
    );

    res.status(201).json({
      success: true,
      data: createdBays,
      message: 'Default service bays initialized successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
