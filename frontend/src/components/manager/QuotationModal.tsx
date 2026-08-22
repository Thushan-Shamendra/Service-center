import React, { useEffect, useState } from 'react';
import { jobCardApi } from '../../api/jobCardApi';
import { quotationApi } from '../../api/quotationApi';
import { JobCard } from '../../types';
import { Lock, Check, FileText, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

interface QuotationPart {
  id: string;
  partName: string;
  partCode: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  availableStock: number;
}

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (quotation: any) => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdQuotation, setCreatedQuotation] = useState<any>(null);
  
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [showJobCardModal, setShowJobCardModal] = useState(false);

  const [quotationNumber, setQuotationNumber] = useState('QT-00049');
  const [quotationDate, setQuotationDate] = useState(dayjs().format('YYYY-MM-DD'));
  
  const [parts, setParts] = useState<QuotationPart[]>([]);
  const [laborCharge, setLaborCharge] = useState(3500);
  const [estimatedHours, setEstimatedHours] = useState(4.5);
  const [discount, setDiscount] = useState(2000);
  const [remarks, setRemarks] = useState('Quotation valid for 14 days. Prices may vary based on actual parts used.');

  useEffect(() => {
    if (isOpen) {
      fetchJobCards();
      setQuotationDate(dayjs().format('YYYY-MM-DD'));
      setParts([]);
      setLaborCharge(3500);
      setEstimatedHours(4.5);
      setDiscount(2000);
      setSelectedJobCard(null);
      setError(null);
      setShowSuccess(false);
      setCreatedQuotation(null);
    }
  }, [isOpen]);

  const fetchJobCards = async () => {
    try {
      const res = await jobCardApi.getJobCards({ limit: 100 });
      if (res.success) {
        const activeJobs = (res.data || []).filter((jc: JobCard) => 
          jc.status !== 'delivered' && jc.status !== 'cancelled'
        );
        setJobCards(activeJobs);
      }
    } catch (err) {
      console.error('Error fetching job cards:', err);
    }
  };

  const getCustomerName = (jobCard: JobCard) => {
    const customer = jobCard.customer;
    if (typeof customer === 'object' && customer.user) {
      return `${customer.user.firstName} ${customer.user.lastName}`;
    }
    return 'Unknown';
  };

  const getVehicleInfo = (jobCard: JobCard) => {
    const vehicle = jobCard.vehicle;
    if (typeof vehicle === 'object') {
      return `${vehicle.make} ${vehicle.model} • ${vehicle.registrationNumber}`;
    }
    return 'Unknown';
  };

  const addPart = (newPart: QuotationPart) => {
    setParts([...parts, newPart]);
  };

  const removePart = (partId: string) => {
    setParts(parts.filter(p => p.id !== partId));
  };

  const calculatePartsTotal = () => {
    return parts.reduce((sum, part) => sum + part.subtotal, 0);
  };

  const calculateLaborCost = () => {
    return laborCharge * estimatedHours;
  };

  const calculateGrandTotal = () => {
    return calculatePartsTotal() + calculateLaborCost() - discount;
  };

  const handleSubmit = async () => {
    if (!selectedJobCard) {
      toast.error('Please select a job card');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const quotationData = {
        jobCardId: selectedJobCard._id || selectedJobCard.id,
        quotationNumber,
        date: quotationDate,
        parts,
        laborCharge,
        estimatedHours,
        discount,
        remarks,
        status: 'draft',
      };
      
      const res = await quotationApi.createQuotation(quotationData);
      
      if (res.success) {
        const quotationData = {
          quotationNumber,
          jobCardNumber: selectedJobCard.jobCardNumber,
          customerName: getCustomerName(selectedJobCard),
          grandTotal: calculateGrandTotal(),
        };
        setCreatedQuotation(quotationData);
        setShowSuccess(true);
        onSuccess?.(quotationData);
      } else {
        setError(res.message || 'Failed to save quotation');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error saving quotation');
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess && createdQuotation) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Quotation Created Successfully
        </h2>
        
        <div className="space-y-3 mt-6 text-left">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Quotation No.</p>
            <p className="text-lg font-bold text-slate-900">{createdQuotation.quotationNumber}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Job Card</p>
            <p className="text-lg font-bold text-slate-900">{createdQuotation.jobCardNumber}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Customer</p>
            <p className="text-lg font-bold text-slate-900">{createdQuotation.customerName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total</p>
            <p className="text-lg font-bold text-slate-900">{createdQuotation.grandTotal.toLocaleString()}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          {error}
        </div>
      )}

      <h2 className="text-lg font-bold text-slate-900 mb-4">QUOTATION INFORMATION</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Quotation No.</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={quotationNumber}
              readOnly
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-600"
            />
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Job Card *</label>
          <button
            type="button"
            onClick={() => setShowJobCardModal(true)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-left flex items-center justify-between hover:bg-slate-50"
          >
            {selectedJobCard ? `${selectedJobCard.jobCardNumber} - ${getVehicleInfo(selectedJobCard)}` : 'Select Job Card'}
            <FileText className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={quotationDate}
              readOnly
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-600"
            />
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {selectedJobCard && (
        <div className="mb-4 bg-slate-50 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">CUSTOMER & VEHICLE</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Customer</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={getCustomerName(selectedJobCard)}
                  readOnly
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-600 text-sm"
                />
                <Lock className="w-3 h-3 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Vehicle</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={getVehicleInfo(selectedJobCard)}
                  readOnly
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-600 text-sm"
                />
                <Lock className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">PARTS & MATERIALS</h3>
      
      <button
        type="button"
        onClick={() => {
          const newPart: QuotationPart = {
            id: Date.now().toString(),
            partName: '',
            partCode: '',
            quantity: 1,
            unitPrice: 0,
            subtotal: 0,
            availableStock: 0,
          };
          addPart(newPart);
        }}
        className="mb-4 flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50"
      >
        <Plus className="w-4 h-4" />
        Add Part
      </button>

      {parts.length > 0 && (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Part</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Qty</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Unit Price</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Subtotal</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => (
                <tr key={part.id} className="border-b border-slate-100">
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={part.partName}
                      onChange={(e) => {
                        const updated = parts.map(p => p.id === part.id ? { ...p, partName: e.target.value } : p);
                        setParts(updated);
                      }}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                      placeholder="Part name"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={part.quantity}
                      onChange={(e) => {
                        const qty = Number(e.target.value);
                        const updated = parts.map(p => p.id === part.id ? { ...p, quantity: qty, subtotal: qty * part.unitPrice } : p);
                        setParts(updated);
                      }}
                      className="w-20 px-2 py-1 border border-slate-200 rounded text-sm"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={part.unitPrice}
                      onChange={(e) => {
                        const price = Number(e.target.value);
                        const updated = parts.map(p => p.id === part.id ? { ...p, unitPrice: price, subtotal: part.quantity * price } : p);
                        setParts(updated);
                      }}
                      className="w-24 px-2 py-1 border border-slate-200 rounded text-sm"
                    />
                  </td>
                  <td className="py-2 px-3 text-sm text-slate-900 font-medium">{part.subtotal.toLocaleString()}</td>
                  <td className="py-2 px-3">
                    <button
                      type="button"
                      onClick={() => removePart(part.id)}
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right py-2 text-sm text-slate-600">
            Parts Subtotal: {calculatePartsTotal().toLocaleString()}
          </div>
        </div>
      )}

      <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">LABOR</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Labor Charge</label>
          <input
            type="number"
            value={laborCharge}
            onChange={(e) => setLaborCharge(Number(e.target.value))}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Hours</label>
          <input
            type="number"
            step="0.5"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(Number(e.target.value))}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl"
          />
        </div>
      </div>

      <div className="text-right mb-4 text-sm text-slate-600">
        Labor Cost: {calculateLaborCost().toLocaleString()}
      </div>

      <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">PRICE SUMMARY</h3>
      
      <div className="bg-slate-50 rounded-xl p-4 mb-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Parts Subtotal</span>
            <span className="text-slate-900">{calculatePartsTotal().toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Labor Cost</span>
            <span className="text-slate-900">{calculateLaborCost().toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Discount</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-24 px-2 py-1 border border-slate-200 rounded text-right text-sm"
            />
          </div>
          <div className="border-t border-slate-300 pt-2 mt-2">
            <div className="flex justify-between font-bold text-lg">
              <span className="text-slate-900">GRAND TOTAL</span>
              <span className="text-slate-900">{calculateGrandTotal().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">REMARKS</h3>
      
      <textarea
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        rows={3}
        className="w-full px-4 py-2 border border-slate-200 rounded-xl mb-4"
      />

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Quotation'}
        </button>
      </div>

      {/* Job Card Selection Modal */}
      {showJobCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Select Job Card</h3>
              <button onClick={() => setShowJobCardModal(false)} className="text-slate-400 hover:text-slate-600">
                <FileText className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {jobCards.map((jc) => (
                <div
                  key={jc.id}
                  onClick={() => { setSelectedJobCard(jc); setShowJobCardModal(false); }}
                  className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  <p className="font-bold text-slate-900">{jc.jobCardNumber}</p>
                  <p className="text-sm text-slate-600">👤 {getCustomerName(jc)}</p>
                  <p className="text-sm text-slate-600">🚗 {getVehicleInfo(jc)}</p>
                  <p className="text-sm text-slate-600">🔧 {jc.complaint}</p>
                  <p className="text-sm text-slate-600">Status: {jc.status}</p>
                </div>
              ))}
              {jobCards.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-4">No active job cards found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
