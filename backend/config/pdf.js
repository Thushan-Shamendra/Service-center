import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateInvoicePDF = async (invoice, customer, vehicle) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const pdfPath = path.join(process.env.UPLOAD_PATH || './uploads', 'pdfs', `invoice-${invoice.invoiceNumber}.pdf`);
      
      // Ensure directory exists
      const pdfDir = path.dirname(pdfPath);
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).fillColor('#0000FF').text('VSMS - Vehicle Service Management System', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).fillColor('#000000').text('Invoice', { align: 'center' });
      doc.moveDown();

      // Invoice details
      doc.fontSize(10).text(`Invoice Number: ${invoice.invoiceNumber}`);
      doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-GB')}`);
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}`);
      doc.moveDown();

      // Customer details
      doc.fontSize(12).fillColor('#0000FF').text('Customer Details');
      doc.fontSize(10).fillColor('#000000');
      if (customer?.user) {
        doc.text(`Name: ${customer.user.firstName} ${customer.user.lastName}`);
        doc.text(`Email: ${customer.user.email}`);
        doc.text(`Mobile: ${customer.user.mobile}`);
      }
      doc.moveDown();

      // Vehicle details
      doc.fontSize(12).fillColor('#0000FF').text('Vehicle Details');
      doc.fontSize(10).fillColor('#000000');
      if (vehicle) {
        doc.text(`Registration: ${vehicle.registrationNumber}`);
        doc.text(`Make: ${vehicle.make}`);
        doc.text(`Model: ${vehicle.model}`);
      }
      doc.moveDown();

      // Items table
      doc.fontSize(12).fillColor('#0000FF').text('Service Items');
      doc.moveDown();

      let y = doc.y;
      doc.fontSize(10).fillColor('#000000');
      
      // Table header
      doc.text('Description', 50, y);
      doc.text('Qty', 300, y);
      doc.text('Unit Price', 350, y);
      doc.text('Total', 450, y);
      
      y += 20;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      // Items
      invoice.items?.forEach(item => {
        doc.text(item.description || item.itemName || 'Service', 50, y);
        doc.text(item.quantity?.toString() || '1', 300, y);
        doc.text(`Rs. ${item.unitPrice?.toLocaleString() || item.price?.toLocaleString() || 0}`, 350, y);
        doc.text(`Rs. ${(item.total || item.quantity * item.unitPrice || 0).toLocaleString()}`, 450, y);
        y += 20;
      });

      // Labor charges
      if (invoice.laborCharges && invoice.laborCharges.length > 0) {
        invoice.laborCharges.forEach(labor => {
          doc.text(labor.description, 50, y);
          doc.text(labor.hours?.toString() || '1', 300, y);
          doc.text(`Rs. ${labor.ratePerHour?.toLocaleString() || 0}`, 350, y);
          doc.text(`Rs. ${labor.total?.toLocaleString() || 0}`, 450, y);
          y += 20;
        });
      }

      y += 10;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 20;

      // Totals
      doc.text(`Subtotal:`, 350, y);
      doc.text(`Rs. ${invoice.subtotal?.toLocaleString() || 0}`, 450, y);
      y += 15;

      doc.text(`Discount:`, 350, y);
      doc.text(`Rs. ${invoice.discount?.toLocaleString() || 0}`, 450, y);
      y += 15;

      doc.text(`Tax (${invoice.taxRate || 0}%):`, 350, y);
      doc.text(`Rs. ${invoice.taxAmount?.toLocaleString() || 0}`, 450, y);
      y += 20;

      doc.fontSize(12).fillColor('#0000FF').text(`Grand Total:`, 350, y);
      doc.text(`Rs. ${invoice.grandTotal?.toLocaleString() || 0}`, 450, y);
      y += 25;

      doc.fontSize(10).fillColor('#000000');
      doc.text(`Amount Paid: Rs. ${invoice.amountPaid?.toLocaleString() || 0}`, 350, y);
      y += 15;
      doc.text(`Outstanding: Rs. ${invoice.outstandingBalance?.toLocaleString() || 0}`, 350, y);
      y += 25;

      // Notes
      if (invoice.notes) {
        doc.fontSize(12).fillColor('#0000FF').text('Notes');
        doc.fontSize(10).fillColor('#000000').text(invoice.notes);
      }

      // Footer
      doc.fontSize(8).fillColor('#666666').text('Thank you for your business!', { align: 'center' });
      doc.text('VSMS - Vehicle Service Management System', { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

export const generateQuotationPDF = async (quotation, customer, vehicle) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const pdfPath = path.join(process.env.UPLOAD_PATH || './uploads', 'pdfs', `quotation-${quotation.quotationNumber}.pdf`);
      
      const pdfDir = path.dirname(pdfPath);
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).fillColor('#0000FF').text('VSMS - Vehicle Service Management System', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).fillColor('#000000').text('Quotation', { align: 'center' });
      doc.moveDown();

      // Quotation details
      doc.fontSize(10).text(`Quotation Number: ${quotation.quotationNumber}`);
      doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString('en-GB')}`);
      doc.text(`Valid Until: ${new Date(quotation.validUntil).toLocaleDateString('en-GB')}`);
      doc.moveDown();

      // Customer details
      doc.fontSize(12).fillColor('#0000FF').text('Customer Details');
      doc.fontSize(10).fillColor('#000000');
      if (customer?.user) {
        doc.text(`Name: ${customer.user.firstName} ${customer.user.lastName}`);
        doc.text(`Email: ${customer.user.email}`);
        doc.text(`Mobile: ${customer.user.mobile}`);
      }
      doc.moveDown();

      // Vehicle details
      doc.fontSize(12).fillColor('#0000FF').text('Vehicle Details');
      doc.fontSize(10).fillColor('#000000');
      if (vehicle) {
        doc.text(`Registration: ${vehicle.registrationNumber}`);
        doc.text(`Make: ${vehicle.make}`);
        doc.text(`Model: ${vehicle.model}`);
      }
      doc.moveDown();

      // Items table
      doc.fontSize(12).fillColor('#0000FF').text('Quoted Items');
      doc.moveDown();

      let y = doc.y;
      doc.fontSize(10).fillColor('#000000');
      
      // Table header
      doc.text('Description', 50, y);
      doc.text('Qty', 300, y);
      doc.text('Unit Price', 350, y);
      doc.text('Total', 450, y);
      
      y += 20;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      // Items
      quotation.items?.forEach(item => {
        doc.text(item.description || item.partName || 'Item', 50, y);
        doc.text(item.quantity?.toString() || '1', 300, y);
        doc.text(`Rs. ${item.unitPrice?.toLocaleString() || 0}`, 350, y);
        doc.text(`Rs. ${(item.total || item.quantity * item.unitPrice || 0).toLocaleString()}`, 450, y);
        y += 20;
      });

      y += 10;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 20;

      // Totals
      doc.text(`Subtotal:`, 350, y);
      doc.text(`Rs. ${quotation.subtotal?.toLocaleString() || 0}`, 450, y);
      y += 15;

      doc.text(`Labor Charge:`, 350, y);
      doc.text(`Rs. ${quotation.laborCharge?.toLocaleString() || 0}`, 450, y);
      y += 15;

      doc.text(`Estimated Hours:`, 350, y);
      doc.text(quotation.estimatedHours?.toString() || '0', 450, y);
      y += 15;

      doc.text(`Labor Cost:`, 350, y);
      doc.text(`Rs. ${quotation.laborCost?.toLocaleString() || 0}`, 450, y);
      y += 15;

      doc.text(`Tax (${quotation.taxRate || 0}%):`, 350, y);
      doc.text(`Rs. ${quotation.taxAmount?.toLocaleString() || 0}`, 450, y);
      y += 20;

      doc.fontSize(12).fillColor('#0000FF').text(`Estimated Total:`, 350, y);
      doc.text(`Rs. ${quotation.grandTotal?.toLocaleString() || 0}`, 450, y);
      y += 25;

      // Notes
      if (quotation.notes) {
        doc.fontSize(12).fillColor('#0000FF').text('Notes');
        doc.fontSize(10).fillColor('#000000').text(quotation.notes);
      }

      // Footer
      doc.fontSize(8).fillColor('#666666').text('This quotation is valid until the specified date.', { align: 'center' });
      doc.text('VSMS - Vehicle Service Management System', { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

export const generatePayslipPDF = async (payroll, employee) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 35,
        autoFirstPage: true
      });
      const pdfPath = path.join(process.env.UPLOAD_PATH || './uploads', 'pdfs', `payslip-${payroll.payrollId}.pdf`);
      
      const pdfDir = path.dirname(pdfPath);
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      console.log('Generating payslip PDF:', pdfPath);

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      const margin = 35;
      const pageWidth = 595.28;
      const contentWidth = pageWidth - (margin * 2); // 525.28 pt

      // Helper for formatting LKR currency
      const formatCurrency = (amount) => {
        const val = Number(amount) || 0;
        return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };

      // Helper for Month Name
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const periodStr = `${monthNames[(payroll.month || 1) - 1]} ${payroll.year}`;

      // ==========================================
      // 1. COMPANY HEADER BOX (Y: 35 -> 100, H: 65)
      // ==========================================
      const headerY = 35;
      const headerH = 65;
      doc.rect(margin, headerY, contentWidth, headerH).fillAndStroke('#F0F7FF', '#0066CC');

      // Left: Company Branding
      doc.fillColor('#0066CC').font('Helvetica-Bold').fontSize(20).text('VSMS.LK', margin + 12, headerY + 10);
      doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(8.5).text('VEHICLE SERVICE MANAGEMENT SYSTEM', margin + 12, headerY + 34);
      doc.fillColor('#64748B').font('Helvetica').fontSize(7.5).text('Professional Vehicle Care & Fleet Solutions', margin + 12, headerY + 47);

      // Right: Payslip Info
      doc.fillColor('#0066CC').font('Helvetica-Bold').fontSize(16).text('PAYSLIP', margin + contentWidth - 140, headerY + 12, { width: 128, align: 'right' });
      doc.fillColor('#64748B').font('Helvetica').fontSize(8).text('Official Salary Statement', margin + contentWidth - 140, headerY + 32, { width: 128, align: 'right' });
      const statusBadge = (payroll.status || 'DRAFT').toUpperCase();
      doc.fillColor(statusBadge === 'PROCESSED' || statusBadge === 'PAID' ? '#16A34A' : '#D97706')
         .font('Helvetica-Bold').fontSize(8)
         .text(`STATUS: ${statusBadge}`, margin + contentWidth - 140, headerY + 46, { width: 128, align: 'right' });

      // ==========================================
      // 2. EMPLOYEE & PAYROLL DETAILS (Y: 106 -> 168, H: 62)
      // ==========================================
      const empY = 106;
      const empH = 62;
      doc.rect(margin, empY, contentWidth, empH).fillAndStroke('#F8FAFC', '#E2E8F0');

      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8.5).text('EMPLOYEE INFORMATION', margin + 10, empY + 8);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8.5).text('PAYMENT DETAILS', margin + 270, empY + 8);

      doc.font('Helvetica').fontSize(8).fillColor('#475569');
      // Left details
      doc.text(`Employee ID:`, margin + 10, empY + 23);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(`${employee?.employeeId || employee?.managerId || 'N/A'}`, margin + 80, empY + 23);

      doc.font('Helvetica').fillColor('#475569').text(`Name:`, margin + 10, empY + 35);
      const fullName = `${employee?.user?.firstName || ''} ${employee?.user?.lastName || ''}`.trim() || 'Employee';
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(fullName, margin + 80, empY + 35);

      doc.font('Helvetica').fillColor('#475569').text(`Position:`, margin + 10, empY + 47);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(`${employee?.user?.role || 'Employee'}`, margin + 80, empY + 47);

      // Right details
      doc.font('Helvetica').fillColor('#475569').text(`Payroll ID:`, margin + 270, empY + 23);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(`${payroll.payrollId}`, margin + 345, empY + 23);

      doc.font('Helvetica').fillColor('#475569').text(`Pay Period:`, margin + 270, empY + 35);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(periodStr, margin + 345, empY + 35);

      doc.font('Helvetica').fillColor('#475569').text(`Generated:`, margin + 270, empY + 47);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(`${new Date().toLocaleDateString('en-GB')}`, margin + 345, empY + 47);

      // ==========================================
      // 3. EARNINGS & DEDUCTIONS SIDE-BY-SIDE (Y: 174)
      // ==========================================
      const colGap = 12;
      const colWidth = (contentWidth - colGap) / 2; // 256.64 pt
      const leftColX = margin;
      const rightColX = margin + colWidth + colGap;

      const tablesStartY = 174;
      const sectionHeaderH = 20;
      const tableHeaderH = 17;
      const rowH = 17;

      // Prepare Earnings Items
      const earningsItems = [
        { desc: 'Basic Salary', qty: '-', rate: '-', amount: payroll.basicSalary || 0 }
      ];
      if (payroll.allowances > 0) {
        earningsItems.push({ desc: 'Allowances', qty: '-', rate: '-', amount: payroll.allowances });
      }
      if (payroll.overtimePay > 0) {
        earningsItems.push({ desc: 'Overtime Pay', qty: `${payroll.overtimeHours || 0} hrs`, rate: '-', amount: payroll.overtimePay });
      }

      // Prepare Deductions Items
      const deductionItems = [];
      if (payroll.epfEmployee > 0) {
        deductionItems.push({ desc: 'EPF (Employee)', ref: 'Statutory', pct: '8%', amount: payroll.epfEmployee });
      }
      if (payroll.loanDeductions > 0) {
        deductionItems.push({ desc: 'Loan Repayment', ref: 'Active Loan', pct: '-', amount: payroll.loanDeductions });
      }
      if (payroll.salaryAdvanceDeductions > 0) {
        deductionItems.push({ desc: 'Salary Advance', ref: 'Advance Repayment', pct: '-', amount: payroll.salaryAdvanceDeductions });
      }
      if (payroll.otherDeductions > 0) {
        deductionItems.push({ desc: 'Other Deductions', ref: '-', pct: '-', amount: payroll.otherDeductions });
      }
      if (deductionItems.length === 0) {
        deductionItems.push({ desc: 'No Deductions', ref: '-', pct: '-', amount: 0 });
      }

      // Equalize row heights between the two tables
      const maxRows = Math.max(earningsItems.length, deductionItems.length);

      // Draw Section Headers
      doc.rect(leftColX, tablesStartY, colWidth, sectionHeaderH).fillAndStroke('#ECFDF5', '#10B981');
      doc.fillColor('#047857').font('Helvetica-Bold').fontSize(9).text('EARNINGS', leftColX + 8, tablesStartY + 6);

      doc.rect(rightColX, tablesStartY, colWidth, sectionHeaderH).fillAndStroke('#FEF2F2', '#EF4444');
      doc.fillColor('#B91C1C').font('Helvetica-Bold').fontSize(9).text('DEDUCTIONS', rightColX + 8, tablesStartY + 6);

      // Draw Subheaders
      const subHeaderY = tablesStartY + sectionHeaderH;
      doc.rect(leftColX, subHeaderY, colWidth, tableHeaderH).fillAndStroke('#F1F5F9', '#CBD5E1');
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5);
      doc.text('Description', leftColX + 6, subHeaderY + 5);
      doc.text('Hours/Qty', leftColX + 115, subHeaderY + 5);
      doc.text('Amount (LKR)', leftColX + 175, subHeaderY + 5, { width: 75, align: 'right' });

      doc.rect(rightColX, subHeaderY, colWidth, tableHeaderH).fillAndStroke('#F1F5F9', '#CBD5E1');
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5);
      doc.text('Description', rightColX + 6, subHeaderY + 5);
      doc.text('Rate/Ref', rightColX + 115, subHeaderY + 5);
      doc.text('Amount (LKR)', rightColX + 175, subHeaderY + 5, { width: 75, align: 'right' });

      // Draw Rows
      let currentRowY = subHeaderY + tableHeaderH;
      for (let i = 0; i < maxRows; i++) {
        const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        
        // Left Column Row
        doc.rect(leftColX, currentRowY, colWidth, rowH).fillAndStroke(bg, '#E2E8F0');
        const earn = earningsItems[i];
        if (earn) {
          doc.fillColor('#1E293B').font('Helvetica').fontSize(7.5).text(earn.desc, leftColX + 6, currentRowY + 4.5);
          doc.fillColor('#64748B').text(earn.qty, leftColX + 115, currentRowY + 4.5);
          doc.fillColor('#0F172A').font('Helvetica-Bold').text(formatCurrency(earn.amount), leftColX + 175, currentRowY + 4.5, { width: 75, align: 'right' });
        }

        // Right Column Row
        doc.rect(rightColX, currentRowY, colWidth, rowH).fillAndStroke(bg, '#E2E8F0');
        const ded = deductionItems[i];
        if (ded) {
          doc.fillColor('#1E293B').font('Helvetica').fontSize(7.5).text(ded.desc, rightColX + 6, currentRowY + 4.5);
          doc.fillColor('#64748B').text(ded.pct !== '-' ? ded.pct : ded.ref, rightColX + 115, currentRowY + 4.5);
          const dedSign = ded.amount > 0 ? '-' : '';
          doc.fillColor(ded.amount > 0 ? '#DC2626' : '#64748B').font('Helvetica-Bold').text(`${dedSign}${formatCurrency(ded.amount)}`, rightColX + 175, currentRowY + 4.5, { width: 75, align: 'right' });
        }

        currentRowY += rowH;
      }

      // Column Totals
      const totalH = 22;
      doc.rect(leftColX, currentRowY, colWidth, totalH).fillAndStroke('#ECFDF5', '#10B981');
      doc.fillColor('#047857').font('Helvetica-Bold').fontSize(8.5).text('GROSS SALARY', leftColX + 6, currentRowY + 6.5);
      doc.text(formatCurrency(payroll.grossSalary), leftColX + 150, currentRowY + 6.5, { width: 100, align: 'right' });

      doc.rect(rightColX, currentRowY, colWidth, totalH).fillAndStroke('#FEF2F2', '#EF4444');
      doc.fillColor('#B91C1C').font('Helvetica-Bold').fontSize(8.5).text('TOTAL DEDUCTIONS', rightColX + 6, currentRowY + 6.5);
      doc.text(`-${formatCurrency(payroll.totalDeductions)}`, rightColX + 150, currentRowY + 6.5, { width: 100, align: 'right' });

      currentRowY += totalH + 8;

      // ==========================================
      // 4. NET SALARY PAYABLE BANNER
      // ==========================================
      const netY = currentRowY;
      const netH = 38;
      doc.rect(margin, netY, contentWidth, netH).fillAndStroke('#0066CC', '#0066CC');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12).text('NET SALARY PAYABLE', margin + 14, netY + 8);
      doc.font('Helvetica').fontSize(7.5).fillColor('#BFDBFE').text('Take Home Pay for the Period', margin + 14, netY + 23);

      doc.font('Helvetica-Bold').fontSize(16).fillColor('#FFFFFF').text(`LKR ${formatCurrency(payroll.netSalary)}`, margin + contentWidth - 250, netY + 11, { width: 236, align: 'right' });

      currentRowY += netH + 8;

      // ==========================================
      // 5. EMPLOYER CONTRIBUTIONS & PAYMENT SUMMARY (Side-by-Side)
      // ==========================================
      const lowerY = currentRowY;
      const lowerH = 68;

      // Left: Employer Contributions
      doc.rect(leftColX, lowerY, colWidth, lowerH).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.rect(leftColX, lowerY, colWidth, 18).fillAndStroke('#EFF6FF', '#3B82F6');
      doc.fillColor('#1D4ED8').font('Helvetica-Bold').fontSize(8).text('EMPLOYER CONTRIBUTIONS (Statutory / Informational)', leftColX + 6, lowerY + 5);

      const epfEmployer = payroll.epfEmployer || Math.round((payroll.basicSalary || 0) * 0.12);
      const etfEmployer = payroll.etfEmployer || Math.round((payroll.basicSalary || 0) * 0.03);
      const totalEmployer = epfEmployer + etfEmployer;

      doc.font('Helvetica').fontSize(7.5).fillColor('#475569');
      doc.text('EPF Employer (12%):', leftColX + 8, lowerY + 24);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(formatCurrency(epfEmployer), leftColX + 160, lowerY + 24, { width: 90, align: 'right' });

      doc.font('Helvetica').fillColor('#475569').text('ETF Employer (3%):', leftColX + 8, lowerY + 38);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(formatCurrency(etfEmployer), leftColX + 160, lowerY + 38, { width: 90, align: 'right' });

      doc.rect(leftColX, lowerY + 52, colWidth, 16).fillAndStroke('#F1F5F9', '#CBD5E1');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1E293B').text('Total Employer Cost:', leftColX + 8, lowerY + 56);
      doc.text(formatCurrency(totalEmployer), leftColX + 160, lowerY + 56, { width: 90, align: 'right' });

      // Right: Payment Summary
      doc.rect(rightColX, lowerY, colWidth, lowerH).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.rect(rightColX, lowerY, colWidth, 18).fillAndStroke('#F1F5F9', '#64748B');
      doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8).text('PAYMENT SUMMARY', rightColX + 6, lowerY + 5);

      doc.font('Helvetica').fontSize(7.5).fillColor('#475569');
      doc.text('Payment Method:', rightColX + 8, lowerY + 24);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(`${payroll.paymentMethod || 'Bank Transfer'}`, rightColX + 140, lowerY + 24, { width: 110, align: 'right' });

      doc.font('Helvetica').fillColor('#475569').text('Payment Status:', rightColX + 8, lowerY + 38);
      doc.font('Helvetica-Bold').fillColor(statusBadge === 'PROCESSED' || statusBadge === 'PAID' ? '#16A34A' : '#D97706')
         .text(statusBadge, rightColX + 140, lowerY + 38, { width: 110, align: 'right' });

      doc.font('Helvetica').fillColor('#475569').text('Payment Date:', rightColX + 8, lowerY + 52);
      const payDateStr = payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString('en-GB') : 'Processed with Payroll';
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(payDateStr, rightColX + 140, lowerY + 52, { width: 110, align: 'right' });

      currentRowY = lowerY + lowerH + 16;

      // ==========================================
      // 6. SIGNATURE LINES
      // ==========================================
      const sigLineY = currentRowY + 20;
      const sigLineWidth = 180;

      // Left Signature (Authorised)
      doc.lineWidth(0.8).strokeColor('#64748B')
         .moveTo(leftColX + 10, sigLineY)
         .lineTo(leftColX + 10 + sigLineWidth, sigLineY)
         .stroke();
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155')
         .text('Authorised Signature', leftColX + 10, sigLineY + 5, { width: sigLineWidth, align: 'center' });
      doc.font('Helvetica').fontSize(6.5).fillColor('#94A3B8')
         .text('Management / Finance', leftColX + 10, sigLineY + 15, { width: sigLineWidth, align: 'center' });

      // Right Signature (Employee)
      doc.lineWidth(0.8).strokeColor('#64748B')
         .moveTo(rightColX + colWidth - 10 - sigLineWidth, sigLineY)
         .lineTo(rightColX + colWidth - 10, sigLineY)
         .stroke();
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155')
         .text('Employee Signature', rightColX + colWidth - 10 - sigLineWidth, sigLineY + 5, { width: sigLineWidth, align: 'center' });
      doc.font('Helvetica').fontSize(6.5).fillColor('#94A3B8')
         .text('Acknowledgement of Receipt', rightColX + colWidth - 10 - sigLineWidth, sigLineY + 15, { width: sigLineWidth, align: 'center' });

      // ==========================================
      // 7. COMPACT PROFESSIONAL FOOTER
      // ==========================================
      // Positioned explicitly at the bottom margin without triggering automatic page breaks
      const footerY = 770;
      doc.lineWidth(0.5).strokeColor('#E2E8F0')
         .moveTo(margin, footerY - 8)
         .lineTo(margin + contentWidth, footerY - 8)
         .stroke();

      doc.font('Helvetica').fontSize(7).fillColor('#64748B');
      doc.text('This is a computer-generated document and does not require a physical signature when processed electronically.', margin, footerY, { width: contentWidth, align: 'center' });
      doc.text('VSMS.LK - Vehicle Service Management System | Professional Vehicle Care & Fleet Solutions', margin, footerY + 10, { width: contentWidth, align: 'center' });
      doc.fillColor('#94A3B8').fontSize(6.5).text(`Generated on ${new Date().toLocaleString('en-GB')} | Document ID: ${payroll.payrollId} | Page 1 of 1`, margin, footerY + 20, { width: contentWidth, align: 'center' });

      doc.end();

      stream.on('finish', () => {
        console.log('Payslip PDF generated successfully:', pdfPath);
        resolve(pdfPath);
      });
      stream.on('error', (error) => {
        console.error('Error writing PDF stream:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Error generating payslip PDF:', error);
      reject(error);
    }
  });
};

export default { generateInvoicePDF, generateQuotationPDF, generatePayslipPDF };
