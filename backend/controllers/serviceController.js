import Service from '../models/Service.js';
import ServiceCategory from '../models/ServiceCategory.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.find({ status: 'active' }).sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const category = await ServiceCategory.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getServices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.status) query.status = req.query.status;

    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [{ name: regex }, { serviceCode: regex }, { description: regex }];
    }

    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const [services, total] = await Promise.all([
      Service.find(query)
        .populate('category', 'name')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Service.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: services,
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

export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('category', 'name');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    // Remove category if not provided to avoid validation errors
    const serviceData = { ...req.body };
    if (!serviceData.category) {
      delete serviceData.category;
    }
    const service = await Service.create(serviceData);
    res.status(201).json({ success: true, data: service, message: 'Service created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    // Remove category if not provided to avoid validation errors
    const serviceData = { ...req.body };
    if (!serviceData.category) {
      delete serviceData.category;
    }
    const service = await Service.findByIdAndUpdate(req.params.id, serviceData, {
      new: true,
      runValidators: true,
    });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.status(200).json({ success: true, data: service, message: 'Service updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Check if service has historical records (used in jobs/invoices)
    // This would need to check job cards or invoices that reference this service
    // For now, we'll implement a simple deactivation approach
    service.status = 'inactive';
    await service.save();
    res.status(200).json({ success: true, message: 'Service deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleServiceStatus = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    service.status = service.status === 'active' ? 'inactive' : 'active';
    await service.save();
    res.status(200).json({ success: true, data: service, message: `Service ${service.status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
