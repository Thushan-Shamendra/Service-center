import PurchaseReturn from '../models/PurchaseReturn.js';
import GRN from '../models/GRN.js';
import InventoryItem from '../models/InventoryItem.js';

export const getPurchaseReturns = async (req, res) => {
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

    // Handle date range filter
    if (req.query.startDate || req.query.endDate) {
      query.returnDate = {};
      if (req.query.startDate) {
        query.returnDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.returnDate.$lte = new Date(req.query.endDate);
      }
    }

    // Handle search
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [
        { returnNumber: regex },
        { grnNumber: regex },
        { supplierName: regex },
        { notes: regex },
      ];
    }

    const [returns, total] = await Promise.all([
      PurchaseReturn.find(query)
        .populate('supplier', 'name supplierId')
        .populate('grn', 'grnNumber')
        .populate('purchaseOrder', 'poNumber')
        .populate('createdBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PurchaseReturn.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: returns,
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

export const getPurchaseReturnById = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id)
      .populate('supplier')
      .populate('grn')
      .populate('purchaseOrder')
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .populate('items.item');
    
    if (!purchaseReturn) {
      return res.status(404).json({ success: false, message: 'Purchase return not found' });
    }

    res.status(200).json({ success: true, data: purchaseReturn });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPurchaseReturn = async (req, res) => {
  try {
    const { grn, items, returnReason, notes, refundMethod } = req.body;

    console.log('Creating purchase return with data:', { grn, items, returnReason, notes, refundMethod });

    // Verify GRN exists
    const grnData = await GRN.findById(grn);
    if (!grnData) {
      console.log('GRN not found:', grn);
      return res.status(404).json({ success: false, message: 'GRN not found' });
    }

    console.log('Found GRN:', grnData.grnNumber);

    // Calculate total refund
    let totalRefund = 0;
    const processedItems = [];

    for (const item of items) {
      // Fetch inventory item details
      let itemDetails = null;
      if (item.item) {
        itemDetails = await InventoryItem.findById(item.item);
      }

      const refundAmount = item.returnedQuantity * item.unitPrice;
      totalRefund += refundAmount;
      
      processedItems.push({
        ...item,
        reason: item.itemReason || item.reason,
        refundAmount,
      });
    }

    console.log('Creating purchase return document...');

    const purchaseReturn = await PurchaseReturn.create({
      grn,
      grnNumber: grnData.grnNumber,
      purchaseOrder: grnData.purchaseOrder,
      poNumber: grnData.poNumber,
      supplier: grnData.supplier,
      supplierName: grnData.supplierName,
      items: processedItems,
      totalRefund,
      returnReason,
      notes,
      refundMethod,
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      createdBy: req.user.id,
    });

    console.log('Purchase return created successfully:', purchaseReturn.returnNumber);

    // Revert inventory stock for returned items with movement history
    for (const item of purchaseReturn.items) {
      if (item.item && item.returnedQuantity > 0) {
        const inventoryItem = await InventoryItem.findById(item.item);
        if (inventoryItem) {
          inventoryItem.quantity -= item.returnedQuantity;
          inventoryItem.movementHistory.push({
            type: 'out',
            quantity: -item.returnedQuantity,
            reference: `RET-${purchaseReturn.returnNumber}`,
            remarks: `Purchase return - ${returnReason}`,
            performedBy: req.user.id,
          });
          await inventoryItem.save();
        }
      }
    }

    const populatedReturn = await PurchaseReturn.findById(purchaseReturn._id)
      .populate('supplier', 'name supplierId')
      .populate('grn', 'grnNumber')
      .populate('purchaseOrder', 'poNumber')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({ 
      success: true, 
      data: populatedReturn, 
      message: 'Purchase return created successfully' 
    });
  } catch (error) {
    console.error('Error creating purchase return:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePurchaseReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id);
    
    if (!purchaseReturn) {
      return res.status(404).json({ success: false, message: 'Purchase return not found' });
    }

    // Recalculate total refund if items are updated
    if (req.body.items) {
      let totalRefund = 0;
      const processedItems = req.body.items.map(item => {
        const refundAmount = item.returnedQuantity * item.unitPrice;
        totalRefund += refundAmount;
        return { ...item, refundAmount };
      });
      
      req.body.items = processedItems;
      req.body.totalRefund = totalRefund;
    }

    const updatedReturn = await PurchaseReturn.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('supplier', 'name supplierId')
     .populate('grn', 'grnNumber')
     .populate('purchaseOrder', 'poNumber')
     .populate('createdBy', 'firstName lastName')
     .populate('approvedBy', 'firstName lastName');

    res.status(200).json({ 
      success: true, 
      data: updatedReturn, 
      message: 'Purchase return updated successfully' 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePurchaseReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id);
    
    if (!purchaseReturn) {
      return res.status(404).json({ success: false, message: 'Purchase return not found' });
    }

    // Restore inventory stock for deleted return with movement history
    for (const item of purchaseReturn.items) {
      if (item.item && item.returnedQuantity > 0) {
        const inventoryItem = await InventoryItem.findById(item.item);
        if (inventoryItem) {
          inventoryItem.quantity += item.returnedQuantity;
          inventoryItem.movementHistory.push({
            type: 'in',
            quantity: item.returnedQuantity,
            reference: `RET-${purchaseReturn.returnNumber}`,
            remarks: `Return deleted - stock restored`,
            performedBy: req.user.id,
          });
          await inventoryItem.save();
        }
      }
    }

    await PurchaseReturn.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      success: true, 
      message: 'Purchase return deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approvePurchaseReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id);
    
    if (!purchaseReturn) {
      return res.status(404).json({ success: false, message: 'Purchase return not found' });
    }

    if (purchaseReturn.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending returns can be approved' });
    }

    purchaseReturn.status = 'approved';
    purchaseReturn.approvedBy = req.user.id;
    purchaseReturn.approvedAt = new Date();
    await purchaseReturn.save();

    const populatedReturn = await PurchaseReturn.findById(purchaseReturn._id)
      .populate('supplier', 'name supplierId')
      .populate('grn', 'grnNumber')
      .populate('approvedBy', 'firstName lastName');

    res.status(200).json({ 
      success: true, 
      data: populatedReturn, 
      message: 'Purchase return approved successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectPurchaseReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id);
    
    if (!purchaseReturn) {
      return res.status(404).json({ success: false, message: 'Purchase return not found' });
    }

    if (purchaseReturn.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending returns can be rejected' });
    }

    // Restore inventory stock for rejected return with movement history
    for (const item of purchaseReturn.items) {
      if (item.item && item.returnedQuantity > 0) {
        const inventoryItem = await InventoryItem.findById(item.item);
        if (inventoryItem) {
          inventoryItem.quantity += item.returnedQuantity;
          inventoryItem.movementHistory.push({
            type: 'in',
            quantity: item.returnedQuantity,
            reference: `RET-${purchaseReturn.returnNumber}`,
            remarks: `Return rejected - stock restored`,
            performedBy: req.user.id,
          });
          await inventoryItem.save();
        }
      }
    }

    purchaseReturn.status = 'rejected';
    await purchaseReturn.save();

    const populatedReturn = await PurchaseReturn.findById(purchaseReturn._id)
      .populate('supplier', 'name supplierId')
      .populate('grn', 'grnNumber');

    res.status(200).json({ 
      success: true, 
      data: populatedReturn, 
      message: 'Purchase return rejected successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPurchaseReturnSummary = async (req, res) => {
  try {
    const [pending, approved, rejected, processed] = await Promise.all([
      PurchaseReturn.countDocuments({ status: 'pending' }),
      PurchaseReturn.countDocuments({ status: 'approved' }),
      PurchaseReturn.countDocuments({ status: 'rejected' }),
      PurchaseReturn.countDocuments({ status: 'processed' }),
    ]);

    const totalRefund = await PurchaseReturn.aggregate([
      { $match: { status: { $in: ['approved', 'processed'] } } },
      { $group: { _id: null, total: { $sum: '$totalRefund' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        processed,
        totalRefund: totalRefund[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};