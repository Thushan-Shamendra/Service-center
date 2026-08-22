import AuditLog from '../models/AuditLog.js';

export const auditLog = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      res.send = originalSend;

      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const logData = {
          action,
          performedBy: req.user?._id,
          performedByName: req.user?.fullName || req.user?.username,
          performedByRole: req.user?.role,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          endpoint: req.originalUrl,
          method: req.method,
          oldValue: req.body?.oldValue || null,
          newValue: req.body || null,
          entity: req.params.id || null,
          entityType: determineEntityType(req.originalUrl),
          status: 'success',
        };

        AuditLog.create(logData).catch(err => console.error('Audit log error:', err));
      }

      originalSend.call(this, data);
    };

    next();
  };
};

function determineEntityType(url) {
  if (url.includes('/customers')) return 'customer';
  if (url.includes('/vehicles')) return 'vehicle';
  if (url.includes('/appointments')) return 'appointment';
  if (url.includes('/job-cards')) return 'job_card';
  if (url.includes('/invoices')) return 'invoice';
  if (url.includes('/quotations')) return 'quotation';
  if (url.includes('/payments')) return 'payment';
  if (url.includes('/inventory')) return 'inventory';
  if (url.includes('/employees') || url.includes('/users')) return 'employee';
  if (url.includes('/spare-parts')) return 'spare_parts';
  if (url.includes('/finance')) return 'financial_entry';
  if (url.includes('/hr')) return 'hr_record';
  return 'unknown';
}

export const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.action) query.action = { $regex: req.query.action, $options: 'i' };
    if (req.query.entityType) query.entityType = req.query.entityType;
    if (req.query.performedBy) query.performedBy = req.query.performedBy;
    if (req.query.startDate && req.query.endDate) {
      query.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('performedBy', 'firstName lastName email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
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

export const getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('performedBy', 'firstName lastName email');
    if (!log) return res.status(404).json({ success: false, message: 'Audit log not found' });

    res.status(200).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
