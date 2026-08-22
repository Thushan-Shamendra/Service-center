import Quotation from '../models/Quotation.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import JobCard from '../models/JobCard.js';
import InventoryItem from '../models/InventoryItem.js';
import Notification from '../models/Notification.js';

export const getQuotations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status) query.status = req.query.status;

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user._id });
      if (customer) query.customer = customer._id;
    } else if (req.query.customer) {
      query.customer = req.query.customer;
    }

    const [quotations, total] = await Promise.all([
      Quotation.find(query)
        .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
        .populate('vehicle', 'registrationNumber make model')
        .populate('jobCard', 'jobCardNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Quotation.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: quotations,
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

export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
      .populate('vehicle', 'registrationNumber make model')
      .populate('jobCard', 'jobCardNumber')
      .populate('items.part', 'itemName itemCode');

    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createQuotation = async (req, res) => {
  try {
    const { customer, vehicle, jobCard, items, laborCharge, estimatedHours, taxRate, notes } = req.body;

    const quotation = await Quotation.create({
      customer,
      vehicle,
      jobCard,
      items: items.map(item => ({
        ...item,
        total: item.quantity * item.unitPrice,
      })),
      laborCharge,
      estimatedHours,
      taxRate,
      notes,
      status: 'draft',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    res.status(201).json({ success: true, data: quotation, message: 'Quotation created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    res.status(200).json({ success: true, data: quotation, message: 'Quotation updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('customer');

    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    if (quotation.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Quotation can only be submitted from draft status' });
    }

    quotation.status = 'submitted';
    await quotation.save();

    // Notify manager for approval
    if (quotation.customer?.user) {
      await Notification.create({
        user: quotation.customer.user,
        title: `Quotation Submitted (${quotation.quotationNumber})`,
        description: `Your quotation has been submitted and is pending approval. Total: Rs. ${quotation.grandTotal.toLocaleString()}`,
        type: 'quotation_submitted',
      });
    }

    res.status(200).json({ success: true, data: quotation, message: 'Quotation submitted for approval' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('customer');

    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    if (quotation.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Quotation must be in submitted status' });
    }

    quotation.status = 'approved';
    await quotation.save();

    // Notify customer
    if (quotation.customer?.user) {
      await Notification.create({
        user: quotation.customer.user,
        title: `Quotation Approved (${quotation.quotationNumber})`,
        description: `Your quotation has been approved. Total: Rs. ${quotation.grandTotal.toLocaleString()}`,
        type: 'quotation_approved',
      });
    }

    res.status(200).json({ success: true, data: quotation, message: 'Quotation approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectQuotation = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const quotation = await Quotation.findById(req.params.id).populate('customer');

    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    if (quotation.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Quotation must be in submitted status' });
    }

    quotation.status = 'rejected';
    quotation.rejectionReason = rejectionReason;
    await quotation.save();

    // Notify customer
    if (quotation.customer?.user) {
      await Notification.create({
        user: quotation.customer.user,
        title: `Quotation Rejected (${quotation.quotationNumber})`,
        description: `Your quotation has been rejected. ${rejectionReason || 'Please contact for details.'}`,
        type: 'quotation_rejected',
      });
    }

    res.status(200).json({ success: true, data: quotation, message: 'Quotation rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const convertToInvoice = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    if (quotation.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Quotation must be approved before conversion' });
    }

    const Invoice = (await import('../models/Invoice.js')).default;
    
    const invoice = await Invoice.create({
      customer: quotation.customer,
      vehicle: quotation.vehicle,
      jobCard: quotation.jobCard,
      quotation: quotation._id,
      items: quotation.items,
      laborCharges: [{
        description: 'Service Labor',
        hours: quotation.estimatedHours,
        ratePerHour: quotation.laborCharge,
        total: quotation.laborCost,
      }],
      subtotal: quotation.subtotal,
      taxRate: quotation.taxRate,
      taxAmount: quotation.taxAmount,
      grandTotal: quotation.grandTotal,
      status: 'sent',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    quotation.status = 'converted';
    await quotation.save();

    res.status(201).json({ success: true, data: invoice, message: 'Quotation converted to invoice' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    if (quotation.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft quotations can be deleted' });
    }

    await Quotation.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
