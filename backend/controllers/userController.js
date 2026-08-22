import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Customer from '../models/Customer.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Helper to look up User by ObjectId or display ID (employeeId, managerId, customerId)
const findUserByIdOrDisplayId = async (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    const user = await User.findById(id);
    if (user) return user;
  }
  
  const employee = await Employee.findOne({
    $or: [{ employeeId: id }, { managerId: id }]
  });
  if (employee && employee.user) {
    const user = await User.findById(employee.user);
    if (user) return user;
  }

  const customer = await Customer.findOne({ customerId: id });
  if (customer && customer.user) {
    const user = await User.findById(customer.user);
    if (user) return user;
  }

  return await User.findOne({ username: id });
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If user is an employee, get additional employee details
    let employeeDetails = null;
    if (user.role === 'employee') {
      employeeDetails = await Employee.findOne({ user: user._id });
    }

    // If user is a customer, get additional customer details
    let customerDetails = null;
    if (user.role === 'customer') {
      customerDetails = await Customer.findOne({ user: user._id });
    }

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        employeeDetails,
        customerDetails,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message,
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, mobile, email, address, nic } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (mobile) user.mobile = mobile;
    if (email) user.email = email;
    if (address) user.address = address;

    if (req.file) {
      user.profilePhoto = `/uploads/profiles/${req.file.filename}`;
    } else if (req.body.profilePhoto) {
      user.profilePhoto = req.body.profilePhoto;
    }

    await user.save();

    // Update employee details if applicable
    if (user.role === 'employee') {
      const employee = await Employee.findOne({ user: user._id });
      if (employee) {
        if (address) employee.address = address;
        if (nic) employee.nic = nic;
        await employee.save();
      }
    }

    // Update customer details if applicable
    if (user.role === 'customer') {
      const customer = await Customer.findOne({ user: user._id });
      if (customer) {
        if (address) customer.address = address;
        if (nic) customer.nic = nic;
        await customer.save();
      }
    }

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Set new password (hashing is handled by User model pre-save hook)
    user.password = newPassword;
    user.passwordChangedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message,
    });
  }
};

// Existing user management functions (keep these for admin functionality)
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, status } = req.query;
    const filter = {};
    
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const userIds = users.map((u) => u._id);
    const [customers, employees] = await Promise.all([
      Customer.find({ user: { $in: userIds } }),
      Employee.find({ user: { $in: userIds } }),
    ]);

    const customerMap = new Map(customers.map((c) => [c.user.toString(), c]));
    const employeeMap = new Map(employees.map((e) => [e.user.toString(), e]));

    const usersWithProfiles = users.map((user) => {
      const userObj = user.toObject();
      const strId = user._id.toString();

      if (user.role === 'customer' && customerMap.has(strId)) {
        const cust = customerMap.get(strId).toObject();
        userObj.profile = cust;
        userObj.customerDetails = cust;
      } else if ((user.role === 'employee' || user.role === 'manager' || user.role === 'administrator') && employeeMap.has(strId)) {
        const emp = employeeMap.get(strId).toObject();
        userObj.profile = emp;
        userObj.employeeDetails = emp;
      }
      return userObj;
    });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: usersWithProfiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await findUserByIdOrDisplayId(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const userData = { ...req.body };

    // If profilePhoto was uploaded via Multer
    if (req.file) {
      userData.profilePhoto = `/uploads/profiles/${req.file.filename}`;
    }

    // Parse address if sent as a JSON string via FormData
    if (userData.address && typeof userData.address === 'string') {
      try {
        userData.address = JSON.parse(userData.address);
      } catch (e) {
        userData.address = {};
      }
    }
    
    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [
        { username: userData.username },
        { email: userData.email },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists',
      });
    }

    // Create user
    const user = await User.create(userData);

    // Create employee record for both employee and manager roles
    if (userData.role === 'employee' || userData.role === 'manager') {
      await Employee.create({
        user: user._id,
        nic: userData.nic || '',
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : new Date('1990-01-01'),
        gender: userData.gender || 'male',
        designation: userData.designation || (userData.role === 'manager' ? 'Manager' : 'Technician'),
        employmentDate: userData.employmentDate ? new Date(userData.employmentDate) : new Date(),
        basicSalary: userData.basicSalary ? Number(userData.basicSalary) : 0,
        address: userData.address || {},
        bankName: userData.bankName || '',
        branch: userData.branch || '',
        accountNumber: userData.accountNumber || '',
      });
    }

    // Create customer record for customer role
    if (userData.role === 'customer' && userData.profile) {
      let custProfile = userData.profile;
      if (typeof custProfile === 'string') {
        try { custProfile = JSON.parse(custProfile); } catch (e) { custProfile = {}; }
      }
      await Customer.create({
        user: user._id,
        customerId: custProfile.customerId,
        nic: custProfile.nic || '',
        passport: custProfile.passport || '',
        address: custProfile.address || userData.address || {},
        status: custProfile.status || 'active',
      });
    }

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await findUserByIdOrDisplayId(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if email is already in use by another user
    if (updates.email && updates.email !== user.email) {
      const existingEmail = await User.findOne({ email: updates.email.toLowerCase(), _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email is already in use by another user' });
      }
      user.email = updates.email.toLowerCase();
    }

    // Check if username is already in use by another user
    if (updates.username && updates.username !== user.username) {
      const existingUsername = await User.findOne({ username: updates.username, _id: { $ne: user._id } });
      if (existingUsername) {
        return res.status(400).json({ success: false, message: 'Username is already in use by another user' });
      }
      user.username = updates.username;
    }

    if (updates.firstName) user.firstName = updates.firstName;
    if (updates.lastName) user.lastName = updates.lastName;
    if (updates.mobile) user.mobile = updates.mobile;
    if (updates.isActive !== undefined) user.isActive = updates.isActive;
    if (updates.address) user.address = typeof updates.address === 'string' ? JSON.parse(updates.address) : updates.address;

    // Handle password update (hashes automatically in User model pre-save hook)
    if (updates.password && updates.password.trim() !== '') {
      user.password = updates.password;
    }

    // Handle profilePhoto if uploaded via Multer
    if (req.file) {
      user.profilePhoto = `/uploads/profiles/${req.file.filename}`;
    }

    await user.save();

    // Update associated Employee record if role is employee or manager
    if (user.role === 'employee' || user.role === 'manager') {
      const empUpdates = {};
      if (updates.profile) {
        let profileObj = updates.profile;
        if (typeof profileObj === 'string') {
          try { profileObj = JSON.parse(profileObj); } catch (e) {}
        }
        if (profileObj.designation) empUpdates.designation = profileObj.designation;
        if (profileObj.basicSalary !== undefined) empUpdates.basicSalary = Number(profileObj.basicSalary);
        if (profileObj.nic) empUpdates.nic = profileObj.nic;
        if (profileObj.bankName !== undefined) empUpdates.bankName = profileObj.bankName;
        if (profileObj.branch !== undefined) empUpdates.branch = profileObj.branch;
        if (profileObj.accountNumber !== undefined) empUpdates.accountNumber = profileObj.accountNumber;
      }
      if (updates.address) empUpdates.address = typeof updates.address === 'string' ? JSON.parse(updates.address) : updates.address;

      await Employee.findOneAndUpdate({ user: user._id }, empUpdates, { new: true, upsert: true });
    }

    // Update associated Customer record if role is customer
    if (user.role === 'customer') {
      const custUpdates = {};
      if (updates.profile) {
        let profileObj = updates.profile;
        if (typeof profileObj === 'string') {
          try { profileObj = JSON.parse(profileObj); } catch (e) {}
        }
        if (profileObj.nic) custUpdates.nic = profileObj.nic;
        if (profileObj.passport) custUpdates.passport = profileObj.passport;
      }
      if (updates.address) custUpdates.address = typeof updates.address === 'string' ? JSON.parse(updates.address) : updates.address;

      await Customer.findOneAndUpdate({ user: user._id }, custUpdates, { new: true });
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deactivating user',
      error: error.message,
    });
  }
};

export const deleteUserPermanently = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Also delete associated employee record if exists
    if (user.role === 'employee') {
      await Employee.findOneAndDelete({ user: user._id });
    }

    res.json({
      success: true,
      message: 'User deleted permanently',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
};

export const getNextUserId = async (req, res) => {
  try {
    const { role } = req.query;
    let nextNumber = 1;
    
    if (role === 'customer') {
      // For customers, check the Customer model for customerId
      const lastCustomer = await Customer.findOne({ customerId: { $exists: true, $ne: null } })
        .sort({ customerId: -1 })
        .select('customerId');
      
      if (lastCustomer && lastCustomer.customerId) {
        const currentNumber = parseInt(lastCustomer.customerId.split('-')[1]);
        if (!isNaN(currentNumber)) {
          nextNumber = currentNumber + 1;
        }
      }
    } else if (role === 'manager') {
      // For managers, check Employee model for managerId
      const lastManager = await Employee.findOne({ managerId: { $exists: true, $ne: null } })
        .sort({ managerId: -1 })
        .select('managerId');
      
      if (lastManager && lastManager.managerId) {
        const currentNumber = parseInt(lastManager.managerId.replace(/\D/g, ''));
        if (!isNaN(currentNumber)) {
          nextNumber = currentNumber + 1;
        }
      }
    } else if (role === 'employee') {
      // For employees, check Employee model for employeeId
      const lastEmployee = await Employee.findOne({ employeeId: { $exists: true, $ne: null } })
        .sort({ employeeId: -1 })
        .select('employeeId');
      
      if (lastEmployee && lastEmployee.employeeId) {
        const currentNumber = parseInt(lastEmployee.employeeId.replace(/\D/g, ''));
        if (!isNaN(currentNumber)) {
          nextNumber = currentNumber + 1;
        }
      }
    } else if (role === 'administrator') {
      // For administrators, we'll use a simple counter
      const adminCount = await User.countDocuments({ role: 'administrator' });
      nextNumber = adminCount + 1;
    }

    let nextUserId;
    if (role === 'customer') {
      nextUserId = `CUST-${String(nextNumber).padStart(5, '0')}`;
    } else if (role === 'manager') {
      nextUserId = `MGR${String(nextNumber).padStart(4, '0')}`;
    } else if (role === 'employee') {
      nextUserId = `EMP${String(nextNumber).padStart(4, '0')}`;
    } else {
      nextUserId = `ADM${String(nextNumber).padStart(4, '0')}`;
    }

    res.json({
      success: true,
      data: { nextId: nextUserId },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating next user ID',
      error: error.message,
    });
  }
};