import RoadTest from '../models/RoadTest.js';
import JobCard from '../models/JobCard.js';
import Employee from '../models/Employee.js';

// Get all road tests for a technician
export const getRoadTests = async (req, res) => {
  try {
    const { result, jobCard } = req.query;
    
    // Resolve the Employee record from the authenticated User
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found for this user',
      });
    }

    // If jobCard filter is provided, fetch all road tests for that job card
    // (needed for Repair Progress page to check road test status)
    const filter = {};
    if (jobCard) {
      filter.jobCard = jobCard;
    } else {
      filter.technician = employee._id;
    }
    
    if (result) filter.result = result;

    const roadTests = await RoadTest.find(filter)
      .populate('jobCard', 'jobCardNumber vehicle customer')
      .populate('technician', 'name employeeId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: roadTests.length,
      data: roadTests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching road tests',
      error: error.message,
    });
  }
};

// Get road test by ID
export const getRoadTestById = async (req, res) => {
  try {
    const roadTest = await RoadTest.findById(req.params.id)
      .populate('jobCard')
      .populate('technician', 'name employeeId');

    if (!roadTest) {
      return res.status(404).json({
        success: false,
        message: 'Road test not found',
      });
    }

    res.json({
      success: true,
      data: roadTest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching road test',
      error: error.message,
    });
  }
};

// Create new road test
export const createRoadTest = async (req, res) => {
  try {
    console.log('Road test submission payload:', req.body);

    const jobCard = await JobCard.findById(req.body.jobCard);
    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found',
      });
    }

    // Resolve the Employee record from the authenticated User
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found for this user',
      });
    }

    // Validate mileage
    if (req.body.mileageAfterTest < req.body.mileageBeforeTest) {
      return res.status(400).json({
        success: false,
        message: 'Mileage after test cannot be less than mileage before test',
      });
    }

    const roadTest = await RoadTest.create({
      ...req.body,
      technician: employee._id,
    });

    console.log('Road test created successfully:', roadTest.roadTestId);

    // Update job card with road test result
    await JobCard.findByIdAndUpdate(req.body.jobCard, {
      roadTest: {
        date: roadTest.testDate,
        result: roadTest.result,
        remarks: roadTest.remarks,
        mileageAfterTest: roadTest.mileageAfterTest,
      },
      status: roadTest.result === 'pass' ? 'ready_for_delivery' : 'repair_in_progress',
      progress: roadTest.result === 'pass' ? 95 : 50,
    });

    res.status(201).json({
      success: true,
      data: roadTest,
    });
  } catch (error) {
    console.error('Error creating road test:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating road test',
      error: error.message,
    });
  }
};

// Update road test
export const updateRoadTest = async (req, res) => {
  try {
    const roadTest = await RoadTest.findById(req.params.id);

    if (!roadTest) {
      return res.status(404).json({
        success: false,
        message: 'Road test not found',
      });
    }

    // Resolve the Employee record from the authenticated User
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found for this user',
      });
    }

    // Check ownership
    if (roadTest.technician.toString() !== employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this road test',
      });
    }

    // Validate mileage if being updated
    if (req.body.mileageAfterTest && req.body.mileageBeforeTest) {
      if (req.body.mileageAfterTest < req.body.mileageBeforeTest) {
        return res.status(400).json({
          success: false,
          message: 'Mileage after test cannot be less than mileage before test',
        });
      }
    }

    const updatedRoadTest = await RoadTest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedRoadTest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating road test',
      error: error.message,
    });
  }
};

// Get jobs ready for road test
export const getJobsReadyForRoadTest = async (req, res) => {
  try {
    // Resolve the Employee record from the authenticated User
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found for this user',
      });
    }

    const jobCards = await JobCard.find({
      assignedTechnician: employee._id,
      status: 'testing',
    })
      .populate('vehicle', 'registrationNumber make model year')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobCards.length,
      data: jobCards,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs ready for road test',
      error: error.message,
    });
  }
};