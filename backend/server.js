import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import hrRoutes from './routes/hrRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import jobCardRoutes from './routes/jobCardRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import sparePartsRoutes from './routes/sparePartsRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes.js';
import grnRoutes from './routes/grnRoutes.js';
import purchaseReturnRoutes from './routes/purchaseReturnRoutes.js';
import supplierPaymentRoutes from './routes/supplierPaymentRoutes.js';
import salaryAdvanceRoutes from './routes/salaryAdvanceRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import accountingRoutes from './routes/accountingRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import inspectionRoutes from './routes/inspectionRoutes.js';
import roadTestRoutes from './routes/roadTestRoutes.js';
import timeTrackingRoutes from './routes/timeTrackingRoutes.js';
import workLogRoutes from './routes/workLogRoutes.js';
import finalInspectionRoutes from './routes/finalInspectionRoutes.js';
import finalInspectionReportRoutes from './routes/finalInspectionReportRoutes.js';
import serviceBayRoutes from './routes/serviceBayRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import leaveRequestRoutes from './routes/leaveRequestRoutes.js';
import repairProgressRoutes from './routes/repairProgressRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to database
connectDB();

// Initialize cron jobs (commented out temporarily for debugging)
// import('./utils/cronJobs.js').catch(err => console.error('Failed to initialize cron jobs:', err));

// Middleware
// Build allowed origins list — includes local dev ports and production URLs from env
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  process.env.FRONTEND_URL,           // e.g. https://your-app.vercel.app
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Also allow all *.vercel.app subdomains for preview deployments
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(morgan('dev'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Disable caching for API routes to prevent 304 responses
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/job-cards', jobCardRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/spare-parts', sparePartsRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/grn', grnRoutes);
app.use('/api/purchase-returns', purchaseReturnRoutes);
app.use('/api/supplier-payments', supplierPaymentRoutes);
app.use('/api/hr', salaryAdvanceRoutes);
app.use('/api/hr', loanRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/road-tests', roadTestRoutes);
app.use('/api/time-tracking', timeTrackingRoutes);
app.use('/api/work-logs', workLogRoutes);
app.use('/api/final-inspections', finalInspectionRoutes);
app.use('/api/final-inspection-reports', finalInspectionReportRoutes);
app.use('/api/service-bays', serviceBayRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/repair-progress', repairProgressRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'VSMS API is running', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only start the HTTP server when running directly (local dev / traditional Node.js).
// On Vercel serverless, the exported `app` is used directly as the handler.
if (process.env.VERCEL !== '1') {
  const server = app.listen(PORT, () => {
    console.log(`\n🚗 VSMS API Server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   API URL: http://localhost:${PORT}/api\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n⚠️  Port ${PORT} is already in use by another running server!`);
      console.error(`   To free it, stop the other terminal with Ctrl+C or run: npm run kill-port\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

export default app;

