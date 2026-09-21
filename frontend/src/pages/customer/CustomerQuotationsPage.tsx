import React, { useEffect, useState } from 'react';
import { quotationApi } from '../../api/quotationApi';
import { formatLKR, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import toast from 'react-hot-toast';
import {
  FileText,
  Check,
  X,
  Printer,
  Eye,
  Car,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  Wrench,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface QuotationItem {
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface Quotation {
  _id: string;
  id?: string;
  quotationNumber: string;
  customer: any;
  vehicle: any;
  jobCard: any;
  grandTotal: number;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  discount: number;
  laborCharge: number;
  estimatedHours: number;
  laborCost: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'converted';
  createdAt: string;
  validUntil?: string;
  items: QuotationItem[];
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export const CustomerQuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('all');

  // Modal states
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [confirmAgreement, setConfirmAgreement] = useState(false);

  const fetchQuotations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await quotationApi.getQuotations({ limit: 50 });
      if (res.success) {
        setQuotations(res.data || []);
      } else {
        setError(res.message || 'Failed to load quotations');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleApprove = async () => {
    if (!selectedQuotation) return;
    if (!confirmAgreement) {
      toast.error('Please confirm that you agree to the estimated charges');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const qId = selectedQuotation._id || selectedQuotation.id;
      const res = await quotationApi.approveQuotation(qId, {
        approvedBy: 'Customer',
        remarks: 'Approved by customer via customer portal',
      });

      if (res.success) {
        toast.success(`Quotation ${selectedQuotation.quotationNumber} approved successfully!`);
        setIsApproveModalOpen(false);
        setIsDetailModalOpen(false);
        setSelectedQuotation(null);
        setConfirmAgreement(false);
        fetchQuotations();
      } else {
        toast.error(res.message || 'Failed to approve quotation');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error approving quotation');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReject = async () => {
    if (!selectedQuotation) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for declining the quotation');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const qId = selectedQuotation._id || selectedQuotation.id;
      const res = await quotationApi.rejectQuotation(qId, {
        rejectionReason: rejectionReason.trim(),
      });

      if (res.success) {
        toast.success(`Quotation ${selectedQuotation.quotationNumber} has been declined`);
        setIsRejectModalOpen(false);
        setIsDetailModalOpen(false);
        setSelectedQuotation(null);
        setRejectionReason('');
        fetchQuotations();
      } else {
        toast.error(res.message || 'Failed to decline quotation');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error declining quotation');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const filteredQuotations = quotations.filter((q) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      q.quotationNumber?.toLowerCase().includes(term) ||
      q.vehicle?.registrationNumber?.toLowerCase().includes(term) ||
      q.vehicle?.make?.toLowerCase().includes(term) ||
      q.vehicle?.model?.toLowerCase().includes(term) ||
      q.jobCard?.jobCardNumber?.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'all' ? true : q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = quotations.filter((q) => q.status === 'submitted').length;

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchQuotations} />;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block backdrop-blur-xs">
            Service Estimates & Approvals
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            My Service Quotations
          </h1>
          <p className="text-sm text-blue-100 leading-relaxed">
            Review detailed spare parts and labor estimates submitted by our workshop technicians. You can approve or decline estimates before work begins.
          </p>
        </div>
      </div>

      {/* Alert for Pending Quotations */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                You have {pendingCount} quotation{pendingCount > 1 ? 's' : ''} awaiting your review!
              </p>
              <p className="text-xs text-amber-700">
                Please review and approve the quotation to authorize the workshop team to begin repairs.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('submitted')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0"
          >
            View Pending
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quotation, vehicle, job card..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {(['all', 'submitted', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                statusFilter === tab
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab === 'all'
                ? 'All Quotations'
                : tab === 'submitted'
                ? `Awaiting Approval (${pendingCount})`
                : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations List */}
      {filteredQuotations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Quotations Found</h3>
          <p className="text-xs text-slate-500">
            {searchTerm || statusFilter !== 'all'
              ? 'Try changing your search query or filter criteria.'
              : 'You have no quotations issued at this time.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuotations.map((quotation) => {
            const isPending = quotation.status === 'submitted';
            const isApproved = quotation.status === 'approved';
            const isRejected = quotation.status === 'rejected';

            return (
              <div
                key={quotation._id}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                  isPending
                    ? 'border-amber-300 ring-1 ring-amber-100'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          {quotation.quotationNumber}
                        </span>
                        {isPending && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold animate-pulse">
                            Action Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Received on {formatDate(quotation.createdAt)}
                      </p>
                    </div>
                    <StatusBadge
                      status={
                        isPending
                          ? 'Awaiting Approval'
                          : quotation.status
                      }
                    />
                  </div>

                  <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-slate-400" /> Vehicle:
                      </span>
                      <span className="font-medium text-slate-800">
                        {quotation.vehicle?.make} {quotation.vehicle?.model} •{' '}
                        <span className="font-bold text-slate-900">
                          {quotation.vehicle?.registrationNumber}
                        </span>
                      </span>
                    </div>

                    {quotation.jobCard?.jobCardNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-slate-400" /> Job Card:
                        </span>
                        <span className="font-mono text-slate-700 font-medium">
                          {quotation.jobCard.jobCardNumber}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" /> Parts & Labor:
                      </span>
                      <span className="text-slate-700">
                        {quotation.items?.length || 0} part(s) • {quotation.estimatedHours} labor hrs
                      </span>
                    </div>

                    {quotation.validUntil && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> Valid Until:
                        </span>
                        <span className="text-slate-700">
                          {formatDate(quotation.validUntil)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Total Estimate</p>
                      <p className="text-lg font-extrabold text-slate-900">
                        {formatLKR(quotation.grandTotal)}
                      </p>
                    </div>

                    {isApproved && (
                      <div className="text-right">
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                        <p className="text-xs text-slate-400">
                          {quotation.approvedBy || 'Customer'}
                        </p>
                      </div>
                    )}

                    {isRejected && (
                      <div className="text-right">
                        <span className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Declined
                        </span>
                        <p className="text-xs text-slate-400 truncate max-w-[140px]">
                          {quotation.rejectionReason || 'Declined'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedQuotation(quotation);
                      setIsDetailModalOpen(true);
                    }}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Breakdown
                  </button>

                  {isPending && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedQuotation(quotation);
                          setIsApproveModalOpen(true);
                        }}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedQuotation(quotation);
                          setIsRejectModalOpen(true);
                        }}
                        className="flex items-center justify-center px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Decline
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail & Review Modal */}
      {isDetailModalOpen && selectedQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 text-brand-600 rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedQuotation.quotationNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vehicle Service Quotation Breakdown
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Notice */}
            {selectedQuotation.status === 'submitted' && (
              <div className="my-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  This quotation is awaiting your approval. You can approve or decline the estimate below.
                </span>
              </div>
            )}

            {selectedQuotation.status === 'approved' && (
              <div className="my-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>
                  Approved by {selectedQuotation.approvedBy || 'Customer'} on{' '}
                  {selectedQuotation.approvedAt ? formatDate(selectedQuotation.approvedAt) : 'N/A'}.
                </span>
              </div>
            )}

            {selectedQuotation.status === 'rejected' && (
              <div className="my-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
                <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>
                  Declined. Reason: {selectedQuotation.rejectionReason || 'Declined by customer'}
                </span>
              </div>
            )}

            {/* Vehicle & Job Info */}
            <div className="grid grid-cols-2 gap-4 my-4 p-4 bg-slate-50 rounded-2xl text-xs">
              <div>
                <p className="text-slate-400 mb-0.5">Vehicle</p>
                <p className="font-bold text-slate-800">
                  {selectedQuotation.vehicle?.make} {selectedQuotation.vehicle?.model}
                </p>
                <p className="text-slate-600 font-mono">
                  {selectedQuotation.vehicle?.registrationNumber}
                </p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Job Card Reference</p>
                <p className="font-bold text-slate-800 font-mono">
                  {selectedQuotation.jobCard?.jobCardNumber || 'N/A'}
                </p>
                <p className="text-slate-500">
                  Issued: {formatDate(selectedQuotation.createdAt)}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="my-4">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                Itemized Parts & Materials
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedQuotation.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {item.name}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {formatLKR(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                          {formatLKR(item.total)}
                        </td>
                      </tr>
                    ))}
                    {/* Labor Row */}
                    <tr className="bg-blue-50/30">
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        Service Labor ({selectedQuotation.estimatedHours} hrs @ {formatLKR(selectedQuotation.laborCharge)}/hr)
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        {selectedQuotation.estimatedHours} hrs
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {formatLKR(selectedQuotation.laborCharge)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                        {formatLKR(selectedQuotation.laborCost || selectedQuotation.laborCharge * selectedQuotation.estimatedHours)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 my-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Parts & Labor)</span>
                <span className="font-medium text-slate-900">
                  {formatLKR(selectedQuotation.subtotal || selectedQuotation.grandTotal)}
                </span>
              </div>
              {selectedQuotation.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>- {formatLKR(selectedQuotation.discount)}</span>
                </div>
              )}
              {selectedQuotation.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({selectedQuotation.taxRate}%)</span>
                  <span>{formatLKR(selectedQuotation.taxAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Grand Total</span>
                <span className="text-base text-brand-600">
                  {formatLKR(selectedQuotation.grandTotal)}
                </span>
              </div>
            </div>

            {/* Remarks */}
            {selectedQuotation.notes && (
              <div className="my-4 text-xs">
                <p className="text-slate-400 mb-1">Notes / Terms</p>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-600 italic">
                  "{selectedQuotation.notes}"
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                <Printer className="w-3.5 h-3.5" /> Print Estimate
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Close
                </button>
                {selectedQuotation.status === 'submitted' && (
                  <>
                    <button
                      onClick={() => {
                        setIsRejectModalOpen(true);
                      }}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => {
                        setIsApproveModalOpen(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                    >
                      Approve Quotation
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {isApproveModalOpen && selectedQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Approve Quotation</h3>
                <p className="text-xs text-slate-500">{selectedQuotation.quotationNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              You are approving the vehicle service estimate of{' '}
              <span className="font-bold text-slate-900">{formatLKR(selectedQuotation.grandTotal)}</span>{' '}
              for <span className="font-bold">{selectedQuotation.vehicle?.registrationNumber}</span>.
              Our workshop team will proceed with issuing the parts and completing the repair.
            </p>

            <label className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-xs text-slate-700 mb-6">
              <input
                type="checkbox"
                checked={confirmAgreement}
                onChange={(e) => setConfirmAgreement(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>
                I agree to the estimated charges and authorize the service center to perform the requested repairs.
              </span>
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsApproveModalOpen(false);
                  setConfirmAgreement(false);
                }}
                disabled={isSubmittingAction}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmittingAction || !confirmAgreement}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingAction ? (
                  'Approving...'
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Confirm Approval
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {isRejectModalOpen && selectedQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Decline Quotation</h3>
                <p className="text-xs text-slate-500">{selectedQuotation.quotationNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Please tell us why you are declining this quotation so our service manager can contact you with suitable alternatives.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Reason for declining *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="e.g. Total price exceeds budget, unnecessary parts, delay in parts arrival..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectionReason('');
                }}
                disabled={isSubmittingAction}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmittingAction || !rejectionReason.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {isSubmittingAction ? 'Declining...' : 'Decline Quotation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
