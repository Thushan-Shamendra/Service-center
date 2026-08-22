import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FileText, Edit, X, Check, Printer, Mail, RefreshCw, AlertTriangle, Lock } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatLKR, formatDate } from '../../utils/formatters';
import { quotationApi } from '../../api/quotationApi';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

interface Quotation {
  id: string;
  _id?: string;
  quotationNumber: string;
  customer: any;
  vehicle: any;
  jobCard: any;
  amount: number;
  status: 'draft' | 'review' | 'approved' | 'rejected' | 'converted' | 'awaiting_customer';
  createdAt: string;
  validUntil?: string;
  parts: any[];
  laborCharge: number;
  estimatedHours: number;
  discount: number;
  remarks: string;
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
  
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [varianceReason, setVarianceReason] = useState('');
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
    if (typeof customer === 'object' && customer.user) {
      return `${customer.user.firstName} ${customer.user.lastName}`;
    }
    return 'Unknown';
  };

  const getVehicleInfo = () => {
    const vehicle = quotation?.vehicle;
    if (typeof vehicle === 'object') {
      return `${vehicle.make} ${vehicle.model} • ${vehicle.registrationNumber}`;
    }
    return 'Unknown';
  };

  const calculatePartsTotal = () => {
    if (!quotation?.parts) return 0;
    return quotation.parts.reduce((sum, part) => sum + part.subtotal, 0);
  };

  const calculateLaborCost = () => {
    if (!quotation) return 0;
    return quotation.laborCharge * quotation.estimatedHours;
  };

  const calculateGrandTotal = () => {
    return calculatePartsTotal() + calculateLaborCost() - (quotation?.discount || 0);
  };

  const handleApprove = async () => {
    if (!confirmApproval) {
      toast.error('Please confirm that you have reviewed the quotation');
      return;
    }
    
    if (!quotation) return;
    
    try {
      const mongoId = quotation._id || quotation.id;
      const res = await quotationApi.approveQuotation(mongoId, {
        approvedBy: 'Manager',
        remarks: 'Approved by Manager',
      });
      
      if (res.success) {
        toast.success('Quotation approved successfully');
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
    // Calculate variance
    const quotedAmount = calculateGrandTotal();
    const actualParts = 40500;
    const actualLabor = 16000;
    const actualAmount = actualParts + actualLabor;
    const variance = actualAmount - quotedAmount;
    const variancePercent = ((variance / quotedAmount) * 100).toFixed(2);
    
    if (variance > 0 && !varianceReason) {
      toast.error('Please enter a reason for the variance');
      return;
    }
    
    if (!quotation) return;
    
    try {
      const mongoId = quotation._id || quotation.id;
      const res = await quotationApi.convertToInvoice(mongoId, {
        varianceReason: variance > 0 ? varianceReason : undefined,
        confirmApproval: variance > 0 ? confirmApproval : undefined,
      });
      
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
  const actualParts = 40500;
  const actualLabor = 16000;
  const actualAmount = actualParts + actualLabor;
  const variance = actualAmount - quotedAmount;
  const variancePercent = Math.abs((variance / quotedAmount) * 100).toFixed(2);
  const hasVariance = variance > 0;

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
          <p className="text-slate-600">{quotation.customer?.mobile}</p>
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
                {quotation.parts?.map((part, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-2 px-3 text-sm text-slate-900">{part.partName}</td>
                    <td className="py-2 px-3 text-sm text-slate-600">{part.quantity}</td>
                    <td className="py-2 px-3 text-sm text-slate-600">{part.unitPrice.toLocaleString()}</td>
                    <td className="py-2 px-3 text-sm text-slate-600">0</td>
                    <td className="py-2 px-3 text-sm text-slate-900 font-medium">{part.subtotal.toLocaleString()}</td>
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
              <span className="text-slate-900">-{quotation.discount.toLocaleString()}</span>
            </div>
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
          <p className="text-sm text-slate-600">{quotation.remarks}</p>
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
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={() => setShowApproveModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
              >
                <Check className="w-4 h-4" />
                Approve Quotation
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
            </>
          )}
          
          {quotation.status === 'approved' && (
            <>
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50">
                <Printer className="w-4 h-4" />
                Print PDF
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50">
                <Mail className="w-4 h-4" />
                Email Customer
              </button>
              <button
                onClick={() => setShowConvertModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700"
              >
                <RefreshCw className="w-4 h-4" />
                Convert to Invoice
              </button>
            </>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Approve Quotation</h3>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="text-slate-500">Quotation:</span> <span className="ml-2 font-medium">{quotation.quotationNumber}</span></p>
              <p><span className="text-slate-500">Customer:</span> <span className="ml-2 font-medium">{getCustomerName()}</span></p>
              <p><span className="text-slate-500">Vehicle:</span> <span className="ml-2 font-medium">{getVehicleInfo()}</span></p>
              <p><span className="text-slate-500">Quotation Total:</span> <span className="ml-2 font-medium">{formatLKR(quotedAmount)}</span></p>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Once approved, this quotation becomes the approved estimate for the current Job Card.
            </p>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={confirmApproval}
                  onChange={(e) => setConfirmApproval(e.target.checked)}
                  className="rounded"
                />
                <span>I confirm that I have reviewed the quotation.</span>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowApproveModal(false)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl">Cancel</button>
              <button onClick={handleApprove} className="px-4 py-2 bg-brand-600 text-white rounded-xl">
                <Check className="w-4 h-4 inline mr-2" />
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
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {hasVariance ? '⚠ Quotation Variance Detected' : 'Convert Quotation to Invoice'}
            </h3>
            
            <div className="space-y-4 mb-4">
              <div>
                <p className="text-sm text-slate-500">QUOTATION</p>
                <p className="font-medium text-slate-900">{quotation.quotationNumber}</p>
                <p className="text-sm text-slate-600">Original Quotation</p>
                <p className="font-bold text-slate-900">{formatLKR(quotedAmount)}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500">ACTUAL COST</p>
                <p className="text-sm text-slate-600">Actual Parts Used</p>
                <p className="font-medium text-slate-900">{formatLKR(actualParts)}</p>
                <p className="text-sm text-slate-600">Actual Labor</p>
                <p className="font-medium text-slate-900">{formatLKR(actualLabor)}</p>
                <div className="border-t border-slate-200 mt-2 pt-2">
                  <p className="text-sm text-slate-600">Final Actual Amount</p>
                  <p className="font-bold text-slate-900">{formatLKR(actualAmount)}</p>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${hasVariance ? 'bg-rose-50 border border-rose-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                <p className="text-sm text-slate-500">VARIANCE</p>
                <p className="font-medium text-slate-900">Original Quotation: {formatLKR(quotedAmount)}</p>
                <p className="font-medium text-slate-900">Final Amount: {formatLKR(actualAmount)}</p>
                <p className={`font-bold ${hasVariance ? 'text-rose-600' : 'text-emerald-600'}`}>
                  Difference: {variance > 0 ? '+' : ''}{formatLKR(variance)}
                </p>
                <p className={`font-bold ${hasVariance ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {variance > 0 ? '+' : ''}{variancePercent}%
                </p>
                {hasVariance ? (
                  <p className="text-sm text-rose-800 mt-2">
                    🔴 Final amount exceeds the approved quotation. Manager confirmation is required.
                  </p>
                ) : (
                  <p className="text-sm text-emerald-800 mt-2">
                    🟢 Final amount is within the approved quotation.
                  </p>
                )}
              </div>
              
              {hasVariance && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Variance *</label>
                  <textarea
                    value={varianceReason}
                    onChange={(e) => setVarianceReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                    placeholder="Additional engine component required after inspection..."
                  />
                </div>
              )}
              
              {hasVariance && (
                <div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={confirmApproval}
                      onChange={(e) => setConfirmApproval(e.target.checked)}
                      className="rounded"
                    />
                    <span>I confirm and approve the additional cost.</span>
                  </label>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConvertModal(false)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl">Cancel</button>
              <button onClick={handleConvertToInvoice} className="px-4 py-2 bg-brand-600 text-white rounded-xl">
                {hasVariance ? 'Confirm & Convert to Invoice' : 'Convert to Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};