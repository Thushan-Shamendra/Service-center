export type UserRole = 'administrator' | 'manager' | 'employee' | 'customer';

export interface User {
  id: string;
  _id?: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  mobile?: string;
  nic?: string;
  profilePhoto?: string | null;
  isActive: boolean;
  lastLogin?: string;
  profile?: any;
  createdAt?: string;
  managerId?: string;
  employeeId?: string;
  customerId?: string;
  vehicles?: any[];
  totalServices?: number;
  completedServices?: number;
  pendingServices?: number;
  outstandingBalance?: number;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
}

export interface Employee {
  id: string;
  user: User | string;
  employeeId: string;
  nic: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  department?: string;
  designation?: string;
  employmentDate: string;
  basicSalary: number;
  allowances?: number;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  skills?: string[];
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
}

export interface Customer {
  id: string;
  _id?: string;
  user: User | string;
  customerId: string;
  nic?: string;
  passport?: string;
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  loyaltyTier: 'standard' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  outstandingBalance: number;
  notes?: string;
  status: 'active' | 'inactive';
}

export interface Vehicle {
  id: string;
  _id?: string;
  vehicleId?: string;
  customer: Customer | string;
  registrationNumber: string;
  vin?: string;
  engineNumber?: string;
  chassisNumber?: string;
  make: string;
  model: string;
  manufactureYear?: number;
  fuelType?: 'petrol' | 'diesel' | 'hybrid' | 'electric' | 'other';
  transmission?: 'manual' | 'automatic' | 'cvt' | 'other';
  currentMileage: number;
  color?: string;
  insuranceCompany?: string;
  insuranceNumber?: string;
  insuranceExpiry?: string;
  warrantyProvider?: string;
  warrantyExpiry?: string;
  insurance?: {
    provider?: string;
    policyNumber?: string;
    expiryDate?: string;
  };
  warranty?: {
    provider?: string;
    expiryDate?: string;
    details?: string;
  };
  currentServiceStatus: 'none' | 'in_service' | 'ready_for_pickup';
  nextRecommendedService?: string;
  status: 'active' | 'inactive';
}

export interface Appointment {
  id: string;
  _id?: string;
  appointmentNumber: string;
  customer: Customer | any;
  vehicle: Vehicle | any;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  complaint?: string;
  images?: string[];
  assignedTechnician?: Employee | any;
  estimatedDuration?: number;
  workshopBay?: string;
  status: 'pending' | 'approved' | 'rejected' | 'rescheduled' | 'cancelled' | 'completed';
  rejectionReason?: string;
  rescheduleDate?: string;
  rescheduleTime?: string;
  rescheduleReason?: string;
  notes?: string;
  createdAt?: string;
}

export interface JobCard {
  id: string;
  _id?: string;
  jobCardNumber: string;
  customer: Customer | any;
  vehicle: Vehicle | any;
  appointment?: Appointment | string;
  complaint: string;
  assignedTechnician?: Employee | any;
  serviceBay?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedCost: number;
  estimatedDelivery?: string;
  status:
    | 'pending'
    | 'diagnosing'
    | 'waiting_for_parts'
    | 'repair_in_progress'
    | 'testing'
    | 'ready_for_delivery'
    | 'delivered'
    | 'cancelled';
  progress: number;
  inspectionNotes?: string;
  odometer?: number;
  vehicleCondition?: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_further_repair';
  problemsFound?: string[];
  recommendedRepairs?: string[];
  workPerformed?: string[];
  parts?: Array<{
    item: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  timeLogs?: Array<{
    type: 'inspection' | 'repair' | 'testing' | 'waiting' | 'break';
    description: string;
    startTime: string;
    endTime?: string;
    hoursWorked?: number;
    remarks?: string;
  }>;
  evidence?: Array<{
    type: 'before' | 'after' | 'document' | 'video';
    url: string;
    caption?: string;
    uploadedAt: string;
  }>;
  roadTest?: {
    date?: string;
    result?: 'pass' | 'fail';
    remarks?: string;
    mileageAfterTest?: number;
  };
  finalInspection?: {
    finalCondition?: 'excellent' | 'good' | 'fair' | 'needs_further_repair';
    safetyCheck?: 'pass' | 'fail';
    remainingIssues?: string;
    futureRecommendations?: string;
    mechanicRemarks?: string;
    signature?: string;
  };
  statusChangeReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: string;
  _id?: string;
  itemCode: string;
  itemName: string;
  category: string;
  brand?: string;
  model?: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  reorderLevel: number;
  supplier?: any;
  location?: string;
  description?: string;
  status: 'active' | 'inactive' | 'discontinued';
  isLowStock?: boolean;
}

export interface Supplier {
  id: string;
  _id?: string;
  supplierId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  category?: string;
  paymentTerms?: string;
  bankDetails?: {
    bankName?: string;
    branch?: string;
    accountNumber?: string;
  };
  status: 'active' | 'inactive';
  isActive?: boolean;
}

export interface PurchaseOrder {
  id: string;
  _id?: string;
  poNumber: string;
  supplier: Supplier | string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  items: Array<{
    item?: InventoryItem | string;
    itemName: string;
    partNumber?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  status: 'pending' | 'partially_received' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  notes?: string;
  terms?: string;
  createdBy: User | string;
  approvedBy?: User | string;
  approvedAt?: string;
  cancelledBy?: User | string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GRN {
  id: string;
  _id?: string;
  grnNumber: string;
  purchaseOrder: PurchaseOrder | string;
  poNumber: string;
  supplier: Supplier | string;
  supplierName: string;
  receivedDate: string;
  items: Array<{
    item?: InventoryItem | string;
    itemName: string;
    partNumber?: string;
    orderedQuantity: number;
    receivedQuantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    total: number;
    condition: 'good' | 'damaged' | 'defective';
    notes?: string;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  status: 'partial' | 'complete';
  notes?: string;
  receivedBy: User | string;
  verifiedBy?: User | string;
  verifiedAt?: string;
  warehouseLocation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  _id?: string;
  invoiceNumber: string;
  jobCard?: any;
  customer: Customer | any;
  vehicle: Vehicle | any;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  }>;
  laborCharges: Array<{
    description: string;
    hours: number;
    ratePerHour: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  dueDate?: string;
  notes?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt?: string;
}

export type NotificationType = 
  | 'low_stock'
  | 'purchase_order_pending'
  | 'payment_due'
  | 'user_added'
  | 'leave_request'
  | 'payroll'
  | 'service_update'
  | 'system_alert'
  | 'appointment_confirmed'
  | 'appointment_rejected'
  | 'appointment_reminder'
  | 'vehicle_received'
  | 'repair_started'
  | 'waiting_for_parts'
  | 'vehicle_ready'
  | 'invoice_generated'
  | 'payment_received'
  | 'service_reminder'
  | 'warranty_expiry'
  | 'insurance_expiry'
  | 'system'
  | 'general';

export interface NotificationItem {
  id: string;
  _id?: string;
  user: string;
  title: string;
  description?: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// Dashboard Summaries
export interface AdminSummaryData {
  totalManagers: number;
  totalEmployees: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalInventoryItems: number;
  lowStockItems: number;
  pendingPurchaseOrders: number;
  pendingGRNs: number;
  pendingPayables: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  employeesPresentToday: number;
  recentActivities: NotificationItem[];
}

export interface WorkshopBay {
  id: number;
  vehicle: string | null;
  customer: string | null;
  status: 'Empty' | 'Repair' | 'Testing' | 'Parts';
}

export interface DashboardAppointment {
  id: string;
  time: string;
  customer: string;
  vehicle: string;
  service: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
}

export interface DashboardJobCard {
  id: string;
  vehicle: string;
  customer: string;
  status: string;
  amount: number;
}

export interface DashboardAlert {
  type: string;
  count: number;
  label: string;
  color: 'red' | 'orange' | 'yellow' | 'blue';
}

export interface ManagerSummaryData {
  todaysAppointments: number;
  todaysAppointmentsTrend?: number;
  vehiclesInWorkshop: number;
  pendingJobCards: number;
  waitingForParts: number;
  readyForDelivery: number;
  quotationsPendingApproval: number;
  unpaidInvoices: number;
  todaysRevenue: number;
  totalCustomers: number;
  totalVehicles: number;
  lowStockAlerts: number;
  techniciansAvailable: number;
  activeBays?: number;
  workshopBays?: WorkshopBay[];
  todaysAppointmentsList?: DashboardAppointment[];
  recentJobCards?: DashboardJobCard[];
  urgentJobCards?: number;
  delayedParts?: number;
  alerts?: DashboardAlert[];
}

export interface EmployeeSummaryData {
  assignedJobs: number;
  jobsInProgress: number;
  waitingForParts: number;
  completedJobsToday: number;
  pendingRoadTests: number;
  totalHoursWorkedToday: number;
}

export interface CustomerSummaryData {
  myVehicles: number;
  upcomingAppointments: number;
  vehiclesInService: number;
  outstandingBalance: number;
  totalCompletedServices: number;
  nextServiceDue: string | null;
  warrantyExpiringSoon: number;
  insuranceExpiringSoon: number;
}
