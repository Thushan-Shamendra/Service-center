import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { UnauthorizedPage } from '../pages/auth/UnauthorizedPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';

// Dashboards
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { ManagerDashboard } from '../pages/manager/ManagerDashboard';
import { EmployeeDashboard } from '../pages/employee/EmployeeDashboard';
import { CustomerDashboard } from '../pages/customer/CustomerDashboard';

// Admin Pages
import { UsersPage } from '../pages/admin/UsersPage';
import { ServicesPage } from '../pages/admin/ServicesPage';
import { InventoryPage } from '../pages/admin/InventoryPage';
import { SuppliersPage } from '../pages/admin/SuppliersPage';
import { CreatePurchaseOrder } from '../pages/admin/CreatePurchaseOrder';
import { GoodsReceivingPage } from '../pages/admin/GoodsReceivingPage';
import { CreateGRNPage } from '../pages/admin/CreateGRNPage';
import { CreatePurchaseReturnPage } from '../pages/admin/CreatePurchaseReturnPage';
import { PurchaseReturnsPage } from '../pages/admin/PurchaseReturnsPage';
import { RecordSupplierPaymentPage } from '../pages/admin/RecordSupplierPaymentPage';
import { HRPage } from '../pages/admin/HRPage';
import { PayrollPage } from '../pages/admin/PayrollPage';
import { SalaryAdvancePage } from '../pages/admin/SalaryAdvancePage';
import { LoanPage } from '../pages/admin/LoanPage';
import { FinancePage } from '../pages/admin/FinancePage';
import { FinancialManagementPage } from '../pages/admin/FinancialManagementPage';
import { ReportsPage as AdminReportsPage } from '../pages/admin/ReportsPage';
import { SettingsPage } from '../pages/admin/SettingsPage';

// Manager Pages
import { VehiclesPage } from '../pages/manager/VehiclesPage';
import { AppointmentsPage } from '../pages/manager/AppointmentsPage';
import { CreateAppointmentPage } from '../pages/manager/CreateAppointmentPage';
import { AppointmentDetailsPage } from '../pages/manager/AppointmentDetailsPage';
import { JobCardsPage } from '../pages/manager/JobCardsPage';
import { CreateJobCardPage } from '../pages/manager/CreateJobCardPage';
import { JobCardDetailsPage } from '../pages/manager/JobCardDetailsPage';
import { ActiveJobsPage } from '../pages/manager/ActiveJobsPage';
import { CompletedJobsPage } from '../pages/manager/CompletedJobsPage';
import { WorkshopPage } from '../pages/manager/WorkshopPage';
import { WorkshopQueuePage } from '../pages/manager/WorkshopQueuePage';
import { AssignTechnicianPage } from '../pages/manager/AssignTechnicianPage';
import { AssignBayPage } from '../pages/manager/AssignBayPage';
import { ServiceBaysPage } from '../pages/manager/ServiceBaysPage';
import { TechnicianWorkloadPage } from '../pages/manager/TechnicianWorkloadPage';
import { TimeTrackingPage as ManagerTimeTrackingPage } from '../pages/manager/TimeTrackingPage';
import { QuotationsPage } from '../pages/manager/QuotationsPage';
import { GenerateQuotationPage } from '../pages/manager/GenerateQuotationPage';
import { QuotationDetailsPage } from '../pages/manager/QuotationDetailsPage';
import { InvoicesPage } from '../pages/manager/InvoicesPage';
import { ManagerPaymentsPage } from '../pages/manager/ManagerPaymentsPage';
import { CreateInvoicePage } from '../pages/manager/CreateInvoicePage';
import { InventoryUsagePage } from '../pages/manager/InventoryUsagePage';
import { PartsRequestsPage } from '../pages/manager/PartsRequestsPage';
import { CustomersPage } from '../pages/manager/CustomersPage';
import { RegisterCustomerPage } from '../pages/manager/RegisterCustomerPage';
import { CustomerDetailsPage } from '../pages/manager/CustomerDetailsPage';
import { UpdateCustomerPage } from '../pages/manager/UpdateCustomerPage';
import { RegisterVehiclePage } from '../pages/manager/RegisterVehiclePage';
import { VehicleDetailsPage } from '../pages/manager/VehicleDetailsPage';
import { UpdateVehiclePage } from '../pages/manager/UpdateVehiclePage';
import { NotificationsPage } from '../pages/manager/NotificationsPage';
import { SendNotificationPage } from '../pages/manager/SendNotificationPage';
import { NotificationDetailsPage } from '../pages/manager/NotificationDetailsPage';
import { AppointmentConfirmationPage } from '../pages/manager/notifications/AppointmentConfirmationPage';
import { AppointmentCancellationPage } from '../pages/manager/notifications/AppointmentCancellationPage';
import { AppointmentReminderPage } from '../pages/manager/notifications/AppointmentReminderPage';
import { VehicleReadyPage } from '../pages/manager/notifications/VehicleReadyPage';
import { InvoiceReadyPage } from '../pages/manager/notifications/InvoiceReadyPage';
import { PaymentReminderPage } from '../pages/manager/notifications/PaymentReminderPage';
import { ReportsPage as ManagerReportsPage } from '../pages/manager/ReportsPage';
import { CustomerReportsPage } from '../pages/manager/reports/CustomerReportsPage';
import { VehicleReportsPage } from '../pages/manager/reports/VehicleReportsPage';
import { AppointmentReportsPage } from '../pages/manager/reports/AppointmentReportsPage';
import { WorkshopReportsPage } from '../pages/manager/reports/WorkshopReportsPage';
import { QuotationReportsPage } from '../pages/manager/reports/QuotationReportsPage';
import { InvoiceReportsPage } from '../pages/manager/reports/InvoiceReportsPage';
import { InventoryReportsPage } from '../pages/manager/reports/InventoryReportsPage';
import { TechnicianProductivityReport } from '../pages/manager/reports/TechnicianProductivityReport';
import { ManagerProfilePage } from '../pages/manager/ManagerProfilePage';
import { ManagerLeaveManagementPage } from '../pages/manager/ManagerLeaveManagementPage';

// Employee Pages
import { AssignedJobsPage } from '../pages/employee/AssignedJobsPage';
import { JobCardDetailsPage as EmployeeJobCardDetailsPage } from '../pages/employee/JobCardDetailsPage';
import { InitialInspectionPage } from '../pages/employee/InitialInspectionPage';
import { InspectionListPage } from '../pages/employee/InspectionListPage';
import { RepairProgressPage } from '../pages/employee/RepairProgressPage';
import { RepairProgressListPage } from '../pages/employee/RepairProgressListPage';
import { RedesignedRepairProgressPage } from '../pages/employee/RedesignedRepairProgressPage';
import { SparePartsRequestPage } from '../pages/employee/SparePartsRequestPage';
import { RequestPartsFormPage } from '../pages/employee/RequestPartsFormPage';
import { RequestPendingPage } from '../pages/employee/RequestPendingPage';
import { RequestApprovedPage } from '../pages/employee/RequestApprovedPage';
import { RequestRejectedPage } from '../pages/employee/RequestRejectedPage';
import { PartsIssuedPage } from '../pages/employee/PartsIssuedPage';
import { PartsRequestStatusPage } from '../pages/employee/PartsRequestStatusPage';
import { RoadTestPage } from '../pages/employee/RoadTestPage';
import { RoadTestFormPage } from '../pages/employee/RoadTestFormPage';
import { RoadTestPassPage } from '../pages/employee/RoadTestPassPage';
import { RoadTestFailPage } from '../pages/employee/RoadTestFailPage';
import { RoadTestHistoryPage } from '../pages/employee/RoadTestHistoryPage';
import { TimeTrackingPage } from '../pages/employee/TimeTrackingPage';
import { FinalInspectionPage } from '../pages/employee/FinalInspectionPage';
import { FinalInspectionReportFormPage } from '../pages/employee/FinalInspectionReportFormPage';
import { RedesignedFinalInspectionReportPage } from '../pages/employee/RedesignedFinalInspectionReportPage';
import { FinalInspectionReportWithIssuesPage } from '../pages/employee/FinalInspectionReportWithIssuesPage';
import { FinalInspectionReportSuccessPage } from '../pages/employee/FinalInspectionReportSuccessPage';
import { RedesignedFinalInspectionSuccessPage } from '../pages/employee/RedesignedFinalInspectionSuccessPage';
import { FinalInspectionReportPreviewPage } from '../pages/employee/FinalInspectionReportPreviewPage';
import { EmployeeProfilePage } from '../pages/employee/EmployeeProfilePage';
import { LeaveManagementPage } from '../pages/employee/LeaveManagementPage';
import { ApplyLeavePage } from '../pages/employee/ApplyLeavePage';
import { LeaveRequestDetailPage } from '../pages/employee/LeaveRequestDetailPage';
import { LeaveHistoryPage } from '../pages/employee/LeaveHistoryPage';
import { EmployeeAttendancePage } from '../pages/employee/EmployeeAttendancePage';

// Customer Pages
import { CustomerAppointmentsPage } from '../pages/customer/CustomerAppointmentsPage';
import { ServiceTrackerPage } from '../pages/customer/ServiceTrackerPage';
import { ServiceHistoryPage } from '../pages/customer/ServiceHistoryPage';
import { CustomerInvoicesPage } from '../pages/customer/CustomerInvoicesPage';
import { CustomerNotificationsPage } from '../pages/customer/CustomerNotificationsPage';
import { CustomerReviewsPage } from '../pages/customer/CustomerReviewsPage';
import { CustomerAccountPage } from '../pages/customer/CustomerAccountPage';
import { CustomerVehiclesPage } from '../pages/customer/CustomerVehiclesPage';
import { CustomerQuotationsPage } from '../pages/customer/CustomerQuotationsPage';

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-card text-center my-4">
    <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
    <p className="text-sm text-slate-500">
      This module is ready to connect. Select items or actions to proceed.
    </p>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ==================== ADMINISTRATOR ==================== */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['administrator']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['administrator']}>
            <Routes>
              <Route path="users" element={<UsersPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="suppliers/create-po" element={<CreatePurchaseOrder />} />
              <Route path="goods-receiving" element={<GoodsReceivingPage />} />
              <Route path="goods-receiving/create" element={<CreateGRNPage />} />
              <Route path="purchase-returns" element={<PurchaseReturnsPage />} />
              <Route path="purchase-returns/:id" element={<PurchaseReturnsPage />} />
              <Route path="purchase-returns/create" element={<CreatePurchaseReturnPage />} />
              <Route path="supplier-payments/record" element={<RecordSupplierPaymentPage />} />
              <Route path="purchasing" element={<PlaceholderPage title="Purchasing & GRN Management" />} />
              <Route path="hr" element={<HRPage />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="salary-advances" element={<SalaryAdvancePage />} />
              <Route path="loans" element={<LoanPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="financial-management" element={<FinancialManagementPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="notifications" element={<PlaceholderPage title="Notification Center" />} />
              <Route path="profile" element={<PlaceholderPage title="Administrator Profile" />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* ==================== MANAGER ==================== */}
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/*"
        element={
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <Routes>
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/new" element={<RegisterCustomerPage />} />
              <Route path="customers/:customerId" element={<CustomerDetailsPage />} />
              <Route path="customers/:customerId/edit" element={<UpdateCustomerPage />} />
              <Route path="customers/:customerId/vehicles" element={<CustomerDetailsPage />} />
              <Route path="customers/:customerId/history" element={<CustomerDetailsPage />} />
              <Route path="customers/:customerId/ledger" element={<CustomerDetailsPage />} />
              <Route path="vehicles" element={<VehiclesPage />} />
              <Route path="vehicles/new" element={<RegisterVehiclePage />} />
              <Route path="vehicles/:vehicleId" element={<VehicleDetailsPage />} />
              <Route path="vehicles/:vehicleId/edit" element={<UpdateVehiclePage />} />
              <Route path="vehicles/:vehicleId/history" element={<VehicleDetailsPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="appointments/new" element={<CreateAppointmentPage />} />
              <Route path="appointments/:appointmentId" element={<AppointmentDetailsPage />} />
              <Route path="appointments/:appointmentId/edit" element={<AppointmentDetailsPage />} />
              <Route path="job-cards" element={<JobCardsPage />} />
              <Route path="job-cards/new" element={<CreateJobCardPage />} />
              <Route path="job-cards/active" element={<ActiveJobsPage />} />
              <Route path="job-cards/completed" element={<CompletedJobsPage />} />
              <Route path="job-cards/statistics" element={<WorkshopReportsPage />} />
              <Route path="job-cards/:jobCardId" element={<JobCardDetailsPage />} />
              <Route path="workshop" element={<WorkshopPage />} />
              <Route path="workshop/queue" element={<WorkshopQueuePage />} />
              <Route path="workshop/assign-technician" element={<AssignTechnicianPage />} />
              <Route path="workshop/assign-bay" element={<AssignBayPage />} />
              <Route path="workshop/service-bays" element={<ServiceBaysPage />} />
              <Route path="workshop/technician-workload" element={<TechnicianWorkloadPage />} />
              <Route path="workshop/time-tracking" element={<ManagerTimeTrackingPage />} />
              <Route path="technicians" element={<TechnicianWorkloadPage />} />
              <Route path="quotations" element={<QuotationsPage />} />
              <Route path="quotations/new" element={<GenerateQuotationPage />} />
              <Route path="quotations/:quotationId/edit" element={<GenerateQuotationPage />} />
              <Route path="quotations/:quotationId" element={<QuotationDetailsPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="inventory-usage" element={<InventoryUsagePage />} />
              <Route path="parts-requests" element={<PartsRequestsPage />} />
              <Route path="parts-requests/:requestId" element={<PartsRequestsPage />} />
              <Route path="invoices/new" element={<CreateInvoicePage />} />
              <Route path="invoices/:id" element={<InvoicesPage />} />
              <Route path="payments" element={<ManagerPaymentsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="notifications/send" element={<SendNotificationPage />} />
              <Route path="notifications/:notificationId" element={<NotificationDetailsPage />} />
              <Route path="notifications/send/appointment-confirmation" element={<AppointmentConfirmationPage />} />
              <Route path="notifications/send/appointment-cancellation" element={<AppointmentCancellationPage />} />
              <Route path="notifications/send/appointment-reminder" element={<AppointmentReminderPage />} />
              <Route path="notifications/send/vehicle-ready" element={<VehicleReadyPage />} />
              <Route path="notifications/send/invoice-ready" element={<InvoiceReadyPage />} />
              <Route path="notifications/send/payment-reminder" element={<PaymentReminderPage />} />
              <Route path="reports" element={<ManagerReportsPage />} />
              <Route path="reports/customers" element={<CustomerReportsPage />} />
              <Route path="reports/vehicles" element={<VehicleReportsPage />} />
              <Route path="reports/appointments" element={<AppointmentReportsPage />} />
              <Route path="reports/workshop" element={<WorkshopReportsPage />} />
              <Route path="reports/quotations" element={<QuotationReportsPage />} />
              <Route path="reports/invoices" element={<InvoiceReportsPage />} />
              <Route path="reports/inventory" element={<InventoryReportsPage />} />
              <Route path="reports/workshop/technician-productivity" element={<TechnicianProductivityReport />} />
              <Route path="profile" element={<ManagerProfilePage />} />
              <Route path="leave-management" element={<ManagerLeaveManagementPage />} />
              <Route path="leave-request/:requestId" element={<ManagerLeaveManagementPage />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* ==================== EMPLOYEE ==================== */}
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/assigned-jobs"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <AssignedJobsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/assigned-jobs/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <EmployeeJobCardDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/inspection"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <InspectionListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/inspection/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <InitialInspectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/repair-progress"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <RepairProgressListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/repair-progress/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <RedesignedRepairProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/repair-progress-old/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <RepairProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/parts-requests"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <SparePartsRequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/request-parts-form/:jobCardId?"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <RequestPartsFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/request-parts/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <RequestPartsFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/parts-request-pending/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <RequestPendingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/parts-request-approved/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <RequestApprovedPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/parts-request-rejected/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <RequestRejectedPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/parts-issued/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <PartsIssuedPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/parts-request-status/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <PartsRequestStatusPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/time-tracking"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <TimeTrackingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/evidence"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <PlaceholderPage title="Evidence Photos & Media Gallery" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/road-test"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <RoadTestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/road-test-form/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <RoadTestFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/road-test-pass/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <RoadTestPassPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/road-test-fail/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <RoadTestFailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/road-test-history/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <RoadTestHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/final-inspection"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <FinalInspectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/final-inspection-form/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <RedesignedFinalInspectionReportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/final-inspection-form-old/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <FinalInspectionReportFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/final-inspection-with-issues/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <FinalInspectionReportWithIssuesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/final-inspection-success/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <RedesignedFinalInspectionSuccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/final-inspection-success-old/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <FinalInspectionReportSuccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/final-inspection-preview/:reportId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <FinalInspectionReportPreviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/final-inspection/:jobCardId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <FinalInspectionReportPreviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/profile"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <EmployeeProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/attendance"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <EmployeeAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/leave-management"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <LeaveManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/apply-leave"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <ApplyLeavePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/edit-leave/:requestId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <ApplyLeavePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/leave-request/:requestId"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <LeaveRequestDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/leave-history"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <LeaveHistoryPage />
          </ProtectedRoute>
        }
      />

      {/* ==================== CUSTOMER ==================== */}
      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/*"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Routes>
              <Route path="account" element={<CustomerAccountPage />} />
              <Route path="vehicles" element={<CustomerVehiclesPage />} />
              <Route path="appointments" element={<CustomerAppointmentsPage />} />
              <Route path="tracking" element={<ServiceTrackerPage />} />
              <Route path="quotations" element={<CustomerQuotationsPage />} />
              <Route path="history" element={<ServiceHistoryPage />} />
              <Route path="invoices" element={<CustomerInvoicesPage />} />
              <Route path="notifications" element={<CustomerNotificationsPage />} />
              <Route path="reviews" element={<CustomerReviewsPage />} />
              <Route path="profile" element={<PlaceholderPage title="Customer Profile" />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
