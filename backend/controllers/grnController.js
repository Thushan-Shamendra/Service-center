import GRN from '../models/GRN.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import InventoryItem from '../models/InventoryItem.js';
import mongoose from 'mongoose';

export const getGRNs = async (req, res) => {
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
      query.receivedDate = {};
      if (req.query.startDate) {
        query.receivedDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.receivedDate.$lte = new Date(req.query.endDate);
      }
    }

    // Handle search
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [
        { grnNumber: regex },
        { poNumber: regex },
        { supplierName: regex },
        { notes: regex },
      ];
    }

    const [grns, total] = await Promise.all([
      GRN.find(query)
        .populate('supplier', 'name supplierId')
        .populate('purchaseOrder', 'poNumber')
        .populate('receivedBy', 'firstName lastName')
        .populate('verifiedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      GRN.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: grns,
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

export const getGRNById = async (req, res) => {
  try {
    const grn = await GRN.findById(req.params.id)
      .populate('supplier')
      .populate('purchaseOrder')
      .populate('receivedBy', 'firstName lastName')
      .populate('verifiedBy', 'firstName lastName')
      .populate('items.item');
    
    if (!grn) {
      return res.status(404).json({ success: false, message: 'GRN not found' });
    }

    res.status(200).json({ success: true, data: grn });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createGRN = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { purchaseOrder, items, notes, warehouseLocation } = req.body;

    console.log('Creating GRN with data:', { purchaseOrder, items, notes, warehouseLocation });

    // Verify purchase order exists
    const poData = await PurchaseOrder.findById(purchaseOrder).session(session);
    if (!poData) {
      console.log('Purchase order not found:', purchaseOrder);
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    console.log('Found purchase order:', poData.poNumber);

    // Calculate totals and update PO received quantities
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      // Fetch inventory item details
      let itemDetails = null;
      if (item.item) {
        itemDetails = await InventoryItem.findById(item.item).session(session);
      }

      const itemTotal = item.receivedQuantity * item.unitPrice - (item.discount || 0) + (item.tax || 0);
      subtotal += itemTotal;
      
      processedItems.push({
        ...item,
        description: itemDetails?.description || '',
        total: itemTotal,
      });

      // Update PO item received quantity cumulatively
      const poItem = poData.items.find(pi => pi.item?.toString() === item.item?.toString() || pi._id?.toString() === item.item?.toString());
      if (poItem) {
        const previousReceived = poItem.receivedQuantity || 0;
        poItem.receivedQuantity = previousReceived + item.receivedQuantity;
      }

      // Update inventory stock with movement history
      if (item.item && item.receivedQuantity > 0) {
        const inventoryItem = await InventoryItem.findById(item.item).session(session);
        if (inventoryItem) {
          inventoryItem.quantity += item.receivedQuantity;
          inventoryItem.movementHistory.push({
            type: 'in',
            quantity: item.receivedQuantity,
            reference: `GRN-${poData.poNumber}`, // Use actual PO number directly
            remarks: `Goods received against purchase order ${poData.poNumber}`,
            performedBy: req.user.id,
            date: new Date(),
          });
          await inventoryItem.save({ session });
        }
      }
    }

    const discount = req.body.discount || 0;
    const tax = req.body.tax || 0;
    const totalAmount = subtotal - discount + tax;

    // Determine PO status based on cumulative received quantities
    let allItemsComplete = true;
    let anyItemsReceived = false;

    for (const poItem of poData.items) {
      const receivedQty = poItem.receivedQuantity || 0;
      if (receivedQty < poItem.quantity) {
        allItemsComplete = false;
      }
      if (receivedQty > 0) {
        anyItemsReceived = true;
      }
    }

    // Update PO status
    if (allItemsComplete) {
      poData.status = 'completed';
      poData.actualDeliveryDate = new Date();
    } else if (anyItemsReceived) {
      poData.status = 'partially_received';
    }
    await poData.save({ session });

    // Determine GRN status based on this specific receipt
    const isComplete = items.every(item => item.receivedQuantity >= item.orderedQuantity);

    console.log('Creating GRN document...');

    const grn = await GRN.create([{
      purchaseOrder,
      poNumber: poData.poNumber,
      supplier: poData.supplier,
      supplierName: poData.supplierName,
      items: processedItems,
      subtotal,
      discount,
      tax,
      totalAmount,
      status: isComplete ? 'complete' : 'partial',
      notes,
      warehouseLocation,
      receivedBy: req.user.id,
    }], { session });

    const grnData = grn[0]; // create with array returns array
    console.log('GRN created successfully:', grnData.grnNumber);

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    const populatedGRN = await GRN.findById(grnData._id)
      .populate('supplier', 'name supplierId')
      .populate('purchaseOrder', 'poNumber')
      .populate('receivedBy', 'firstName lastName');

    res.status(201).json({ 
      success: true, 
      data: populatedGRN, 
      message: 'GRN created successfully' 
    });
  } catch (error) {
    console.error('Error creating GRN:', error);
    
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGRN = async (req, res) => {
  try {
    const grn = await GRN.findById(req.params.id);
    
    if (!grn) {
      return res.status(404).json({ success: false, message: 'GRN not found' });
    }

    // Recalculate totals if items are updated
    if (req.body.items) {
      let subtotal = 0;
      const processedItems = req.body.items.map(item => {
        const itemTotal = item.receivedQuantity * item.unitPrice - (item.discount || 0) + (item.tax || 0);
        subtotal += itemTotal;
        return { ...item, total: itemTotal };
      });
      
      req.body.items = processedItems;
      req.body.subtotal = subtotal;
      req.body.totalAmount = subtotal - (req.body.discount || 0) + (req.body.tax || 0);
    }

    const updatedGRN = await GRN.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('supplier', 'name supplierId')
     .populate('purchaseOrder', 'poNumber')
     .populate('receivedBy', 'firstName lastName');

    res.status(200).json({ 
      success: true, 
      data: updatedGRN, 
      message: 'GRN updated successfully' 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteGRN = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const grn = await GRN.findById(req.params.id).session(session);
    
    if (!grn) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'GRN not found' });
    }

    // Revert inventory stock changes
    for (const item of grn.items) {
      if (item.item && item.receivedQuantity > 0) {
        const inventoryItem = await InventoryItem.findById(item.item).session(session);
        if (inventoryItem) {
          inventoryItem.quantity -= item.receivedQuantity;
          await inventoryItem.save({ session });
        }
      }
    }

    await GRN.findByIdAndDelete(req.params.id).session(session);

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      success: true, 
      message: 'GRN deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting GRN:', error);
    
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGRNSummary = async (req, res) => {
  try {
    const [partial, complete] = await Promise.all([
      GRN.countDocuments({ status: 'partial' }),
      GRN.countDocuments({ status: 'complete' }),
    ]);

    const totalValue = await GRN.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        partial,
        complete,
        totalValue: totalValue[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyGRN = async (req, res) => {
  try {
    const grn = await GRN.findById(req.params.id);
    
    if (!grn) {
      return res.status(404).json({ success: false, message: 'GRN not found' });
    }

    grn.verifiedBy = req.user.id;
    grn.verifiedAt = new Date();
    await grn.save();

    const populatedGRN = await GRN.findById(grn._id)
      .populate('supplier', 'name supplierId')
      .populate('purchaseOrder', 'poNumber')
      .populate('receivedBy', 'firstName lastName')
      .populate('verifiedBy', 'firstName lastName');

    res.status(200).json({ 
      success: true, 
      data: populatedGRN, 
      message: 'GRN verified successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
