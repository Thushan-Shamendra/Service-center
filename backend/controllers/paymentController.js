import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// @desc    Get all payments with filters & pagination
// @route   GET /api/payments
export const getPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    if (req.query.paymentMethod && req.query.paymentMethod !== 'all') {
      query.paymentMethod = req.query.paymentMethod;
    }

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user._id });
      if (customer) query.customer = customer._id;
    } else if (req.query.customer) {
      query.customer = req.query.customer;
    }

    if (req.query.invoice) {
      query.invoice = req.query.invoice;
    }

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
        .populate('invoice', 'invoiceNumber grandTotal amountPaid outstandingBalance paymentStatus')
        .populate('verifiedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: payments,
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

// @desc    Get single payment by ID
// @route   GET /api/payments/:id
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
      .populate('invoice', 'invoiceNumber grandTotal amountPaid outstandingBalance paymentStatus')
      .populate('verifiedBy', 'firstName lastName email');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create/Submit a new payment
// @route   POST /api/payments
export const createPayment = async (req, res) => {
  try {
    const {
      invoice,
      amount,
      paymentMethod,
      referenceNumber,
      bankName,
      accountNumber,
      chequeNumber,
      chequeDate,
      cardType,
      lastFourDigits,
      cardHolderName,
      terminalId,
      authCode,
      payerName,
      payerPhone,
      slipUrl,
      notes,
    } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid payment amount' });
    }

    const invoiceDoc = await Invoice.findById(invoice).populate('customer');
    if (!invoiceDoc) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Customer security check: customer can only pay for their own invoice
    const customerDocId = invoiceDoc.customer?._id || invoiceDoc.customer;
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user._id });
      if (!customer || !customerDocId || customer._id.toString() !== customerDocId.toString()) {
        return res.status(403).json({ success: false, message: 'You are not authorized to pay for this invoice' });
      }
    }

    if (invoiceDoc.outstandingBalance < numAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (Rs. ${numAmount.toLocaleString()}) exceeds outstanding balance (Rs. ${invoiceDoc.outstandingBalance.toLocaleString()})`,
      });
    }

    // If submitted by customer, it ALWAYS requires manager verification ('pending').
    // If recorded by manager/admin, they can specify status or default to 'completed'.
    const isCustomer = req.user.role === 'customer';
    const status = isCustomer ? 'pending' : (req.body.status || 'completed');

    const paymentData = {
      invoice,
      customer: customerDocId,
      amount: numAmount,
      paymentMethod,
      referenceNumber,
      recordedBy: req.user._id,
      notes,
      payerName: payerName || (req.user.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : undefined),
      payerPhone,
      slipUrl,
      status,
      bankDetails: {
        bankName,
        accountNumber,
        chequeNumber,
        chequeDate: chequeDate ? new Date(chequeDate) : undefined,
      },
      cardDetails: {
        lastFourDigits,
        cardType,
        cardHolderName,
      },
      posTerminalDetails: {
        terminalId,
        authCode,
      },
    };

    if (status === 'completed') {
      paymentData.verifiedBy = req.user._id;
      paymentData.verifiedAt = new Date();
    }

    const payment = await Payment.create(paymentData);

    if (status === 'completed') {
      // Immediate update for manager direct recording
      invoiceDoc.amountPaid += numAmount;
      await invoiceDoc.save();

      await Customer.findByIdAndUpdate(customerDocId, {
        $inc: { totalSpent: numAmount },
      });

      try {
        if (invoiceDoc.customer?.user) {
          await Notification.create({
            user: invoiceDoc.customer.user,
            title: `Payment Received (${invoiceDoc.invoiceNumber})`,
            description: `Payment of Rs. ${numAmount.toLocaleString()} received via ${paymentMethod.replace('_', ' ')}. Outstanding: Rs. ${invoiceDoc.outstandingBalance.toLocaleString()}`,
            type: 'payment_received',
          });
        }
      } catch (notifErr) {
        console.error('Error creating payment_received notification:', notifErr);
      }
    } else {
      // Pending manager verification
      // 1. Notify Customer
      try {
        const customerUserId = invoiceDoc.customer?.user?._id || invoiceDoc.customer?.user;
        if (customerUserId) {
          await Notification.create({
            user: customerUserId,
            title: `Payment Submitted (${invoiceDoc.invoiceNumber})`,
            description: `Your payment of Rs. ${numAmount.toLocaleString()} via ${paymentMethod.replace('_', ' ')} was submitted and is awaiting manager verification.`,
            type: 'payment_submitted',
          });
        }
      } catch (notifErr) {
        console.error('Error creating payment_submitted notification:', notifErr);
      }

      // 2. Notify Managers & Admins
      try {
        const managers = await User.find({ role: { $in: ['manager', 'administrator'] } }).select('_id');
        const managerNotifs = managers.map(m => ({
          user: m._id,
          title: `Payment Verification Required (${invoiceDoc.invoiceNumber})`,
          description: `Payment of Rs. ${numAmount.toLocaleString()} submitted via ${paymentMethod.replace('_', ' ')} requires your verification.`,
          type: 'payment_pending',
        }));
        if (managerNotifs.length > 0) {
          await Notification.insertMany(managerNotifs);
        }
      } catch (err) {
        console.error('Error notifying managers:', err);
      }
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
      .populate('invoice', 'invoiceNumber grandTotal amountPaid outstandingBalance paymentStatus');

    res.status(201).json({
      success: true,
      data: populatedPayment,
      message: status === 'pending'
        ? 'Payment submitted successfully and is awaiting manager verification.'
        : 'Payment recorded successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify/Approve or Reject a pending payment
// @route   PUT /api/payments/:id/verify
// @access  Private (manager, administrator)
export const verifyPayment = async (req, res) => {
  try {
    const { action, rejectionReason, notes } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'" });
    }

    const payment = await Payment.findById(req.params.id)
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
      .populate('invoice');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Payment has already been ${payment.status} and cannot be verified again`,
      });
    }

    const invoiceDoc = await Invoice.findById(payment.invoice?._id || payment.invoice);
    if (!invoiceDoc) {
      return res.status(404).json({ success: false, message: 'Associated invoice not found' });
    }

    if (action === 'approve') {
      payment.status = 'completed';
      payment.verifiedBy = req.user._id;
      payment.verifiedAt = new Date();
      if (notes) payment.notes = notes;
      await payment.save();

      // Update invoice amountPaid & save (triggers pre-save hook for outstandingBalance & paymentStatus)
      invoiceDoc.amountPaid += payment.amount;
      await invoiceDoc.save();

      // Update customer total spent
      await Customer.findByIdAndUpdate(payment.customer._id || payment.customer, {
        $inc: { totalSpent: payment.amount },
      });

      // Send notification to customer
      try {
        const customerUserId = payment.customer?.user?._id || payment.customer?.user;
        if (customerUserId) {
          await Notification.create({
            user: customerUserId,
            title: `Payment Verified & Approved (${invoiceDoc.invoiceNumber})`,
            description: `Your payment of Rs. ${payment.amount.toLocaleString()} has been verified and approved. Outstanding balance: Rs. ${invoiceDoc.outstandingBalance.toLocaleString()}`,
            type: 'payment_verified',
          });
        }
      } catch (notifErr) {
        console.error('Error creating payment_verified notification:', notifErr);
      }

      const updated = await Payment.findById(payment._id)
        .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
        .populate('invoice', 'invoiceNumber grandTotal amountPaid outstandingBalance paymentStatus')
        .populate('verifiedBy', 'firstName lastName email');

      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Payment verified and approved successfully. Invoice balance updated.',
      });
    } else {
      // Reject payment
      payment.status = 'rejected';
      payment.verifiedBy = req.user._id;
      payment.verifiedAt = new Date();
      payment.rejectionReason = rejectionReason || 'Payment proof could not be verified';
      if (notes) payment.notes = notes;
      await payment.save();

      // Send notification to customer
      try {
        const customerUserId = payment.customer?.user?._id || payment.customer?.user;
        if (customerUserId) {
          await Notification.create({
            user: customerUserId,
            title: `Payment Rejected (${invoiceDoc.invoiceNumber})`,
            description: `Your payment of Rs. ${payment.amount.toLocaleString()} was rejected. Reason: ${payment.rejectionReason}`,
            type: 'payment_rejected',
          });
        }
      } catch (notifErr) {
        console.error('Error creating payment_rejected notification:', notifErr);
      }

      const updated = await Payment.findById(payment._id)
        .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
        .populate('invoice', 'invoiceNumber grandTotal amountPaid outstandingBalance paymentStatus')
        .populate('verifiedBy', 'firstName lastName email');

      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Payment rejected. Customer has been notified.',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Refund payment
// @route   PUT /api/payments/:id/refund
export const refundPayment = async (req, res) => {
  try {
    const { refundAmount, refundReason } = req.body;
    const payment = await Payment.findById(req.params.id).populate('invoice').populate('customer');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Only completed payments can be refunded' });
    }

    const refundAmt = refundAmount || payment.amount;

    if (refundAmt > payment.amount) {
      return res.status(400).json({ success: false, message: 'Refund amount cannot exceed payment amount' });
    }

    payment.status = 'refunded';
    payment.refundAmount = refundAmt;
    payment.refundReason = refundReason;
    payment.refundDate = new Date();
    await payment.save();

    // Update invoice
    if (payment.invoice) {
      const invoiceDoc = await Invoice.findById(payment.invoice._id || payment.invoice);
      if (invoiceDoc) {
        invoiceDoc.amountPaid -= refundAmt;
        await invoiceDoc.save();
      }
    }

    // Notify customer
    const customerUserId = payment.customer?.user?._id || payment.customer?.user;
    if (customerUserId) {
      await Notification.create({
        user: customerUserId,
        title: `Payment Refunded (${payment.paymentId})`,
        description: `Refund of Rs. ${refundAmt.toLocaleString()} processed. ${refundReason || ''}`,
        type: 'payment_refunded',
      });
    }

    res.status(200).json({ success: true, data: payment, message: 'Payment refunded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
export const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    res.status(200).json({ success: true, data: payment, message: 'Payment updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payment statistics
// @route   GET /api/payments/stats
export const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {};
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const stats = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0],
            },
          },
          pendingCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
            },
          },
          completedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
            },
          },
          rejectedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0],
            },
          },
          totalRefunds: {
            $sum: {
              $cond: [{ $eq: ['$status', 'refunded'] }, '$refundAmount', 0],
            },
          },
          byMethod: {
            $push: {
              method: '$paymentMethod',
              amount: '$amount',
              status: '$status',
            },
          },
        },
      },
    ]);

    const byStatus = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: stats[0] || {
          totalPayments: 0,
          totalAmount: 0,
          pendingCount: 0,
          completedCount: 0,
          rejectedCount: 0,
          totalRefunds: 0,
          byMethod: [],
        },
        byStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
