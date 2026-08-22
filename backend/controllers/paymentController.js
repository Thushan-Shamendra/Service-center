import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Notification from '../models/Notification.js';

export const getPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status) query.status = req.query.status;
    if (req.query.paymentMethod) query.paymentMethod = req.query.paymentMethod;

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user._id });
      if (customer) query.customer = customer._id;
    } else if (req.query.customer) {
      query.customer = req.query.customer;
    }

    if (req.query.invoice) query.invoice = req.query.invoice;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
        .populate('invoice', 'invoiceNumber')
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

export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
      .populate('invoice', 'invoiceNumber');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { invoice, amount, paymentMethod, referenceNumber, bankName, chequeNumber, chequeDate } = req.body;

    const invoiceDoc = await Invoice.findById(invoice).populate('customer').session(session);
    if (!invoiceDoc) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoiceDoc.outstandingBalance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Payment amount exceeds outstanding balance' });
    }

    const payment = await Payment.create([{
      invoice,
      customer: invoiceDoc.customer._id,
      amount,
      paymentMethod,
      referenceNumber,
      bankName,
      chequeNumber,
      chequeDate,
      status: 'completed',
    }], { session });

    // Update invoice
    invoiceDoc.amountPaid += amount;
    await invoiceDoc.save({ session });

    // Update customer total spent
    await Customer.findByIdAndUpdate(invoiceDoc.customer._id, {
      $inc: { totalSpent: amount },
    }, { session });

    // Notify customer
    if (invoiceDoc.customer?.user) {
      await Notification.create([{
        user: invoiceDoc.customer.user,
        title: `Payment Received (${invoiceDoc.invoiceNumber})`,
        description: `Payment of Rs. ${Number(amount).toLocaleString()} received via ${paymentMethod}. Outstanding: Rs. ${invoiceDoc.outstandingBalance.toLocaleString()}`,
        type: 'payment_received',
      }], { session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, data: payment[0], message: 'Payment recorded successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

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

    const session = await Payment.startSession();
    session.startTransaction();

    try {
      payment.status = 'refunded';
      payment.refundAmount = refundAmt;
      payment.refundReason = refundReason;
      payment.refundDate = new Date();
      await payment.save({ session });

      // Update invoice
      if (payment.invoice) {
        payment.invoice.amountPaid -= refundAmt;
        await payment.invoice.save({ session });
      }

      await session.commitTransaction();

      // Notify customer
      if (payment.customer?.user) {
        await Notification.create({
          user: payment.customer.user,
          title: `Payment Refunded (${payment.paymentId})`,
          description: `Refund of Rs. ${refundAmt.toLocaleString()} processed. ${refundReason || ''}`,
          type: 'payment_refunded',
        });
      }

      res.status(200).json({ success: true, data: payment, message: 'Payment refunded successfully' });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
          totalAmount: { $sum: '$amount' },
          totalRefunds: {
            $sum: {
              $cond: [{ $eq: ['$status', 'refunded'] }, '$refundAmount', 0],
            },
          },
          byMethod: {
            $push: {
              method: '$paymentMethod',
              amount: '$amount',
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
        summary: stats[0] || { totalPayments: 0, totalAmount: 0, totalRefunds: 0, byMethod: [] },
        byStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
