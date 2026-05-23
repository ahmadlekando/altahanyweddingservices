import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export type PDFInvoiceData = {
  invoice_number: string;
  invoice_type: string;
  issue_date: string;
  due_date?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_vat?: string;
  items: Array<{
    description: string;
    description_ar?: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
    total: number;
  }>;
  subtotal: number;
  discount_percent?: number;
  discount_amount?: number;
  vat_percent: number;
  vat_amount: number;
  total: number;
  amount_paid?: number;
  currency?: string;
  notes?: string;
  terms?: string;
  company_name?: string;
  company_name_ar?: string;
  company_phone?: string;
  company_email?: string;
  company_address?: string;
  vat_number?: string;
  language?: 'ar' | 'en' | 'both';
};

export type PDFQuotationData = PDFInvoiceData & {
  quotation_number?: string;
  event_date?: string;
  event_type?: string;
  valid_until?: string;
};

const LOGO_URL = 'https://altahany.com/media/ALTAHANY%20LOGO4.png';
const GOLD = [245, 158, 11] as const;
const DARK = [17, 17, 17] as const;
const GRAY = [100, 100, 100] as const;
const LIGHT_GRAY = [240, 240, 240] as const;

function loadImage(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
}

async function generateQR(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, { width: 128, margin: 1, color: { dark: '#111111', light: '#ffffff' } });
  } catch {
    return '';
  }
}

function fmtCurrency(amount: number, currency = 'AED'): string {
  return `${currency} ${amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d?: string): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export async function generateInvoicePDF(data: PDFInvoiceData, download = true): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const contentW = pageW - margin * 2;

  const [logoData, qrData] = await Promise.all([
    loadImage(LOGO_URL),
    generateQR(`${window.location.origin}/invoice/${data.invoice_number}`),
  ]);

  // === HEADER BAND ===
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, 42, 'F');

  // Gold accent line
  doc.setFillColor(...GOLD);
  doc.rect(0, 42, pageW, 2, 'F');

  // Logo
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, 7, 36, 28);
    } catch { /* skip */ }
  }

  // Company name & info (right side of header)
  const companyName = data.company_name || 'Altahany Wedding Services';
  const companyNameAr = data.company_name_ar || 'التهاني لخدمات الأفراح';
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, pageW - margin, 14, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(245, 158, 11);
  doc.text(companyNameAr, pageW - margin, 21, { align: 'right' });
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(7.5);
  if (data.company_phone) doc.text(`T: ${data.company_phone}`, pageW - margin, 27, { align: 'right' });
  if (data.company_email) doc.text(`E: ${data.company_email}`, pageW - margin, 32, { align: 'right' });
  if (data.vat_number) doc.text(`TRN: ${data.vat_number}`, pageW - margin, 37, { align: 'right' });

  // === INVOICE TITLE BAND ===
  let typeLabel = 'TAX INVOICE';
  if (data.invoice_type === 'proforma') typeLabel = 'PROFORMA INVOICE';
  if (data.invoice_type === 'quotation') typeLabel = 'QUOTATION';
  if (data.invoice_type === 'receipt') typeLabel = 'RECEIPT';

  doc.setFillColor(248, 248, 248);
  doc.rect(0, 44, pageW, 18, 'F');
  doc.setTextColor(...DARK);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(typeLabel, margin, 56);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`# ${data.invoice_number}`, margin + 68, 56);

  // Date info
  doc.setFontSize(8);
  doc.text(`Issue Date: ${fmtDate(data.issue_date)}`, pageW - margin, 50, { align: 'right' });
  if (data.due_date) doc.text(`Due Date: ${fmtDate(data.due_date)}`, pageW - margin, 57, { align: 'right' });

  let y = 68;

  // === BILL TO / QR ROW ===
  const colW = (contentW - 40) / 2;

  // Bill To box
  doc.setFillColor(252, 252, 252);
  doc.roundedRect(margin, y, colW, 36, 2, 2, 'F');
  doc.setDrawColor(230, 230, 230);
  doc.roundedRect(margin, y, colW, 36, 2, 2, 'S');

  doc.setFillColor(...GOLD);
  doc.roundedRect(margin, y, colW, 7, 2, 2, 'F');
  doc.rect(margin, y + 4, colW, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin + 3, y + 5);

  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(data.customer_name, margin + 3, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  if (data.customer_phone) doc.text(`Tel: ${data.customer_phone}`, margin + 3, y + 20);
  if (data.customer_email) doc.text(`Email: ${data.customer_email}`, margin + 3, y + 26);
  if (data.customer_address) doc.text(data.customer_address.substring(0, 40), margin + 3, y + 32);
  if (data.customer_vat) {
    doc.setTextColor(245, 158, 11);
    doc.text(`TRN: ${data.customer_vat}`, margin + 3, y + 38);
  }

  // QR Code
  if (qrData) {
    const qrX = pageW - margin - 30;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrX - 2, y, 34, 34, 2, 2, 'F');
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(qrX - 2, y, 34, 34, 2, 2, 'S');
    try {
      doc.addImage(qrData, 'PNG', qrX, y + 2, 30, 30);
    } catch { /* skip */ }
    doc.setTextColor(...GRAY);
    doc.setFontSize(6);
    doc.text('Scan to verify', qrX + 15, y + 35, { align: 'center' });
  }

  y += 44;

  // === LINE ITEMS TABLE ===
  // Table header
  const colWidths = [80, 20, 28, 20, 30];
  const headers = ['Description', 'Qty', 'Unit Price', 'Disc%', 'Total'];
  const colX = [margin, margin + 80, margin + 100, margin + 128, margin + 148];

  doc.setFillColor(...DARK);
  doc.rect(margin, y, contentW, 8, 'F');
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => {
    const align = i === 0 ? 'left' : 'center';
    const x = i === 0 ? colX[i] + 2 : colX[i] + colWidths[i] / 2;
    doc.text(h, x, y + 5.5, { align });
  });
  y += 8;

  // Rows
  data.items.forEach((item, idx) => {
    const rowH = 9;
    const bg = idx % 2 === 0 ? [255, 255, 255] : [249, 249, 249];
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(margin, y, contentW, rowH, 'F');

    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    const desc = item.description || item.description_ar || '';
    doc.text(desc.substring(0, 45), colX[0] + 2, y + 6);
    doc.text(item.quantity.toString(), colX[1] + colWidths[1] / 2, y + 6, { align: 'center' });
    doc.text(item.unit_price.toFixed(2), colX[2] + colWidths[2] / 2, y + 6, { align: 'center' });
    doc.text(`${item.discount_percent}%`, colX[3] + colWidths[3] / 2, y + 6, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(item.total.toFixed(2), colX[4] + colWidths[4] / 2 - 2, y + 6, { align: 'right' });

    y += rowH;
  });

  // Bottom border on table
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, margin + contentW, y);
  y += 6;

  // === TOTALS ===
  const totalsX = pageW - margin - 70;
  const totalsW = 70;

  const totalsRows: Array<[string, string, boolean, boolean]> = [
    ['Subtotal', fmtCurrency(data.subtotal, data.currency), false, false],
  ];
  if (data.discount_amount && data.discount_amount > 0) {
    totalsRows.push([`Discount (${data.discount_percent || 0}%)`, `-${fmtCurrency(data.discount_amount, data.currency)}`, false, false]);
  }
  totalsRows.push([`VAT (${data.vat_percent}%)`, fmtCurrency(data.vat_amount, data.currency), false, false]);
  if (data.amount_paid && data.amount_paid > 0) {
    totalsRows.push(['Amount Paid', `-${fmtCurrency(data.amount_paid, data.currency)}`, false, false]);
  }
  totalsRows.push(['TOTAL DUE', fmtCurrency(data.total - (data.amount_paid || 0), data.currency), true, true]);

  totalsRows.forEach(([label, val, bold, highlight]) => {
    if (highlight) {
      doc.setFillColor(...DARK);
      doc.rect(totalsX, y - 1, totalsW, 9, 'F');
      doc.setTextColor(245, 158, 11);
    } else {
      doc.setTextColor(...GRAY);
    }
    doc.setFontSize(bold ? 9 : 8);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, totalsX + 3, y + 5.5);
    doc.text(val, totalsX + totalsW - 3, y + 5.5, { align: 'right' });
    y += 9;
  });

  // Notes / Terms
  y += 5;
  if (data.notes) {
    doc.setTextColor(...DARK);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    y += 5;
    const noteLines = doc.splitTextToSize(data.notes, contentW - 5);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4.5 + 4;
  }

  if (data.terms) {
    doc.setTextColor(...DARK);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    y += 5;
    const termLines = doc.splitTextToSize(data.terms, contentW - 5);
    doc.text(termLines, margin, y);
  }

  // === WATERMARK ===
  doc.setGState(doc.GState({ opacity: 0.05 }));
  doc.setTextColor(...DARK);
  doc.setFontSize(48);
  doc.setFont('helvetica', 'bold');
  doc.text('ALTAHANY', pageW / 2, pageH / 2, { align: 'center', angle: -45 });
  doc.setGState(doc.GState({ opacity: 1 }));

  // === FOOTER ===
  doc.setFillColor(...DARK);
  doc.rect(0, pageH - 20, pageW, 20, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, pageH - 20, pageW, 1, 'F');

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const footerY1 = pageH - 13;
  const footerY2 = pageH - 7;
  doc.text(data.company_name || 'Altahany Wedding Services', margin, footerY1);
  doc.text(`T: ${data.company_phone || '+971 52 724 9190'} | E: ${data.company_email || 'info@altahany.com'}`, margin, footerY2);
  doc.setTextColor(245, 158, 11);
  doc.text('www.altahany.com', pageW / 2, footerY1, { align: 'center' });
  doc.setTextColor(150, 150, 150);
  doc.text(`TRN: ${data.vat_number || '—'}`, pageW / 2, footerY2, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageW - margin, footerY1, { align: 'right' });
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(6);
  doc.text('Sharjah, UAE | Instagram: @altahany_uae', pageW - margin, footerY2, { align: 'right' });

  if (download) {
    doc.save(`${data.invoice_number}.pdf`);
  } else {
    window.open(doc.output('bloburl'), '_blank');
  }
}

export async function generateQuotationPDF(data: PDFQuotationData, download = true): Promise<void> {
  const invoiceData: PDFInvoiceData = {
    ...data,
    invoice_number: data.quotation_number || data.invoice_number,
    invoice_type: 'quotation',
  };
  await generateInvoicePDF(invoiceData, download);
}
