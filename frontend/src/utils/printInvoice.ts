import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatLKR, formatDate } from './formatters';

export interface PrintableInvoiceData {
  _id?: string;
  id?: string;
  invoiceNumber: string;
  createdAt: string;
  dueDate?: string;
  paymentStatus?: 'paid' | 'partially_paid' | 'unpaid' | string;
  jobCard?: {
    jobCardNumber?: string;
    complaint?: string;
  } | string;
  vehicle?: {
    registrationNumber?: string;
    make?: string;
    model?: string;
    year?: number | string;
    color?: string;
  } | string;
  customer?: {
    name?: string;
    user?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      mobile?: string;
    };
    phone?: string;
    email?: string;
  } | string;
  items?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    discount?: number;
    total?: number;
  }>;
  laborCharges?: Array<{
    description: string;
    hours?: number;
    ratePerHour?: number;
    total?: number;
  }>;
  subtotal?: number;
  discount?: number;
  taxRate?: number;
  taxAmount?: number;
  grandTotal: number;
  amountPaid?: number;
  outstandingBalance?: number;
  notes?: string;
}

export interface PrintablePayment {
  _id?: string;
  paymentId?: string;
  paymentDate?: string;
  createdAt?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  amount: number;
  status?: string;
}

function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const INVOICE_STYLES = `
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .invoice-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    font-size: 13px;
    line-height: 1.5;
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
  }
  .header-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #2563eb;
    padding-bottom: 18px;
    margin-bottom: 20px;
  }
  .brand-info h1 {
    font-size: 26px;
    font-weight: 900;
    color: #1d4ed8;
    margin: 0 0 4px 0;
    letter-spacing: -0.5px;
  }
  .brand-info .tagline {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .brand-info .contacts {
    margin-top: 8px;
    font-size: 12px;
    color: #475569;
    line-height: 1.4;
  }
  .invoice-title-block {
    text-align: right;
  }
  .invoice-title {
    font-size: 30px;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 4px 0;
    letter-spacing: -0.5px;
  }
  .invoice-num {
    font-size: 16px;
    font-weight: 800;
    color: #2563eb;
    margin-bottom: 6px;
  }
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge-paid {
    background-color: #dcfce7;
    color: #15803d;
    border: 1px solid #86efac;
  }
  .badge-partially-paid {
    background-color: #fef3c7;
    color: #b45309;
    border: 1px solid #fde68a;
  }
  .badge-unpaid {
    background-color: #fee2e2;
    color: #b91c1c;
    border: 1px solid #fca5a5;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
  }
  .meta-card h4 {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #64748b;
    margin: 0 0 6px 0;
  }
  .meta-card p {
    margin: 0 0 3px 0;
    font-size: 12px;
    color: #334155;
  }
  .meta-card .strong-text {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
  }
  .section-container {
    margin-bottom: 20px;
  }
  .section-title {
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #334155;
    margin: 0 0 8px 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin-bottom: 6px;
  }
  th {
    background-color: #f1f5f9;
    color: #475569;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.5px;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    text-align: left;
  }
  td {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    color: #1e293b;
  }
  tr:nth-child(even) td {
    background-color: #fcfcfd;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-muted { color: #94a3b8; font-style: italic; }
  .font-semibold { font-weight: 700; }
  .status-pill {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 9999px;
    text-transform: capitalize;
  }
  .status-completed, .status-verified, .status-paid {
    background-color: #dcfce7;
    color: #15803d;
  }
  .status-pending {
    background-color: #fef3c7;
    color: #b45309;
  }
  .status-rejected {
    background-color: #fee2e2;
    color: #b91c1c;
  }
  .summary-block {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-top: 16px;
    page-break-inside: avoid;
  }
  .terms-note {
    flex: 1;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px;
    font-size: 12px;
  }
  .terms-note h5 {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: #475569;
    margin: 0 0 6px 0;
  }
  .terms-note p {
    margin: 0 0 4px 0;
    color: #64748b;
    line-height: 1.4;
  }
  .calculation-card {
    width: 320px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
  }
  .calc-row {
    display: flex;
    justify-content: space-between;
    padding: 7px 14px;
    font-size: 12px;
    border-bottom: 1px solid #f1f5f9;
  }
  .calc-row:last-child {
    border-bottom: none;
  }
  .calc-row.grand-total {
    background: #eff6ff;
    border-top: 2px solid #2563eb;
    border-bottom: 2px solid #2563eb;
    font-size: 14px;
    font-weight: 800;
    color: #1d4ed8;
    padding: 10px 14px;
  }
  .calc-row.balance-due {
    font-weight: 800;
    font-size: 13px;
  }
  .text-red { color: #dc2626; }
  .text-green { color: #16a34a; }
  .footer-section {
    margin-top: 36px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    page-break-inside: avoid;
  }
  .footer-disclaimer {
    font-size: 11px;
    color: #94a3b8;
    max-width: 360px;
    line-height: 1.4;
  }
  .signature-box {
    text-align: center;
    width: 180px;
  }
  .signature-line {
    border-bottom: 1px dashed #94a3b8;
    height: 38px;
    margin-bottom: 6px;
  }
  .signature-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
  }
`;

export const getInvoiceHtml = (
  invoice: PrintableInvoiceData,
  payments: PrintablePayment[] = []
): string => {
  // Resolve Customer Details
  const customerObj = typeof invoice.customer === 'object' ? invoice.customer : null;
  const customerUser = customerObj?.user;
  const customerName = customerUser?.firstName
    ? `${customerUser.firstName} ${customerUser.lastName || ''}`.trim()
    : (customerObj?.name || (typeof invoice.customer === 'string' ? invoice.customer : 'Valued Customer'));
  const customerEmail = customerUser?.email || customerObj?.email || '';
  const customerPhone = customerUser?.mobile || customerObj?.phone || '';

  // Resolve Vehicle Details
  const vehicleObj = typeof invoice.vehicle === 'object' ? invoice.vehicle : null;
  const vehicleReg = vehicleObj?.registrationNumber || (typeof invoice.vehicle === 'string' ? invoice.vehicle : 'N/A');
  const vehicleDetails = vehicleObj
    ? `${vehicleObj.make || ''} ${vehicleObj.model || ''}${vehicleObj.year ? ` (${vehicleObj.year})` : ''}`.trim()
    : '';

  // Resolve Job Card
  const jobCardObj = typeof invoice.jobCard === 'object' ? invoice.jobCard : null;
  const jobCardNumber = jobCardObj?.jobCardNumber || (typeof invoice.jobCard === 'string' ? invoice.jobCard : 'N/A');

  // Determine Payment Status Badge
  const outstanding = invoice.outstandingBalance ?? (invoice.grandTotal - (invoice.amountPaid || 0));
  const amountPaid = invoice.amountPaid || 0;
  let statusText = 'UNPAID';
  let statusBadgeClass = 'badge-unpaid';

  if (outstanding <= 0 || invoice.paymentStatus === 'paid') {
    statusText = 'PAID IN FULL';
    statusBadgeClass = 'badge-paid';
  } else if (amountPaid > 0) {
    statusText = 'PARTIALLY PAID';
    statusBadgeClass = 'badge-partially-paid';
  }

  // Items table rows
  const itemsHtml = invoice.items && invoice.items.length > 0
    ? invoice.items
        .map((item, index) => {
          const qty = item.quantity || 1;
          const unitPrice = item.unitPrice || 0;
          const total = item.total ?? (qty * unitPrice);
          return `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td><strong>${escapeHtml(item.description)}</strong></td>
              <td class="text-center">${qty}</td>
              <td class="text-right">${formatLKR(unitPrice)}</td>
              <td class="text-right font-semibold">${formatLKR(total)}</td>
            </tr>
          `;
        })
        .join('')
    : `<tr><td colspan="5" class="text-center text-muted">No spare parts or items recorded.</td></tr>`;

  // Labor charges table rows
  const laborHtml = invoice.laborCharges && invoice.laborCharges.length > 0
    ? invoice.laborCharges
        .map((labor, index) => {
          const hours = labor.hours || 0;
          const rate = labor.ratePerHour || 0;
          const total = labor.total ?? (hours * rate);
          return `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td><strong>${escapeHtml(labor.description)}</strong></td>
              <td class="text-center">${hours} hrs</td>
              <td class="text-right">${formatLKR(rate)}/hr</td>
              <td class="text-right font-semibold">${formatLKR(total)}</td>
            </tr>
          `;
        })
        .join('')
    : `<tr><td colspan="5" class="text-center text-muted">No labor charges recorded.</td></tr>`;

  // Payments rows (if any)
  const paymentsHtml = payments.length > 0
    ? `
      <div class="section-container">
        <div class="section-title">Payment History &amp; Receipts</div>
        <table>
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Date</th>
              <th>Payment Method</th>
              <th>Reference</th>
              <th>Status</th>
              <th class="text-right">Amount Paid</th>
            </tr>
          </thead>
          <tbody>
            ${payments.map(p => `
              <tr>
                <td><strong>${escapeHtml(p.paymentId || 'Payment')}</strong></td>
                <td>${formatDate(p.paymentDate || p.createdAt || '')}</td>
                <td style="text-transform: capitalize;">${escapeHtml((p.paymentMethod || 'cash').replace(/_/g, ' '))}</td>
                <td>${escapeHtml(p.referenceNumber || 'N/A')}</td>
                <td><span class="status-pill status-${(p.status || 'completed').toLowerCase()}">${escapeHtml(p.status || 'Verified')}</span></td>
                <td class="text-right font-semibold">${formatLKR(p.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
    : '';

  const subtotal = invoice.subtotal || invoice.grandTotal;
  const discount = invoice.discount || 0;
  const taxRate = invoice.taxRate || 0;
  const taxAmount = invoice.taxAmount || 0;

  return `
    <div class="invoice-container">
      <style>${INVOICE_STYLES}</style>
      
      <!-- Header -->
      <div class="header-bar">
        <div class="brand-info">
          <h1>VSMS.LK</h1>
          <div class="tagline">Vehicle Service Management System Pro</div>
          <div class="contacts">
            123 Galle Road, Colombo 03, Sri Lanka<br>
            Tel: +94 11 234 5678 &bull; Email: service@vsms.lk &bull; Web: www.vsms.lk
          </div>
        </div>
        <div class="invoice-title-block">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-num">${escapeHtml(invoice.invoiceNumber)}</div>
          <div class="badge ${statusBadgeClass}">${statusText}</div>
        </div>
      </div>

      <!-- 3-Column Info Cards -->
      <div class="meta-grid">
        <div class="meta-card">
          <h4>Customer Details</h4>
          <p class="strong-text">${escapeHtml(customerName)}</p>
          ${customerPhone ? `<p>Tel: ${escapeHtml(customerPhone)}</p>` : ''}
          ${customerEmail ? `<p>Email: ${escapeHtml(customerEmail)}</p>` : ''}
        </div>
        <div class="meta-card">
          <h4>Vehicle Details</h4>
          <p class="strong-text">${escapeHtml(vehicleReg)}</p>
          ${vehicleDetails ? `<p>${escapeHtml(vehicleDetails)}</p>` : ''}
          <p>Job Card: <strong>${escapeHtml(jobCardNumber)}</strong></p>
        </div>
        <div class="meta-card">
          <h4>Invoice Info</h4>
          <p>Invoice Date: <strong>${formatDate(invoice.createdAt)}</strong></p>
          ${invoice.dueDate ? `<p>Due Date: <strong>${formatDate(invoice.dueDate)}</strong></p>` : ''}
          <p>Payment Terms: Due upon receipt</p>
        </div>
      </div>

      <!-- Parts / Items Section -->
      <div class="section-container">
        <div class="section-title">Parts &amp; Items Replaced</div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;" class="text-center">#</th>
              <th>Description</th>
              <th style="width: 60px;" class="text-center">Qty</th>
              <th style="width: 110px;" class="text-right">Unit Price</th>
              <th style="width: 120px;" class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <!-- Labor Charges Section -->
      <div class="section-container">
        <div class="section-title">Labor &amp; Service Charges</div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;" class="text-center">#</th>
              <th>Service Description</th>
              <th style="width: 80px;" class="text-center">Hours</th>
              <th style="width: 110px;" class="text-right">Hourly Rate</th>
              <th style="width: 120px;" class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${laborHtml}
          </tbody>
        </table>
      </div>

      <!-- Summary Block -->
      <div class="summary-block">
        <div class="terms-note">
          <h5>Remarks &amp; Terms</h5>
          <p>${invoice.notes ? escapeHtml(invoice.notes) : 'All services and parts supplied are covered by our standard workshop service warranty.'}</p>
          <p>Payments can be made online via credit/debit card or at the service center cashier desk.</p>
        </div>

        <div class="calculation-card">
          <div class="calc-row">
            <span>Subtotal:</span>
            <span class="font-semibold">${formatLKR(subtotal)}</span>
          </div>
          ${discount > 0 ? `
            <div class="calc-row">
              <span>Discount:</span>
              <span class="font-semibold text-green">- ${formatLKR(discount)}</span>
            </div>
          ` : ''}
          ${(taxAmount > 0 || taxRate > 0) ? `
            <div class="calc-row">
              <span>Tax (${taxRate}%):</span>
              <span class="font-semibold">${formatLKR(taxAmount)}</span>
            </div>
          ` : ''}
          <div class="calc-row grand-total">
            <span>Grand Total:</span>
            <span>${formatLKR(invoice.grandTotal)}</span>
          </div>
          <div class="calc-row">
            <span>Amount Paid:</span>
            <span class="font-semibold">${formatLKR(amountPaid)}</span>
          </div>
          <div class="calc-row balance-due">
            <span>Outstanding Balance:</span>
            <span class="${outstanding > 0 ? 'text-red' : 'text-green'}">${formatLKR(outstanding)}</span>
          </div>
        </div>
      </div>

      <!-- Payment History (if any) -->
      ${paymentsHtml}

      <!-- Footer & Signature -->
      <div class="footer-section">
        <div class="footer-disclaimer">
          Thank you for trusting VSMS.LK Vehicle Service Center with your vehicle!<br>
          This is an electronically generated document.
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Authorized Workshop Sign</div>
        </div>
      </div>
    </div>
  `;
};

export const printInvoice = (
  invoice: PrintableInvoiceData,
  payments: PrintablePayment[] = []
): void => {
  if (!invoice) return;

  const content = getInvoiceHtml(invoice, payments);
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${escapeHtml(invoice.invoiceNumber)}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        body {
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;

  // Create isolated invisible iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    if (document.body.contains(iframe)) document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(fullHtml);
  doc.close();

  if (iframe.contentWindow) {
    iframe.contentWindow.document.title = `Invoice-${invoice.invoiceNumber || 'Document'}`;
  }

  let hasPrinted = false;
  const executePrint = () => {
    if (hasPrinted) return;
    hasPrinted = true;

    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Error invoking print dialog for invoice:', err);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  };

  if (iframe.contentWindow) {
    iframe.contentWindow.onload = () => {
      setTimeout(executePrint, 150);
    };
  }
  setTimeout(executePrint, 500);
};

export const downloadInvoicePDF = async (
  invoice: PrintableInvoiceData,
  payments: PrintablePayment[] = []
): Promise<void> => {
  if (!invoice) return;

  // Create an off-screen render container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1e293b';
  container.style.zIndex = '-9999';
  container.innerHTML = getInvoiceHtml(invoice, payments);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    const cleanInvoiceNumber = (invoice.invoiceNumber || 'Document').replace(/[^a-zA-Z0-9-_]/g, '-');
    pdf.save(`Invoice-${cleanInvoiceNumber}.pdf`);
  } catch (error) {
    console.error('Error generating PDF file with canvas:', error);
    // Fallback to print method if canvas fails
    printInvoice(invoice, payments);
    throw error;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};
