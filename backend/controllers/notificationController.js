import Notification from '../models/Notification.js';
import User from '../models/User.js';
import {
  sendAppointmentConfirmation,
  sendInvoiceEmail,
  sendPaymentConfirmation,
  sendServiceCompletion,
} from '../config/email.js';

export const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };
    if (req.query.unread === 'true') query.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
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

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { userId, title, description, type, sendEmail } = req.body;

    const notification = await Notification.create({
      user: userId,
      title,
      description,
      type,
    });

    // Send email if requested
    if (sendEmail) {
      const user = await User.findById(userId);
      if (user && user.email) {
        try {
          await sendEmail({
            to: user.email,
            subject: title,
            html: `<div style="font-family: Arial, sans-serif;"><h2>${title}</h2><p>${description}</p></div>`,
          });
        } catch (emailError) {
          console.error('Email send failed:', emailError);
        }
      }
    }

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendAppointmentNotification = async (appointment, type) => {
  try {
    const customer = await (await import('../models/Customer.js')).default.findById(appointment.customer).populate('user');
    if (!customer?.user?.email) return;

    if (type === 'confirmed') {
      await sendAppointmentConfirmation(
        customer.user.email,
        appointment.appointmentNumber,
        appointment.preferredDate,
        appointment.preferredTime
      );
    }
  } catch (error) {
    console.error('Appointment notification error:', error);
  }
};

export const sendInvoiceNotification = async (invoice) => {
  try {
    const customer = await (await import('../models/Customer.js')).default.findById(invoice.customer).populate('user');
    if (!customer?.user?.email) return;

    await sendInvoiceEmail(
      customer.user.email,
      invoice.invoiceNumber,
      invoice.grandTotal,
      invoice.dueDate
    );
  } catch (error) {
    console.error('Invoice notification error:', error);
  }
};

export const sendPaymentNotification = async (payment) => {
  try {
    const customer = await (await import('../models/Customer.js')).default.findById(payment.customer).populate('user');
    if (!customer?.user?.email) return;

    const invoice = await (await import('../models/Invoice.js')).default.findById(payment.invoice);
    
    await sendPaymentConfirmation(
      customer.user.email,
      payment.paymentId,
      payment.amount,
      invoice?.invoiceNumber
    );
  } catch (error) {
    console.error('Payment notification error:', error);
  }
};

export const sendServiceCompletionNotification = async (jobCard) => {
  try {
    const customer = await (await import('../models/Customer.js')).default.findById(jobCard.customer).populate('user');
    const vehicle = await (await import('../models/Vehicle.js')).default.findById(jobCard.vehicle);
    
    if (!customer?.user?.email) return;

    await sendServiceCompletion(
      customer.user.email,
      jobCard.jobCardNumber,
      vehicle?.registrationNumber
    );
  } catch (error) {
    console.error('Service completion notification error:', error);
  }
};
