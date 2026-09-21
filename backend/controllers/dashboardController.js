import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import Appointment from '../models/Appointment.js';
import JobCard from '../models/JobCard.js';
import InventoryItem from '../models/InventoryItem.js';
import Supplier from '../models/Supplier.js';
import Invoice from '../models/Invoice.js';
import Notification from '../models/Notification.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import GRN from '../models/GRN.js';
import SupplierPayment from '../models/SupplierPayment.js';
import Attendance from '../models/Attendance.js';
import dayjs from 'dayjs';

const workshopStatuses = [
  'pending', 'inspection_started', 'inspection_complete', 'diagnosing',
  'repair_started', 'waiting_for_parts', 'repair_in_progress', 'testing',
  'work_complete', 'road_test_pending', 'ready_for_delivery',
];

export const getAdminSummary = async (req, res) => {
  try {
    const now = dayjs();
    const startOfMonth = now.startOf('month').toDate();
    const endOfMonth = now.endOf('month').toDate();
    const todayStart = now.startOf('day').toDate();
    const todayEnd = now.endOf('day').toDate();

    const [
      totalManagers,
      totalEmployees,
      totalCustomers,
      totalSuppliers,
      totalInventoryItems,
      lowStockItems,
      pendingPurchaseOrders,
      pendingGRNs,
      pendingPayables,
      monthlyInvoices,
      recentActivities,
      monthlyPurchaseOrders,
      employeesPresentToday,
    ] = await Promise.all([
      User.countDocuments({ role: 'manager', isActive: true }),
      User.countDocuments({ role: 'employee', isActive: true }),
      User.countDocuments({ role: 'customer', isActive: true }),
      Supplier.countDocuments({
        $or: [
          { isActive: true },
          { status: 'active' },
          { isActive: { $ne: false } },
        ],
      }),
      InventoryItem.countDocuments({ status: 'active' }),
      InventoryItem.countDocuments({
        status: 'active',
        $expr: { $lte: ['$quantity', '$reorderLevel'] },
      }),
      PurchaseOrder.countDocuments({ status: { $in: ['pending', 'partially_received'] } }),
      GRN.countDocuments({ verifiedBy: { $exists: false } }),
      SupplierPayment.countDocuments({ status: { $ne: 'completed' } }),
      Invoice.find({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      Notification.find().sort({ createdAt: -1 }).limit(10).populate('user', 'firstName lastName'),
      PurchaseOrder.find({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      Attendance.countDocuments({
        date: { $gte: todayStart, $lte: todayEnd },
        status: { $in: ['present', 'late', 'half_day'] },
      }),
    ]);

    const monthlyRevenue = monthlyInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const monthlyExpenses = monthlyPurchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const netProfit = monthlyRevenue - monthlyExpenses;

    // Transform notifications to activity format
    const activities = recentActivities.map((notification) => ({
      id: notification._id,
      title: notification.title || 'System Notification',
      description: notification.message || notification.description || 'System activity logged',
      createdAt: notification.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalManagers,
        totalEmployees,
        totalCustomers,
        totalSuppliers,
        totalInventoryItems,
        lowStockItems,
        pendingPurchaseOrders,
        pendingGRNs,
        pendingPayables,
        monthlyRevenue,
        monthlyExpenses,
        netProfit,
        employeesPresentToday,
        recentActivities: activities,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getManagerSummary = async (req, res) => {
  try {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const [
      todaysAppointments,
      workshopVehicleIds,
      pendingJobCards,
      waitingForParts,
      readyForDelivery,
      unpaidInvoices,
      totalCustomers,
      totalVehicles,
      lowStockAlerts,
      todaysRevenue,
    ] = await Promise.all([
      Appointment.countDocuments({
        preferredDate: { $gte: todayStart, $lte: todayEnd },
        status: { $in: ['pending', 'approved'] },
      }),
      JobCard.distinct('vehicle', {
        status: { $in: workshopStatuses },
        vehicle: { $ne: null },
      }),
      JobCard.countDocuments({ status: 'pending' }),
      JobCard.countDocuments({ status: 'waiting_for_parts' }),
      JobCard.countDocuments({ status: 'ready_for_delivery' }),
      Invoice.countDocuments({ paymentStatus: { $in: ['unpaid', 'partially_paid'] } }),
      Customer.countDocuments({ status: 'active' }),
      Vehicle.countDocuments({ status: 'active' }),
      InventoryItem.countDocuments({
        status: 'active',
        $expr: { $lte: ['$quantity', '$reorderLevel'] },
      }),
      Invoice.aggregate([
        {
          $match: {
            createdAt: { $gte: todayStart, $lte: todayEnd },
          },
        },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
    ]);

    const techniciansAvailable = await Employee.countDocuments({ status: 'active' });

    res.status(200).json({
      success: true,
      data: {
        todaysAppointments,
        vehiclesInWorkshop: workshopVehicleIds.length,
        pendingJobCards,
        waitingForParts,
        readyForDelivery,
        quotationsPendingApproval: 0, 
        unpaidInvoices,
        todaysRevenue: todaysRevenue[0]?.total || 0,
        totalCustomers,
        totalVehicles,
        lowStockAlerts,
        techniciansAvailable,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployeeSummary = async (req, res) => {
  try {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(200).json({
        success: true,
        data: {
          assignedJobs: 0,
          jobsInProgress: 0,
          waitingForParts: 0,
          completedJobsToday: 0,
          pendingRoadTests: 0,
          totalHoursWorkedToday: 0,
        },
      });
    }

    const [assignedJobs, jobsInProgress, waitingForParts, completedJobsToday, pendingRoadTests] =
      await Promise.all([
        JobCard.countDocuments({ assignedTechnician: employee._id, status: { $nin: ['delivered', 'cancelled'] } }),
        JobCard.countDocuments({ assignedTechnician: employee._id, status: 'repair_in_progress' }),
        JobCard.countDocuments({ assignedTechnician: employee._id, status: 'waiting_for_parts' }),
        JobCard.countDocuments({
          assignedTechnician: employee._id,
          status: 'delivered',
          updatedAt: { $gte: todayStart, $lte: todayEnd },
        }),
        JobCard.countDocuments({ assignedTechnician: employee._id, status: 'testing' }),
      ]);

    const todayJobs = await JobCard.find({
      assignedTechnician: employee._id,
      'timeLogs.startTime': { $gte: todayStart, $lte: todayEnd },
    });

    let totalHoursWorkedToday = 0;
    todayJobs.forEach((job) => {
      job.timeLogs.forEach((log) => {
        if (log.startTime >= todayStart && log.hoursWorked) {
          totalHoursWorkedToday += log.hoursWorked;
        }
      });
    });

    res.status(200).json({
      success: true,
      data: {
        assignedJobs,
        jobsInProgress,
        waitingForParts,
        completedJobsToday,
        pendingRoadTests,
        totalHoursWorkedToday: Math.round(totalHoursWorkedToday * 10) / 10,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerSummary = async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res.status(200).json({
        success: true,
        data: {
          myVehicles: 0,
          upcomingAppointments: 0,
          vehiclesInService: 0,
          outstandingBalance: 0,
          totalCompletedServices: 0,
          nextServiceDue: null,
          warrantyExpiringSoon: 0,
          insuranceExpiringSoon: 0,
        },
      });
    }

    const now = new Date();
    const thirtyDaysFromNow = dayjs().add(30, 'day').toDate();

    const vehicles = await Vehicle.find({ customer: customer._id, status: 'active' });
    const vehicleIds = vehicles.map((v) => v._id);

    const [upcomingAppointments, vehiclesInService, totalCompletedServices, invoices] =
      await Promise.all([
        Appointment.countDocuments({
          customer: customer._id,
          preferredDate: { $gte: now },
          status: { $in: ['pending', 'approved'] },
        }),
        JobCard.countDocuments({
          vehicle: { $in: vehicleIds },
          status: { $nin: ['delivered', 'cancelled'] },
        }),
        JobCard.countDocuments({
          vehicle: { $in: vehicleIds },
          status: 'delivered',
        }),
        Invoice.find({
          customer: customer._id,
          paymentStatus: { $in: ['unpaid', 'partially_paid'] },
        }),
      ]);

    const outstandingBalance = invoices.reduce((sum, inv) => sum + (inv.outstandingBalance || 0), 0);

    let warrantyExpiringSoon = 0;
    let insuranceExpiringSoon = 0;
    let nextServiceDue = null;

    vehicles.forEach((v) => {
      if (v.warranty?.expiryDate && v.warranty.expiryDate <= thirtyDaysFromNow && v.warranty.expiryDate >= now) {
        warrantyExpiringSoon++;
      }
      if (v.insurance?.expiryDate && v.insurance.expiryDate <= thirtyDaysFromNow && v.insurance.expiryDate >= now) {
        insuranceExpiringSoon++;
      }
      if (v.nextRecommendedService && (!nextServiceDue || v.nextRecommendedService < nextServiceDue)) {
        nextServiceDue = v.nextRecommendedService;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        myVehicles: vehicles.length,
        upcomingAppointments,
        vehiclesInService,
        outstandingBalance,
        totalCompletedServices,
        nextServiceDue,
        warrantyExpiringSoon,
        insuranceExpiringSoon,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChartData = async (req, res) => {
  try {
    const { type } = req.params;
    let data = {};

    switch (type) {
      case 'revenue': {
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const start = dayjs().subtract(i, 'month').startOf('month').toDate();
          const end = dayjs().subtract(i, 'month').endOf('month').toDate();
          const result = await Invoice.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: null, revenue: { $sum: '$amountPaid' }, total: { $sum: '$grandTotal' } } },
          ]);
          months.push({
            month: dayjs().subtract(i, 'month').format('MMM'),
            revenue: result[0]?.revenue || 0,
            total: result[0]?.total || 0,
          });
        }
        data = months;
        break;
      }
      case 'appointments': {
        const statuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
        const counts = await Promise.all(
          statuses.map((s) => Appointment.countDocuments({ status: s }))
        );
        data = statuses.map((status, i) => ({ status, count: counts[i] }));
        break;
      }
      case 'jobStatus': {
        const statuses = ['pending', 'diagnosing', 'waiting_for_parts', 'repair_in_progress', 'testing', 'ready_for_delivery', 'delivered'];
        const counts = await Promise.all(
          statuses.map((s) => JobCard.countDocuments({ status: s }))
        );
        data = statuses.map((status, i) => ({
          status: status.replace(/_/g, ' '),
          count: counts[i],
        }));
        break;
      }
      case 'inventory': {
        const categories = await InventoryItem.aggregate([
          { $match: { status: 'active' } },
          { $group: { _id: '$category', count: { $sum: 1 }, totalValue: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]);
        data = categories.map((c) => ({ category: c._id || 'Uncategorized', count: c.count, totalValue: c.totalValue }));
        break;
      }
      default:
        data = [];
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWorkshopBays = async (req, res) => {
  try {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const activeJobCards = await JobCard.find({
      status: { $in: workshopStatuses },
    })
      .populate('vehicle')
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName' } })
      .limit(4);

    const workshopBays = [];
    for (let i = 1; i <= 4; i++) {
      const jobCard = activeJobCards[i - 1];
      if (jobCard) {
        workshopBays.push({
          id: i,
          status: jobCard.status === 'waiting_for_parts' ? 'Parts' :
                 ['testing', 'road_test_pending'].includes(jobCard.status) ? 'Testing' :
                 jobCard.status === 'pending' ? 'Pending' :
                 ['inspection_started', 'inspection_complete', 'diagnosing'].includes(jobCard.status) ? 'Inspection' :
                 ['work_complete', 'ready_for_delivery'].includes(jobCard.status) ? 'Ready' : 'Repair',
          vehicle: jobCard.vehicle?.registrationNumber || 'Unknown',
          customer: jobCard.customer?.user ? 
                   `${jobCard.customer.user.firstName} ${jobCard.customer.user.lastName}` : 'Unknown',
        });
      } else {
        workshopBays.push({
          id: i,
          status: 'Empty',
          vehicle: '',
          customer: '',
        });
      }
    }

    res.status(200).json({ success: true, data: workshopBays });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTodaysAppointments = async (req, res) => {
  try {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const appointments = await Appointment.find({
      preferredDate: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['pending', 'approved'] },
    })
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName' } })
      .populate('vehicle')
      .sort({ preferredTime: 1 })
      .limit(10);

    const todaysAppointmentsList = appointments.map((apt) => ({
      id: apt._id,
      time: apt.preferredTime,
      customer: apt.customer?.user ? 
               `${apt.customer.user.firstName} ${apt.customer.user.lastName}` : 'Unknown',
      vehicle: apt.vehicle?.registrationNumber || 'Unknown',
      service: apt.complaint || 'General Service',
      status: apt.status,
    }));

    res.status(200).json({ success: true, data: todaysAppointmentsList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecentJobCards = async (req, res) => {
  try {
    const recentJobCards = await JobCard.find({
      status: { $nin: ['delivered', 'cancelled'] },
    })
      .populate('vehicle')
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName' } })
      .sort({ createdAt: -1 })
      .limit(5);

    const jobCardsList = recentJobCards.map((job) => ({
      id: job.jobCardNumber || job._id.toString(),
      vehicle: job.vehicle?.registrationNumber || 'Unknown',
      customer: job.customer?.user ? 
               `${job.customer.user.firstName} ${job.customer.user.lastName}` : 'Unknown',
      status: job.status,
      amount: job.estimatedCost || 0,
    }));

    res.status(200).json({ success: true, data: jobCardsList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getManagerAlerts = async (req, res) => {
  try {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const [
      pendingJobCards,
      urgentJobCards,
      waitingForParts,
      delayedParts,
      unpaidInvoices,
      lowStockItems,
    ] = await Promise.all([
      JobCard.countDocuments({ status: 'pending' }),
      JobCard.countDocuments({ 
        status: { $in: ['pending', 'diagnosing'] },
        createdAt: { $lt: todayStart },
      }),
      JobCard.countDocuments({ status: 'waiting_for_parts' }),
      JobCard.countDocuments({
        status: 'waiting_for_parts',
        updatedAt: { $lt: dayjs().subtract(2, 'day').toDate() },
      }),
      Invoice.countDocuments({ paymentStatus: { $in: ['unpaid', 'partially_paid'] } }),
      InventoryItem.countDocuments({
        status: 'active',
        $expr: { $lte: ['$quantity', '$reorderLevel'] },
      }),
    ]);

    const alerts = [];
    if (pendingJobCards > 0) {
      alerts.push({ label: 'Pending Job Cards', count: pendingJobCards, color: 'yellow' });
    }
    if (urgentJobCards > 0) {
      alerts.push({ label: 'Urgent Job Cards', count: urgentJobCards, color: 'red' });
    }
    if (waitingForParts > 0) {
      alerts.push({ label: 'Waiting for Parts', count: waitingForParts, color: 'orange' });
    }
    if (delayedParts > 0) {
      alerts.push({ label: 'Delayed Parts', count: delayedParts, color: 'red' });
    }
    if (unpaidInvoices > 0) {
      alerts.push({ label: 'Unpaid Invoices', count: unpaidInvoices, color: 'orange' });
    }
    if (lowStockItems > 0) {
      alerts.push({ label: 'Low Stock Items', count: lowStockItems, color: 'yellow' });
    }

    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
