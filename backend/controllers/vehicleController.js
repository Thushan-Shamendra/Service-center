import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import Customer from '../models/Customer.js';
import JobCard from '../models/JobCard.js';
import Appointment from '../models/Appointment.js';

export const getVehicles = async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database not connected. Please ensure MongoDB is running.' 
      });
    }

    // Explicitly disable caching for this endpoint
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = { status: 'active' }; // Only fetch active vehicles (soft delete implemented)

    // Filter out cache-busting parameter
    const { _t, ...cleanQuery } = req.query;

    // Handle customer parameter - could be User ID or Customer ID
    if (cleanQuery.customer) {
      const customerId = cleanQuery.customer;
      
      // Check if it's a User ID by looking for a Customer with that user reference
      const customer = await Customer.findOne({ user: customerId });
      
      if (customer) {
        // It's a User ID, use the Customer ID
        query.customer = customer._id;
      } else {
        // Try to use it directly as a Customer ID
        query.customer = customerId;
      }
    }

    // Handle status filter for service status
    if (cleanQuery.status && cleanQuery.status !== 'all') {
      query.currentServiceStatus = cleanQuery.status;
    }

    // Handle fuel type filter
    if (cleanQuery.fuelType && cleanQuery.fuelType !== 'all') {
      query.fuelType = cleanQuery.fuelType;
    }

    if (cleanQuery.search) {
      const regex = new RegExp(cleanQuery.search, 'i');
      query.$or = [
        { registrationNumber: regex },
        { make: regex },
        { model: regex },
        { vin: regex },
        { chassisNumber: regex },
      ];
    }

    const vehicles = await Vehicle.find(query)
      .populate({ 
        path: 'customer', 
        populate: { 
          path: 'user', 
          select: 'firstName lastName mobile email customerId'
        } 
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Only filter out vehicles with null customer references
    // Don't filter based on user population since that can fail temporarily
    const validVehicles = vehicles.filter(v => v.customer);
    
    // Get the total count for pagination
    const totalValidVehicles = await Vehicle.countDocuments(query);

    res.status(200).json({
      success: true,
      data: validVehicles,
      pagination: {
        page,
        limit,
        total: totalValidVehicles,
        pages: Math.ceil(totalValidVehicles / limit),
      },
    });
  } catch (error) {
    console.error('Error in getVehicles:', error);
    res.status(500).json({ success: false, message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  }
};

export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, status: 'active' }).populate({
      path: 'customer',
      populate: { 
        path: 'user', 
        select: 'firstName lastName mobile email customerId'
      },
    });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register new vehicle for customer
// @route   POST /api/vehicles
export const registerVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({ success: true, data: vehicle, message: 'Vehicle registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
export const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.status(200).json({ success: true, data: vehicle, message: 'Vehicle details updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
export const deleteVehicle = async (req, res) => {
  try {
    console.log('Attempting to delete vehicle with ID:', req.params.id);
    
    // First, find the vehicle to check its current state
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      console.log('Vehicle not found');
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    console.log('Vehicle found:', vehicle.registrationNumber, 'Service status:', vehicle.currentServiceStatus);

    // Check if vehicle has active service status BEFORE making any changes
    if (vehicle.currentServiceStatus === 'in_service') {
      console.log('Cannot delete vehicle - currently in service');
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete vehicle that is currently in service' 
      });
    }

    // Check for active job cards
    const activeJobCards = await JobCard.countDocuments({ 
      vehicle: req.params.id, 
      status: { $nin: ['delivered', 'cancelled'] } 
    });
    
    if (activeJobCards > 0) {
      console.log('Cannot delete vehicle - has active job cards');
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete vehicle with ${activeJobCards} active job card(s)` 
      });
    }

    // Check for future appointments
    const futureAppointments = await Appointment.countDocuments({ 
      vehicle: req.params.id, 
      preferredDate: { $gte: new Date() },
      status: { $nin: ['cancelled', 'completed'] }
    });
    
    if (futureAppointments > 0) {
      console.log('Cannot delete vehicle - has future appointments');
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete vehicle with ${futureAppointments} scheduled appointment(s)` 
      });
    }

    // Soft delete by setting status to inactive
    await Vehicle.findByIdAndUpdate(req.params.id, { status: 'inactive' });
    console.log('Vehicle marked as inactive');

    res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error in deleteVehicle:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
