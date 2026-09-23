import React, { useEffect, useState } from 'react';
import { hrApi } from '../../api/hrApi';
import { userApi } from '../../api/userApi';
import { formatLKR } from '../../utils/formatters';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Plus, 
  Save, 
  X, 
  FileText,
  Download,
  Printer,
  Calculator,
  Search,
  Eye,
  Edit,
  ClipboardList,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

  const STATUS_COLORS = {
    draft: 'bg-yellow-100 text-yellow-800',
    calculated: 'bg-blue-100 text-blue-800',
    pending_approval: 'bg-orange-100 text-orange-800',
    processed: 'bg-emerald-100 text-emerald-800',
    generated: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800'
  };

const STATUS_ICONS = {
  draft: Clock,
  calculated: Calculator,
  pending_approval: Clock,
  processed: CheckCircle,
  generated: FileText,
  cancelled: XCircle
};

const STATUS_EMOJIS = {
  draft: '🟡',
  calculated: '🔵',
  pending_approval: '🟠',
  processed: '🟢',
  generated: '📄',
  cancelled: '🔴'
};

export const PayrollPage: React.FC = () => {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  // Process Payroll modal
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payrollPreview, setPayrollPreview] = useState<any>(null);
  const [includeOvertime, setIncludeOvertime] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [individualPayrollForm, setIndividualPayrollForm] = useState({
    allowances: 0,
    otherDeductions: 0,
  });
  
  // Individual Payroll modal
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [isEditingPayroll, setIsEditingPayroll] = useState(false);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [payrollForm, setPayrollForm] = useState({
    employeeId: '',
    month: month,
    year: year,
    allowances: 0,
    otherDeductions: 0,
    loanDeductions: 0,
    salaryAdvanceDeductions: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Payslip modal
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [isGeneratingPayslip, setIsGeneratingPayslip] = useState(false);
  
  // Payroll settings
  const [payrollSettings, setPayrollSettings] = useState<any>(null);

  const fetchPayroll = async () => {
    setIsLoading(true);
    try {
      const res = await hrApi.getPayroll({ month, year });
      if (res.success) setPayrolls(res.data);
    } catch (error) {
      console.error('Failed to load payroll records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayrollSettings = async () => {
    try {
      const res = await hrApi.getPayrollSettings();
      if (res.success) setPayrollSettings(res.data);
    } catch (error) {
      console.error('Failed to load payroll settings:', error);
    }
  };

  const fetchStaffMembers = async () => {
    setIsLoadingStaff(true);
    try {
      const [employeesRes, managersRes] = await Promise.all([
        userApi.getUsers({ role: 'employee', status: 'active', limit: 100 }),
        userApi.getUsers({ role: 'manager', status: 'active', limit: 100 })
      ]);
      
      const allStaff = [
        ...(employeesRes.success ? employeesRes.data : []),
        ...(managersRes.success ? managersRes.data : [])
      ];
      
      const validStaff = allStaff
        .map(staff => {
          const profile = staff.profile || staff.employeeDetails;
          if (!profile) return null;
          return {
            ...staff,
            profile,
            displayId: staff.role === 'manager' 
              ? (profile.managerId || profile.employeeId || `MGR-${staff._id.slice(-4)}`)
              : (profile.employeeId || `EMP-${staff._id.slice(-4)}`)
          };
        })
        .filter(Boolean);
      
      setStaffMembers(validStaff);
    } catch (error) {
      console.error('Failed to fetch staff members:', error);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleCalculatePreview = async (silent = false) => {
    setIsCalculating(true);
    try {
      const res = await hrApi.calculatePayrollPreview({ month, year, includeOvertime });
      if (res.success) {
        setPayrollPreview(res.data);
      }
    } catch (error) {
      console.error('Failed to calculate preview:', error);
      if (!silent) {
        alert('Failed to calculate payroll preview');
      }
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
    fetchPayrollSettings();
    fetchStaffMembers();
    handleCalculatePreview(true);
  }, [month, year]);

  useEffect(() => {
    if (showProcessModal && !payrollPreview) {
      handleCalculatePreview(true);
    }
  }, [showProcessModal]);

  const handleBulkCalculate = async () => {
    setIsCalculating(true);
    try {
      const res = await hrApi.bulkCalculatePayroll({ month, year, includeOvertime });
      if (res.success) {
        await fetchPayroll();
        await handleCalculatePreview();
        alert(res.message || `Payroll records generated for ${res.data?.length || 0} employees`);
      }
    } catch (error: any) {
      console.error('Failed to calculate payroll:', error);
      alert(error.response?.data?.message || 'Failed to generate monthly payroll');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleBulkProcess = async () => {
    if (!payrollPreview) {
      alert('Please calculate payroll preview first');
      return;
    }

    const confirmed = window.confirm(
      `Process payroll for ${payrollPreview.employeeCount} staff members?\n\n` +
      `Total Net Payroll: ${formatLKR(payrollPreview.estimatedNetPayroll)}\n\n` +
      `This action will:\n` +
      `- Mark all calculated payroll records as processed\n` +
      `- Update loan repayments\n` +
      `- Update salary advance deductions\n\n` +
      `Are you sure you want to continue?`
    );

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const res = await hrApi.bulkProcessPayroll({ month, year });
      if (res.success) {
        fetchPayroll();
        handleCalculatePreview();
        alert(res.message);
      }
    } catch (error) {
      console.error('Failed to process payroll:', error);
      alert('Failed to process payroll');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateIndividualPayroll = async (status: string) => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await hrApi.createPayroll({
        employeeId: selectedEmployee,
        month,
        year,
        allowances: individualPayrollForm.allowances,
        otherDeductions: individualPayrollForm.otherDeductions,
      });
      
      if (res.success) {
        // Update status if needed
        if (status === 'processed') {
          await hrApi.updatePayroll(res.data._id, { status: 'processed' });
        }
        
        fetchPayroll();
        setShowProcessModal(false);
        setSelectedEmployee('');
        setIndividualPayrollForm({ allowances: 0, otherDeductions: 0 });
        alert(`Payroll ${status === 'draft' ? 'saved as draft' : 'processed'} successfully`);
      }
    } catch (error: any) {
      console.error('Failed to create payroll:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create payroll';
      setSubmitError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPayroll = (payroll: any) => {
    setSelectedPayroll(payroll);
    setIsEditingPayroll(false);
    setShowPayrollModal(true);
  };

  const handleEditPayroll = (payroll: any) => {
    setSelectedPayroll(payroll);
    setIsEditingPayroll(true);
    setPayrollForm({
      employeeId: payroll.employee?._id,
      month: payroll.month,
      year: payroll.year,
      allowances: payroll.allowances || 0,
      otherDeductions: payroll.otherDeductions || 0,
      loanDeductions: payroll.loanDeductions || 0,
      salaryAdvanceDeductions: payroll.salaryAdvanceDeductions || 0,
    });
    setShowPayrollModal(true);
  };

  const handleSaveDraft = async () => {
    if (!selectedPayroll?._id) return;
    setIsSubmitting(true);
    try {
      const res = await hrApi.updatePayroll(selectedPayroll._id, {
        allowances: Number(payrollForm.allowances) || 0,
        otherDeductions: Number(payrollForm.otherDeductions) || 0,
        loanDeductions: Number(payrollForm.loanDeductions) || 0,
        salaryAdvanceDeductions: Number(payrollForm.salaryAdvanceDeductions) || 0,
        status: 'draft',
      });
      if (res.success) {
        setSelectedPayroll(res.data);
        setIsEditingPayroll(false);
        await fetchPayroll();
        alert('Draft payroll updated successfully');
      } else {
        alert(res.message || 'Failed to update payroll draft');
      }
    } catch (error: any) {
      console.error('Failed to update payroll draft:', error);
      alert(error.response?.data?.message || 'Failed to update payroll draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneratePayslip = (payroll: any) => {
    setSelectedPayroll(payroll);
    setShowPayslipModal(true);
  };

  const handleDownloadPayslip = async () => {
    setIsGeneratingPayslip(true);
    try {
      await hrApi.downloadPayslipPDF(selectedPayroll._id);
      setIsGeneratingPayslip(false);
    } catch (error: any) {
      console.error('Failed to download payslip:', error);
      setIsGeneratingPayslip(false);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to download payslip';
      alert(`Download failed: ${errorMessage}`);
    }
  };

  const handlePrintPayslip = () => {
    // Create a print-specific window with just the payslip content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print payslips');
      return;
    }

    const MONTH_NAMES = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const formatLKR = (amount: number) => {
      return `LKR ${amount?.toLocaleString('en-LK') || '0.00'}`;
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip - ${selectedPayroll.payrollId}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 10px;
            color: #1e293b;
            font-size: 11px;
            line-height: 1.3;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f0f7ff;
            border: 1.5px solid #0066cc;
            border-radius: 4px;
            padding: 10px 16px;
            margin-bottom: 10px;
          }
          .company-name {
            font-size: 20px;
            color: #0066cc;
            font-weight: bold;
          }
          .company-subtitle {
            font-size: 9px;
            font-weight: bold;
            color: #1e293b;
            margin-top: 2px;
          }
          .company-tagline {
            font-size: 8px;
            color: #64748b;
          }
          .document-title {
            font-size: 18px;
            color: #0066cc;
            font-weight: bold;
            text-align: right;
          }
          .document-subtitle {
            font-size: 8.5px;
            color: #64748b;
            text-align: right;
          }
          .employee-info {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 10px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 16px;
            font-size: 9px;
          }
          .info-label {
            color: #64748b;
            font-weight: normal;
          }
          .info-val {
            font-weight: bold;
            color: #0f172a;
          }
          .tables-row {
            display: flex;
            gap: 12px;
            margin-bottom: 8px;
          }
          .table-col {
            flex: 1;
          }
          .section-header {
            background: #ecfdf5;
            color: #047857;
            padding: 5px 8px;
            font-weight: bold;
            font-size: 9px;
            border: 1px solid #10b981;
            border-radius: 3px 3px 0 0;
          }
          .deductions-header {
            background: #fef2f2;
            color: #b91c1c;
            border-color: #ef4444;
          }
          .employer-header {
            background: #eff6ff;
            color: #1d4ed8;
            border-color: #3b82f6;
          }
          .summary-header {
            background: #f1f5f9;
            color: #334155;
            border-color: #64748b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            border: 1px solid #e2e8f0;
            border-top: none;
          }
          th, td {
            padding: 5px 8px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          th {
            background: #f1f5f9;
            font-weight: bold;
            color: #475569;
            font-size: 8.5px;
          }
          .amount {
            text-align: right;
            font-weight: bold;
          }
          .total-row {
            background: #ecfdf5;
            font-weight: bold;
            color: #047857;
          }
          .deduction-total {
            background: #fef2f2;
            color: #b91c1c;
          }
          .net-salary {
            background: #0066cc;
            color: white;
            padding: 10px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 4px;
            margin: 8px 0;
          }
          .net-salary-title {
            font-size: 12px;
            font-weight: bold;
          }
          .net-salary-subtitle {
            font-size: 8px;
            color: #bfdbfe;
          }
          .net-salary-amount {
            font-size: 18px;
            font-weight: bold;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 25px;
            padding-top: 10px;
          }
          .signature-box {
            width: 40%;
            text-align: center;
          }
          .signature-line {
            border-bottom: 1px solid #64748b;
            margin-bottom: 5px;
            height: 25px;
          }
          .signature-title {
            font-size: 8px;
            font-weight: bold;
            color: #334155;
          }
          .signature-sub {
            font-size: 7px;
            color: #94a3b8;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 7.5px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
            .tables-row, .signatures, .footer, .net-salary {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">VSMS.LK</div>
            <div class="company-subtitle">VEHICLE SERVICE MANAGEMENT SYSTEM</div>
            <div class="company-tagline">Professional Vehicle Care & Fleet Solutions</div>
          </div>
          <div>
            <div class="document-title">PAYSLIP</div>
            <div class="document-subtitle">Official Salary Statement</div>
          </div>
        </div>

        <div class="employee-info">
          <div><span class="info-label">Employee ID:</span> <span class="info-val">${selectedPayroll.employee?.employeeId || selectedPayroll.employee?.managerId || 'N/A'}</span></div>
          <div><span class="info-label">Payroll ID:</span> <span class="info-val">${selectedPayroll.payrollId}</span></div>
          <div><span class="info-label">Name:</span> <span class="info-val">${selectedPayroll.employee?.user?.firstName || ''} ${selectedPayroll.employee?.user?.lastName || ''}</span></div>
          <div><span class="info-label">Pay Period:</span> <span class="info-val">${MONTH_NAMES[selectedPayroll.month - 1]} ${selectedPayroll.year}</span></div>
          <div><span class="info-label">Position:</span> <span class="info-val">${selectedPayroll.employee?.user?.role || 'Employee'}</span></div>
          <div><span class="info-label">Generated:</span> <span class="info-val">${new Date().toLocaleDateString('en-GB')}</span></div>
        </div>

        <div class="tables-row">
          <div class="table-col">
            <div class="section-header">EARNINGS</div>
            <table>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
              <tr>
                <td>Basic Salary</td>
                <td class="amount">${formatLKR(selectedPayroll.basicSalary)}</td>
              </tr>
              ${selectedPayroll.allowances > 0 ? `
              <tr>
                <td>Allowances</td>
                <td class="amount">${formatLKR(selectedPayroll.allowances)}</td>
              </tr>` : ''}
              ${selectedPayroll.overtimePay > 0 ? `
              <tr>
                <td>Overtime Pay (${selectedPayroll.overtimeHours || 0} hrs)</td>
                <td class="amount">${formatLKR(selectedPayroll.overtimePay)}</td>
              </tr>` : ''}
              <tr class="total-row">
                <td>GROSS SALARY</td>
                <td class="amount">${formatLKR(selectedPayroll.grossSalary)}</td>
              </tr>
            </table>
          </div>

          <div class="table-col">
            <div class="section-header deductions-header">DEDUCTIONS</div>
            <table>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
              ${selectedPayroll.epfEmployee > 0 ? `
              <tr>
                <td>EPF (Employee 8%)</td>
                <td class="amount" style="color: #dc2626;">-${formatLKR(selectedPayroll.epfEmployee)}</td>
              </tr>` : ''}
              ${selectedPayroll.loanDeductions > 0 ? `
              <tr>
                <td>Loan Repayment</td>
                <td class="amount" style="color: #dc2626;">-${formatLKR(selectedPayroll.loanDeductions)}</td>
              </tr>` : ''}
              ${selectedPayroll.salaryAdvanceDeductions > 0 ? `
              <tr>
                <td>Salary Advance</td>
                <td class="amount" style="color: #dc2626;">-${formatLKR(selectedPayroll.salaryAdvanceDeductions)}</td>
              </tr>` : ''}
              ${selectedPayroll.otherDeductions > 0 ? `
              <tr>
                <td>Other Deductions</td>
                <td class="amount" style="color: #dc2626;">-${formatLKR(selectedPayroll.otherDeductions)}</td>
              </tr>` : ''}
              ${(!selectedPayroll.epfEmployee && !selectedPayroll.loanDeductions && !selectedPayroll.salaryAdvanceDeductions && !selectedPayroll.otherDeductions) ? `
              <tr>
                <td>No Deductions</td>
                <td class="amount">LKR 0.00</td>
              </tr>` : ''}
              <tr class="total-row deduction-total">
                <td>TOTAL DEDUCTIONS</td>
                <td class="amount">-${formatLKR(selectedPayroll.totalDeductions)}</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="net-salary">
          <div>
            <div class="net-salary-title">NET SALARY PAYABLE</div>
            <div class="net-salary-subtitle">Take Home Pay for the Period</div>
          </div>
          <div class="net-salary-amount">${formatLKR(selectedPayroll.netSalary)}</div>
        </div>

        <div class="tables-row">
          <div class="table-col">
            <div class="section-header employer-header">EMPLOYER CONTRIBUTIONS (Informational)</div>
            <table>
              <tr>
                <th>Contribution</th>
                <th>Rate</th>
                <th style="text-align: right;">Amount</th>
              </tr>
              <tr>
                <td>EPF (Employer)</td>
                <td>12%</td>
                <td class="amount">${formatLKR(selectedPayroll.epfEmployer)}</td>
              </tr>
              <tr>
                <td>ETF (Employer)</td>
                <td>3%</td>
                <td class="amount">${formatLKR(selectedPayroll.etfEmployer)}</td>
              </tr>
            </table>
          </div>

          <div class="table-col">
            <div class="section-header summary-header">PAYMENT SUMMARY</div>
            <table>
              <tr>
                <td>Payment Method:</td>
                <td class="amount" style="font-weight: normal;">${selectedPayroll.paymentMethod || 'Bank Transfer'}</td>
              </tr>
              <tr>
                <td>Payment Status:</td>
                <td class="amount" style="color: ${selectedPayroll.status === 'processed' || selectedPayroll.status === 'paid' ? '#16a34a' : '#d97706'};">
                  ${selectedPayroll.status?.toUpperCase() || 'DRAFT'}
                </td>
              </tr>
              <tr>
                <td>Payment Date:</td>
                <td class="amount" style="font-weight: normal;">${selectedPayroll.paymentDate ? new Date(selectedPayroll.paymentDate).toLocaleDateString('en-GB') : 'Processed with Payroll'}</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-title">Authorised Signature</div>
            <div class="signature-sub">Management / Finance</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-title">Employee Signature</div>
            <div class="signature-sub">Acknowledgement of Receipt</div>
          </div>
        </div>

        <div class="footer">
          <div>This is a computer-generated document and does not require a physical signature when processed electronically.</div>
          <div>VSMS.LK - Vehicle Service Management System | Professional Vehicle Care & Fleet Solutions</div>
          <div>Generated on ${new Date().toLocaleString('en-GB')} | Document ID: ${selectedPayroll.payrollId} | Page 1 of 1</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for the content to load, then print
    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };
  };

  const getSelectedEmployee = () => {
    return staffMembers.find(s => s.profile?._id === (selectedEmployee || payrollForm.employeeId));
  };

  const getSelectedEmployeePreview = () => {
    if (!selectedEmployee) return null;
    const selectedStaff = getSelectedEmployee();
    return payrollPreview?.employees?.find(
      (e: any) => (e._id && String(e._id) === String(selectedEmployee)) || 
                  (selectedStaff?.displayId && e.employeeId === selectedStaff.displayId)
    );
  };

  const calculatePayrollPreview = () => {
    const employee = getSelectedEmployee();
    if (!employee) return null;

    const empPreview = getSelectedEmployeePreview();
    const basic = employee.profile?.basicSalary || empPreview?.basicSalary || 50000;
    const allowances = individualPayrollForm.allowances || payrollForm.allowances || 0;
    const overtimeHours = empPreview?.overtimeHours || 0;
    const overtimePay = empPreview?.overtimePay || 0;
    const grossSalary = basic + allowances + overtimePay;
    
    const epfRate = payrollSettings?.epfEmployeeRate || 8;
    const etfRate = payrollSettings?.etfEmployerRate || 3;
    
    const epfEmployee = empPreview?.epfEmployee || Math.round(basic * (epfRate / 100));
    const etfEmployer = empPreview?.etfEmployer || Math.round(basic * (etfRate / 100));
    const loanDeductions = empPreview?.loanDeductions || payrollForm.loanDeductions || 0;
    const salaryAdvanceDeductions = empPreview?.salaryAdvanceDeductions || payrollForm.salaryAdvanceDeductions || 0;
    const otherDeductions = individualPayrollForm.otherDeductions || payrollForm.otherDeductions || 0;
    
    // ETF is employer contribution only, not deducted from employee
    const totalDeductions = epfEmployee + otherDeductions + loanDeductions + salaryAdvanceDeductions;
    const netSalary = grossSalary - totalDeductions;

    return {
      basic,
      allowances,
      overtimeHours,
      overtimePay,
      grossSalary,
      epfEmployee,
      etfEmployer,
      loanDeductions,
      salaryAdvanceDeductions,
      otherDeductions,
      totalDeductions,
      netSalary,
    };
  };

  const preview = calculatePayrollPreview();

  // Filter payrolls
  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesSearch = !searchTerm || 
      payroll.employee?.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.employee?.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.payrollId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || payroll.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate dashboard stats
  const totalStaff = staffMembers.length; // Actual count of staff members
  const totalPayroll = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const processedCount = payrolls.filter(p => p.status === 'processed').length;
  const pendingCount = payrolls.filter(p => ['draft', 'calculated', 'pending_approval'].includes(p.status)).length;

  const columns: Column<any>[] = [
    {
      header: 'Payroll ID',
      accessor: (item) => (
        <span className="text-xs font-mono text-slate-500">{item.payrollId}</span>
      ),
    },
    {
      header: 'Staff',
      accessor: (item) => (
        <span className="text-xs font-mono text-slate-700">
          {item.employee?.employeeId || item.employee?.managerId}
        </span>
      ),
    },
    {
      header: 'Basic',
      accessor: (item) => <span className="text-xs font-semibold text-slate-700">{formatLKR(item.basicSalary)}</span>,
    },
    {
      header: 'Net Salary',
      accessor: (item) => (
        <span className="text-sm font-extrabold text-emerald-600">{formatLKR(item.netSalary)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (item) => {
        const StatusIcon = STATUS_ICONS[item.status] || Clock;
        const statusEmoji = STATUS_EMOJIS[item.status] || '⚪';
        return (
          <div className="flex items-center gap-2">
            <span className="text-lg">{statusEmoji}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-800'}`}>
              {item.status === 'calculated' ? 'Processed' : item.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Action',
      accessor: (item) => (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => handleViewPayroll(item)}
            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
            title="View Payroll"
          >
            <Eye className="w-3 h-3" />
            View
          </button>
          {item.status === 'draft' && (
            <button
              onClick={() => handleEditPayroll(item)}
              className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
              title="Edit / Adjust"
            >
              <Edit className="w-3 h-3" />
              Edit
            </button>
          )}
          <button
            onClick={() => handleGeneratePayslip(item)}
            className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
            title="View Payslip"
          >
            <FileText className="w-3 h-3" />
            Payslip
          </button>
          <button
            onClick={() => handleGeneratePayslip(item)}
            className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
            title="Print Payslip"
          >
            <Printer className="w-3 h-3" />
            Print
          </button>
          <button
            onClick={() => { 
              setSelectedPayroll(item); 
              handleDownloadPayslip(); 
            }}
            className="px-2 py-1 bg-teal-500 hover:bg-teal-600 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
            title="Download Payslip"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
        </div>
      ),
    },
  ];

  const selectedEmpPreview = getSelectedEmployeePreview();
  const previewBasic = getSelectedEmployee()?.profile?.basicSalary || selectedEmpPreview?.basicSalary || 0;
  const previewAllowances = Number(individualPayrollForm.allowances) || 0;
  const previewOvertimePay = selectedEmpPreview?.overtimePay || 0;
  const previewOvertimeHours = selectedEmpPreview?.overtimeHours || 0;
  const previewGrossSalary = previewBasic + previewAllowances + previewOvertimePay;
  const previewEpf = selectedEmpPreview?.epfEmployee || Math.round(previewBasic * 0.08);
  const previewEtf = selectedEmpPreview?.etfEmployer || Math.round(previewBasic * 0.03);
  const previewLoans = selectedEmpPreview?.loanDeductions || 0;
  const previewAdvances = selectedEmpPreview?.salaryAdvanceDeductions || 0;
  const previewOtherDeductions = Number(individualPayrollForm.otherDeductions) || 0;
  const previewTotalDeductions = previewEpf + previewLoans + previewAdvances + previewOtherDeductions;
  const previewNetSalary = previewGrossSalary - previewTotalDeductions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payroll Processing</h2>
          <p className="text-sm text-slate-500">
            Manage monthly salaries, deductions and payslips
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleBulkCalculate}
            disabled={isCalculating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calculator className="w-4 h-4" />
            {isCalculating ? 'Generating...' : 'Generate Monthly Payroll'}
          </button>
          <button
            onClick={handleBulkProcess}
            disabled={isProcessing || !payrollPreview}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            {isProcessing ? 'Processing...' : 'Process All Payroll'}
          </button>
          <button
            onClick={() => setShowProcessModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Process Payroll
          </button>
        </div>
      </div>

      {/* Payroll Period Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-bold text-slate-700">Payroll Month</label>
            <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="font-bold text-slate-800 focus:outline-none"
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="font-bold text-slate-800 focus:outline-none"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-semibold">Total Staff</p>
                <p className="text-xl font-extrabold text-blue-900">{totalStaff}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-semibold">Total Payroll</p>
                <p className="text-xl font-extrabold text-emerald-900">{formatLKR(totalPayroll)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-green-600 font-semibold">Processed</p>
                <p className="text-xl font-extrabold text-green-900">{processedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-amber-600 font-semibold">Pending</p>
                <p className="text-xl font-extrabold text-amber-900">{pendingCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Records */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Payroll Records</h3>
        
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === '' 
                ? 'bg-brand-500 text-white' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('processed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'processed' 
                ? 'bg-brand-500 text-white' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Processed
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'draft' 
                ? 'bg-brand-500 text-white' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('calculated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'calculated' 
                ? 'bg-brand-500 text-white' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Payslip Generated
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">Department</option>
            <option value="service">Service</option>
            <option value="sales">Sales</option>
            <option value="admin">Admin</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">Status</option>
            <option value="draft">Draft</option>
            <option value="calculated">Calculated</option>
            <option value="processed">Processed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={filteredPayrolls}
          isLoading={isLoading}
          emptyTitle="No Payroll Records"
          emptyDescription="Process payroll to generate records for all staff."
        />
      </div>

      {/* Process Payroll Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-5xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-900">Process Payroll</h3>
              <button
                onClick={() => {
                  setShowProcessModal(false);
                  setSelectedEmployee('');
                  setIndividualPayrollForm({ allowances: 0, otherDeductions: 0 });
                  setPayrollPreview(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-6 overflow-y-auto flex-1">
              {/* Main Form */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Payroll ID</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                    <span>PAY-*****</span>
                    <span className="text-slate-400">🔒</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Auto Generated</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Payroll Month</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <span className="font-bold">{MONTH_NAMES[month - 1]} {year}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Employee / Manager *</label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="">Select Employee ▼</option>
                    {staffMembers.map((staff) => (
                      <option key={staff._id} value={staff.profile?._id}>
                        {staff.displayId}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <p className="text-xs font-bold text-slate-700 mb-3">EARNINGS</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Basic Salary</label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        <span className="font-bold">{selectedEmployee ? formatLKR(previewBasic) : 'LKR 0'}</span>
                        <span className="text-slate-400">🔒</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Auto Filled from Employee Profile</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Allowances</label>
                      <input
                        type="number"
                        value={individualPayrollForm.allowances}
                        onChange={(e) => setIndividualPayrollForm({ ...individualPayrollForm, allowances: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        placeholder="LKR 0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Overtime</label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        <span className="font-bold">{selectedEmployee ? formatLKR(previewOvertimePay) : 'LKR 0'}</span>
                        <span className="text-slate-400">🔒</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {selectedEmployee && previewOvertimeHours > 0 ? `${previewOvertimeHours} hrs - Auto Calculated from Attendance` : 'Auto Calculated from Attendance / Overtime'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Gross Salary</label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        <span className="font-bold">{selectedEmployee ? formatLKR(previewGrossSalary) : 'LKR 0'}</span>
                        <span className="text-slate-400">🔒</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Auto Calculated</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <p className="text-xs font-bold text-slate-700 mb-3">DEDUCTIONS</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Other Deductions</label>
                      <input
                        type="number"
                        value={individualPayrollForm.otherDeductions}
                        onChange={(e) => setIndividualPayrollForm({ ...individualPayrollForm, otherDeductions: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        placeholder="LKR 0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Loan Deduction</label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        <span className="font-bold">{selectedEmployee ? formatLKR(previewLoans) : 'LKR 0'}</span>
                        <span className="text-slate-400">🔒</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Auto Filled from Active Loan</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Salary Advance</label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        <span className="font-bold">{selectedEmployee ? formatLKR(previewAdvances) : 'LKR 0'}</span>
                        <span className="text-slate-400">🔒</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Auto Filled from Approved Advance</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">EPF</label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        <span className="font-bold">{selectedEmployee ? formatLKR(previewEpf) : 'LKR 0'}</span>
                        <span className="text-slate-400">🔒</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Auto Calculated</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">ETF</label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        <span className="font-bold">{selectedEmployee ? formatLKR(previewEtf) : 'LKR 0'}</span>
                        <span className="text-slate-400">🔒</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Auto Calculated</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <p className="text-xs font-bold text-slate-700 mb-3">NET SALARY</p>
                  <div className="flex items-center justify-center px-6 py-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-2xl font-extrabold text-emerald-700">
                      {selectedEmployee ? formatLKR(previewNetSalary) : 'LKR 0'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 text-center">🔒 Auto Calculated</p>
                </div>

                <div className="flex gap-3 flex-shrink-0 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowProcessModal(false);
                      setSelectedEmployee('');
                      setIndividualPayrollForm({ allowances: 0, otherDeductions: 0 });
                      setPayrollPreview(null);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Save draft functionality
                      if (selectedEmployee) {
                        handleCreateIndividualPayroll('draft');
                      }
                    }}
                    disabled={!selectedEmployee || isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    Save Draft
                  </button>
                  <button
                    onClick={() => {
                      if (selectedEmployee) {
                        handleCreateIndividualPayroll('processed');
                      }
                    }}
                    disabled={!selectedEmployee || isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isSubmitting ? 'Processing...' : 'Process Payroll'}
                  </button>
                </div>
              </div>

              {/* Side Panel - Payroll Summary */}
              <div className="w-80 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-sm font-bold text-slate-900 mb-4">PAYROLL SUMMARY</p>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-2">Earnings</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Basic Salary</span>
                        <span className="font-mono">{selectedEmployee ? formatLKR(previewBasic) : 'LKR 0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Allowances</span>
                        <span className="font-mono">{formatLKR(previewAllowances)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Overtime</span>
                        <span className="font-mono">{selectedEmployee ? formatLKR(previewOvertimePay) : 'LKR 0'}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between">
                        <span className="text-slate-500 font-bold">Gross Salary</span>
                        <span className="font-bold text-slate-800">{selectedEmployee ? formatLKR(previewGrossSalary) : 'LKR 0'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-2">Deductions</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Other</span>
                        <span className="font-mono">{formatLKR(previewOtherDeductions)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Loan</span>
                        <span className="font-mono">{selectedEmployee ? formatLKR(previewLoans) : 'LKR 0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Advance</span>
                        <span className="font-mono">{selectedEmployee ? formatLKR(previewAdvances) : 'LKR 0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">EPF</span>
                        <span className="font-mono">{selectedEmployee ? formatLKR(previewEpf) : 'LKR 0'}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between">
                        <span className="text-slate-500 font-bold">Total Deductions</span>
                        <span className="font-bold text-slate-800">{selectedEmployee ? formatLKR(previewTotalDeductions) : 'LKR 0'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">══════════════════════════════</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-500 font-bold">NET SALARY</span>
                      <span className="font-bold text-emerald-600">{selectedEmployee ? formatLKR(previewNetSalary) : 'LKR 0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">══════════════════════════════</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 mt-3">
                    <p className="text-xs font-bold text-slate-700 mb-2">Employer Contributions</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">ETF</span>
                        <span className="font-mono text-blue-600">{selectedEmployee ? formatLKR(previewEtf) : 'LKR 0'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Payroll Modal */}
      {showPayrollModal && selectedPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-900">Payroll Details — {selectedPayroll.payrollId}</h3>
              <button
                onClick={() => {
                  setShowPayrollModal(false);
                  setIsEditingPayroll(false);
                  setSelectedPayroll(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-6 overflow-y-auto flex-1">
              {/* Main Form */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Payroll ID</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                    <span>{selectedPayroll.payrollId}</span>
                    <span className="text-slate-400">🔒</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Employee / Manager</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <span className="font-bold">
                      {selectedPayroll.employee?.employeeId || selectedPayroll.employee?.managerId || 'N/A'}
                      {selectedPayroll.employee?.user ? ` - ${selectedPayroll.employee.user.firstName} ${selectedPayroll.employee.user.lastName}` : ''}
                    </span>
                    <span className="text-slate-400">🔒</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Auto Filled</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Basic Salary</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <span className="font-bold">{formatLKR(selectedPayroll.basicSalary)}</span>
                    <span className="text-slate-400">🔒</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Auto Filled</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Allowances</label>
                  {isEditingPayroll && selectedPayroll.status === 'draft' ? (
                    <input
                      type="number"
                      value={payrollForm.allowances}
                      onChange={(e) => setPayrollForm({ ...payrollForm, allowances: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      {formatLKR(selectedPayroll.allowances)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Overtime</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <span className="font-bold">{formatLKR(selectedPayroll.overtimePay)}</span>
                    <span className="text-slate-400">🔒</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Auto Calculated</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Deductions</label>
                  {isEditingPayroll && selectedPayroll.status === 'draft' ? (
                    <input
                      type="number"
                      value={payrollForm.otherDeductions}
                      onChange={(e) => setPayrollForm({ ...payrollForm, otherDeductions: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      {formatLKR(selectedPayroll.otherDeductions)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Loans</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <span className="font-bold">{formatLKR(selectedPayroll.loanDeductions)}</span>
                    <span className="text-slate-400">🔒</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Auto Filled</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Advances</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <span className="font-bold">{formatLKR(selectedPayroll.salaryAdvanceDeductions)}</span>
                    <span className="text-slate-400">🔒</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Auto Filled</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">EPF</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <span className="font-bold">{formatLKR(selectedPayroll.epfEmployee)}</span>
                    <span className="text-slate-400">🔒</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ETF</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <span className="font-bold">{formatLKR(selectedPayroll.etfEmployer)}</span>
                    <span className="text-slate-400">🔒</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Net Salary</label>
                  <div className="flex items-center justify-center px-6 py-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-2xl font-extrabold text-emerald-700">
                      {isEditingPayroll ? formatLKR(
                        (selectedPayroll.basicSalary || 0) +
                        (Number(payrollForm.allowances) || 0) +
                        (selectedPayroll.overtimePay || 0) -
                        (selectedPayroll.epfEmployee || 0) -
                        (selectedPayroll.loanDeductions || 0) -
                        (selectedPayroll.salaryAdvanceDeductions || 0) -
                        (Number(payrollForm.otherDeductions) || 0)
                      ) : formatLKR(selectedPayroll.netSalary)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 text-center">🔒 Auto Calculated</p>
                </div>

                <div className="flex gap-3 flex-shrink-0 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowPayrollModal(false);
                      setIsEditingPayroll(false);
                      setSelectedPayroll(null);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  {isEditingPayroll && selectedPayroll.status === 'draft' && (
                    <button
                      onClick={handleSaveDraft}
                      disabled={isSubmitting}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isSubmitting ? 'Saving...' : 'Save Draft'}
                    </button>
                  )}
                  {!isEditingPayroll && selectedPayroll.status === 'draft' && (
                    <button
                      onClick={() => {
                        setPayrollForm({
                          employeeId: selectedPayroll.employee?._id,
                          month: selectedPayroll.month,
                          year: selectedPayroll.year,
                          allowances: selectedPayroll.allowances || 0,
                          otherDeductions: selectedPayroll.otherDeductions || 0,
                          loanDeductions: selectedPayroll.loanDeductions || 0,
                          salaryAdvanceDeductions: selectedPayroll.salaryAdvanceDeductions || 0,
                        });
                        setIsEditingPayroll(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-md shadow-orange-500/20 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Draft
                    </button>
                  )}
                  <button
                    onClick={() => handleGeneratePayslip(selectedPayroll)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    Generate Payslip
                  </button>
                </div>
              </div>

              {/* Side Panel - Salary Summary */}
              <div className="w-72 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-sm font-bold text-slate-900 mb-4">Payroll Calculation</p>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-2">Earnings</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Basic Salary</span>
                        <span className="font-mono">{formatLKR(selectedPayroll.basicSalary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Allowances</span>
                        <span className="font-mono">{formatLKR(isEditingPayroll ? (Number(payrollForm.allowances) || 0) : selectedPayroll.allowances)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Overtime</span>
                        <span className="font-mono">{formatLKR(selectedPayroll.overtimePay)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between">
                        <span className="text-slate-500 font-bold">Gross Salary</span>
                        <span className="font-bold text-slate-800">{formatLKR(
                          (selectedPayroll.basicSalary || 0) + 
                          (isEditingPayroll ? (Number(payrollForm.allowances) || 0) : (selectedPayroll.allowances || 0)) + 
                          (selectedPayroll.overtimePay || 0)
                        )}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-2">Deductions</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Deductions</span>
                        <span className="font-mono">{formatLKR(isEditingPayroll ? (Number(payrollForm.otherDeductions) || 0) : selectedPayroll.otherDeductions)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Loan</span>
                        <span className="font-mono text-rose-600">-{formatLKR(selectedPayroll.loanDeductions)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Advance</span>
                        <span className="font-mono text-rose-600">-{formatLKR(selectedPayroll.salaryAdvanceDeductions)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">EPF</span>
                        <span className="font-mono text-rose-600">-{formatLKR(selectedPayroll.epfEmployee)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between">
                        <span className="text-slate-500 font-bold">Net Salary</span>
                        <span className="font-bold text-emerald-600">{formatLKR(
                          (selectedPayroll.basicSalary || 0) +
                          (isEditingPayroll ? (Number(payrollForm.allowances) || 0) : (selectedPayroll.allowances || 0)) +
                          (selectedPayroll.overtimePay || 0) -
                          (selectedPayroll.epfEmployee || 0) -
                          (selectedPayroll.loanDeductions || 0) -
                          (selectedPayroll.salaryAdvanceDeductions || 0) -
                          (isEditingPayroll ? (Number(payrollForm.otherDeductions) || 0) : (selectedPayroll.otherDeductions || 0))
                        )}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 mt-3">
                    <p className="text-xs font-bold text-slate-700 mb-2">Employer Contributions</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">ETF</span>
                        <span className="font-mono text-blue-600">{formatLKR(selectedPayroll.etfEmployer)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {showPayslipModal && selectedPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div className="text-center flex-1">
                <h3 className="text-xl font-extrabold text-blue-600">VSMS.LK</h3>
                <p className="text-xs text-slate-500">VEHICLE SERVICE CENTER</p>
                <p className="text-xs text-slate-400 mt-1">PAYSLIP</p>
              </div>
              <button
                onClick={() => setShowPayslipModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Payroll ID</p>
                    <p className="font-bold text-slate-900">{selectedPayroll.payrollId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Employee ID</p>
                    <p className="font-bold text-slate-900">{selectedPayroll.employee?.employeeId || selectedPayroll.employee?.managerId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Employee Name</p>
                    <p className="font-bold text-slate-900">{selectedPayroll.employee?.user?.firstName} {selectedPayroll.employee?.user?.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Position</p>
                    <p className="font-bold text-slate-900 capitalize">{selectedPayroll.employee?.user?.role || 'Employee'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Payroll Month</p>
                    <p className="font-bold text-slate-900">{MONTH_NAMES[selectedPayroll.month - 1]} {selectedPayroll.year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Generated Date</p>
                    <p className="font-bold text-slate-900">{new Date().toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold text-slate-700">EARNINGS</p>
                  <div className="flex-1 border-b border-slate-200"></div>
                </div>
                <div className="bg-slate-50 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2 text-slate-600">Basic Salary</td>
                        <td className="px-4 py-2 text-right font-semibold text-slate-900">{formatLKR(selectedPayroll.basicSalary)}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2 text-slate-600">Allowances</td>
                        <td className="px-4 py-2 text-right font-semibold text-slate-900">{formatLKR(selectedPayroll.allowances)}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2 text-slate-600">Overtime</td>
                        <td className="px-4 py-2 text-right font-semibold text-slate-900">{formatLKR(selectedPayroll.overtimePay)}</td>
                      </tr>
                      <tr className="bg-slate-100">
                        <td className="px-4 py-2 text-slate-700 font-bold">Gross Salary</td>
                        <td className="px-4 py-2 text-right font-bold text-slate-900">{formatLKR(selectedPayroll.grossSalary)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold text-slate-700">DEDUCTIONS</p>
                  <div className="flex-1 border-b border-slate-200"></div>
                </div>
                <div className="bg-slate-50 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2 text-slate-600">Other Deductions</td>
                        <td className="px-4 py-2 text-right font-semibold text-slate-900">{formatLKR(selectedPayroll.otherDeductions)}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2 text-slate-600">Loan Deduction</td>
                        <td className="px-4 py-2 text-right font-semibold text-rose-600">-{formatLKR(selectedPayroll.loanDeductions)}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2 text-slate-600">Advance Deduction</td>
                        <td className="px-4 py-2 text-right font-semibold text-rose-600">-{formatLKR(selectedPayroll.salaryAdvanceDeductions)}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2 text-slate-600">EPF Employee</td>
                        <td className="px-4 py-2 text-right font-semibold text-rose-600">-{formatLKR(selectedPayroll.epfEmployee)}</td>
                      </tr>
                      <tr className="bg-slate-100">
                        <td className="px-4 py-2 text-slate-700 font-bold">Total Deductions</td>
                        <td className="px-4 py-2 text-right font-bold text-slate-900">{formatLKR(selectedPayroll.totalDeductions)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-emerald-800">NET SALARY</span>
                  <span className="text-2xl font-extrabold text-emerald-700">{formatLKR(selectedPayroll.netSalary)}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold text-slate-700">EMPLOYER CONTRIBUTIONS</p>
                  <div className="flex-1 border-b border-slate-200"></div>
                </div>
                <div className="bg-blue-50 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 text-slate-600">ETF</td>
                        <td className="px-4 py-2 text-right font-semibold text-blue-600">{formatLKR(selectedPayroll.etfEmployer)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 flex-shrink-0">
                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadPayslip}
                    disabled={isGeneratingPayslip}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {isGeneratingPayslip ? 'Generating...' : 'Download PDF'}
                  </button>
                  <button
                    onClick={handlePrintPayslip}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
