import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatDate } from './formatters';

export interface PrintableJobCardData {
  _id?: string;
  id?: string;
  jobCardNumber: string;
  createdAt: string;
  completedAt?: string;
  vehicle?: {
    registrationNumber?: string;
    make?: string;
    model?: string;
    year?: number | string;
    color?: string;
  };
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
  };
  serviceType?: string;
  complaint?: string;
  assignedTechnician?: {
    firstName?: string;
    lastName?: string;
    user?: {
      firstName?: string;
      lastName?: string;
    };
    name?: string;
  };
  odometer?: number;
  status?: string;
  workPerformed?: string[];
  inspectionNotes?: string;
  parts?: Array<{
    name: string;
    quantity: number;
  }>;
  roadTest?: {
    result: string;
    remarks?: string;
  };
  finalInspection?: {
    mechanicRemarks?: string;
    remainingIssues?: string;
    futureRecommendations?: string;
  };
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

const REPORT_STYLES = `
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .report-container {
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
  .report-title-block {
    text-align: right;
  }
  .report-title {
    font-size: 24px;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 4px 0;
    letter-spacing: -0.5px;
  }
  .report-num {
    font-size: 15px;
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
  .badge-completed {
    background-color: #dcfce7;
    color: #15803d;
    border: 1px solid #86efac;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
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
    margin-bottom: 18px;
  }
  .section-title {
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #334155;
    margin: 0 0 8px 0;
  }
  .detail-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 12px;
    color: #334155;
    line-height: 1.5;
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
  .status-pill {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 9999px;
  }
  .status-pass {
    background-color: #dcfce7;
    color: #15803d;
  }
  .status-fail {
    background-color: #fee2e2;
    color: #b91c1c;
  }
  .work-list {
    margin: 0;
    padding-left: 20px;
  }
  .work-list li {
    margin-bottom: 4px;
    font-size: 12px;
  }
  .footer-section {
    margin-top: 32px;
    padding-top: 18px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    page-break-inside: avoid;
  }
  .footer-disclaimer {
    font-size: 11px;
    color: #94a3b8;
    max-width: 380px;
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

export const getServiceReportHtml = (jobCard: PrintableJobCardData): string => {
  // Resolve Vehicle Details
  const vehicle = jobCard.vehicle;
  const vehicleReg = vehicle?.registrationNumber || 'N/A';
  const vehicleDetails = vehicle
    ? `${vehicle.make || ''} ${vehicle.model || ''}${vehicle.year ? ` (${vehicle.year})` : ''}`.trim()
    : 'Vehicle';

  // Resolve Customer Details
  const customerUser = jobCard.customer?.user;
  const customerName = customerUser?.firstName
    ? `${customerUser.firstName} ${customerUser.lastName || ''}`.trim()
    : (jobCard.customer?.name || 'Valued Customer');
  const customerPhone = customerUser?.mobile || jobCard.customer?.phone || '';
  const customerEmail = customerUser?.email || jobCard.customer?.email || '';

  // Resolve Mechanic
  const tech = jobCard.assignedTechnician;
  const techUser = tech?.user || tech;
  const technicianName = techUser?.firstName
    ? `${techUser.firstName} ${techUser.lastName || ''}`.trim()
    : (tech?.name || 'Assigned Technician');

  // Work performed
  const workItems = jobCard.workPerformed && jobCard.workPerformed.length > 0
    ? jobCard.workPerformed
    : [jobCard.complaint || 'Scheduled maintenance & inspection'];

  // Parts
  const partsHtml = jobCard.parts && jobCard.parts.length > 0
    ? `
      <div class="section-container">
        <div class="section-title">Parts &amp; Consumables Replaced</div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;" class="text-center">#</th>
              <th>Part Name / Description</th>
              <th style="width: 100px;" class="text-center">Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${jobCard.parts.map((p, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td><strong>${escapeHtml(p.name)}</strong></td>
                <td class="text-center">x${p.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
    : '';

  return `
    <div class="report-container">
      <style>${REPORT_STYLES}</style>

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
        <div class="report-title-block">
          <div class="report-title">SERVICE REPORT</div>
          <div class="report-num">${escapeHtml(jobCard.jobCardNumber)}</div>
          <div class="badge badge-completed">COMPLETED SERVICE</div>
        </div>
      </div>

      <!-- 3-Column Info Cards -->
      <div class="meta-grid">
        <div class="meta-card">
          <h4>Vehicle Details</h4>
          <p class="strong-text">${escapeHtml(vehicleReg)}</p>
          <p>${escapeHtml(vehicleDetails)}</p>
          <p>Mileage: <strong>${jobCard.odometer ? `${jobCard.odometer.toLocaleString()} km` : 'Recorded'}</strong></p>
        </div>
        <div class="meta-card">
          <h4>Customer Details</h4>
          <p class="strong-text">${escapeHtml(customerName)}</p>
          ${customerPhone ? `<p>Tel: ${escapeHtml(customerPhone)}</p>` : ''}
          ${customerEmail ? `<p>Email: ${escapeHtml(customerEmail)}</p>` : ''}
        </div>
        <div class="meta-card">
          <h4>Service Details</h4>
          <p>Date: <strong>${formatDate(jobCard.createdAt)}</strong></p>
          <p>Technician: <strong>${escapeHtml(technicianName)}</strong></p>
          <p>Warranty: <strong style="color: #15803d;">Active Warranty</strong></p>
        </div>
      </div>

      <!-- Work Performed -->
      <div class="section-container">
        <div class="section-title">Work Performed</div>
        <div class="detail-box">
          <ul class="work-list">
            ${workItems.map(w => `<li>${escapeHtml(w)}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Inspection Notes -->
      ${jobCard.inspectionNotes ? `
        <div class="section-container">
          <div class="section-title">Inspection Notes</div>
          <div class="detail-box">
            <p style="margin: 0;">${escapeHtml(jobCard.inspectionNotes)}</p>
          </div>
        </div>
      ` : ''}

      <!-- Parts Replaced -->
      ${partsHtml}

      <!-- Road Test -->
      ${jobCard.roadTest ? `
        <div class="section-container">
          <div class="section-title">Road Test Assessment</div>
          <div class="detail-box" style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <span>Road Test Result:</span>
              <span class="status-pill ${jobCard.roadTest.result === 'pass' ? 'status-pass' : 'status-fail'}" style="margin-left: 8px;">
                ${jobCard.roadTest.result === 'pass' ? 'Passing' : 'Needs Further Review'}
              </span>
            </div>
            ${jobCard.roadTest.remarks ? `<span style="font-style: italic; color: #64748b;">${escapeHtml(jobCard.roadTest.remarks)}</span>` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Mechanic Remarks / Recommendations -->
      ${(jobCard.finalInspection?.mechanicRemarks || jobCard.finalInspection?.futureRecommendations || jobCard.finalInspection?.remainingIssues) ? `
        <div class="section-container">
          <div class="section-title">Technician Feedback &amp; Recommendations</div>
          <div class="detail-box">
            ${jobCard.finalInspection?.mechanicRemarks ? `<p style="margin: 0 0 6px 0;"><strong>Remarks:</strong> ${escapeHtml(jobCard.finalInspection.mechanicRemarks)}</p>` : ''}
            ${jobCard.finalInspection?.futureRecommendations ? `<p style="margin: 0 0 6px 0;"><strong>Recommendations:</strong> ${escapeHtml(jobCard.finalInspection.futureRecommendations)}</p>` : ''}
            ${jobCard.finalInspection?.remainingIssues ? `<p style="margin: 0; color: #dc2626;"><strong>Remaining Issues:</strong> ${escapeHtml(jobCard.finalInspection.remainingIssues)}</p>` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Footer & Signatures -->
      <div class="footer-section">
        <div class="footer-disclaimer">
          This service report certify that the listed maintenance procedures were completed according to manufacturer standards.<br>
          Electronically verified by VSMS.LK Vehicle Service Center.
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Certified Technician Sign</div>
        </div>
      </div>
    </div>
  `;
};

export const printServiceReport = (jobCard: PrintableJobCardData): void => {
  if (!jobCard) return;

  const content = getServiceReportHtml(jobCard);
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Service-Report-${escapeHtml(jobCard.jobCardNumber)}</title>
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
    iframe.contentWindow.document.title = `Service-Report-${jobCard.jobCardNumber || 'Document'}`;
  }

  let hasPrinted = false;
  const executePrint = () => {
    if (hasPrinted) return;
    hasPrinted = true;

    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Error invoking print dialog for service report:', err);
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

export const downloadServiceReportPDF = async (jobCard: PrintableJobCardData): Promise<void> => {
  if (!jobCard) return;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1e293b';
  container.style.zIndex = '-9999';
  container.innerHTML = getServiceReportHtml(jobCard);
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

    const cleanJobNumber = (jobCard.jobCardNumber || 'Document').replace(/[^a-zA-Z0-9-_]/g, '-');
    pdf.save(`Service-Report-${cleanJobNumber}.pdf`);
  } catch (error) {
    console.error('Error downloading service report PDF:', error);
    printServiceReport(jobCard);
    throw error;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};
