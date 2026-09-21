import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FileText, Edit, X, Check, Printer, RefreshCw, Send, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatLKR, formatDate } from '../../utils/formatters';
import { quotationApi } from '../../api/quotationApi';
import toast from 'react-hot-toast';

interface Quotation {
  id: string;
  _id?: string;
  quotationNumber: string;
  customer: any;
  vehicle: any;
  jobCard: any;
  grandTotal: number;
  taxAmount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'converted' | 'awaiting_customer';
  createdAt: string;
  validUntil?: string;
  items: any[];
  laborCharge: number;
  estimatedHours: number;
  discount: number;
  notes: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export const QuotationDetailsPage: React.FC = () => {
  const { quotationId } = useParams<{ quotationId: string }>();
  const navigate = useNavigate();
  
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [confirmApproval, setConfirmApproval] = useState(false);

  const fetchQuotation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await quotationApi.getQuotationById(quotationId || '');
      
      if (res.success) {
        setQuotation(res.data);
      } else {
        setError(res.message || 'Failed to load quotation');
      }
    } catch (err: any) {
      console.error('Error loading quotation:', err);
      setError(err.response?.data?.message || 'Error loading quotation');
      setQuotation(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [quotationId]);

  const getCustomerName = () => {
    const customer = quotation?.customer;
    if (customer && typeof customer === 'object' && customer.user) {
      return `${customer.user.firstName} ${customer.user.lastName}`;
    }
    return 'Unknown';
  };

  const getCustomerMobile = () => {
    const customer = quotation?.customer;
    return customer?.user?.mobile || customer?.phone || 'N/A';
  };

  const getCustomerEmail = () => {
    const customer = quotation?.customer;
    return customer?.user?.email || customer?.email || 'N/A';
  };

  const getVehicleInfo = () => {
    const vehicle = quotation?.vehicle;
    if (vehicle && typeof vehicle === 'object') {
      return `${vehicle.make} ${vehicle.model} • ${vehicle.registrationNumber}`;
    }
    return 'Unknown';
  };

  const calculatePartsTotal = () => {
    if (!quotation?.items) return 0;
    return quotation.items.reduce((sum, part) => sum + part.total, 0);
  };

  const calculateLaborCost = () => {
    if (!quotation) return 0;
    return quotation.laborCharge * quotation.estimatedHours;
  };

  const calculateGrandTotal = () => {
    return quotation?.grandTotal || 0;
  };

  const handleSendToCustomer = async () => {
    if (!quotation) return;
    setIsSubmitting(true);
    try {
      const mongoId = quotation._id || quotation.id;
      const res = await quotationApi.submitQuotation(mongoId);
      if (res.success) {
        toast.success(res.message || `Quotation submitted to ${getCustomerName()}!`);
        setShowSubmitModal(false);
        fetchQuotation();
      } else {
        toast.error(res.message || 'Failed to submit quotation to customer');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error submitting quotation to customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!confirmApproval) {
      toast.error('Please confirm customer approval');
      return;
    }
    
    if (!quotation) return;
    
    try {
      const mongoId = quotation._id || quotation.id;
      const res = await quotationApi.approveQuotation(mongoId, {
        approvedBy: `${getCustomerName()} (Approved via Manager)`,
        remarks: 'Customer approval recorded by manager',
      });
      
      if (res.success) {
        toast.success(`Quotation approved for ${getCustomerName()}!`);
        setShowApproveModal(false);
        fetchQuotation();
      } else {
        setError(res.message || 'Failed to approve quotation');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error approving quotation');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error('Please enter a rejection reason');
      return;
    }
    
    if (!quotation) return;
    
    try {
      const mongoId = quotation._id || quotation.id;
      const res = await quotationApi.rejectQuotation(mongoId, {
        rejectionReason,
      });
      
      if (res.success) {
        toast.success('Quotation rejected');
        setShowRejectModal(false);
        fetchQuotation();
      } else {
        setError(res.message || 'Failed to reject quotation');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error rejecting quotation');
    }
  };

  const handleConvertToInvoice = async () => {
    if (!quotation) return;
    
    try {
      const mongoId = quotation._id || quotation.id;
      const res = await quotationApi.convertToInvoice(mongoId, {});
      
      if (res.success) {
        toast.success('Quotation converted to invoice');
        setShowConvertModal(false);
        navigate('/manager/invoices');
      } else {
        setError(res.message || 'Failed to convert to invoice');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error converting to invoice');
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchQuotation} />;
  if (!quotation) return <ErrorState message="Quotation not found" />;

  const quotedAmount = calculateGrandTotal();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/manager/quotations" className="p-2 hover:bg-slate-100 rounded-lg">
            <FileText className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{quotation.quotationNumber}</h1>
            <p className="text-sm text-slate-500">{getVehicleInfo()} • {getCustomerName()}</p>
          </div>
        </div>
        <StatusBadge status={quotation.status} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
        {/* Customer Submission Status Alert */}
        {quotation.status === 'submitted' && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-950">
                  Submitted to Customer: <span className="text-brand-700 font-extrabold">{getCustomerName()}</span>
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Phone: <span className="font-semibold">{getCustomerMobile()}</span> • Email: <span className="font-semibold">{getCustomerEmail()}</span> — Awaiting customer review & approval in Customer Portal.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" /> Resend to Customer
            </button>
          </div>
        )}

        {/* Quotation Header */}
        <div className="border-b border-slate-200 pb-6 mb-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-slate-900">VSMS.LK</h2>
            <p className="text-sm text-slate-500">VEHICLE SERVICE MANAGEMENT SYSTEM</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Quotation No:</p>
              <p className="font-medium text-slate-900">{quotation.quotationNumber}</p>
            </div>
            <div>
              <p className="text-slate-500">Date:</p>
              <p className="font-medium text-slate-900">{formatDate(quotation.createdAt)}</p>
            </div>
            <div>
              <p className="text-slate-500">Job Card:</p>
              <p className="font-medium text-slate-900">{quotation.jobCard?.jobCardNumber}</p>
            </div>
            {quotation.validUntil && (
              <div>
                <p className="text-slate-500">Valid Until:</p>
                <p className="font-medium text-slate-900">{formatDate(quotation.validUntil)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer & Vehicle */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">CUSTOMER</h3>
          <p className="text-slate-900">{getCustomerName()}</p>
          <p className="text-slate-600">{quotation.customer?.user?.mobile}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">VEHICLE</h3>
          <p className="text-slate-900">{getVehicleInfo()}</p>
        </div>

        {/* Items */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">ITEMS</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Description</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Qty</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Unit Price</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Discount</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items?.map((part, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-2 px-3 text-sm text-slate-900">{part.name}</td>
                    <td className="py-2 px-3 text-sm text-slate-600">{part.quantity}</td>
                    <td className="py-2 px-3 text-sm text-slate-600">{part.unitPrice.toLocaleString()}</td>
                    <td className="py-2 px-3 text-sm text-slate-600">{formatLKR(part.discount || 0)}</td>
                    <td className="py-2 px-3 text-sm text-slate-900 font-medium">{part.total.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3 text-sm text-slate-900">Labor</td>
                  <td className="py-2 px-3 text-sm text-slate-600">{quotation.estimatedHours} hrs</td>
                  <td className="py-2 px-3 text-sm text-slate-600">{quotation.laborCharge.toLocaleString()}/hr</td>
                  <td className="py-2 px-3 text-sm text-slate-600">—</td>
                  <td className="py-2 px-3 text-sm text-slate-900 font-medium">{calculateLaborCost().toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="text-slate-900">{(calculatePartsTotal() + calculateLaborCost()).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Discount</span>
              <span className="text-slate-900">-{(quotation.discount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between"><span>Tax</span><span>{formatLKR(quotation.taxAmount || 0)}</span></div>
            <div className="border-t border-slate-300 pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span className="text-slate-900">GRAND TOTAL</span>
                <span className="text-slate-900">{calculateGrandTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">REMARKS</h3>
          <p className="text-sm text-slate-600">{quotation.notes}</p>
        </div>

        {/* Approval Info */}
        {quotation.status === 'approved' && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-800">
              Approved by: {quotation.approvedBy || 'Manager'}
            </p>
            <p className="text-sm text-emerald-800">
              Approved at: {quotation.approvedAt ? formatDate(quotation.approvedAt) : 'N/A'}
            </p>
          </div>
        )}

        {/* Rejection Info */}
        {quotation.status === 'rejected' && quotation.rejectionReason && (
          <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4">
            <p className="text-sm text-rose-800">
              <span className="font-bold">Rejection Reason:</span> {quotation.rejectionReason}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-200">
          {quotation.status === 'draft' && (
            <>
              <Link
                to={`/manager/quotations/${quotation._id || quotation.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold shadow-xs text-sm transition-colors"
              >
                <Send className="w-4 h-4" />
                Submit to Customer ({getCustomerName()})
              </button>
            </>
          )}
          {quotation.status === 'submitted' && (
            <>
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50 rounded-xl font-medium text-sm transition-colors"
              >
                <Send className="w-4 h-4" />
                Resend to Customer
              </button>
              <button
                type="button"
                onClick={() => setShowApproveModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs text-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                Record Customer Approval
              </button>
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                Record Customer Rejection
              </button>
            </>
          )}
          
          {quotation.status === 'approved' && (
            <>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm">
                <Printer className="w-4 h-4" />
                Print PDF
              </button>
              <button
                onClick={() => setShowConvertModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-semibold shadow-xs text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Convert to Invoice
              </button>
            </>
          )}
        </div>
      </div>

      {/* Submit to Customer Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {quotation.status === 'submitted' ? 'Resend Quotation to Customer' : 'Submit Quotation to Customer'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{quotation.quotationNumber}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs mb-4 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Customer:</span>
                <span className="font-bold text-slate-900">{getCustomerName()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Number:</span>
                <span className="font-medium text-slate-800">{getCustomerMobile()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email Address:</span>
                <span className="font-medium text-slate-800">{getCustomerEmail()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-medium text-slate-800">{getVehicleInfo()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold">
                <span className="text-slate-700">Quotation Total:</span>
                <span className="text-brand-600 font-extrabold">{formatLKR(quotedAmount)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              This quotation will be dispatched to <span className="font-bold text-slate-900">{getCustomerName()}</span>. The customer will receive an immediate in-app notification with a link to review, itemize, and approve or decline this estimate directly in their Customer Portal.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSendToCustomer}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Confirm & Submit to Customer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Customer Approval Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Record Customer Approval</h3>
                <p className="text-xs text-slate-500 font-mono">{quotation.quotationNumber}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-xs mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p><span className="text-slate-500">Customer:</span> <span className="ml-2 font-bold text-slate-900">{getCustomerName()}</span></p>
              <p><span className="text-slate-500">Vehicle:</span> <span className="ml-2 font-medium text-slate-800">{getVehicleInfo()}</span></p>
              <p><span className="text-slate-500">Quotation Total:</span> <span className="ml-2 font-bold text-brand-600">{formatLKR(quotedAmount)}</span></p>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Use this to record that <span className="font-bold text-slate-900">{getCustomerName()}</span> has approved this quotation verbally (e.g. phone call, in-person at counter) or signed a physical copy.
            </p>

            <div className="mb-6">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmApproval}
                  onChange={(e) => setConfirmApproval(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600"
                />
                <span>I confirm that the customer has approved this estimate.</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowApproveModal(false)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50">Cancel</button>
              <button onClick={handleApprove} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                <Check className="w-3.5 h-3.5" />
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Reject Quotation</h3>
            <p className="text-sm text-slate-600 mb-4">
              Quotation: {quotation.quotationNumber}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                placeholder="Please enter reason..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl">Cancel</button>
              <button onClick={handleReject} className="px-4 py-2 bg-rose-600 text-white rounded-xl">Reject Quotation</button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Invoice Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Convert Quotation to Invoice</h3>
            <p className="mb-4 text-slate-600">Create an invoice using the approved items, labor, discount and tax from {quotation.quotationNumber}.</p>
            <p className="mb-6 text-xl font-bold">Invoice total: {formatLKR(quotedAmount)}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConvertModal(false)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl">Cancel</button>
              <button onClick={handleConvertToInvoice} className="px-4 py-2 bg-brand-600 text-white rounded-xl">
                Convert to Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
