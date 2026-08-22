import Customer from '../models/Customer.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Invoice from '../models/Invoice.js';
import Appointment from '../models/Appointment.js';
import JobCard from '../models/JobCard.js';

export const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { status: 'active' };

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { customerId: searchRegex },
        { nic: searchRegex },
        { passport: searchRegex },
      ];
    }

    const customers = await Customer.find(query)
      .populate({
        path: 'user',
        select: 'firstName lastName email mobile isActive',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const customersWithVehicles = await Promise.all(
      customers.map(async (customer) => {
        const customerObj = customer.toObject();
        const vehicles = await Vehicle.countDocuments({ customer: customer._id, status: 'active' });
        customerObj.vehicleCount = vehicles;
        return customerObj;
      })
    );

    const total = await Customer.countDocuments(query);

    res.status(200).json({
      success: true,
      data: customersWithVehicles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate({
      path: 'user',
      select: 'firstName lastName email mobile isActive',
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const vehicles = await Vehicle.find({ customer: customer._id, status: 'active' });
    const outstandingBalance = await Invoice.aggregate([
      { $match: { customer: customer._id, paymentStatus: { $ne: 'paid' } } },
      { $group: { _id: null, total: { $sum: '$outstandingBalance' } } },
    ]);

    const customerObj = customer.toObject();
    customerObj.vehicles = vehicles;
    customerObj.outstandingBalance = outstandingBalance[0]?.total || 0;

    res.status(200).json({ success: true, data: customerObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, password, nic, passport, address } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      username: email.split('@')[0],
      email,
      password: password || 'Customer@123',
      firstName,
      lastName,
      mobile,
      role: 'customer',
    });

    const customer = await Customer.create({
      user: user._id,
      nic,
      passport,
      address,
    });

    const customerObj = customer.toObject();
    customerObj.user = user.toObject();

    res.status(201).json({ success: true, data: customerObj, message: 'Customer registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const { nic, passport, address, notes, status } = req.body;

    if (nic) customer.nic = nic;
    if (passport) customer.passport = passport;
    if (address) customer.address = address;
    if (notes) customer.notes = notes;
    if (status) customer.status = status;

    await customer.save();

    res.status(200).json({ success: true, data: customer, message: 'Customer updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ customer: req.params.id, status: 'active' }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerServiceHistory = async (req, res) => {
  try {
    const jobCards = await JobCard.find({ customer: req.params.id })
      .populate('vehicle', 'registrationNumber make model')
      .populate('assignedTechnician', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: jobCards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ customer: req.params.id })
      .populate('vehicle', 'registrationNumber make model')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ customer: req.params.id })
      .populate('vehicle', 'registrationNumber make model')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
