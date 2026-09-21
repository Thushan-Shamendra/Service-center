import Quotation from '../models/Quotation.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import JobCard from '../models/JobCard.js';
import InventoryItem from '../models/InventoryItem.js';
import Notification from '../models/Notification.js';

const editableFields = ['customer', 'vehicle', 'jobCard', 'items', 'laborCharge', 'estimatedHours', 'discount', 'taxRate', 'notes'];
const editableData = body => Object.fromEntries(editableFields.filter(key => body[key] !== undefined).map(key => [key, body[key]]));
const fail = (res, error) => res.status(error.name === 'ValidationError' || error.name === 'CastError' ? 400 : error.name === 'VersionError' || error.code === 11000 ? 409 : 500)
  .json({ success: false, message: error.message });

const validateReferences = async data => {
  const [customer, vehicle, job] = await Promise.all([
    Customer.findById(data.customer), Vehicle.findById(data.vehicle),
    data.jobCard ? JobCard.findById(data.jobCard) : null,
  ]);
  if (!customer || !vehicle || String(vehicle.customer) !== String(customer._id)) return 'Select a vehicle belonging to the customer';
  if (data.jobCard && (!job || String(job.customer) !== String(customer._id) || String(job.vehicle) !== String(vehicle._id))) return 'Job card must match the customer and vehicle';
  if (!Array.isArray(data.items)) return 'Quotation items must be an array';
  for (const item of data.items) {
    if (!item || typeof item.name !== 'string') return 'Each item needs a name';
    if (item.part && !(await InventoryItem.exists({ _id: item.part }))) return 'Inventory part not found';
    if (!item.name?.trim()) return 'Each item needs a name';
  }
  return null;
};

export const getQuotations = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status) query.status = req.query.status;

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user._id });
      if (!customer) return res.json({ success: true, data: [], pagination: { page, limit, total: 0, pages: 0 } });
      query.customer = customer._id;
    } else if (req.query.customer) {
      query.customer = req.query.customer;
    }

    const [quotations, total] = await Promise.all([
      Quotation.find(query)
        .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
        .populate('vehicle', 'registrationNumber make model')
        .populate({ path: 'jobCard', select: 'jobCardNumber assignedTechnician', populate: { path: 'assignedTechnician', populate: { path: 'user', select: 'firstName lastName' } } })
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
    fail(res, error);
  }
};

export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName mobile email' } })
      .populate('vehicle', 'registrationNumber make model')
      .populate('jobCard', 'jobCardNumber')
      .populate('items.part', 'itemName itemCode quantity');

    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    if (req.user.role === 'customer') {
      const owner = await Customer.findOne({ user: req.user._id });
      if (!owner || String(quotation.customer?._id) !== String(owner._id)) return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    fail(res, error);
  }
};

export const createQuotation = async (req, res) => {
  try {
    const data = editableData(req.body);
    const invalid = await validateReferences(data);
    if (invalid) return res.status(400).json({ success: false, message: invalid });
    const quotation = await Quotation.create({
      ...data,
      status: 'draft',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    res.status(201).json({ success: true, data: quotation, message: 'Quotation created successfully' });
  } catch (error) {
    fail(res, error);
  }
};

export const updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    if (quotation.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft quotations can be edited' });
    quotation.set(editableData(req.body));
    const invalid = await validateReferences(quotation);
    if (invalid) return res.status(400).json({ success: false, message: invalid });
    await quotation.save();

    res.status(200).json({ success: true, data: quotation, message: 'Quotation updated successfully' });
  } catch (error) {
    fail(res, error);
  }
};

export const submitQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName email mobile' } });

    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    if (quotation.status !== 'draft' && quotation.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Only draft or pending quotations can be submitted to customer' });
    }

    quotation.status = 'submitted';
    await quotation.save();

    const customerUser = quotation.customer?.user;
    const customerUserId = customerUser?._id || customerUser;
    const customerName = customerUser?.firstName
      ? `${customerUser.firstName} ${customerUser.lastName || ''}`.trim()
      : 'Customer';

    // Notify customer
    if (customerUserId) {
      await Notification.create({
        user: customerUserId,
        title: `Quotation Received (${quotation.quotationNumber})`,
        description: `Dear ${customerName}, your vehicle service quotation (${quotation.quotationNumber}) has been submitted for your review. Total: Rs. ${quotation.grandTotal.toLocaleString()}. Please review and approve.`,
        type: 'quotation_submitted',
        link: '/customer/quotations',
        metadata: {
          quotationId: quotation._id,
          jobCardId: quotation.jobCard,
          grandTotal: quotation.grandTotal,
        }
      });
    }

    res.status(200).json({
      success: true,
      data: quotation,
      message: `Quotation submitted to ${customerName} successfully`,
    });
  } catch (error) {
    fail(res, error);
  }
};

export const approveQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName email mobile' } });

    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    if (quotation.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Quotation must be in submitted status' });
    }

    const customerUser = quotation.customer?.user;
    const customerUserId = customerUser?._id || customerUser;
    const customerName = customerUser?.firstName
      ? `${customerUser.firstName} ${customerUser.lastName || ''}`.trim()
      : 'Customer';

    // If customer is approving
    if (req.user.role === 'customer') {
      const owner = await Customer.findOne({ user: req.user._id });
      if (!owner || String(quotation.customer?._id) !== String(owner._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to approve this quotation' });
      }
      quotation.approvedBy = `${req.user.firstName || ''} ${req.user.lastName || ''} (Customer)`.trim();
    } else {
      // Manager is approving (e.g. on customer's behalf)
      quotation.approvedBy = req.body.approvedBy || `${req.user.firstName || ''} ${req.user.lastName || ''} (Manager)`.trim();
    }

    quotation.status = 'approved';
    quotation.approvedAt = new Date();
    await quotation.save();

    // If customer approved, notify managers and administrators
    if (req.user.role === 'customer') {
      const User = (await import('../models/User.js')).default;
      const staff = await User.find({ role: { $in: ['manager', 'administrator'] } }).select('_id');
      await Promise.all(
        staff.map(member =>
          Notification.create({
            user: member._id,
            title: `Quotation Approved by Customer (${quotation.quotationNumber})`,
            description: `Customer ${customerName} approved quotation ${quotation.quotationNumber} (Total: Rs. ${quotation.grandTotal.toLocaleString()}). Ready for service/invoicing.`,
            type: 'quotation_approved',
            link: `/manager/quotations/${quotation._id}`,
            metadata: {
              quotationId: quotation._id,
              customerId: quotation.customer?._id,
            },
          })
        )
      );
    } else {
      // If manager recorded approval, notify customer
      if (customerUserId) {
        await Notification.create({
          user: customerUserId,
          title: `Quotation Approved (${quotation.quotationNumber})`,
          description: `Your quotation ${quotation.quotationNumber} has been approved. Total: Rs. ${quotation.grandTotal.toLocaleString()}`,
          type: 'quotation_approved',
          link: '/customer/quotations',
        });
      }
    }

    res.status(200).json({ success: true, data: quotation, message: 'Quotation approved successfully' });
  } catch (error) {
    fail(res, error);
  }
};

export const rejectQuotation = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason?.trim()) return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    const quotation = await Quotation.findById(req.params.id)
      .populate({ path: 'customer', populate: { path: 'user', select: 'firstName lastName email mobile' } });

    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    if (quotation.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Quotation must be in submitted status' });
    }

    const customerUser = quotation.customer?.user;
    const customerUserId = customerUser?._id || customerUser;
    const customerName = customerUser?.firstName
      ? `${customerUser.firstName} ${customerUser.lastName || ''}`.trim()
      : 'Customer';

    // If customer is rejecting
    if (req.user.role === 'customer') {
      const owner = await Customer.findOne({ user: req.user._id });
      if (!owner || String(quotation.customer?._id) !== String(owner._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to reject this quotation' });
      }
    }

    quotation.status = 'rejected';
    quotation.rejectionReason = rejectionReason;
    await quotation.save();

    // If customer rejected, notify managers
    if (req.user.role === 'customer') {
      const User = (await import('../models/User.js')).default;
      const staff = await User.find({ role: { $in: ['manager', 'administrator'] } }).select('_id');
      await Promise.all(
        staff.map(member =>
          Notification.create({
            user: member._id,
            title: `Quotation Declined by Customer (${quotation.quotationNumber})`,
            description: `Customer ${customerName} declined quotation ${quotation.quotationNumber}. Reason: ${rejectionReason}`,
            type: 'quotation_rejected',
            link: `/manager/quotations/${quotation._id}`,
            metadata: {
              quotationId: quotation._id,
              customerId: quotation.customer?._id,
            },
          })
        )
      );
    } else {
      // If manager rejected, notify customer
      if (customerUserId) {
        await Notification.create({
          user: customerUserId,
          title: `Quotation Rejected (${quotation.quotationNumber})`,
          description: `Your quotation has been rejected. ${rejectionReason || 'Please contact the workshop for details.'}`,
          type: 'quotation_rejected',
          link: '/customer/quotations',
        });
      }
    }

    res.status(200).json({ success: true, data: quotation, message: 'Quotation rejected' });
  } catch (error) {
    fail(res, error);
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
    const existingInvoice = await Invoice.findOne({ quotation: quotation._id });
    if (existingInvoice) {
      quotation.status = 'converted';
      await quotation.save();
      return res.json({ success: true, data: existingInvoice, message: 'Quotation already converted to invoice' });
    }
    await quotation.validate();
    
    const invoice = await Invoice.create({
      customer: quotation.customer,
      vehicle: quotation.vehicle,
      jobCard: quotation.jobCard,
      quotation: quotation._id,
      items: quotation.items.map(item => ({ description: item.name, quantity: item.quantity, unitPrice: item.unitPrice, discount: item.discount, total: item.total })),
      laborCharges: [{
        description: 'Service Labor',
        hours: quotation.estimatedHours,
        ratePerHour: quotation.laborCharge,
        total: quotation.laborCost,
      }],
      subtotal: quotation.subtotal,
      discount: quotation.discount,
      notes: quotation.notes,
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
    fail(res, error);
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
    fail(res, error);
  }
};
