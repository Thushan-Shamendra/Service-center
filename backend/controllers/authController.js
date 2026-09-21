import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Customer from '../models/Customer.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: email }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = user.generateAuthToken();

    // Fetch profile data based on role
    let profile = null;
    
    if (user.role === 'employee' || user.role === 'manager') {
      try {
        profile = await Employee.findOne({ user: user._id });
      } catch (profileError) {
        // Continue without profile if fetch fails
        profile = null;
      }
    } else if (user.role === 'customer') {
      try {
        profile = await Customer.findOne({ user: user._id });
      } catch (profileError) {
        // Continue without profile if fetch fails
        profile = null;
      }
    }

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        mobile: user.mobile,
        profilePhoto: user.profilePhoto,
        isActive: user.isActive,
        createdAt: user.createdAt,
        profile,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred during login. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    let profile = null;
    if (user.role === 'employee' || user.role === 'manager') {
      profile = await Employee.findOne({ user: user._id });
    } else if (user.role === 'customer') {
      profile = await Customer.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        mobile: user.mobile,
        profilePhoto: user.profilePhoto,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        profile,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, mobile, role } = req.body;

    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      mobile,
      role: role || 'customer',
    });

    if (role === 'employee' || role === 'manager') {
      await Employee.create({
        user: user._id,
        nic: req.body.nic || '',
        dateOfBirth: req.body.dateOfBirth || new Date('1990-01-01'),
        gender: req.body.gender || 'male',
        designation: req.body.designation || '',
        employmentDate: req.body.employmentDate || new Date(),
        basicSalary: req.body.basicSalary || 0,
        address: req.body.address || {},
      });
    } else if (role === 'customer') {
      await Customer.create({
        user: user._id,
        nic: req.body.nic,
        passport: req.body.passport,
        address: req.body.address || {},
      });
    }

    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        mobile: user.mobile,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {};
    const allowed = ['firstName', 'lastName', 'mobile', 'email'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) fieldsToUpdate[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    const token = user.generateAuthToken();
    res.status(200).json({ success: true, token, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
