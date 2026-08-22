import PurchaseOrder from '../models/PurchaseOrder.js';
import Supplier from '../models/Supplier.js';
import InventoryItem from '../models/InventoryItem.js';
import mongoose from 'mongoose';

export const getPurchaseOrders = async (req, res) => {
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
      query.orderDate = {};
      if (req.query.startDate) {
        query.orderDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.orderDate.$lte = new Date(req.query.endDate);
      }
    }

    // Handle search
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [
        { poNumber: regex },
        { supplierName: regex },
        { notes: regex },
      ];
    }

    const [purchaseOrders, total] = await Promise.all([
      PurchaseOrder.find(query)
        .populate('supplier', 'name supplierId')
        .populate('createdBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PurchaseOrder.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: purchaseOrders,
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

export const getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .populate('items.item');
    
    if (!purchaseOrder) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    res.status(200).json({ success: true, data: purchaseOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPurchaseOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { supplier, items, expectedDeliveryDate, notes, terms, status } = req.body;

    // Verify supplier exists
    const supplierData = await Supplier.findById(supplier).session(session);
    if (!supplierData) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Calculate totals
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      // Fetch inventory item details for auto-fill
      let itemDetails = null;
      if (item.item) {
        itemDetails = await InventoryItem.findById(item.item).session(session);
      }

      const itemTotal = item.quantity * item.unitPrice - (item.discount || 0) + (item.tax || 0);
      subtotal += itemTotal;
      
      processedItems.push({
        ...item,
        description: itemDetails?.description || item.description || '',
        availableStock: itemDetails?.quantity || 0,
        total: itemTotal,
        receivedQuantity: 0,
      });
    }

    const discount = req.body.discount || 0;
    const tax = req.body.tax || 0;
    const totalAmount = subtotal - discount + tax;

    const purchaseOrder = await PurchaseOrder.create([{
      supplier,
      supplierName: supplierData.name,
      items: processedItems,
      expectedDeliveryDate,
      subtotal,
      discount,
      tax,
      totalAmount,
      notes,
      terms,
      status: status || 'pending',
      createdBy: req.user.id,
    }], { session });

    const poData = purchaseOrder[0]; // create with array returns array

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    const populatedPO = await PurchaseOrder.findById(poData._id)
      .populate('supplier', 'name supplierId')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedPO,
      message: 'Purchase order created successfully'
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    
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

export const updatePurchaseOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id).session(session);
    
    if (!purchaseOrder) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    // Don't allow updates if already completed
    if (purchaseOrder.status === 'completed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed purchase orders'
      });
    }

    // Recalculate totals if items are updated
    if (req.body.items) {
      let subtotal = 0;
      const processedItems = req.body.items.map(item => {
        const itemTotal = item.quantity * item.unitPrice - (item.discount || 0) + (item.tax || 0);
        subtotal += itemTotal;
        return { ...item, total: itemTotal };
      });
      
      req.body.items = processedItems;
      req.body.subtotal = subtotal;
      req.body.totalAmount = subtotal - (req.body.discount || 0) + (req.body.tax || 0);
    }

    const updatedPO = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true, session }
    ).populate('supplier', 'name supplierId')
     .populate('createdBy', 'firstName lastName');

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      success: true, 
      data: updatedPO, 
      message: 'Purchase order updated successfully' 
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    
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

export const cancelPurchaseOrder = async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    if (purchaseOrder.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel completed purchase orders' 
      });
    }

    purchaseOrder.status = 'cancelled';
    purchaseOrder.cancelledBy = req.user.id;
    purchaseOrder.cancelledAt = new Date();
    purchaseOrder.cancellationReason = cancellationReason;
    await purchaseOrder.save();

    const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('supplier', 'name supplierId')
      .populate('createdBy', 'firstName lastName')
      .populate('cancelledBy', 'firstName lastName');

    res.status(200).json({ 
      success: true, 
      data: populatedPO, 
      message: 'Purchase order cancelled successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approvePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    if (purchaseOrder.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending purchase orders can be approved' 
      });
    }

    purchaseOrder.approvedBy = req.user.id;
    purchaseOrder.approvedAt = new Date();
    await purchaseOrder.save();

    const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('supplier', 'name supplierId')
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName');

    res.status(200).json({ 
      success: true, 
      data: populatedPO, 
      message: 'Purchase order approved successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    if (purchaseOrder.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending purchase orders can be deleted' 
      });
    }

    await PurchaseOrder.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Purchase order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPurchaseOrderSummary = async (req, res) => {
  try {
    const [pending, partiallyReceived, completed, cancelled] = await Promise.all([
      PurchaseOrder.countDocuments({ status: 'pending' }),
      PurchaseOrder.countDocuments({ status: 'partially_received' }),
      PurchaseOrder.countDocuments({ status: 'completed' }),
      PurchaseOrder.countDocuments({ status: 'cancelled' }),
    ]);

    const totalValue = await PurchaseOrder.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending,
        partiallyReceived,
        completed,
        cancelled,
        totalValue: totalValue[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const receiveGoods = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items } = req.body;
    const purchaseOrder = await PurchaseOrder.findById(req.params.id).session(session);
    
    if (!purchaseOrder) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    if (purchaseOrder.status === 'cancelled' || purchaseOrder.status === 'completed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot receive goods for cancelled or completed purchase orders' 
      });
    }

    let allItemsReceived = true;
    let anyItemsReceived = false;

    for (const receivedItem of items) {
      const poItem = purchaseOrder.items.id(receivedItem._id);
      if (poItem) {
        const previousReceived = poItem.receivedQuantity || 0;
        const newReceived = previousReceived + receivedItem.quantity;
        
        // Don't exceed ordered quantity
        poItem.receivedQuantity = Math.min(newReceived, poItem.quantity);
        
        // Update inventory stock
        if (poItem.item) {
          const inventoryItem = await InventoryItem.findById(poItem.item).session(session);
          if (inventoryItem) {
            inventoryItem.quantity += receivedItem.quantity;
            inventoryItem.movementHistory.push({
              type: 'in',
              quantity: receivedItem.quantity,
              reference: `PO-${purchaseOrder.poNumber}`,
              remarks: `Goods received against purchase order`,
              performedBy: req.user.id,
              date: new Date(),
            });
            await inventoryItem.save({ session });
          }
        }

        if (poItem.receivedQuantity < poItem.quantity) {
          allItemsReceived = false;
        }
        if (poItem.receivedQuantity > 0) {
          anyItemsReceived = true;
        }
      }
    }

    // Update status based on receipt
    if (allItemsReceived) {
      purchaseOrder.status = 'completed';
      purchaseOrder.actualDeliveryDate = new Date();
    } else if (anyItemsReceived) {
      purchaseOrder.status = 'partially_received';
    }

    await purchaseOrder.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('supplier', 'name supplierId')
      .populate('createdBy', 'firstName lastName')
      .populate('items.item');

    res.status(200).json({ 
      success: true, 
      data: populatedPO, 
      message: allItemsReceived ? 'All goods received - PO completed' : 'Goods received successfully' 
    });
  } catch (error) {
    console.error('Error receiving goods:', error);
    
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ success: false, message: error.message });
  }
};