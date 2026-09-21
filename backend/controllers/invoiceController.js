import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';

// @desc    Get invoices with paymentStatus and customer filters
// @route   GET /api/invoices
export const getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.paymentStatus && req.query.paymentStatus !== 'all') {
      query.paymentStatus = req.query.paymentStatus;
    }
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    if (req.query.jobCard) {
      query.jobCard = req.query.jobCard;
    }

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user._id });
      if (customer) query.customer = customer._id;
    } else if (req.query.customer) {
      query.customer = req.query.customer;
    }

    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [{ invoiceNumber: regex }];
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
        .populate('vehicle')
        .populate('jobCard', 'jobCardNumber complaint status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: invoices,
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

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
      .populate('vehicle')
      .populate('jobCard');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new invoice
// @route   POST /api/invoices
export const createInvoice = async (req, res) => {
  try {
    const { items, laborCharges, discount, taxRate } = req.body;

    // Calculate and validate invoice totals
    let subtotal = 0;

    // Calculate items total
    if (items && Array.isArray(items)) {
      items.forEach(item => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0) - (item.discount || 0);
        item.total = itemTotal;
        subtotal += itemTotal;
      });
    }

    // Calculate labor charges total
    let laborTotal = 0;
    if (laborCharges && Array.isArray(laborCharges)) {
      laborCharges.forEach(labor => {
        const laborChargeTotal = (labor.hours || 0) * (labor.ratePerHour || 0);
        labor.total = laborChargeTotal;
        laborTotal += laborChargeTotal;
      });
    }

    const totalBeforeDiscount = subtotal + laborTotal;
    const discountAmount = discount || 0;
    const taxableAmount = totalBeforeDiscount - discountAmount;
    const tax = (taxableAmount * (taxRate || 0)) / 100;
    const grandTotal = taxableAmount + tax;

    // Validate calculated values
    if (grandTotal < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invoice total cannot be negative' 
      });
    }

    const invoiceData = {
      ...req.body,
      items,
      laborCharges,
      subtotal: totalBeforeDiscount,
      discount: discountAmount,
      taxRate: taxRate || 0,
      taxAmount: tax,
      grandTotal,
      amountPaid: 0,
      outstandingBalance: grandTotal,
      paymentStatus: 'unpaid',
    };

    const invoice = await Invoice.create(invoiceData);
    res.status(201).json({ success: true, data: invoice, message: 'Invoice generated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record payment for invoice (Cash, Card, Bank Transfer, Cheque)
// @route   POST /api/invoices/:id/payments
export const recordPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, referenceNumber, bankDetails, cardDetails } = req.body;
    const payAmt = Number(amount);

    if (isNaN(payAmt) || payAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid payment amount' });
    }

    // Validate payment method
    const validPaymentMethods = ['cash', 'card', 'bank_transfer', 'cheque'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}` 
      });
    }

    // Validate method-specific fields
    if (paymentMethod === 'cheque') {
      if (!bankDetails || !bankDetails.chequeNumber || !bankDetails.chequeDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cheque number and cheque date are required for cheque payments' 
        });
      }
    }

    if (paymentMethod === 'card') {
      if (!cardDetails || !cardDetails.lastFourDigits) {
        return res.status(400).json({ 
          success: false, 
          message: 'Card details (last 4 digits) are required for card payments' 
        });
      }
    }

    if (paymentMethod === 'bank_transfer') {
      if (!referenceNumber) {
        return res.status(400).json({ 
          success: false, 
          message: 'Reference number is required for bank transfer payments' 
        });
      }
    }

    const invoice = await Invoice.findById(req.params.id).populate('customer');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    // Check if payment amount exceeds outstanding balance
    if (payAmt > invoice.outstandingBalance) {
      return res.status(400).json({ 
        success: false, 
        message: `Payment amount exceeds outstanding balance. Outstanding: Rs. ${invoice.outstandingBalance.toLocaleString()}` 
      });
    }

    // Create payment record
    const payment = await Payment.create({
      invoice: invoice._id,
      customer: invoice.customer._id,
      amount: payAmt,
      paymentMethod,
      referenceNumber,
      bankDetails,
      cardDetails,
      recordedBy: req.user._id,
      status: 'completed',
    });

    invoice.amountPaid += payAmt;
    await invoice.save(); // pre-save hook calculates outstanding balance & paymentStatus

    // Update customer total spent
    if (invoice.customer) {
      await Customer.findByIdAndUpdate(invoice.customer._id, {
        $inc: { totalSpent: payAmt },
      });
    }

    // Trigger Notification
    if (invoice.customer?.user) {
      await Notification.create({
        user: invoice.customer.user,
        title: `Payment Received (${invoice.invoiceNumber})`,
        description: `Payment of Rs. ${payAmt.toLocaleString()} received via ${paymentMethod}. Outstanding: Rs. ${invoice.outstandingBalance.toLocaleString()}`,
        type: 'payment_received',
      });
    }

    res.status(200).json({
      success: true,
      data: { invoice, payment },
      message: `Payment of Rs. ${payAmt.toLocaleString()} recorded. Outstanding balance: Rs. ${invoice.outstandingBalance.toLocaleString()}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
