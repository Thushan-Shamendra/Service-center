import Review from '../models/Review.js';
import JobCard from '../models/JobCard.js';
import Vehicle from '../models/Vehicle.js';
import Customer from '../models/Customer.js';

export const getReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.customer) query.customer = req.query.customer;
    if (req.query.jobCard) query.jobCard = req.query.jobCard;
    if (req.query.status) query.status = req.query.status;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('customer', 'user')
        .populate('customer.user', 'firstName lastName email mobile')
        .populate('jobCard', 'jobCardNumber')
        .populate('vehicle', 'registrationNumber make model')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch reviews'
    });
  }
};

export const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('customer', 'user')
      .populate('customer.user', 'firstName lastName email mobile')
      .populate('jobCard', 'jobCardNumber')
      .populate('vehicle', 'registrationNumber make model')
      .populate('approvedBy', 'firstName lastName');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch review'
    });
  }
};

export const createReview = async (req, res) => {
  try {
    const { jobCard, vehicle, serviceQuality, mechanicPerformance, overallExperience, comments } = req.body;

    // Validate required fields
    if (!jobCard || !vehicle || !serviceQuality || !mechanicPerformance || !overallExperience) {
      return res.status(400).json({
        success: false,
        message: 'All rating fields are required'
      });
    }

    // Validate ratings are between 1-5
    if (serviceQuality < 1 || serviceQuality > 5 ||
        mechanicPerformance < 1 || mechanicPerformance > 5 ||
        overallExperience < 1 || overallExperience > 5) {
      return res.status(400).json({
        success: false,
        message: 'Ratings must be between 1 and 5'
      });
    }

    // Check if job card exists and is completed
    const jobCardDoc = await JobCard.findById(jobCard);
    if (!jobCardDoc) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found'
      });
    }

    if (!['completed', 'delivered'].includes(jobCardDoc.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed services'
      });
    }

    // Check if vehicle exists
    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Get customer from logged-in user
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if review already exists for this job card and customer
    const existingReview = await Review.findOne({
      customer: customer._id,
      jobCard: jobCard
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this service'
      });
    }

    const review = await Review.create({
      customer: customer._id,
      jobCard,
      vehicle,
      serviceQuality,
      mechanicPerformance,
      overallExperience,
      comments,
      status: 'pending'
    });

    const populatedReview = await Review.findById(review._id)
      .populate('customer', 'user')
      .populate('customer.user', 'firstName lastName email mobile')
      .populate('jobCard', 'jobCardNumber')
      .populate('vehicle', 'registrationNumber make model');

    res.status(201).json({
      success: true,
      data: populatedReview,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create review'
    });
  }
};

export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Only allow updating if review is still pending
    if (review.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update approved or rejected reviews'
      });
    }

    // Only allow customer to update their own review
    const customer = await Customer.findOne({ user: req.user._id });
    if (review.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    const { serviceQuality, mechanicPerformance, overallExperience, comments } = req.body;

    if (serviceQuality !== undefined) {
      if (serviceQuality < 1 || serviceQuality > 5) {
        return res.status(400).json({
          success: false,
          message: 'Service quality rating must be between 1 and 5'
        });
      }
      review.serviceQuality = serviceQuality;
    }

    if (mechanicPerformance !== undefined) {
      if (mechanicPerformance < 1 || mechanicPerformance > 5) {
        return res.status(400).json({
          success: false,
          message: 'Mechanic performance rating must be between 1 and 5'
        });
      }
      review.mechanicPerformance = mechanicPerformance;
    }

    if (overallExperience !== undefined) {
      if (overallExperience < 1 || overallExperience > 5) {
        return res.status(400).json({
          success: false,
          message: 'Overall experience rating must be between 1 and 5'
        });
      }
      review.overallExperience = overallExperience;
    }

    if (comments !== undefined) {
      review.comments = comments;
    }

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('customer', 'user')
      .populate('customer.user', 'firstName lastName email mobile')
      .populate('jobCard', 'jobCardNumber')
      .populate('vehicle', 'registrationNumber make model');

    res.status(200).json({
      success: true,
      data: populatedReview,
      message: 'Review updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update review'
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Only allow customer to delete their own review
    const customer = await Customer.findOne({ user: req.user._id });
    if (review.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete review'
    });
  }
};

export const getCustomerReviews = async (req, res) => {
  try {
    const customerId = req.params.customerId;

    const reviews = await Review.find({ customer: customerId })
      .populate('jobCard', 'jobCardNumber')
      .populate('vehicle', 'registrationNumber make model')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch customer reviews'
    });
  }
};

export const approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = 'approved';
    review.approvedBy = req.user._id;
    review.approvedAt = new Date();

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('customer', 'user')
      .populate('customer.user', 'firstName lastName email mobile')
      .populate('jobCard', 'jobCardNumber')
      .populate('vehicle', 'registrationNumber make model')
      .populate('approvedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: populatedReview,
      message: 'Review approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve review'
    });
  }
};

export const rejectReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = 'rejected';
    review.approvedBy = req.user._id;
    review.approvedAt = new Date();

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('customer', 'user')
      .populate('customer.user', 'firstName lastName email mobile')
      .populate('jobCard', 'jobCardNumber')
      .populate('vehicle', 'registrationNumber make model')
      .populate('approvedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: populatedReview,
      message: 'Review rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject review'
    });
  }
};
