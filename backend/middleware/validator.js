import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Auth validators
export const loginValidator = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
  body('password').trim().notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

export const registerValidator = [
  body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3, max: 50 }),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
  body('password').trim().notEmpty().withMessage('Password is required').isLength({ min: 6 }),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('role').optional().isIn(['administrator', 'manager', 'employee', 'customer']),
  handleValidationErrors,
];

// Customer validators
export const customerValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
  body('mobile').trim().optional().matches(/^[0-9]{10}$/).withMessage('Invalid mobile number'),
  body('nic').trim().optional().matches(/^[0-9]{9}[vVxX]$|^[0-9]{12}$/).withMessage('Invalid NIC format'),
  handleValidationErrors,
];

// Vehicle validators
export const vehicleValidator = [
  body('customer').notEmpty().withMessage('Customer is required'),
  body('registrationNumber').trim().notEmpty().withMessage('Registration number is required').toUpperCase(),
  body('make').trim().notEmpty().withMessage('Vehicle make is required'),
  body('model').trim().notEmpty().withMessage('Vehicle model is required'),
  body('fuelType').optional().isIn(['petrol', 'diesel', 'hybrid', 'electric', 'other']),
  body('transmission').optional().isIn(['manual', 'automatic', 'cvt', 'other']),
  handleValidationErrors,
];

// Appointment validators
export const appointmentValidator = [
  body('customer').notEmpty().withMessage('Customer is required'),
  body('vehicle').notEmpty().withMessage('Vehicle is required'),
  body('serviceType').trim().notEmpty().withMessage('Service type is required'),
  body('preferredDate').notEmpty().withMessage('Preferred date is required').isISO8601(),
  body('preferredTime').trim().notEmpty().withMessage('Preferred time is required'),
  handleValidationErrors,
];

// Job card validators
export const jobCardValidator = [
  body('customer').notEmpty().withMessage('Customer is required'),
  body('vehicle').notEmpty().withMessage('Vehicle is required'),
  body('complaint').trim().notEmpty().withMessage('Complaint is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  handleValidationErrors,
];

// Inventory validators
export const inventoryValidator = [
  body('itemName').trim().notEmpty().withMessage('Item name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('purchasePrice').isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  handleValidationErrors,
];

// Invoice validators
export const invoiceValidator = [
  body('customer').notEmpty().withMessage('Customer is required'),
  body('vehicle').notEmpty().withMessage('Vehicle is required'),
  body('items').isArray().withMessage('Items must be an array'),
  handleValidationErrors,
];

// Employee validators
export const employeeValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
  body('nic').trim().notEmpty().withMessage('NIC is required'),
  body('dateOfBirth').notEmpty().withMessage('Date of birth is required').isISO8601(),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('basicSalary').isFloat({ min: 0 }).withMessage('Basic salary must be a positive number'),
  handleValidationErrors,
];

// Spare parts request validators
export const sparePartsRequestValidator = [
  body('jobCard').notEmpty().withMessage('Job card is required'),
  body('item').notEmpty().withMessage('Item is required'),
  body('requestedQuantity').isInt({ min: 1 }).withMessage('Requested quantity must be at least 1'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  handleValidationErrors,
];

// Payment validators
export const paymentValidator = [
  body('invoice').notEmpty().withMessage('Invoice is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('paymentMethod').isIn(['cash', 'card', 'bank_transfer', 'cheque']).withMessage('Invalid payment method'),
  handleValidationErrors,
];
