import SparePartsRequest from '../models/SparePartsRequest.js';
import JobCard from '../models/JobCard.js';
import InventoryItem from '../models/InventoryItem.js';
import Employee from '../models/Employee.js';
import StockMovement from '../models/StockMovement.js';
import Notification from '../models/Notification.js';

export const getSparePartsRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status) query.status = req.query.status;

    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (employee) query.technician = employee._id;
    }

    const [requests, total] = await Promise.all([
      SparePartsRequest.find(query)
        .populate('jobCard', 'jobCardNumber complaint')
        .populate({ path: 'technician', populate: { path: 'user', select: 'firstName lastName' } })
        .populate('item', 'itemName quantity')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SparePartsRequest.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: requests,
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

export const createSparePartsRequest = async (req, res) => {
  try {
    const { jobCard, item, items, requestedQuantity, reason, priority } = req.body;

    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(400).json({ success: false, message: 'Employee profile not found' });
    }

    // Support batch items array
    if (Array.isArray(items) && items.length > 0) {
      const createdRequests = [];
      for (const singleItem of items) {
        const itemId = singleItem.item || singleItem._id || singleItem.itemId;
        const qty = Number(singleItem.requestedQuantity || singleItem.quantity || 1);
        const itemReason = singleItem.reason || reason || 'Required for vehicle service';
        const itemPriority = singleItem.priority || priority || 'medium';

        const inv = await InventoryItem.findById(itemId);
        if (!inv) continue;

        const reqDoc = await SparePartsRequest.create({
          jobCard,
          technician: employee._id,
          item: inv._id,
          itemName: inv.itemName,
          requestedQuantity: Math.min(qty, inv.quantity),
          currentStock: inv.quantity,
          reason: itemReason,
          priority: itemPriority,
          status: 'pending',
        });
        createdRequests.push(reqDoc);
      }

      return res.status(201).json({
        success: true,
        data: createdRequests,
        message: `${createdRequests.length} spare parts request(s) created successfully`,
      });
    }

    // Single item handling
    const inventoryItem = await InventoryItem.findById(item);
    if (!inventoryItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found. Only items already registered in the Admin Inventory can be requested.' 
      });
    }

    if (!requestedQuantity || requestedQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Valid quantity is required' });
    }

    if (requestedQuantity > inventoryItem.quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Requested quantity (${requestedQuantity}) exceeds available inventory stock (${inventoryItem.quantity} ${inventoryItem.unit}). Please reduce the quantity or contact the Admin to restock.` 
      });
    }

    const request = await SparePartsRequest.create({
      jobCard,
      technician: employee._id,
      item,
      itemName: inventoryItem.itemName,
      requestedQuantity,
      currentStock: inventoryItem.quantity,
      reason,
      priority: priority || 'medium',
      status: 'pending',
    });

    res.status(201).json({ success: true, data: request, message: 'Spare parts request created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPartsRequestStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [pending, approvedToday, issuedToday, requestedItems, lowStockItems] = await Promise.all([
      SparePartsRequest.countDocuments({ status: 'pending' }),
      SparePartsRequest.countDocuments({ approvedAt: { $gte: today, $lt: tomorrow } }),
      SparePartsRequest.countDocuments({ issueDate: { $gte: today, $lt: tomorrow } }),
      SparePartsRequest.aggregate([{ $group: { _id: null, total: { $sum: '$requestedQuantity' } } }]),
      InventoryItem.countDocuments({ status: 'active', $expr: { $lte: ['$quantity', '$reorderLevel'] } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending,
        approvedToday,
        issuedToday,
        itemsRequested: requestedItems[0]?.total || 0,
        lowStock: lowStockItems,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveSparePartsRequest = async (req, res) => {
  try {
    const { approvedQuantity, managerRemarks } = req.body;
    const request = await SparePartsRequest.findById(req.params.id).populate('item');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    const inventoryItem = await InventoryItem.findById(request.item._id);
    if (!inventoryItem) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    const quantityToApprove = approvedQuantity || request.requestedQuantity;

    if (quantityToApprove > inventoryItem.quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    // Deduct stock and record stock movement in a transaction
    const session = await InventoryItem.startSession();
    session.startTransaction();

    try {
      const previousQuantity = inventoryItem.quantity;
      inventoryItem.quantity -= quantityToApprove;
      await inventoryItem.save({ session });

      await StockMovement.create([{
        item: inventoryItem._id,
        itemName: inventoryItem.itemName,
        type: 'out',
        quantity: quantityToApprove,
        previousQuantity,
        newQuantity: inventoryItem.quantity,
        reference: request.requestId,
        referenceType: 'job_card',
        referenceId: request.jobCard,
        remarks: `${managerRemarks || 'Approved by manager'} - Part request ${request.requestId} approved`,
        performedBy: req.user._id,
        performedByRole: req.user.role,
      }], { session });

      request.approvedQuantity = quantityToApprove;
      request.managerRemarks = managerRemarks;
      request.status = 'approved';
      request.approvedAt = new Date();
      await request.save({ session });

      await session.commitTransaction();

      res.status(200).json({ 
        success: true, 
        data: request, 
        message: `Request approved. Stock deducted: ${quantityToApprove} ${inventoryItem.unit} (remaining: ${inventoryItem.quantity})` 
      });
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

export const rejectSparePartsRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const request = await SparePartsRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    request.status = 'rejected';
    request.rejectionReason = rejectionReason;
    await request.save();

    res.status(200).json({ success: true, data: request, message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const issueSpareParts = async (req, res) => {
  try {
    const request = await SparePartsRequest.findById(req.params.id).populate('item');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Request must be approved first' });
    }

    const inventoryItem = await InventoryItem.findById(request.item._id);
    if (!inventoryItem) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    // NOTE: Stock was already deducted when the request was approved.
    // Issuing only marks the request as issued and records the issue - NO double deduction.

    request.status = 'issued';
    request.issueDate = new Date();
    request.issuedBy = req.user._id;
    await request.save();

    res.status(200).json({ success: true, data: request, message: 'Parts issued successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSparePartsRequestById = async (req, res) => {
  try {
    const request = await SparePartsRequest.findById(req.params.id)
      .populate('jobCard')
      .populate('technician', 'firstName lastName')
      .populate('item')
      .populate('issuedBy', 'firstName lastName');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSparePartsByJobCard = async (req, res) => {
  try {
    const { jobCardId } = req.params;
    
    if (!jobCardId) {
      return res.status(400).json({ success: false, message: 'Job Card ID is required' });
    }

    const requests = await SparePartsRequest.find({ jobCard: jobCardId })
      .populate('item', 'itemName itemCode quantity')
      .populate('technician', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordPartsUsage = async (req, res) => {
  try {
    const { usedQuantity, usageType } = req.body;
    const request = await SparePartsRequest.findById(req.params.id).populate('item');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'issued') {
      return res.status(400).json({ success: false, message: 'Request must be issued first' });
    }

    const inventoryItem = await InventoryItem.findById(request.item._id);
    if (!inventoryItem) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    if (usedQuantity > request.approvedQuantity) {
      return res.status(400).json({ success: false, message: 'Used quantity cannot exceed issued quantity' });
    }

    const session = await InventoryItem.startSession();
    session.startTransaction();

    try {
      // If partial usage, return unused parts to stock
      if (usageType === 'partial' && usedQuantity < request.approvedQuantity) {
        const unusedQuantity = request.approvedQuantity - usedQuantity;
        const previousQuantity = inventoryItem.quantity;
        inventoryItem.quantity += unusedQuantity;
        await inventoryItem.save({ session });

        await StockMovement.create([{
          item: inventoryItem._id,
          itemName: inventoryItem.itemName,
          type: 'in',
          quantity: unusedQuantity,
          previousQuantity,
          newQuantity: inventoryItem.quantity,
          reference: request.requestId,
          referenceType: 'job_card',
          referenceId: request.jobCard,
          remarks: `Returned unused parts for job card ${request.jobCard}`,
          performedBy: req.user._id,
          performedByRole: req.user.role,
        }], { session });
      }

      request.usedQuantity = usedQuantity;
      request.usageType = usageType || 'full';
      request.status = 'completed';
      request.usageDate = new Date();
      await request.save({ session });

      await session.commitTransaction();

      res.status(200).json({ success: true, data: request, message: 'Parts usage recorded successfully' });
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

export const approveMultiple = async (req, res) => {
  try {
    const { ids, remarks } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of request IDs is required' });
    }

    const results = [];
    for (const id of ids) {
      const request = await SparePartsRequest.findById(id).populate('item');
      if (request && request.status === 'pending') {
        const inventoryItem = await InventoryItem.findById(request.item._id);
        if (inventoryItem && inventoryItem.quantity >= request.requestedQuantity) {
          inventoryItem.quantity -= request.requestedQuantity;
          await inventoryItem.save();

          request.approvedQuantity = request.requestedQuantity;
          request.managerRemarks = remarks || 'Bulk approved by manager';
          request.status = 'approved';
          request.approvedAt = new Date();
          await request.save();
          results.push(request);
        }
      }
    }

    res.status(200).json({ success: true, count: results.length, message: `Approved ${results.length} requests` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectMultiple = async (req, res) => {
  try {
    const { ids, rejectionReason } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of request IDs is required' });
    }

    const results = [];
    for (const id of ids) {
      const request = await SparePartsRequest.findById(id);
      if (request && request.status === 'pending') {
        request.status = 'rejected';
        request.rejectionReason = rejectionReason || 'Bulk rejected by manager';
        await request.save();
        results.push(request);
      }
    }

    res.status(200).json({ success: true, count: results.length, message: `Rejected ${results.length} requests` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
