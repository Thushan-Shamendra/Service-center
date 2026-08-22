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
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const pdfPath = path.join(process.env.UPLOAD_PATH || './uploads', 'pdfs', `payslip-${payroll.payrollId}.pdf`);
      
      const pdfDir = path.dirname(pdfPath);
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      console.log('Generating payslip PDF:', pdfPath);

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Company Header Box
      doc.rect(40, 40, 515, 80).fillAndStroke('#E8F4FD', '#0066CC');
      doc.fillColor('#0066CC').fontSize(28).text('VSMS.LK', 50, 55);
      doc.fillColor('#333333').fontSize(12).text('VEHICLE SERVICE MANAGEMENT SYSTEM', 50, 85);
      doc.fillColor('#666666').fontSize(10).text('Professional Vehicle Care Services', 50, 100);
      
      doc.fillColor('#0066CC').fontSize(20).text('PAYSLIP', 400, 60);
      doc.fillColor('#666666').fontSize(10).text('Official Salary Statement', 400, 85);

      // Employee Information Box
      doc.rect(40, 130, 515, 80).stroke('#CCCCCC');
      doc.fillColor('#0066CC').fontSize(12).text('EMPLOYEE INFORMATION', 50, 140);
      
      doc.fillColor('#333333').fontSize(10);
      doc.text(`Payroll ID: ${payroll.payrollId}`, 50, 160);
      doc.text(`Employee ID: ${employee?.employeeId || employee?.managerId || 'N/A'}`, 50, 175);
      doc.text(`Name: ${employee?.user?.firstName} ${employee?.user?.lastName || 'N/A'}`, 50, 190);
      
      doc.text(`Position: ${employee?.user?.role || 'Employee'}`, 300, 160);
      doc.text(`Pay Period: ${new Date(payroll.year, payroll.month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`, 300, 175);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 300, 190);

      // Earnings Section
      let currentY = 230;
      
      // Section Header
      doc.rect(40, currentY, 515, 25).fillAndStroke('#E8F8E8', '#28A745');
      doc.fillColor('#28A745').fontSize(12).text('EARNINGS', 50, currentY + 8);
      currentY += 35;

      // Earnings Table
      doc.fontSize(10).fillColor('#333333');
      
      // Table Header
      doc.rect(40, currentY, 515, 20).fillAndStroke('#F0F0F0', '#CCCCCC');
      doc.fillColor('#666666').text('Description', 50, currentY + 5);
      doc.text('Hours/Qty', 250, currentY + 5);
      doc.text('Rate', 320, currentY + 5);
      doc.text('Amount (LKR)', 420, currentY + 5);
      currentY += 25;

      // Basic Salary
      doc.rect(40, currentY, 515, 20).stroke('#EEEEEE');
      doc.fillColor('#333333').text('Basic Salary', 50, currentY + 5);
      doc.text('-', 250, currentY + 5);
      doc.text('-', 320, currentY + 5);
      doc.text(`${payroll.basicSalary?.toLocaleString() || 0}.00`, 420, currentY + 5);
      currentY += 25;

      // Allowances
      if (payroll.allowances > 0) {
        doc.rect(40, currentY, 515, 20).stroke('#EEEEEE');
        doc.fillColor('#333333').text('Allowances', 50, currentY + 5);
        doc.text('-', 250, currentY + 5);
        doc.text('-', 320, currentY + 5);
        doc.text(`${payroll.allowances?.toLocaleString() || 0}.00`, 420, currentY + 5);
        currentY += 25;
      }

      // Overtime
      if (payroll.overtimePay > 0) {
        doc.rect(40, currentY, 515, 20).stroke('#EEEEEE');
        doc.fillColor('#333333').text('Overtime Pay', 50, currentY + 5);
        doc.text(`${payroll.overtimeHours || 0} hrs`, 250, currentY + 5);
        doc.text('-', 320, currentY + 5);
        doc.text(`${payroll.overtimePay?.toLocaleString() || 0}.00`, 420, currentY + 5);
        currentY += 25;
      }

      // Gross Salary Total
      doc.rect(40, currentY, 515, 25).fillAndStroke('#E8F8E8', '#28A745');
      doc.fillColor('#28A745').fontSize(11).text('GROSS SALARY', 50, currentY + 5);
      doc.text(`${payroll.grossSalary?.toLocaleString() || 0}.00`, 420, currentY + 5);
      currentY += 35;

      // Deductions Section
      doc.rect(40, currentY, 515, 25).fillAndStroke('#FDE8E8', '#DC3545');
      doc.fillColor('#DC3545').fontSize(12).text('DEDUCTIONS', 50, currentY + 8);
      currentY += 35;

      // Deductions Table
      doc.fontSize(10).fillColor('#333333');
      
      // Table Header
      doc.rect(40, currentY, 515, 20).fillAndStroke('#F0F0F0', '#CCCCCC');
      doc.fillColor('#666666').text('Description', 50, currentY + 5);
      doc.text('Reference', 250, currentY + 5);
      doc.text('Percentage', 320, currentY + 5);
      doc.text('Amount (LKR)', 420, currentY + 5);
      currentY += 25;

      // Other Deductions
      if (payroll.otherDeductions > 0) {
        doc.rect(40, currentY, 515, 20).stroke('#EEEEEE');
        doc.fillColor('#333333').text('Other Deductions', 50, currentY + 5);
        doc.text('-', 250, currentY + 5);
        doc.text('-', 320, currentY + 5);
        doc.text(`${payroll.otherDeductions?.toLocaleString() || 0}.00`, 420, currentY + 5);
        currentY += 25;
      }

      // Loan Deduction
      if (payroll.loanDeductions > 0) {
        doc.rect(40, currentY, 515, 20).stroke('#EEEEEE');
        doc.fillColor('#DC3545').text('Loan Repayment', 50, currentY + 5);
        doc.text('Active Loans', 250, currentY + 5);
        doc.text('-', 320, currentY + 5);
        doc.text(`-${payroll.loanDeductions?.toLocaleString() || 0}.00`, 420, currentY + 5);
        currentY += 25;
      }

      // Salary Advance Deduction
      if (payroll.salaryAdvanceDeductions > 0) {
        doc.rect(40, currentY, 515, 20).stroke('#EEEEEE');
        doc.fillColor('#DC3545').text('Salary Advance', 50, currentY + 5);
        doc.text('Approved', 250, currentY + 5);
        doc.text('-', 320, currentY + 5);
        doc.text(`-${payroll.salaryAdvanceDeductions?.toLocaleString() || 0}.00`, 420, currentY + 5);
        currentY += 25;
      }

      // EPF Employee
      if (payroll.epfEmployee > 0) {
        doc.rect(40, currentY, 515, 20).stroke('#EEEEEE');
        doc.fillColor('#DC3545').text('EPF (Employee)', 50, currentY + 5);
        doc.text('Statutory', 250, currentY + 5);
        doc.text('8%', 320, currentY + 5);
        doc.text(`-${payroll.epfEmployee?.toLocaleString() || 0}.00`, 420, currentY + 5);
        currentY += 25;
      }

      // Total Deductions
      doc.rect(40, currentY, 515, 25).fillAndStroke('#FDE8E8', '#DC3545');
      doc.fillColor('#DC3545').fontSize(11).text('TOTAL DEDUCTIONS', 50, currentY + 5);
      doc.text(`${payroll.totalDeductions?.toLocaleString() || 0}.00`, 420, currentY + 5);
      currentY += 35;

      // Net Salary - Highlighted
      doc.rect(40, currentY, 515, 40).fillAndStroke('#0066CC', '#0066CC');
      doc.fillColor('#FFFFFF').fontSize(16).text('NET SALARY PAYABLE', 50, currentY + 12);
      doc.fontSize(20).text(`LKR ${payroll.netSalary?.toLocaleString() || 0}.00`, 350, currentY + 8);
      currentY += 50;

      // Employer Contributions Section
      doc.rect(40, currentY, 515, 25).fillAndStroke('#E8F4FD', '#0066CC');
      doc.fillColor('#0066CC').fontSize(12).text('EMPLOYER CONTRIBUTIONS (For Information Only)', 50, currentY + 8);
      currentY += 35;

      // EPF Employer
      doc.rect(40, currentY, 515, 20).stroke('#EEEEEE');
      doc.fillColor('#333333').text('EPF (Employer)', 50, currentY + 5);
      doc.text('Statutory', 250, currentY + 5);
      doc.text('12%', 320, currentY + 5);
      doc.text(`${payroll.epfEmployer?.toLocaleString() || 0}.00`, 420, currentY + 5);
      currentY += 25;

      // ETF Employer
      doc.rect(40, currentY, 515, 20).stroke('#EEEEEE');
      doc.fillColor('#333333').text('ETF (Employer)', 50, currentY + 5);
      doc.text('Statutory', 250, currentY + 5);
      doc.text('3%', 320, currentY + 5);
      doc.text(`${payroll.etfEmployer?.toLocaleString() || 0}.00`, 420, currentY + 5);
      currentY += 30;

      // Summary Box
      doc.rect(40, currentY, 515, 60).stroke('#CCCCCC');
      doc.fillColor('#0066CC').fontSize(10).text('PAYMENT SUMMARY', 50, currentY + 10);
      
      doc.fillColor('#333333').fontSize(9);
      doc.text(`Payment Method: ${payroll.paymentMethod || 'Bank Transfer'}`, 50, currentY + 25);
      doc.text(`Status: ${payroll.status?.toUpperCase() || 'DRAFT'}`, 50, currentY + 40);
      
      if (payroll.paymentDate) {
        doc.text(`Payment Date: ${new Date(payroll.paymentDate).toLocaleDateString('en-GB')}`, 300, currentY + 25);
      }
      currentY += 70;

      // Signature Lines
      doc.lineCap('butt').lineWidth(1);
      
      // Authorised Signature
      doc.moveTo(40, currentY).lineTo(200, currentY).stroke('#333333');
      doc.fillColor('#666666').fontSize(9).text('Authorised Signature', 40, currentY + 10);
      
      // Employee Signature
      doc.moveTo(355, currentY).lineTo(515, currentY).stroke('#333333');
      doc.fillColor('#666666').fontSize(9).text('Employee Signature', 355, currentY + 10);
      
      currentY += 40;

      // Footer
      doc.fillColor('#999999').fontSize(8);
      doc.text('This is a computer-generated document and does not require a physical signature.', { align: 'center' });
      doc.text('VSMS.LK - Vehicle Service Management System | Professional Vehicle Care', { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleString('en-GB')} | Document ID: ${payroll.payrollId}`, { align: 'center' });

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
