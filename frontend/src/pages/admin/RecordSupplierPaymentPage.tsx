import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supplierPaymentApi } from '../../api/supplierPaymentApi';
import { supplierApi } from '../../api/supplierApi';
import { purchaseOrderApi } from '../../api/purchaseOrderApi';
import { formatLKR } from '../../utils/formatters';
import { X, Lock, DollarSign, FileText, Calendar, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const RecordSupplierPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [paymentId, setPaymentId] = useState('');
  const [supplier, setSupplier] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  
  // Payment method specific fields
  const [bankAccount, setBankAccount] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeBankName, setChequeBankName] = useState('');
  
  // Data
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedSupplierData, setSelectedSupplierData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
    setPaymentId('PAY-*****');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  }, []);

  const fetchData = async () => {
    try {
      const suppliersRes = await supplierApi.getAllSuppliers();
      if (suppliersRes.success) {
        setSuppliers(suppliersRes.data);
      }
    } catch (error) {
      toast.error('Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupplierChange = async (supplierId: string) => {
    setSupplier(supplierId);
    const supplierData = suppliers.find(s => s._id === supplierId);
    setSelectedSupplierData(supplierData);
    
    if (supplierData) {
      // Load purchase orders for this supplier
      try {
        const poRes = await purchaseOrderApi.getPurchaseOrders({ 
          supplier: supplierId,
          status: 'completed'
        });
        if (poRes.success) {
          // Filter POs with outstanding balance
          const outstandingPOs = poRes.data.filter((po: any) => 
            po.totalAmount > (po.paymentStatus === 'paid' ? po.totalAmount : 0)
          );
          setInvoices(outstandingPOs);
          
          // Calculate total outstanding balance
          const totalOutstanding = outstandingPOs.reduce((sum: number, po: any) => {
            const paidAmount = po.paymentStatus === 'paid' ? po.totalAmount : 0;
            return sum + (po.totalAmount - paidAmount);
          }, 0);
          setOutstandingBalance(totalOutstanding);
        }
      } catch (error) {
        console.error('Error loading invoices:', error);
      }
    }
    
    // Reset dependent fields
    setInvoiceNumber('');
    setPaymentAmount('');
    setReferenceNumber('');
    setBankAccount('');
    setTransactionReference('');
    setChequeNumber('');
    setChequeBankName('');
  };

  const handleInvoiceChange = (invoiceId: string) => {
    setInvoiceNumber(invoiceId);
    const invoiceData = invoices.find(inv => inv._id === invoiceId);
    
    if (invoiceData) {
      // Set outstanding balance for this specific invoice
      const paidAmount = invoiceData.paymentStatus === 'paid' ? invoiceData.totalAmount : 0;
      setOutstandingBalance(invoiceData.totalAmount - paidAmount);
    }
  };

  const calculateRemainingBalance = () => {
    const payment = parseFloat(paymentAmount) || 0;
    return Math.max(0, outstandingBalance - payment);
  };

  const handleReset = () => {
    setSupplier('');
    setOutstandingBalance(0);
    setInvoiceNumber('');
    setPaymentAmount('');
    setPaymentMethod('cash');
    setReferenceNumber('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setBankAccount('');
    setTransactionReference('');
    setChequeNumber('');
    setChequeBankName('');
    setSelectedSupplierData(null);
    setInvoices([]);
    fetchData();
  };

  const handleCancel = () => {
    navigate('/admin/suppliers');
  };

  const handleSavePayment = async () => {
    if (!supplier) {
      toast.error('Please select a supplier');
      return;
    }
    
    if (!invoiceNumber) {
      toast.error('Please select an invoice');
      return;
    }
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (parseFloat(paymentAmount) > outstandingBalance) {
      toast.error('Payment amount cannot exceed outstanding balance');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (paymentMethod === 'bank' && (!bankAccount || !transactionReference)) {
      toast.error('Please provide bank account and transaction reference');
      return;
    }

    if (paymentMethod === 'cheque' && (!chequeNumber || !chequeBankName)) {
      toast.error('Please provide cheque number and bank name');
      return;
    }

    setIsSaving(true);
    try {
      const paymentData: any = {
        supplier,
        purchaseOrder: invoiceNumber,
        amount: parseFloat(paymentAmount),
        paymentMethod,
        paymentDate: new Date(paymentDate),
        referenceNumber,
      };

      // Add payment method specific details
      if (paymentMethod === 'bank') {
        paymentData.bankDetails = {
          bankName: bankAccount,
          transferReference: transactionReference,
        };
      }

      if (paymentMethod === 'cheque') {
        paymentData.chequeDetails = {
          chequeNumber,
          bankName: chequeBankName,
          chequeDate: new Date(paymentDate),
        };
      }

      const res = await supplierPaymentApi.createSupplierPayment(paymentData);

      if (res.success) {
        toast.success('Supplier payment recorded successfully');
        navigate('/admin/suppliers');
      } else {
        toast.error(res.message || 'Failed to record payment');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to record payment';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const remainingBalance = calculateRemainingBalance();
  const isFullyPaid = remainingBalance === 0 && parseFloat(paymentAmount) > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">Supplier Payment</h1>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Payment ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment ID</label>
            <div className="relative">
              <input
                type="text"
                value={paymentId}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600 pr-10"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
            <select
              value={supplier}
              onChange={(e) => handleSupplierChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Supplier</option>
              {suppliers.map((sup) => (
                <option key={sup._id} value={sup._id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>

          {/* Outstanding Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outstanding Balance</label>
            <div className="relative">
              <input
                type="text"
                value={formatLKR(outstandingBalance)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600 pr-10 font-semibold"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto Filled</p>
          </div>

          {/* Invoice Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
            <select
              value={invoiceNumber}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              disabled={!supplier}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{!supplier ? 'Select Supplier First' : 'Select Invoice'}</option>
              {invoices.map((inv) => (
                <option key={inv._id} value={inv._id}>
                  {inv.poNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter amount"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">💵 Cash</span>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={paymentMethod === 'bank'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">🏦 Bank</span>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cheque"
                  checked={paymentMethod === 'cheque'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">🧾 Cheque</span>
              </label>
            </div>
          </div>

          {/* Bank Details */}
          {paymentMethod === 'bank' && (
            <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter bank account"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter transaction reference"
                />
              </div>
            </div>
          )}

          {/* Cheque Details */}
          {paymentMethod === 'cheque' && (
            <div className="space-y-3 bg-green-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Number</label>
                <input
                  type="text"
                  value={chequeNumber}
                  onChange={(e) => setChequeNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter cheque number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={chequeBankName}
                  onChange={(e) => setChequeBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter bank name"
                />
              </div>
            </div>
          )}

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter reference number"
            />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
            <div className="relative">
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Remaining Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Balance</label>
            <div className="relative">
              <input
                type="text"
                value={formatLKR(remainingBalance)}
                readOnly
                className={`w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600 pr-10 font-semibold ${isFullyPaid ? 'text-green-600' : ''}`}
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto Calculated</p>
            {isFullyPaid && (
              <div className="flex items-center gap-2 mt-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Status → PAID</span>
              </div>
            )}
          </div>

          {/* Calculation Example */}
          {parseFloat(paymentAmount) > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600">
              <p className="font-medium mb-2">Supplier Payment Calculation</p>
              <div className="space-y-1">
                <p>Outstanding Balance</p>
                <p className="ml-4">{formatLKR(outstandingBalance)}</p>
                <p>Payment Amount</p>
                <p className="ml-4">- {formatLKR(parseFloat(paymentAmount))}</p>
                <p className="border-t border-gray-300 pt-1 mt-2 font-medium">Remaining Balance</p>
                <p className="ml-4 font-bold">{formatLKR(remainingBalance)}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={handleSavePayment}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};