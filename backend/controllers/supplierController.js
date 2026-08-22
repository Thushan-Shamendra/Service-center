import Supplier from '../models/Supplier.js';
import SparePartsRequest from '../models/SparePartsRequest.js';

export const getSupplierSummary = async (req, res) => {
  try {
    // Count all suppliers (both active and inactive)
    const totalSuppliers = await Supplier.countDocuments({});
    
    // Count pending spare parts requests (as proxy for pending PO)
    const pendingPO = await SparePartsRequest.countDocuments({ status: 'pending' });
    
    // Count approved but not issued spare parts requests (as proxy for pending GRN)
    const pendingGRN = await SparePartsRequest.countDocuments({ status: 'approved' });
    
    // For now, set outstanding payments to 0 as we need a proper supplier payment model
    const outstandingPayments = 0;

    res.status(200).json({
      success: true,
      data: {
        totalSuppliers,
        pendingPO,
        pendingGRN,
        outstandingPayments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSuppliers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = {};

    // Handle status filter
    if (req.query.status === 'active') {
      query.isActive = true;
    } else if (req.query.status === 'inactive') {
      query.isActive = false;
    }

    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: regex },
        { supplierId: regex },
        { contactPerson: regex },
        { category: regex },
        { email: regex },
        { 'bankDetails.bankName': regex },
        { 'bankDetails.branch': regex },
      ];
    }

    const [suppliers, total] = await Promise.all([
      Supplier.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Supplier.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: suppliers,
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

export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const supplierData = {
      ...req.body,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    };
    
    // Handle address field - ensure it has required fields
    if (!supplierData.address) {
      supplierData.address = { street: '', city: '' };
    }
    
    const supplier = await Supplier.create(supplierData);
    res.status(201).json({ success: true, data: supplier, message: 'Supplier created successfully' });
  } catch (error) {
    // Handle validation errors for enum fields
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.status(200).json({ success: true, data: supplier, message: 'Supplier updated successfully' });
  } catch (error) {
    // Handle validation errors for enum fields
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, { isActive: true }, {
      new: true,
    });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.status(200).json({ success: true, data: supplier, message: 'Supplier activated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deactivateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, { isActive: false }, {
      new: true,
    });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.status(200).json({ success: true, data: supplier, message: 'Supplier deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    supplier.isActive = false;
    await supplier.save();
    res.status(200).json({ success: true, message: 'Supplier deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
