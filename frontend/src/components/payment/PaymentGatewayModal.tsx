import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Building2,
  FileCheck2,
  Smartphone,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { formatLKR } from '../../utils/formatters';
import { paymentApi } from '../../api/paymentApi';
import toast from 'react-hot-toast';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess: () => void;
}

type PaymentMethod = 'card' | 'cash' | 'bank_transfer' | 'cheque' | 'card_machine';

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  if (!isOpen || !invoice) return null;

  const maxPayable = invoice.outstandingBalance || 0;
  const [payType, setPayType] = useState<'full' | 'custom'>('full');
  const [customAmount, setCustomAmount] = useState<string>(maxPayable.toString());
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gatewayStep, setGatewayStep] = useState<'form' | 'processing' | 'success'>('form');

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Bank Transfer details
  const [transferBank, setTransferBank] = useState('Commercial Bank');
  const [transferRef, setTransferRef] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);

  // Cheque details
  const [chequeBank, setChequeBank] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState(new Date().toISOString().split('T')[0]);

  // Card machine (POS) details
  const [posTerminalId, setPosTerminalId] = useState('');
  const [posAuthCode, setPosAuthCode] = useState('');
  const [posCardDigits, setPosCardDigits] = useState('');

  // Cash / general
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [notes, setNotes] = useState('');

  const amountToPay = payType === 'full' ? maxPayable : parseFloat(customAmount) || 0;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length > 2) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExpiry(raw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amountToPay <= 0) {
      toast.error('Please enter an amount greater than 0');
      return;
    }

    if (amountToPay > maxPayable) {
      toast.error(`Amount cannot exceed outstanding balance (${formatLKR(maxPayable)})`);
      return;
    }

    // Validation per method
    if (selectedMethod === 'card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 15) {
        toast.error('Please enter a valid 16-digit card number');
        return;
      }
      if (!cardHolder.trim()) {
        toast.error('Please enter the cardholder name');
        return;
      }
      if (cardExpiry.length < 5) {
        toast.error('Please enter expiration date (MM/YY)');
        return;
      }
      if (cardCvv.length < 3) {
        toast.error('Please enter a valid CVV');
        return;
      }
    } else if (selectedMethod === 'bank_transfer') {
      if (!transferRef.trim()) {
        toast.error('Please enter the bank transaction reference number');
        return;
      }
    } else if (selectedMethod === 'cheque') {
      if (!chequeNumber.trim() || !chequeBank.trim()) {
        toast.error('Please provide cheque number and bank name');
        return;
      }
    } else if (selectedMethod === 'card_machine') {
      if (!posAuthCode.trim()) {
        toast.error('Please provide POS approval / auth code');
        return;
      }
    }

    setIsSubmitting(true);

    // If online card payment, simulate gateway authentication animation
    if (selectedMethod === 'card') {
      setGatewayStep('processing');
      await new Promise(res => setTimeout(res, 1600));
    }

    try {
      const cleanCardNum = cardNumber.replace(/\s/g, '');
      const lastFour = cleanCardNum.slice(-4) || (posCardDigits.slice(-4) || undefined);

      const payload: any = {
        invoice: invoice._id || invoice.id,
        amount: amountToPay,
        paymentMethod: selectedMethod,
        referenceNumber:
          selectedMethod === 'bank_transfer'
            ? transferRef
            : selectedMethod === 'card_machine'
            ? posAuthCode
            : selectedMethod === 'cheque'
            ? chequeNumber
            : `CARD-${Date.now().toString().slice(-6)}`,
        payerName: payerName || cardHolder || undefined,
        payerPhone: payerPhone || undefined,
        notes: notes || undefined,
      };

      if (selectedMethod === 'card') {
        payload.lastFourDigits = lastFour;
        payload.cardType = cleanCardNum.startsWith('4') ? 'Visa' : 'Mastercard';
        payload.cardHolderName = cardHolder;
      } else if (selectedMethod === 'bank_transfer') {
        payload.bankName = transferBank;
      } else if (selectedMethod === 'cheque') {
        payload.bankName = chequeBank;
        payload.chequeNumber = chequeNumber;
        payload.chequeDate = chequeDate;
      } else if (selectedMethod === 'card_machine') {
        payload.terminalId = posTerminalId || 'POS-01';
        payload.authCode = posAuthCode;
        payload.lastFourDigits = posCardDigits;
      }

      const res = await paymentApi.createPayment(payload);

      if (res.success) {
        setGatewayStep('success');
        toast.success(res.message || 'Payment submitted successfully!');
        setTimeout(() => {
          setIsSubmitting(false);
          onSuccess();
          onClose();
        }, 1800);
      } else {
        setIsSubmitting(false);
        setGatewayStep('form');
        toast.error(res.message || 'Payment submission failed');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setGatewayStep('form');
      toast.error(err.response?.data?.message || 'Error submitting payment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white p-6 relative">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-brand-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Secure Payment Gateway</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Pay Invoice {invoice.invoiceNumber}
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300">
            {invoice.vehicle?.registrationNumber && (
              <span>Vehicle: <strong className="text-white">{invoice.vehicle.registrationNumber}</strong></span>
            )}
            <span>·</span>
            <span>Total Outstanding: <strong className="text-amber-400 font-bold">{formatLKR(maxPayable)}</strong></span>
          </div>
        </div>

        {gatewayStep === 'processing' ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand-50 border-4 border-brand-500 border-t-transparent animate-spin mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6 text-brand-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Processing Payment...</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Connecting securely to the payment network and preparing verification details. Please do not refresh.
            </p>
          </div>
        ) : gatewayStep === 'success' ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Payment Submitted!</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 max-w-md mx-auto flex items-start gap-2 text-left">
              <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <strong>Pending Manager Verification:</strong> Your payment of <strong>{formatLKR(amountToPay)}</strong> has been recorded. Once the workshop manager verifies the transaction, the invoice balance will automatically update.
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Payment Amount Choice */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Select Amount to Pay
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPayType('full');
                    setCustomAmount(maxPayable.toString());
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    payType === 'full'
                      ? 'border-brand-600 bg-brand-50/70 text-brand-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-medium text-slate-500">Pay Full Balance</div>
                  <div className="text-base font-extrabold text-brand-700">{formatLKR(maxPayable)}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPayType('custom')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    payType === 'custom'
                      ? 'border-brand-600 bg-brand-50/70 text-brand-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-medium text-slate-500">Pay Custom Amount</div>
                  <div className="text-sm font-bold text-slate-800">Partial Payment</div>
                </button>
              </div>

              {payType === 'custom' && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Enter Amount (LKR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      LKR
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max={maxPayable}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-hidden"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Select Payment Method
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'card', label: 'Card Payment', icon: CreditCard, subtitle: 'Online Gateway' },
                  { id: 'cash', label: 'Cash', icon: Banknote, subtitle: 'At Counter' },
                  { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2, subtitle: 'Direct Deposit' },
                  { id: 'cheque', label: 'Cheque', icon: FileCheck2, subtitle: 'Bank Cheque' },
                  { id: 'card_machine', label: 'Card Machine', icon: Smartphone, subtitle: 'POS Terminal' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedMethod(item.id as PaymentMethod)}
                      className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold leading-tight">{item.label}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{item.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Method-specific Form Fields */}
            <div className="border-t border-slate-100 pt-4">
              {/* 1. Credit / Debit Card */}
              {selectedMethod === 'card' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700">Card Information</span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">VISA</span>
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">Mastercard</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Card Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-mono tracking-wider focus:ring-2 focus:ring-brand-500 outline-hidden"
                        maxLength={19}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="e.g. BOC BANK"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm uppercase focus:ring-2 focus:ring-brand-500 outline-hidden"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Expiration Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-center font-mono focus:ring-2 focus:ring-brand-500 outline-hidden"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Security Code (CVV)</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="password"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm text-center font-mono focus:ring-2 focus:ring-brand-500 outline-hidden"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>256-bit SSL encrypted. Payment details will be sent to manager for verification.</span>
                  </div>
                </div>
              )}

              {/* 2. Cash Payment */}
              {selectedMethod === 'cash' && (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">
                    <p className="font-semibold mb-1">Cash Payment at Counter</p>
                    <p>
                      Please visit our customer service desk to hand over the cash. Enter your details below so the manager can cross-check and approve your receipt.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Payer Name</label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Contact Phone</label>
                      <input
                        type="text"
                        placeholder="077 123 4567"
                        value={payerPhone}
                        onChange={(e) => setPayerPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Counter Receipt / Notes (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Paid at Bay 2 counter to Cashier"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* 3. Bank Transfer */}
              {selectedMethod === 'bank_transfer' && (
                <div className="space-y-3">
                  {/* Company Bank Account Details Card */}
                  <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 text-xs space-y-1">
                    <div className="font-bold text-brand-400 text-xs uppercase tracking-wider">
                      VSMS Official Bank Accounts
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 border-t border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-400">Bank:</span> Commercial Bank of Ceylon<br />
                        <span className="text-slate-400">Account:</span> <strong className="text-white font-mono">1000 8945 2311</strong><br />
                        <span className="text-slate-400">Branch:</span> Colombo Main
                      </div>
                      <div>
                        <span className="text-slate-400">Bank:</span> Sampath Bank PLC<br />
                        <span className="text-slate-400">Account:</span> <strong className="text-white font-mono">0124 5567 8901</strong><br />
                        <span className="text-slate-400">Branch:</span> City Branch
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Transferred From Bank</label>
                      <input
                        type="text"
                        placeholder="e.g. Commercial Bank / HNB / BOC"
                        value={transferBank}
                        onChange={(e) => setTransferBank(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Transfer Date</label>
                      <input
                        type="date"
                        value={transferDate}
                        onChange={(e) => setTransferDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Transaction Reference / Slip Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FT260915123456 or Bank Slip No"
                      value={transferRef}
                      onChange={(e) => setTransferRef(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500 outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Additional Notes (Optional)</label>
                    <input
                      type="text"
                      placeholder="Account holder name or remarks"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* 4. Cheque */}
              {selectedMethod === 'cheque' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Cheque Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 004521"
                        value={chequeNumber}
                        onChange={(e) => setChequeNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500 outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Bank Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hatton National Bank"
                        value={chequeBank}
                        onChange={(e) => setChequeBank(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cheque Date</label>
                    <input
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cheque Drawer / Remarks (Optional)</label>
                    <input
                      type="text"
                      placeholder="Drawer name or branch details"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* 5. Card Machine (POS) */}
              {selectedMethod === 'card_machine' && (
                <div className="space-y-3">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800">
                    <p className="font-semibold mb-1">Card Machine (POS Terminal) Transaction</p>
                    <p>Enter the transaction authorization code from the POS printed slip.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Approval / Auth Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. APP-948210"
                        value={posAuthCode}
                        onChange={(e) => setPosAuthCode(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500 outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Terminal ID</label>
                      <input
                        type="text"
                        placeholder="POS-01 (Bay counter)"
                        value={posTerminalId}
                        onChange={(e) => setPosTerminalId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Card Last 4 Digits</label>
                    <input
                      type="text"
                      placeholder="e.g. 5432"
                      value={posCardDigits}
                      onChange={(e) => setPosCardDigits(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500 outline-hidden"
                      maxLength={4}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Manager Verification Notice */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <span>
                <strong>Manager Verification:</strong> Submitted payments are flagged as <strong>Pending Verification</strong> until verified by our service center manager.
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || amountToPay <= 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Submit Payment ({formatLKR(amountToPay)})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
