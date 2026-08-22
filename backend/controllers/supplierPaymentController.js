import SupplierPayment from '../models/SupplierPayment.js';
import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import GRN from '../models/GRN.js';

export const getSupplierPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = {};

    // Handle status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Handle supplier filter
    if (req.query.supplier) {
      query.supplier = req.query.supplier;
    }

    // Handle payment method filter
    if (req.query.paymentMethod) {
      query.paymentMethod = req.query.paymentMethod;
    }
    
    // Handle bank_transfer as bank for backward compatibility
    if (req.query.paymentMethod === 'bank_transfer') {
      query.paymentMethod = 'bank';
    }

    // Handle date range filter
    if (req.query.startDate || req.query.endDate) {
      query.paymentDate = {};
      if (req.query.startDate) {
        query.paymentDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.paymentDate.$lte = new Date(req.query.endDate);
      }
    }

    // Handle search
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [
        { paymentId: regex },
        { supplierName: regex },
        { referenceNumber: regex },
        { notes: regex },
      ];
    }

    const [payments, total] = await Promise.all([
      SupplierPayment.find(query)
        .populate('supplier', 'name supplierId')
        .populate('purchaseOrder', 'poNumber')
        .populate('grn', 'grnNumber')
        .populate('recordedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SupplierPayment.countDocuments(query),
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

export const getSupplierPaymentById = async (req, res) => {
  try {
    const payment = await SupplierPayment.findById(req.params.id)
      .populate('supplier')
      .populate('purchaseOrder')
      .populate('grn')
      .populate('recordedBy', 'firstName lastName');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Supplier payment not found' });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSupplierPayment = async (req, res) => {
  try {
    const { supplier, purchaseOrder, grn, amount, outstandingBalance, invoiceNumber, paymentMethod, referenceNumber, bankDetails, chequeDetails, notes } = req.body;

    // Verify supplier exists
    const supplierData = await Supplier.findById(supplier);
    if (!supplierData) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Verify PO or GRN if provided
    if (purchaseOrder) {
      const poData = await PurchaseOrder.findById(purchaseOrder);
      if (!poData) {
        return res.status(404).json({ success: false, message: 'Purchase order not found' });
      }
    }

    if (grn) {
      const grnData = await GRN.findById(grn);
      if (!grnData) {
        return res.status(404).json({ success: false, message: 'GRN not found' });
      }
    }

    // Calculate remaining balance
    const remainingBalance = outstandingBalance - amount;
    
    // Determine status based on remaining balance
    const status = remainingBalance <= 0 ? 'completed' : 'completed';

    const payment = await SupplierPayment.create({
      supplier,
      supplierName: supplierData.name,
      purchaseOrder,
      poNumber: purchaseOrder ? (await PurchaseOrder.findById(purchaseOrder)).poNumber : null,
      grn,
      grnNumber: grn ? (await GRN.findById(grn)).grnNumber : null,
      amount,
      outstandingBalance,
      remainingBalance,
      invoiceNumber,
      paymentMethod,
      referenceNumber,
      bankDetails,
      chequeDetails,
      notes,
      status,
      recordedBy: req.user.id,
    });

    const populatedPayment = await SupplierPayment.findById(payment._id)
      .populate('supplier', 'name supplierId')
      .populate('purchaseOrder', 'poNumber')
      .populate('grn', 'grnNumber')
      .populate('recordedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedPayment,
      message: 'Supplier payment recorded successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupplierPayment = async (req, res) => {
  try {
    const payment = await SupplierPayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Supplier payment not found' });
    }

    // Update supplier name if supplier is changed
    if (req.body.supplier && req.body.supplier !== payment.supplier.toString()) {
      const supplierData = await Supplier.findById(req.body.supplier);
      if (supplierData) {
        req.body.supplierName = supplierData.name;
      }
    }

    const updatedPayment = await SupplierPayment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('supplier', 'name supplierId')
     .populate('purchaseOrder', 'poNumber')
     .populate('grn', 'grnNumber')
     .populate('recordedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: updatedPayment,
      message: 'Supplier payment updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSupplierPayment = async (req, res) => {
  try {
    const payment = await SupplierPayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Supplier payment not found' });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed payments'
      });
    }

    await SupplierPayment.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Supplier payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupplierPaymentSummary = async (req, res) => {
  try {
    const [pending, completed, cancelled] = await Promise.all([
      SupplierPayment.countDocuments({ status: 'pending' }),
      SupplierPayment.countDocuments({ status: 'completed' }),
      SupplierPayment.countDocuments({ status: 'cancelled' }),
    ]);

    const totalPaid = await SupplierPayment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending,
        completed,
        cancelled,
        totalPaid: totalPaid[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};