import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Receipt, Check, AlertCircle } from 'lucide-react';
import { invoiceApi } from '../../api/invoiceApi';
import { jobCardApi } from '../../api/jobCardApi';
import { customerApi } from '../../api/customerApi';
import { vehicleApi } from '../../api/vehicleApi';
import { formatLKR } from '../../utils/formatters';
import toast from 'react-hot-toast';

interface Item {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface LaborCharge {
  description: string;
  hours: number;
  ratePerHour: number;
  total: number;
}

export const CreateInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledJobCardId = searchParams.get('jobCard');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const [selectedJobCardId, setSelectedJobCardId] = useState(prefilledJobCardId || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const [items, setItems] = useState<Item[]>([
    { description: 'Service Labor & Diagnosis', quantity: 1, unitPrice: 2500, discount: 0, total: 2500 }
  ]);

  const [laborCharges, setLaborCharges] = useState<LaborCharge[]>([
    { description: 'Standard Technician Labor', hours: 2, ratePerHour: 1500, total: 3000 }
  ]);

  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [remarks, setRemarks] = useState('');

  // Fetch reference options
  useEffect(() => {
    const loadOptions = async () => {
      setIsLoading(true);
      try {
        const [jcRes, custRes, vehRes] = await Promise.all([
          jobCardApi.getJobCards({ limit: 100 }),
          customerApi.getCustomers({ limit: 100 }),
          vehicleApi.getVehicles({ limit: 100 }),
        ]);

        if (jcRes.success) setJobCards(jcRes.data || []);
        if (custRes.success) setCustomers(custRes.data || []);
        if (vehRes.success) setVehicles(vehRes.data || []);
      } catch (err) {
        console.error('Error loading options:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOptions();
  }, []);

  // When job card selection changes, pre-fill customer & vehicle & parts
  useEffect(() => {
    if (!selectedJobCardId) return;

    const jc = jobCards.find(j => (j._id || j.id) === selectedJobCardId);
    if (jc) {
      if (jc.customer) {
        const cId = typeof jc.customer === 'object' ? jc.customer._id || jc.customer.id : jc.customer;
        setSelectedCustomerId(cId || '');
      }
      if (jc.vehicle) {
        const vId = typeof jc.vehicle === 'object' ? jc.vehicle._id || jc.vehicle.id : jc.vehicle;
        setSelectedVehicleId(vId || '');
      }

      // Pre-fill parts if job card has parts
      if (jc.parts && Array.isArray(jc.parts) && jc.parts.length > 0) {
        const formattedParts: Item[] = jc.parts.map((p: any) => ({
          description: p.partName || p.description || 'Spare Part',
          quantity: p.quantity || 1,
          unitPrice: p.unitPrice || p.price || 0,
          discount: 0,
          total: (p.quantity || 1) * (p.unitPrice || p.price || 0),
        }));
        setItems(formattedParts);
      }
    }
  }, [selectedJobCardId, jobCards]);

  // Handle Items changes
  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof Item, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    item.total = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) - (Number(item.discount) || 0);
    updated[index] = item;
    setItems(updated);
  };

  // Handle Labor changes
  const addLabor = () => {
    setLaborCharges([...laborCharges, { description: '', hours: 1, ratePerHour: 1000, total: 1000 }]);
  };

  const removeLabor = (index: number) => {
    setLaborCharges(laborCharges.filter((_, i) => i !== index));
  };

  const updateLabor = (index: number, field: keyof LaborCharge, value: any) => {
    const updated = [...laborCharges];
    const labor = { ...updated[index], [field]: value };
    labor.total = (Number(labor.hours) || 0) * (Number(labor.ratePerHour) || 0);
    updated[index] = labor;
    setLaborCharges(updated);
  };

  // Calculations
  const itemsSubtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const laborSubtotal = laborCharges.reduce((sum, l) => sum + (l.total || 0), 0);
  const totalBeforeDiscount = itemsSubtotal + laborSubtotal;
  const taxableAmount = Math.max(0, totalBeforeDiscount - (Number(discount) || 0));
  const taxAmount = (taxableAmount * (Number(taxRate) || 0)) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }

    if (items.length === 0 && laborCharges.length === 0) {
      toast.error('Please add at least one item or labor charge');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer: selectedCustomerId,
        vehicle: selectedVehicleId || undefined,
        jobCard: selectedJobCardId || undefined,
        items,
        laborCharges,
        discount: Number(discount) || 0,
        taxRate: Number(taxRate) || 0,
        remarks,
        status: 'approved',
      };

      const res = await invoiceApi.createInvoice(payload);

      if (res.success) {
        toast.success('Invoice generated successfully!');
        navigate('/manager/invoices');
      } else {
        toast.error(res.message || 'Failed to generate invoice');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error generating invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Title & Back */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/manager/invoices')}
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Generate New Invoice</h1>
          <p className="text-sm text-slate-500">Create a final customer invoice for completed services</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Vehicle Selection */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-600" /> Reference Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Associated Job Card (Optional)
              </label>
              <select
                value={selectedJobCardId}
                onChange={(e) => setSelectedJobCardId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
              >
                <option value="">Select Job Card</option>
                {jobCards.map((jc) => (
                  <option key={jc._id || jc.id} value={jc._id || jc.id}>
                    {jc.jobCardNumber} - {jc.vehicle?.registrationNumber || 'Vehicle'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Customer *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
              >
                <option value="">Select Customer</option>
                {customers.map((c) => {
                  const name = c.user ? `${c.user.firstName} ${c.user.lastName}` : c.name || 'Customer';
                  return (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {name} ({c.user?.mobile || c.mobile || 'No Mobile'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vehicle (Optional)
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
              >
                <option value="">Select Vehicle</option>
                {vehicles.map((v) => (
                  <option key={v._id || v.id} value={v._id || v.id}>
                    {v.registrationNumber} ({v.make} {v.model})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Parts & Materials Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Parts & Materials Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-xl">
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Item description / part name"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Price (LKR)"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2 text-right font-semibold text-slate-900 text-sm">
                  {formatLKR(item.total)}
                </div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Labor Charges */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Labor & Service Charges</h2>
            <button
              type="button"
              onClick={addLabor}
              className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              <Plus className="w-4 h-4" /> Add Labor Charge
            </button>
          </div>

          <div className="space-y-3">
            {laborCharges.map((labor, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-xl">
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Labor description"
                    value={labor.description}
                    onChange={(e) => updateLabor(idx, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="Hours"
                    value={labor.hours}
                    onChange={(e) => updateLabor(idx, 'hours', Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Rate/hr"
                    value={labor.ratePerHour}
                    onChange={(e) => updateLabor(idx, 'ratePerHour', Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2 text-right font-semibold text-slate-900 text-sm">
                  {formatLKR(labor.total)}
                </div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeLabor(idx)}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals & Submit */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Remarks / Special Notes
              </label>
              <textarea
                rows={4}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add warranty terms, payment notes, or instructions..."
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatLKR(itemsSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Labor Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatLKR(laborSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Discount (LKR):</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-32 px-3 py-1 border border-slate-200 rounded-lg text-right text-sm"
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Tax Rate (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-32 px-3 py-1 border border-slate-200 rounded-lg text-right text-sm"
                />
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="text-base font-bold text-slate-900">Grand Total:</span>
                <span className="text-xl font-bold text-brand-600">{formatLKR(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/manager/invoices')}
              className="px-6 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Generating...' : 'Generate Invoice'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
