import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'VSMS <noreply@vsms.lk>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

export const sendAppointmentConfirmation = async (email, appointmentNumber, date, time) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0000FF;">Appointment Confirmed</h2>
      <p>Your appointment has been confirmed.</p>
      <p><strong>Appointment Number:</strong> ${appointmentNumber}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p>Please arrive 15 minutes before your scheduled time.</p>
      <p>Thank you for choosing our service.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Appointment Confirmed - ${appointmentNumber}`,
    html,
  });
};

export const sendInvoiceEmail = async (email, invoiceNumber, amount, dueDate) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0000FF;">Invoice Generated</h2>
      <p>A new invoice has been generated for your service.</p>
      <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
      <p><strong>Amount:</strong> Rs. ${Number(amount).toLocaleString()}</p>
      <p><strong>Due Date:</strong> ${dueDate}</p>
      <p>Please complete the payment before the due date.</p>
      <p>Thank you for your business.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Invoice Generated - ${invoiceNumber}`,
    html,
  });
};

export const sendPaymentConfirmation = async (email, paymentId, amount, invoiceNumber) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0000FF;">Payment Received</h2>
      <p>Your payment has been successfully processed.</p>
      <p><strong>Payment ID:</strong> ${paymentId}</p>
      <p><strong>Amount:</strong> Rs. ${Number(amount).toLocaleString()}</p>
      <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
      <p>Thank you for your payment.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Payment Confirmation - ${paymentId}`,
    html,
  });
};

export const sendServiceCompletion = async (email, jobCardNumber, vehicleReg) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0000FF;">Service Completed</h2>
      <p>Your vehicle service has been completed.</p>
      <p><strong>Job Card Number:</strong> ${jobCardNumber}</p>
      <p><strong>Vehicle Registration:</strong> ${vehicleReg}</p>
      <p>Your vehicle is ready for pickup.</p>
      <p>Please visit our workshop to collect your vehicle.</p>
      <p>Thank you for choosing our service.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Service Completed - ${jobCardNumber}`,
    html,
  });
};

export default transporter;
