import Appointment from '../models/Appointment.js';
import Customer from '../models/Customer.js';
import Employee from '../models/Employee.js';
import Notification from '../models/Notification.js';

export const getAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;

    // Handle date filtering
    if (req.query.date) {
      const startOfDay = new Date(req.query.date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(req.query.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.preferredDate = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    // Handle date range filtering
    if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      query.preferredDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // Handle search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { appointmentNumber: searchRegex },
        { complaint: searchRegex },
      ];
    }

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user._id });
      if (customer) query.customer = customer._id;
    } else if (req.query.customer) {
      query.customer = req.query.customer;
    }

    console.log('Appointment query:', JSON.stringify(query, null, 2));

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate({ 
          path: 'customer', 
          populate: { path: 'user', select: 'firstName lastName mobile email' } 
        })
        .populate('vehicle')
        .populate({ 
          path: 'assignedTechnician', 
          populate: { path: 'user', select: 'firstName lastName' } 
        })
        .sort({ preferredDate: 1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(query),
    ]);

    console.log('Found appointments:', appointments.length);
    
    // Log technician data for debugging
    appointments.forEach((apt, index) => {
      if (index < 2) { // Log first 2 appointments
        console.log(`Appointment ${apt.appointmentNumber}:`, {
          status: apt.status,
          hasTechnician: !!apt.assignedTechnician,
          technicianId: apt.assignedTechnician?._id,
          technicianUser: apt.assignedTechnician?.user,
          technicianName: apt.assignedTechnician?.user?.firstName
        });
      }
    });

    res.status(200).json({
      success: true,
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error in getAppointments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create appointment
// @route   POST /api/appointments
export const createAppointment = async (req, res) => {
  try {
    let customerId = req.body.customer;

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user._id });
      if (!customer) return res.status(400).json({ success: false, message: 'Customer profile not found' });
      customerId = customer._id;
    }

    const appointment = await Appointment.create({
      ...req.body,
      customer: customerId,
      statusHistory: [
        {
          status: 'pending',
          changedBy: req.user._id,
          remarks: 'Appointment requested',
          changedAt: new Date(),
        },
      ],
    });

    // Populate customer data before returning
    await appointment.populate({ 
      path: 'customer', 
      populate: { path: 'user', select: 'firstName lastName mobile email' } 
    });
    await appointment.populate('vehicle');

    res.status(201).json({
      success: true,
      data: appointment,
      message: 'Service appointment requested successfully. Pending approval.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update appointment details
// @route   PUT /api/appointments/:id
export const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
      .populate('vehicle')
      .populate({ path: 'assignedTechnician', populate: { path: 'user', select: 'firstName lastName' } });

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    res.status(200).json({ success: true, data: appointment, message: 'Appointment updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update appointment status (approve, reject, reschedule, assign technician)
// @route   PUT /api/appointments/:id/status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, rejectionReason, rescheduleDate, rescheduleTime, assignedTechnician } = req.body;

    const appointment = await Appointment.findById(req.params.id).populate('customer');
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    if (status) {
      appointment.status = status;
      // Record status change in history
      appointment.statusHistory.push({
        status,
        changedBy: req.user._id,
        remarks: rejectionReason || (status === 'rescheduled' ? `Rescheduled to ${rescheduleDate || ''} ${rescheduleTime || ''}` : `Status changed to ${status}`),
        changedAt: new Date(),
      });
    }
    if (rejectionReason) appointment.rejectionReason = rejectionReason;
    if (rescheduleDate) appointment.rescheduleDate = rescheduleDate;
    if (rescheduleTime) appointment.rescheduleTime = rescheduleTime;
    if (assignedTechnician) appointment.assignedTechnician = assignedTechnician;

    await appointment.save();

    // Populate technician data after saving
    await appointment.populate({ 
      path: 'assignedTechnician', 
      populate: { path: 'user', select: 'firstName lastName' } 
    });

    // Send notification to customer
    if (appointment.customer?.user) {
      await Notification.create({
        user: appointment.customer.user,
        title: `Appointment ${status?.toUpperCase()}`,
        description: `Your appointment ${appointment.appointmentNumber} status is now: ${status}.`,
        type: status === 'approved' ? 'appointment_confirmed' : 'appointment_rejected',
      });
    }

    res.status(200).json({ success: true, data: appointment, message: `Appointment status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
      .populate('vehicle')
      .populate({ path: 'assignedTechnician', populate: { path: 'user', select: 'firstName lastName' } });

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    appointment.status = 'cancelled';
    appointment.statusHistory.push({
      status: 'cancelled',
      changedBy: req.user._id,
      remarks: 'Appointment cancelled',
      changedAt: new Date(),
    });
    await appointment.save();

    res.status(200).json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get available time slots for a specific date
// @route   GET /api/appointments/available-slots
export const getAvailableTimeSlots = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    // Define standard time slots (9 AM to 3:30 PM)
    const timeSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    ];

    // Get existing appointments for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Validate date
    if (isNaN(startOfDay.getTime()) || isNaN(endOfDay.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    const existingAppointments = await Appointment.find({
      preferredDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $in: ['pending', 'approved', 'rescheduled'] },
    }).select('preferredTime');

    // Get booked time slots
    const bookedSlots = existingAppointments.map(app => app.preferredTime);

    // Calculate availability for each slot
    const slotAvailability = timeSlots.map(slot => {
      const slotBookings = bookedSlots.filter(booked => booked === slot).length;
      let status = 'available';
      
      if (slotBookings >= 4) {
        status = 'full';
      } else if (slotBookings >= 2) {
        status = 'limited';
      }
      
      return {
        time: slot,
        status,
        bookings: slotBookings,
      };
    });

    res.status(200).json({
      success: true,
      data: slotAvailability,
      date,
    });
  } catch (error) {
    console.error('Error in getAvailableTimeSlots:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get available technicians
// @route   GET /api/appointments/available-technicians
export const getAvailableTechnicians = async (req, res) => {
  try {
    const { date, time } = req.query;

    // Get all active technicians/employees
    const technicians = await Employee.find({ status: 'active' })
      .populate({
        path: 'user',
        select: 'firstName lastName isActive',
      });

    // Filter out technicians without users or inactive users
    const allTechnicians = technicians.filter(
      tech => tech.user && tech.user.isActive
    );

    // If date and time are provided, check technician availability
    let technicianAvailability = [];
    
    if (date && time) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Validate date
      if (isNaN(startOfDay.getTime()) || isNaN(endOfDay.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }

      // Get appointments for the date and time
      const existingAppointments = await Appointment.find({
        preferredDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        preferredTime: time,
        status: { $in: ['pending', 'approved'] },
      }).select('assignedTechnician');

      const bookedTechnicianIds = existingAppointments
        .map(app => app.assignedTechnician)
        .filter(id => id != null);

      technicianAvailability = allTechnicians.map(tech => ({
        _id: tech._id,
        employeeId: tech.employeeId || tech.managerId,
        name: `${tech.user.firstName} ${tech.user.lastName}`,
        designation: tech.designation,
        status: tech.status,
        isActive: tech.user.isActive,
        isAvailable: tech.status === 'active' && tech.user.isActive && !bookedTechnicianIds.some(id => id.toString() === tech._id.toString()),
      }));
    } else {
      // Return all technicians without availability check
      technicianAvailability = allTechnicians.map(tech => ({
        _id: tech._id,
        employeeId: tech.employeeId || tech.managerId,
        name: `${tech.user.firstName} ${tech.user.lastName}`,
        designation: tech.designation,
        status: tech.status,
        isActive: tech.user.isActive,
        isAvailable: tech.status === 'active' && tech.user.isActive,
      }));
    }

    res.status(200).json({
      success: true,
      data: technicianAvailability,
    });
  } catch (error) {
    console.error('Error in getAvailableTechnicians:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
