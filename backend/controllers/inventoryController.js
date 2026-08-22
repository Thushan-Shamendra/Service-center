import InventoryItem from '../models/InventoryItem.js';
import StockMovement from '../models/StockMovement.js';
import User from '../models/User.js';

export const getInventorySummary = async (req, res) => {
  try {
    const allItems = await InventoryItem.find({ status: { $ne: 'discontinued' } });
    
    const totalItems = allItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    // Low stock: quantity > 0 AND quantity <= reorderLevel
    const lowStockItems = allItems.filter(item => {
      const qty = item.quantity || 0;
      const reorderLevel = item.reorderLevel || 0;
      return qty > 0 && qty <= reorderLevel;
    }).length;
    
    // Out of stock: quantity === 0
    const outOfStockItems = allItems.filter(item => (item.quantity || 0) === 0).length;
    
    const stockValue = allItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.purchasePrice || 0)), 0);

    res.status(200).json({
      success: true,
      data: {
        totalItems,
        lowStockItems,
        outOfStockItems,
        stockValue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInventory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = { status: { $ne: 'discontinued' } };

    if (req.query.category) query.category = req.query.category;
    if (req.query.supplier) query.supplier = req.query.supplier;
    if (req.query.lowStock === 'true') {
      // Low stock: quantity > 0 AND quantity <= reorderLevel
      query.$expr = {
        $and: [
          { $gt: ['$quantity', 0] },
          { $lte: ['$quantity', '$reorderLevel'] }
        ]
      };
    }
    if (req.query.outOfStock === 'true') {
      query.quantity = 0;
    }

    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [{ itemName: regex }, { itemCode: regex }, { brand: regex }, { category: regex }];
    }

    const [items, total] = await Promise.all([
      InventoryItem.find(query).populate('supplier', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
      InventoryItem.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: items,
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

export const getInventoryById = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id).populate('supplier');
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createInventoryItem = async (req, res) => {
  try {
    console.log('Creating inventory item with data:', req.body);
    const item = await InventoryItem.create(req.body);
    const populatedItem = await InventoryItem.findById(item._id).populate('supplier', 'name');
    res.status(201).json({ success: true, data: populatedItem, message: 'Item added to inventory' });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    // Handle validation errors for enum fields
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    res.status(200).json({ success: true, data: item, message: 'Item updated successfully' });
  } catch (error) {
    // Handle validation errors for enum fields
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adjustStock = async (req, res) => {
  try {
    const { type, quantity, remarks, reference } = req.body;
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    let updatedItem;
    
    if (type === 'in') {
      // Atomically increment stock
      updatedItem = await InventoryItem.findByIdAndUpdate(
        req.params.id,
        { $inc: { quantity: qty } },
        { new: true }
      );
    } else if (type === 'out') {
      // Atomically decrement stock with condition check to prevent negative stock
      updatedItem = await InventoryItem.findOneAndUpdate(
        { _id: req.params.id, quantity: { $gte: qty } },
        { $inc: { quantity: -qty } },
        { new: true }
      );
      
      if (!updatedItem) {
        // Check if item exists
        const itemExists = await InventoryItem.findById(req.params.id);
        if (!itemExists) {
          return res.status(404).json({ success: false, message: 'Inventory item not found' });
        }
        // Item exists but insufficient stock
        return res.status(400).json({
          success: false,
          message: `Insufficient stock! Current available stock: ${itemExists.quantity} ${itemExists.unit}`,
        });
      }
    } else if (type === 'adjustment') {
      // Atomically set stock to specific quantity
      updatedItem = await InventoryItem.findByIdAndUpdate(
        req.params.id,
        { $set: { quantity: qty } },
        { new: true }
      );
    } else {
      return res.status(400).json({ success: false, message: 'Invalid adjustment type' });
    }

    if (!updatedItem) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    // Add movement history (separate atomic operation)
    await InventoryItem.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          movementHistory: {
            type,
            quantity: qty,
            reference: reference || 'Stock Adjustment',
            remarks,
            performedBy: req.user._id,
            date: new Date(),
          }
        }
      }
    );
    
    const populatedItem = await InventoryItem.findById(updatedItem._id).populate('supplier', 'name');

    res.status(200).json({
      success: true,
      data: populatedItem,
      message: `Stock adjusted successfully. New balance: ${updatedItem.quantity} ${updatedItem.unit}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    
    // Check if item has historical transactions (movement history)
    const embeddedHistory = item.movementHistory && item.movementHistory.length > 0;
    
    // Also check StockMovement collection
    const stockMovements = await StockMovement.findOne({ item: req.params.id });
    const hasStockMovements = !!stockMovements;
    
    const hasHistory = embeddedHistory || hasStockMovements;
    
    if (hasHistory) {
      // Soft delete - deactivate the item
      item.status = 'discontinued';
      await item.save();
      res.status(200).json({ 
        success: true, 
        message: 'Inventory item deactivated successfully (soft delete due to historical transactions)' 
      });
    } else {
      // Permanent delete - no historical transactions
      await InventoryItem.findByIdAndDelete(req.params.id);
      res.status(200).json({ 
        success: true, 
        message: 'Inventory item permanently deleted successfully' 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMovementHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get all inventory items with their movement history
    const items = await InventoryItem.find({ status: { $ne: 'discontinued' } })
      .populate('movementHistory.performedBy', 'firstName lastName username role')
      .sort({ createdAt: -1 });

    // Flatten movement history from all items
    const movements = [];
    let movementCounter = 1;

    items.forEach(item => {
      item.movementHistory.forEach(movement => {
        movements.push({
          movementId: `MOV-${String(movementCounter).padStart(5, '0')}`,
          itemId: item._id,
          itemCode: item.itemCode,
          itemName: item.itemName,
          unit: item.unit,
          type: movement.type,
          quantity: movement.quantity,
          reference: movement.reference,
          remarks: movement.remarks,
          performedBy: movement.performedBy,
          date: movement.date,
        });
        movementCounter++;
      });
    });

    // Apply filters
    let filteredMovements = movements;

    if (req.query.itemId) {
      filteredMovements = filteredMovements.filter(m => m.itemId.toString() === req.query.itemId);
    }

    if (req.query.movementType) {
      filteredMovements = filteredMovements.filter(m => m.type === req.query.movementType);
    }

    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filteredMovements = filteredMovements.filter(m => 
        regex.test(m.itemName) || 
        regex.test(m.itemCode) || 
        regex.test(m.reference)
      );
    }

    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filteredMovements = filteredMovements.filter(m => {
        const movementDate = new Date(m.date);
        return movementDate >= date && movementDate < nextDay;
      });
    }

    // Sort by date (newest first)
    filteredMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = filteredMovements.length;
    const paginatedMovements = filteredMovements.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginatedMovements,
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
