import JobCard from '../models/JobCard.js';
import Invoice from '../models/Invoice.js';
import Appointment from '../models/Appointment.js';
import InventoryItem from '../models/InventoryItem.js';
import Customer from '../models/Customer.js';
import Employee from '../models/Employee.js';
import Payment from '../models/Payment.js';
import Vehicle from '../models/Vehicle.js';

// @desc    Get service report
// @route   GET /api/reports/service
export const getServiceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = {};
    
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const report = await JobCard.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$estimatedCost' },
        },
      },
    ]);

    const totalJobs = await JobCard.countDocuments(matchQuery);
    const completedJobs = await JobCard.countDocuments({ ...matchQuery, status: 'delivered' });

    res.status(200).json({
      success: true,
      data: {
        byStatus: report,
        totalJobs,
        completedJobs,
        completionRate: totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get sales report
// @route   GET /api/reports/sales
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = {};
    
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const salesData = await Invoice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalRevenue: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$amountPaid' },
          invoiceCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const paymentMethods = await Invoice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amountPaid' },
          count: { $sum: 1 },
        },
      },
    ]);

    const outstanding = await Invoice.aggregate([
      { $match: { ...matchQuery, paymentStatus: { $ne: 'paid' } } },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: '$outstandingBalance' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        monthlySales: salesData,
        byPaymentMethod: paymentMethods,
        outstanding: outstanding[0] || { totalOutstanding: 0, count: 0 },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get inventory report
// @route   GET /api/reports/inventory
export const getInventoryReport = async (req, res) => {
  try {
    const lowStockItems = await InventoryItem.find({ $expr: { $lte: ['$quantity', '$reorderLevel'] } });
    const totalItems = await InventoryItem.countDocuments();
    const totalValue = await InventoryItem.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
        },
      },
    ]);

    const byCategory = await InventoryItem.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
        },
      },
    ]);

    const movements = await (await import('../models/StockMovement.js')).default.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        lowStockItems,
        totalItems,
        totalValue: totalValue[0]?.totalValue || 0,
        byCategory,
        movements,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get customer report
// @route   GET /api/reports/customers
export const getCustomerReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = {};
    
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const totalCustomers = await Customer.countDocuments({ status: 'active' });
    const newCustomers = await Customer.countDocuments({ ...matchQuery, status: 'active' });

    const topCustomers = await Customer.aggregate([
      { $match: { status: 'active' } },
      {
        $lookup: {
          from: 'invoices',
          localField: '_id',
          foreignField: 'customer',
          as: 'invoices',
        },
      },
      {
        $addFields: {
          totalSpent: { $sum: '$invoices.grandTotal' },
          invoiceCount: { $size: '$invoices' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          customerId: 1,
          'user.firstName': 1,
          'user.lastName': 1,
          'user.email': 1,
          totalSpent: 1,
          invoiceCount: 1,
        },
      },
    ]);

    const byLoyaltyTier = await Customer.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$loyaltyTier',
          count: { $sum: 1 },
          totalSpent: { $sum: '$totalSpent' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        newCustomers,
        topCustomers,
        byLoyaltyTier,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get employee performance report
// @route   GET /api/reports/employees
export const getEmployeePerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = {};
    
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const performance = await JobCard.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'employees',
          localField: 'assignedTechnician',
          foreignField: '_id',
          as: 'technician',
        },
      },
      { $unwind: { path: '$technician', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'technician.user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$assignedTechnician',
          technicianName: { $first: { $concat: ['$user.firstName', ' ', '$user.lastName'] } },
          totalJobs: { $sum: 1 },
          completedJobs: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0],
            },
          },
          totalRevenue: { $sum: '$estimatedCost' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    const totalEmployees = await Employee.countDocuments({ status: 'active' });

    res.status(200).json({
      success: true,
      data: {
        performance,
        totalEmployees,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get appointment report
// @route   GET /api/reports/appointments
export const getAppointmentReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = {};
    
    if (startDate && endDate) {
      matchQuery.preferredDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const byStatus = await Appointment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const byServiceType = await Appointment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalAppointments = await Appointment.countDocuments(matchQuery);
    const completedAppointments = await Appointment.countDocuments({ ...matchQuery, status: 'completed' });

    res.status(200).json({
      success: true,
      data: {
        byStatus,
        byServiceType,
        totalAppointments,
        completedAppointments,
        completionRate: totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get vehicle report
// @route   GET /api/reports/vehicles
export const getVehicleReport = async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments({ status: 'active' });
    const byMake = await Vehicle.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$make',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const byFuelType = await Vehicle.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$fuelType',
          count: { $sum: 1 },
        },
      },
    ]);

    const inService = await Vehicle.countDocuments({ currentServiceStatus: 'in_service' });

    res.status(200).json({
      success: true,
      data: {
        totalVehicles,
        byMake,
        byFuelType,
        inService,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get comprehensive dashboard report
// @route   GET /api/reports/dashboard
export const getDashboardReport = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

    const [
      totalCustomers,
      totalVehicles,
      totalEmployees,
      todayAppointments,
      monthAppointments,
      activeJobCards,
      completedJobCards,
      monthRevenue,
      outstandingPayments,
      lowStockCount,
    ] = await Promise.all([
      Customer.countDocuments({ status: 'active' }),
      Vehicle.countDocuments({ status: 'active' }),
      Employee.countDocuments({ status: 'active' }),
      Appointment.countDocuments({ preferredDate: today }),
      Appointment.countDocuments({ preferredDate: { $gte: startOfMonth } }),
      JobCard.countDocuments({ status: { $in: ['pending', 'in_progress', 'inspection', 'testing'] } }),
      JobCard.countDocuments({ status: 'delivered', createdAt: { $gte: startOfMonth } }),
      Invoice.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
      Invoice.aggregate([
        { $match: { paymentStatus: { $ne: 'paid' } } },
        { $group: { _id: null, total: { $sum: '$outstandingBalance' } } },
      ]),
      InventoryItem.countDocuments({ $expr: { $lte: ['$quantity', '$reorderLevel'] } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalCustomers,
          totalVehicles,
          totalEmployees,
          todayAppointments,
          monthAppointments,
          activeJobCards,
          completedJobCards,
        },
        financial: {
          monthRevenue: monthRevenue[0]?.total || 0,
          outstandingPayments: outstandingPayments[0]?.total || 0,
        },
        inventory: {
          lowStockCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
