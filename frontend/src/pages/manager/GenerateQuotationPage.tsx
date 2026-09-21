import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import { quotationApi } from '../../api/quotationApi';
import { inventoryApi } from '../../api/inventoryApi';
import { sparePartsApi } from '../../api/sparePartsApi';
import { JobCard } from '../../types';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { ArrowLeft, Save, Plus, Trash2, Lock, FileText, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

interface QuotationPart {
  id: string;
  part?: string;
  discount?: number;
  partName: string;
  partCode: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  availableStock: number;
}

interface InventoryItemOption {
  _id?: string;
  id?: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  sellingPrice: number;
  category?: string;
  brand?: string;
}

export const GenerateQuotationPage: React.FC = () => {
  const navigate = useNavigate();
  const { quotationId } = useParams();
  const [searchParams] = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [quotationNumber, setQuotationNumber] = useState('Assigned when saved');
  const [quotationDate, setQuotationDate] = useState(dayjs().format('YYYY-MM-DD'));
  
  const [parts, setParts] = useState<QuotationPart[]>([]);
  const [laborCharge, setLaborCharge] = useState(3500);
  const [estimatedHours, setEstimatedHours] = useState(4.5);
  const [discount, setDiscount] = useState(0);
  const [remarks, setRemarks] = useState('Quotation valid for 30 days. Prices may vary based on actual parts used.');
  
  const [showJobCardModal, setShowJobCardModal] = useState(false);
  const [showPartModal, setShowPartModal] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOption[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  const [partSearch, setPartSearch] = useState('');

  const populatePartsFromJobCard = async (jc: JobCard) => {
    try {
      const jobCardId = jc._id || jc.id;
      let fullJobCard = jc;

      if (jobCardId) {
        try {
          const res = await jobCardApi.getJobCardById(jobCardId);
          if (res.success && res.data) {
            fullJobCard = res.data;
            setSelectedJobCard(fullJobCard);
          }
        } catch (fetchErr) {
          console.error('Error fetching full job card details:', fetchErr);
        }
      }

      // 1. Check for inspection parts saved directly in JobCard.parts
      const rawParts = fullJobCard.parts || [];
      if (Array.isArray(rawParts) && rawParts.length > 0) {
        const populatedParts: QuotationPart[] = rawParts.map((p: any, index: number) => {
          const itemObj = typeof p.item === 'object' && p.item !== null ? p.item : null;
          const rawItemId = itemObj?._id || itemObj?.id || (typeof p.item === 'string' ? p.item : null);
          const partId = rawItemId || p._id || p.id || `inspection-part-${index}`;
          const partName = p.name || itemObj?.itemName || 'Inspection Part';
          const partCode = itemObj?.itemCode || '';
          const quantity = Number(p.quantity) || 1;
          const unitPrice = Number(p.unitPrice || itemObj?.sellingPrice || 0);
          const subtotal = Number(p.total) || (quantity * unitPrice);
          const availableStock = Math.max(quantity, Number(itemObj?.quantity ?? 10));

          return {
            id: String(partId),
            part: rawItemId && /^[0-9a-fA-F]{24}$/.test(String(rawItemId)) ? String(rawItemId) : undefined,
            partName,
            partCode,
            quantity,
            unitPrice,
            subtotal,
            availableStock,
            discount: 0,
          };
        });

        setParts(populatedParts);
        toast.success(`Automatically loaded ${populatedParts.length} part(s) from inspection`);
      } else if (jobCardId) {
        // 2. Fallback: Check for approved spare parts requests
        try {
          const sprRes = await sparePartsApi.getSparePartsByJobCard(jobCardId);
          const requests = (sprRes.success && Array.isArray(sprRes.data)) ? sprRes.data : [];
          const approvedRequests = requests.filter((r: any) => r.status === 'approved' || r.status === 'issued');
          if (approvedRequests.length > 0) {
            const sprParts: QuotationPart[] = approvedRequests.map((r: any, idx: number) => {
              const itemObj = typeof r.item === 'object' && r.item !== null ? r.item : null;
              const rawItemId = itemObj?._id || itemObj?.id || (typeof r.item === 'string' ? r.item : null);
              const partId = rawItemId || r._id || `spr-part-${idx}`;
              const partName = r.itemName || itemObj?.itemName || 'Requested Part';
              const partCode = itemObj?.itemCode || '';
              const quantity = Number(r.approvedQuantity || r.requestedQuantity || 1);
              const unitPrice = Number(itemObj?.sellingPrice || 0);
              const subtotal = quantity * unitPrice;
              const availableStock = Math.max(quantity, Number(itemObj?.quantity ?? r.currentStock ?? 10));

              return {
                id: String(partId),
                part: rawItemId && /^[0-9a-fA-F]{24}$/.test(String(rawItemId)) ? String(rawItemId) : undefined,
                partName,
                partCode,
                quantity,
                unitPrice,
                subtotal,
                availableStock,
                discount: 0,
              };
            });

            setParts(sprParts);
            toast.success(`Automatically loaded ${sprParts.length} part(s) from spare parts requests`);
          }
        } catch (sprErr) {
          console.error('Error fetching spare parts requests:', sprErr);
        }
      }
    } catch (err) {
      console.error('Error populating inspection parts:', err);
    }
  };

  const handleSelectJobCard = async (jc: JobCard) => {
    setSelectedJobCard(jc);
    setShowJobCardModal(false);
    await populatePartsFromJobCard(jc);
  };

  const fetchJobCards = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await jobCardApi.getJobCards({ limit: 100 });
      
      if (res.success) {
        const activeJobs = (res.data || []).filter((jc: JobCard) => 
          jc.status !== 'delivered' && jc.status !== 'cancelled'
        );
        setJobCards(activeJobs);
        if (quotationId) {
          const response = await quotationApi.getQuotationById(quotationId);
          const q = response.data;
          if (q.status !== 'draft') throw new Error('Only draft quotations can be edited');
          const job = activeJobs.find((j: JobCard) => (j._id || j.id) === (q.jobCard?._id || q.jobCard?.id || q.jobCard));
          setSelectedJobCard(job || { ...q.jobCard, customer: q.customer, vehicle: q.vehicle });
          setQuotationNumber(q.quotationNumber);
          setQuotationDate(dayjs(q.createdAt).format('YYYY-MM-DD'));
          setParts(q.items.map((item: any) => ({ id: item.part?._id || item.part?.id || item.part || item._id,
            part: item.part?._id || item.part?.id || item.part, discount: item.discount || 0,
            partName: item.name, partCode: item.part?.itemCode || '', quantity: item.quantity,
            unitPrice: item.unitPrice, subtotal: item.total, availableStock: Math.max(item.quantity, item.part?.quantity || 0) })));
          setLaborCharge(q.laborCharge); setEstimatedHours(q.estimatedHours);
          setDiscount(q.discount || 0); setTaxRate(q.taxRate || 0); setRemarks(q.notes || '');
        } else {
          // Check if a job card was provided via URL query parameters
          const targetJobCardId = searchParams.get('jobCard') || searchParams.get('jobCardId');
          if (targetJobCardId) {
            const matchedJob = activeJobs.find((j: JobCard) =>
              (j._id || j.id || j.jobCardNumber) === targetJobCardId
            );
            if (matchedJob) {
              setSelectedJobCard(matchedJob);
              await populatePartsFromJobCard(matchedJob);
            }
          }
        }
      } else {
        setError(res.message || 'Failed to load job cards');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error loading job cards');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCards();
  }, [quotationId, searchParams]);

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

  const fetchInventoryItems = async () => {
    setIsLoadingParts(true);
    try {
      const res = await inventoryApi.getInventoryItems({ limit: 100 });
      if (res.success) {
        setInventoryItems((res.data || []).filter((item: InventoryItemOption) => item.quantity > 0));
      } else {
        toast.error(res.message || 'Failed to load inventory parts');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error loading inventory parts');
    } finally {
      setIsLoadingParts(false);
    }
  };

  const openPartModal = () => {
    setPartSearch('');
    setShowPartModal(true);
    fetchInventoryItems();
  };

  const addInventoryPart = (item: InventoryItemOption) => {
    const partId = item._id || item.id;
    if (!partId) {
      toast.error('Invalid inventory item');
      return;
    }

    if (parts.some((part) => part.id === partId)) {
      toast.error('This part is already added');
      return;
    }

    const unitPrice = Number(item.sellingPrice || 0);
    setParts((currentParts) => [
      ...currentParts,
      {
        id: partId,
        part: partId,
        partName: item.itemName,
        partCode: item.itemCode,
        quantity: 1,
        unitPrice,
        subtotal: unitPrice,
        availableStock: Number(item.quantity || 0),
      },
    ]);
    setShowPartModal(false);
    toast.success(`${item.itemName} added`);
  };

  const updatePartQuantity = (partId: string, requestedQuantity: number) => {
    setParts((currentParts) =>
      currentParts.map((part) => {
        if (part.id !== partId) return part;
        const quantity = Math.max(1, Math.min(requestedQuantity || 1, part.availableStock));
        return { ...part, quantity, subtotal: quantity * part.unitPrice - (part.discount || 0) };
      })
    );
  };

  const removePart = (partId: string) => {
    setParts(parts.filter(p => p.id !== partId));
  };

  const calculatePartsTotal = () => {
    return Math.round((parts.reduce((sum, part) => sum + Math.round((part.subtotal + Number.EPSILON) * 100) / 100, 0) + Number.EPSILON) * 100) / 100;
  };

  const calculateLaborCost = () => {
    return Math.round((laborCharge * estimatedHours + Number.EPSILON) * 100) / 100;
  };

  const calculateGrandTotal = () => {
    const subtotal = Math.round((calculatePartsTotal() + calculateLaborCost() + Number.EPSILON) * 100) / 100;
    const tax = Math.round((((subtotal - discount) * taxRate / 100) + Number.EPSILON) * 100) / 100;
    return Math.round((subtotal - discount + tax + Number.EPSILON) * 100) / 100;
  };

  const getEntityId = (entity: any) => {
    if (!entity) return '';
    if (typeof entity === 'string') return entity;
    return entity._id || entity.id || '';
  };

  const buildQuotationData = () => {
    if (!selectedJobCard) return null;

    return {
      customer: getEntityId(selectedJobCard.customer),
      vehicle: getEntityId(selectedJobCard.vehicle),
      jobCard: selectedJobCard._id || selectedJobCard.id,
      items: parts.map((part) => ({
        part: part.part && /^[0-9a-fA-F]{24}$/.test(String(part.part)) ? String(part.part) : undefined,
        name: part.partName,
        quantity: part.quantity,
        unitPrice: part.unitPrice,
        discount: part.discount || 0,
        total: part.subtotal,
      })),
      laborCharge,
      estimatedHours,
      discount,
      taxRate,
      notes: remarks,
    };
  };

  const saveQuotation = async (mode: 'draft' | 'review' | 'submit') => {
    if (isSaving) return;
    const data = buildQuotationData();
    if (!data?.customer || !data.vehicle || !data.jobCard) { toast.error('Please select a valid job card'); return; }
    if ([laborCharge, estimatedHours, discount, taxRate].some(v => !Number.isFinite(v) || v < 0) || taxRate > 100 || discount > calculatePartsTotal() + calculateLaborCost()) {
      toast.error('Enter valid non-negative charges and a discount no greater than the subtotal'); return;
    }
    setIsSaving(true);
    try {
      const res = quotationId ? await quotationApi.updateQuotation(quotationId, data) : await quotationApi.createQuotation(data);
      if (!res.success) { toast.error(res.message || 'Failed to save quotation'); return; }
      
      const newId = res.data._id || res.data.id;
      if (mode === 'submit') {
        const subRes = await quotationApi.submitQuotation(newId);
        if (subRes.success) {
          toast.success(subRes.message || 'Quotation saved and submitted to customer!');
        } else {
          toast.error(subRes.message || 'Saved, but could not submit to customer');
        }
        navigate('/manager/quotations/' + newId);
      } else if (mode === 'review') {
        toast.success('Quotation saved');
        navigate('/manager/quotations/' + newId);
      } else {
        toast.success('Quotation saved as draft');
        navigate('/manager/quotations');
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error saving quotation'); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchJobCards} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/manager/quotations" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{quotationId ? 'Edit Quotation' : 'Generate Quotation'}</h1>
          <p className="text-sm text-slate-500">Create a quotation from an active Job Card.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-6">QUOTATION INFORMATION</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
          <div className="mb-6 bg-slate-50 rounded-xl p-4">
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
          onClick={openPartModal}
          className="mb-4 flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50"
        >
          <Plus className="w-4 h-4" />
          Add Part
        </button>

        {parts.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Part</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Available Stock</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Quantity</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Unit Price</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Subtotal</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => (
                  <tr key={part.id} className="border-b border-slate-100">
                    <td className="py-2 px-3 text-sm text-slate-900">{part.partName}</td>
                    <td className="py-2 px-3 text-sm text-slate-600">{part.availableStock}</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={1}
                        max={part.availableStock}
                        value={part.quantity}
                        onChange={(e) => updatePartQuantity(part.id, Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm"
                      />
                    </td>
                    <td className="py-2 px-3 text-sm text-slate-600">{part.unitPrice.toLocaleString()}</td>
                    <td className="py-2 px-3 text-sm text-slate-900 font-medium">{part.subtotal.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <button
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

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase">LABOR</h3>
          <span className="text-xs text-slate-400 font-normal">Formula: Hourly Rate × Estimated Hours</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Labor Charge (Hourly Rate - Rs./hr)</label>
            <input
              type="number"
              min={0}
              value={laborCharge}
              onChange={(e) => setLaborCharge(Number(e.target.value))}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
              placeholder="e.g. 10000"
            />
            <p className="text-xs text-slate-400 mt-1">Rate charged per labor hour</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Hours (hrs)</label>
            <input
              type="number"
              min={0}
              step="0.5"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(Number(e.target.value))}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
              placeholder="e.g. 4.5"
            />
            <p className="text-xs text-slate-400 mt-1">Estimated duration to complete work</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl mb-6 text-sm">
          <span className="text-slate-600">
            Labor Calculation: <span className="font-semibold text-slate-800">Rs. {laborCharge.toLocaleString()}</span> × <span className="font-semibold text-slate-800">{estimatedHours} hrs</span>
          </span>
          <span className="font-bold text-slate-900 text-base">
            Labor Cost: Rs. {calculateLaborCost().toLocaleString()}
          </span>
        </div>

        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">PRICE SUMMARY</h3>
        
        <div className="bg-slate-50 rounded-xl p-4 mb-6">
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
            <div className="flex justify-between"><span>Tax (%)</span><input type="number" min="0" max="100" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="w-24 px-2 py-1 border rounded text-right" /></div>
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
          className="w-full px-4 py-2 border border-slate-200 rounded-xl mb-6"
        />

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-bold">🟠 Draft</span>
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-slate-200">
          <Link to="/manager/quotations" className="px-5 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium">Cancel</Link>
          <button disabled={isSaving} onClick={() => saveQuotation('draft')} className="px-5 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 flex items-center gap-2 text-sm font-medium">
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button disabled={isSaving} onClick={() => saveQuotation('review')} className="px-5 py-2 border border-brand-200 bg-brand-50 text-brand-700 rounded-xl hover:bg-brand-100 flex items-center gap-2 text-sm font-semibold">
            <Save className="w-4 h-4" />
            Save & Review
          </button>
          <button disabled={isSaving} onClick={() => saveQuotation('submit')} className="px-5 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 flex items-center gap-2 text-sm font-semibold shadow-xs">
            <Send className="w-4 h-4" />
            Save & Submit to Customer
          </button>
        </div>
      </div>

      {/* Job Card Selection Modal */}
      {showJobCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Select Job Card</h3>
              <button onClick={() => setShowJobCardModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                placeholder="Search Job Card / Customer / Registration Number"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
              />
            </div>
            
            <div className="space-y-3">
              {jobCards.filter(jc => [jc.jobCardNumber, getCustomerName(jc), getVehicleInfo(jc)].join(' ').toLowerCase().includes(jobSearch.toLowerCase())).map((jc) => (
                <div
                  key={jc._id || jc.id}
                  onClick={() => handleSelectJobCard(jc)}
                  className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900">{jc.jobCardNumber}</p>
                    {jc.parts && jc.parts.length > 0 && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        {jc.parts.length} Inspected Part{jc.parts.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">👤 {getCustomerName(jc)}</p>
                  <p className="text-sm text-slate-600">🚗 {getVehicleInfo(jc)}</p>
                  {jc.complaint && <p className="text-sm text-slate-600">🔧 {jc.complaint}</p>}
                  {jc.inspectionNotes && <p className="text-xs text-brand-600 mt-1">📋 Inspection: {jc.inspectionNotes}</p>}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span>Status: <span className="capitalize font-medium text-slate-700">{jc.status.replace(/_/g, ' ')}</span></span>
                    <span>Estimated Cost: Rs. {(jc.estimatedCost || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Part Selection Modal */}
      {showPartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Select Part</h3>
                <p className="text-sm text-slate-500">Choose an available item from inventory.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPartModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                aria-label="Close part selector"
              >
                ×
              </button>
            </div>

            <input
              type="text"
              value={partSearch}
              onChange={(e) => setPartSearch(e.target.value)}
              placeholder="Search by part name, code, category or brand"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg mb-4"
            />

            {isLoadingParts ? (
              <div className="py-10 text-center text-slate-500">Loading inventory parts...</div>
            ) : (
              <div className="space-y-3">
                {inventoryItems
                  .filter((item) => {
                    const search = partSearch.trim().toLowerCase();
                    if (!search) return true;
                    return [item.itemName, item.itemCode, item.category, item.brand]
                      .filter(Boolean)
                      .some((value) => String(value).toLowerCase().includes(search));
                  })
                  .map((item) => {
                    const inventoryId = item._id || item.id;
                    const alreadyAdded = inventoryId ? parts.some((part) => part.id === inventoryId) : false;
                    return (
                      <div
                        key={inventoryId || item.itemCode}
                        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border border-slate-200 rounded-xl"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{item.itemName}</p>
                          <p className="text-sm text-slate-500">
                            {item.itemCode}
                            {item.category ? ` • ${item.category}` : ''}
                            {item.brand ? ` • ${item.brand}` : ''}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            Stock: {item.quantity} • Selling Price: Rs. {Number(item.sellingPrice || 0).toLocaleString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => addInventoryPart(item)}
                          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {alreadyAdded ? 'Added' : 'Add'}
                        </button>
                      </div>
                    );
                  })}

                {inventoryItems.length === 0 && (
                  <div className="py-10 text-center text-slate-500">No available parts found in inventory.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
