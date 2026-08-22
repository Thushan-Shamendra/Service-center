import Activity from '../models/Activity.js';

// @desc    Log user activity
// @route   POST /api/activities
export const logActivity = async (req, res) => {
  try {
    const { action, details, type, module } = req.body;

    const activity = await Activity.create({
      user: req.user._id,
      action,
      details,
      type: type || 'other',
      module,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user activities
// @route   GET /api/activities
export const getActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by module if provided
    if (req.query.module) {
      query.module = req.query.module;
    }

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all activities (admin/manager only)
// @route   GET /api/activities/all
export const getAllActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by user if provided
    if (req.query.user) {
      query.user = req.query.user;
    }

    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by module if provided
    if (req.query.module) {
      query.module = req.query.module;
    }

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .populate('user', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching all activities:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};