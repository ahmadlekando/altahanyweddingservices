import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, Send, Printer, ArrowRight, Download, Loader2 } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { generateInvoicePDF, PDFInvoiceData } from '../../lib/pdf';

type LineItem = { description: string; description_ar: string; quantity: number; unit_price: number; discount_percent: number };

const emptyItem = (): LineItem => ({ description: '', description_ar: '', quantity: 1, unit_price: 0, discount_percent: 0 });

export default function NewInvoicePage() {
  const { t } = useLang();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState({
    invoice_type: 'tax',
    language: 'ar',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    customer_vat: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    discount_percent: 0,
    vat_percent: 5,
    notes: '',
    terms: 'يُرجى سداد المبلغ خلال 30 يوماً من تاريخ الفاتورة.',
    currency: 'AED',
    status: 'draft',
  });
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((s: any) => { map[s.key] = s.value; });
        setSettings(map);
      }
    });
  }, []);

  const updateItem = (i: number, key: keyof LineItem, val: string | number) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item));
  };

  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const addItem = () => setItems(prev => [...prev, emptyItem()]);

  const getItemTotal = (item: LineItem) => item.quantity * item.unit_price * (1 - item.discount_percent / 100);
  const subtotal = items.reduce((sum, item) => sum + getItemTotal(item), 0);
  const discountAmount = subtotal * (invoice.discount_percent / 100);
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = afterDiscount * (invoice.vat_percent / 100);
  const total = afterDiscount + vatAmount;

  const sendEmailNotification = async (inv: any) => {
    if (!invoice.customer_email) return;
    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            to: invoice.customer_email,
            to_name: invoice.customer_name,
            subject: t(
              `فاتورة رقم ${inv.invoice_number} من التهاني لخدمات الأفراح`,
              `Invoice ${inv.invoice_number} from Altahany Wedding Services`
            ),
            html: `
              <p>${t(`عزيزنا ${invoice.customer_name}،`, `Dear ${invoice.customer_name},`)}</p>
              <p>${t('يرجى الاطلاع على الفاتورة المرفقة بالتفاصيل التالية:', 'Please find your invoice with the following details:')}</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">${t('رقم الفاتورة', 'Invoice #')}</td><td style="padding:8px;border:1px solid #eee;">${inv.invoice_number}</td></tr>
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">${t('تاريخ الإصدار', 'Issue Date')}</td><td style="padding:8px;border:1px solid #eee;">${invoice.issue_date}</td></tr>
                ${invoice.due_date ? `<tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">${t('تاريخ الاستحقاق', 'Due Date')}</td><td style="padding:8px;border:1px solid #eee;">${invoice.due_date}</td></tr>` : ''}
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">${t('الإجمالي', 'Total')}</td><td style="padding:8px;border:1px solid #eee;color:#F59E0B;font-weight:bold;">${invoice.currency} ${total.toLocaleString('en', { minimumFractionDigits: 2 })}</td></tr>
              </table>
              ${invoice.notes ? `<p style="color:#666;">${invoice.notes}</p>` : ''}
              <p>${t('للاستفسار، يرجى التواصل معنا على +971 52 724 9190', 'For inquiries, please contact us at +971 52 724 9190')}</p>
            `,
            log_type: 'invoice',
            reference_id: inv.id,
          }),
        }
      );
    } catch (_) {
      // Non-fatal: email failure doesn't block invoice save
    }
  };

  const handleSave = async (status = 'draft') => {
    setSaving(true);
    try {
      const invoiceNumber = `INV${Date.now()}`;
      const { data: inv, error } = await supabase.from('invoices').insert({
        invoice_number: invoiceNumber,
        ...invoice,
        subtotal,
        discount_amount: discountAmount,
        vat_amount: vatAmount,
        total,
        amount_paid: 0,
        status,
        created_by: profile?.id,
      }).select().single();

      if (inv) {
        await supabase.from('invoice_items').insert(
          items.map((item, i) => ({
            invoice_id: inv.id,
            ...item,
            total: getItemTotal(item),
            sort_order: i,
          }))
        );
        if (status === 'sent') {
          await sendEmailNotification(inv);
        }
        navigate('/admin/invoices');
      }
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handlePreviewPDF = async (download = false) => {
    setPdfLoading(true);
    try {
      const pdfData: PDFInvoiceData = {
        invoice_number: `PREVIEW-${Date.now()}`,
        invoice_type: invoice.invoice_type,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        customer_name: invoice.customer_name || 'Customer Name',
        customer_email: invoice.customer_email,
        customer_phone: invoice.customer_phone,
        customer_address: invoice.customer_address,
        customer_vat: invoice.customer_vat,
        items: items.map(item => ({ ...item, total: getItemTotal(item) })),
        subtotal,
        discount_percent: invoice.discount_percent,
        discount_amount: discountAmount,
        vat_percent: invoice.vat_percent,
        vat_amount: vatAmount,
        total,
        amount_paid: 0,
        currency: invoice.currency,
        notes: invoice.notes,
        terms: invoice.terms,
        company_name: settings.company_name,
        company_name_ar: settings.company_name_ar,
        company_phone: settings.company_phone,
        company_email: settings.company_email,
        company_address: settings.company_address,
        vat_number: settings.vat_number,
      };
      await generateInvoicePDF(pdfData, download);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/invoices')} className="text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white font-arabic">{t('فاتورة جديدة', 'New Invoice')}</h1>
            <p className="text-gray-500 text-xs font-arabic">{t('إنشاء فاتورة ضريبية', 'Create a tax invoice')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePreviewPDF(false)}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm font-arabic hover:bg-gray-700 transition-colors border border-white/10 disabled:opacity-50"
          >
            {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            {t('معاينة PDF', 'Preview PDF')}
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm font-arabic hover:bg-gray-700 transition-colors border border-white/10 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {t('حفظ مسودة', 'Save Draft')}
          </button>
          <button
            onClick={() => handleSave('sent')}
            disabled={saving || !invoice.customer_name}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-arabic hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {t('إرسال', 'Send')}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Invoice Settings */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <h2 className="text-sm font-semibold text-white font-arabic mb-4">{t('إعدادات الفاتورة', 'Invoice Settings')}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('نوع الفاتورة', 'Invoice Type')}</label>
                <select
                  value={invoice.invoice_type}
                  onChange={e => setInvoice(p => ({ ...p, invoice_type: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 font-arabic"
                >
                  <option value="tax">{t('فاتورة ضريبية', 'Tax Invoice')}</option>
                  <option value="proforma">{t('فاتورة أولية', 'Proforma')}</option>
                  <option value="receipt">{t('إيصال', 'Receipt')}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('تاريخ الإصدار', 'Issue Date')}</label>
                <input
                  type="date"
                  value={invoice.issue_date}
                  onChange={e => setInvoice(p => ({ ...p, issue_date: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('تاريخ الاستحقاق', 'Due Date')}</label>
                <input
                  type="date"
                  value={invoice.due_date}
                  onChange={e => setInvoice(p => ({ ...p, due_date: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <h2 className="text-sm font-semibold text-white font-arabic mb-4">{t('بيانات العميل', 'Customer Info')}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key: 'customer_name', label_ar: 'اسم العميل *', label_en: 'Customer Name *', type: 'text' },
                { key: 'customer_phone', label_ar: 'الهاتف', label_en: 'Phone', type: 'tel' },
                { key: 'customer_email', label_ar: 'البريد الإلكتروني', label_en: 'Email', type: 'email' },
                { key: 'customer_vat', label_ar: 'الرقم الضريبي', label_en: 'VAT Number', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t(field.label_ar, field.label_en)}</label>
                  <input
                    type={field.type}
                    value={(invoice as any)[field.key]}
                    onChange={e => setInvoice(p => ({ ...p, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 font-arabic transition-colors"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('العنوان', 'Address')}</label>
                <input
                  type="text"
                  value={invoice.customer_address}
                  onChange={e => setInvoice(p => ({ ...p, customer_address: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 font-arabic transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white font-arabic">{t('بنود الفاتورة', 'Line Items')}</h2>
              <button onClick={addItem} className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-arabic">
                <Plus className="w-3.5 h-3.5" />{t('إضافة بند', 'Add Item')}
              </button>
            </div>
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-600 font-arabic px-1">
                <div className="col-span-4">{t('الوصف', 'Description')}</div>
                <div className="col-span-2 text-center">{t('الكمية', 'Qty')}</div>
                <div className="col-span-2 text-center">{t('السعر', 'Price')}</div>
                <div className="col-span-2 text-center">{t('الخصم%', 'Disc%')}</div>
                <div className="col-span-2 text-center">{t('الإجمالي', 'Total')}</div>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateItem(i, 'description', e.target.value)}
                      placeholder={t('وصف الخدمة', 'Service description')}
                      className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-amber-500/50 font-arabic"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 bg-gray-800 border border-white/10 rounded-xl text-xs text-gray-300 text-center focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      value={item.unit_price}
                      onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 bg-gray-800 border border-white/10 rounded-xl text-xs text-gray-300 text-center focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount_percent}
                      onChange={e => updateItem(i, 'discount_percent', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 bg-gray-800 border border-white/10 rounded-xl text-xs text-gray-300 text-center focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div className="col-span-1 text-xs text-gray-300 text-center font-medium">
                    {fmt(getItemTotal(item))}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('ملاحظات', 'Notes')}</label>
                <textarea
                  rows={3}
                  value={invoice.notes}
                  onChange={e => setInvoice(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 resize-none font-arabic"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الشروط والأحكام', 'Terms & Conditions')}</label>
                <textarea
                  rows={3}
                  value={invoice.terms}
                  onChange={e => setInvoice(p => ({ ...p, terms: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 resize-none font-arabic"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5 sticky top-4">
            <h2 className="text-sm font-semibold text-white font-arabic mb-4">{t('ملخص الفاتورة', 'Invoice Summary')}</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-arabic">{t('المجموع الفرعي', 'Subtotal')}</span>
                <span className="text-gray-200">AED {fmt(subtotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm font-arabic flex-1">{t('الخصم (%)', 'Discount (%)')}</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={invoice.discount_percent}
                  onChange={e => setInvoice(p => ({ ...p, discount_percent: parseFloat(e.target.value) || 0 }))}
                  className="w-20 px-2 py-1 bg-gray-800 border border-white/10 rounded-lg text-sm text-gray-300 text-center focus:outline-none focus:border-amber-500/50"
                />
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-arabic">{t('قيمة الخصم', 'Discount Amount')}</span>
                  <span className="text-red-400">-AED {fmt(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm font-arabic flex-1">{t('الضريبة (%)', 'VAT (%)')}</span>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={invoice.vat_percent}
                  onChange={e => setInvoice(p => ({ ...p, vat_percent: parseFloat(e.target.value) || 0 }))}
                  className="w-20 px-2 py-1 bg-gray-800 border border-white/10 rounded-lg text-sm text-gray-300 text-center focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-arabic">{t('ضريبة القيمة المضافة', 'VAT Amount')}</span>
                <span className="text-gray-200">AED {fmt(vatAmount)}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between">
                <span className="font-bold text-white font-arabic">{t('الإجمالي', 'Total')}</span>
                <span className="font-bold text-amber-400 text-lg">AED {fmt(total)}</span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => handlePreviewPDF(false)}
                disabled={pdfLoading}
                className="w-full py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-arabic border border-white/10 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                {t('معاينة PDF', 'Preview PDF')}
              </button>
              <button
                onClick={() => handlePreviewPDF(true)}
                disabled={pdfLoading}
                className="w-full py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-arabic border border-white/10 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {t('تنزيل PDF', 'Download PDF')}
              </button>
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="w-full py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-arabic border border-white/10 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {t('حفظ مسودة', 'Save Draft')}
              </button>
              <button
                onClick={() => handleSave('sent')}
                disabled={saving || !invoice.customer_name}
                className="w-full py-2.5 bg-amber-500 text-white rounded-xl text-sm font-arabic hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {t('إرسال الفاتورة', 'Send Invoice')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
