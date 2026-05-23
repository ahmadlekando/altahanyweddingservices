import React, { useEffect, useState } from 'react';
import { Plus, Search, FileCheck, Eye, Send, Download, Loader2, X, Save, Trash2, Pencil, MessageCircle } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase, Quotation } from '../../lib/supabase';
import { formatCurrency, getStatusColor, getStatusLabel } from '../../lib/utils';
import { generateQuotationPDF, PDFQuotationData } from '../../lib/pdf';

const inputCls = 'w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 font-arabic';

type LineItem = { description: string; quantity: number; unit_price: number };

type QuotForm = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_date: string;
  event_type: string;
  valid_until: string;
  issue_date: string;
  vat_percent: string;
  discount_percent: string;
  currency: string;
  notes: string;
  status: string;
};

function emptyForm(): QuotForm {
  const today = new Date().toISOString().slice(0, 10);
  const plus30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  return {
    customer_name: '', customer_email: '', customer_phone: '',
    event_date: '', event_type: '', valid_until: plus30, issue_date: today,
    vat_percent: '5', discount_percent: '0', currency: 'AED', notes: '', status: 'draft',
  };
}

function emptyItem(): LineItem { return { description: '', quantity: 1, unit_price: 0 }; }

export default function QuotationsPage() {
  const { t } = useLang();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState<Quotation | null>(null);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [form, setForm] = useState<QuotForm>(emptyForm());
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
        setSettings(map);
      }
    });
    fetchQuotations();
  }, []);

  async function fetchQuotations() {
    setLoading(true);
    const { data } = await supabase.from('quotations').select('*').order('created_at', { ascending: false });
    if (data) setQuotations(data as Quotation[]);
    setLoading(false);
  }

  function calcTotals() {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const discount = subtotal * (Number(form.discount_percent) / 100);
    const afterDiscount = subtotal - discount;
    const vat = afterDiscount * (Number(form.vat_percent) / 100);
    return { subtotal, vat_amount: vat, total: afterDiscount + vat };
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setItems([emptyItem()]);
    setShowForm(true);
  }

  async function openEdit(q: Quotation) {
    setEditing(q);
    setForm({
      customer_name: q.customer_name || '',
      customer_email: q.customer_email || '',
      customer_phone: q.customer_phone || '',
      event_date: q.event_date || '',
      event_type: q.event_type || '',
      valid_until: q.valid_until || '',
      issue_date: q.issue_date || new Date().toISOString().slice(0, 10),
      vat_percent: String(q.vat_percent ?? 5),
      discount_percent: String(q.discount_percent ?? 0),
      currency: q.currency || 'AED',
      notes: q.notes || '',
      status: q.status || 'draft',
    });
    const { data: its } = await supabase.from('quotation_items').select('*').eq('quotation_id', q.id).order('sort_order');
    setItems(its && its.length > 0 ? its.map((i: { description: string; quantity: number; unit_price: number }) => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price })) : [emptyItem()]);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.customer_name.trim()) return;
    setSaving(true);
    const { subtotal, vat_amount, total } = calcTotals();
    const payload = {
      customer_name: form.customer_name,
      customer_email: form.customer_email || null,
      customer_phone: form.customer_phone || null,
      event_date: form.event_date || null,
      event_type: form.event_type || null,
      valid_until: form.valid_until || null,
      issue_date: form.issue_date,
      vat_percent: Number(form.vat_percent),
      discount_percent: Number(form.discount_percent),
      currency: form.currency,
      notes: form.notes || null,
      status: form.status,
      subtotal,
      vat_amount,
      total,
    };
    let quotId: string;
    if (editing) {
      await supabase.from('quotations').update(payload).eq('id', editing.id);
      quotId = editing.id;
      await supabase.from('quotation_items').delete().eq('quotation_id', quotId);
    } else {
      const num = `QT-${Date.now().toString().slice(-6)}`;
      const { data: newQ } = await supabase.from('quotations').insert({ ...payload, quotation_number: num }).select().maybeSingle();
      quotId = newQ?.id;
    }
    if (quotId) {
      const itemRows = items.filter(i => i.description.trim()).map((i, idx) => ({
        quotation_id: quotId,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.quantity * i.unit_price,
        sort_order: idx,
      }));
      if (itemRows.length > 0) await supabase.from('quotation_items').insert(itemRows);
    }
    setSaving(false);
    setShowForm(false);
    fetchQuotations();
  }

  async function handleDelete(id: string) {
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure?'))) return;
    setDeleting(id);
    await supabase.from('quotation_items').delete().eq('quotation_id', id);
    await supabase.from('quotations').delete().eq('id', id);
    setDeleting(null);
    fetchQuotations();
  }

  async function handleDownloadPDF(q: Quotation) {
    setPdfLoading(q.id);
    try {
      const { data: itemsData } = await supabase.from('quotation_items').select('*').eq('quotation_id', q.id).order('sort_order');
      const pdfData: PDFQuotationData = {
        invoice_number: q.quotation_number,
        quotation_number: q.quotation_number,
        invoice_type: 'proforma',
        issue_date: q.issue_date,
        valid_until: q.valid_until,
        event_date: q.event_date,
        event_type: q.event_type,
        customer_name: q.customer_name,
        customer_email: q.customer_email,
        customer_phone: q.customer_phone,
        items: itemsData || [],
        subtotal: q.subtotal,
        discount_percent: q.discount_percent,
        vat_percent: q.vat_percent,
        vat_amount: q.vat_amount,
        total: q.total,
        currency: q.currency || settings.currency || 'AED',
        notes: q.notes,
        company_name: settings.company_name,
        company_name_ar: settings.company_name_ar,
        company_phone: settings.company_phone,
        company_email: settings.company_email,
        vat_number: settings.vat_number,
      };
      await generateQuotationPDF(pdfData);
    } finally {
      setPdfLoading(null);
    }
  }

  function handleWhatsApp(q: Quotation) {
    const phone = q.customer_phone?.replace(/\D/g, '');
    const msg = encodeURIComponent(`مرحباً ${q.customer_name}، يسعدنا إرسال عرض السعر رقم ${q.quotation_number} بإجمالي ${formatCurrency(q.total || 0)}.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  async function handleSendEmail(q: Quotation) {
    if (!q.customer_email) return;
    setPdfLoading(q.id);
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
            to: q.customer_email,
            to_name: q.customer_name,
            subject: t(
              `عرض سعر رقم ${q.quotation_number} من التهاني لخدمات الأفراح`,
              `Quotation ${q.quotation_number} from Altahany Wedding Services`
            ),
            html: `
              <p>${t(`عزيزنا ${q.customer_name}،`, `Dear ${q.customer_name},`)}</p>
              <p>${t('يرجى الاطلاع على عرض السعر المرفق بالتفاصيل التالية:', 'Please find your quotation with the following details:')}</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">${t('رقم العرض', 'Quote #')}</td><td style="padding:8px;border:1px solid #eee;">${q.quotation_number}</td></tr>
                ${q.event_date ? `<tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">${t('تاريخ الفعالية', 'Event Date')}</td><td style="padding:8px;border:1px solid #eee;">${q.event_date}</td></tr>` : ''}
                ${q.valid_until ? `<tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">${t('صالح حتى', 'Valid Until')}</td><td style="padding:8px;border:1px solid #eee;">${q.valid_until}</td></tr>` : ''}
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">${t('الإجمالي', 'Total')}</td><td style="padding:8px;border:1px solid #eee;color:#F59E0B;font-weight:bold;">${q.currency || 'AED'} ${(q.total || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td></tr>
              </table>
              ${q.notes ? `<p style="color:#666;">${q.notes}</p>` : ''}
              <p>${t('لأي استفسار تواصل معنا على +971 52 724 9190', 'For inquiries contact us at +971 52 724 9190')}</p>
            `,
            log_type: 'quotation',
            reference_id: q.id,
          }),
        }
      );
      await supabase.from('quotations').update({ status: 'sent' }).eq('id', q.id);
      fetchQuotations();
    } finally {
      setPdfLoading(null);
    }
  }

  const filtered = quotations.filter(q => {
    const matchSearch = q.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      q.quotation_number?.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (statusFilter === 'all' || q.status === statusFilter);
  });

  const { subtotal, vat_amount, total } = calcTotals();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-arabic">{t('عروض الأسعار', 'Quotations')}</h1>
          <p className="text-gray-500 text-xs font-arabic mt-0.5">{quotations.length} {t('عرض سعر', 'quotations')}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors font-arabic">
          <Plus className="w-4 h-4" />
          {t('عرض سعر جديد', 'New Quotation')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder={t('بحث...', 'Search...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 font-arabic"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'draft', 'sent', 'approved', 'rejected', 'expired', 'converted'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-arabic transition-all ${statusFilter === s ? 'bg-amber-500 text-white' : 'bg-gray-900 text-gray-400 border border-white/10'}`}
            >
              {s === 'all' ? t('الكل', 'All') : getStatusLabel(s, 'ar')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-arabic">{t('رقم العرض', 'Quote #')}</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-arabic">{t('العميل', 'Customer')}</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-arabic">{t('تاريخ الفعالية', 'Event Date')}</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-arabic">{t('صالح حتى', 'Valid Until')}</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-arabic">{t('الإجمالي', 'Total')}</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-arabic">{t('الحالة', 'Status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                ))}</tr>
              )) : filtered.length > 0 ? filtered.map(q => (
                <tr key={q.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-amber-400 font-mono">{q.quotation_number}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-200 font-arabic">{q.customer_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{q.event_date ? new Date(q.event_date).toLocaleDateString('ar-AE') : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{q.valid_until ? new Date(q.valid_until).toLocaleDateString('ar-AE') : '-'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-100">{formatCurrency(q.total || 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium font-arabic ${getStatusColor(q.status)}`}>
                      {getStatusLabel(q.status, 'ar')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setShowView(q)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-blue-400 transition-colors"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-amber-400 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleWhatsApp(q)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-green-400 transition-colors" title={t('واتساب', 'WhatsApp')}><MessageCircle className="w-4 h-4" /></button>
                      {q.customer_email && (
                        <button onClick={() => handleSendEmail(q)} disabled={pdfLoading === q.id} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-blue-400 transition-colors" title={t('إرسال بريد', 'Send Email')}>
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDownloadPDF(q)} disabled={pdfLoading === q.id} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-amber-400 transition-colors">
                        {pdfLoading === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(q.id)} disabled={deleting === q.id} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition-colors">
                        {deleting === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="py-16 text-center text-gray-600 font-arabic">{t('لا توجد عروض أسعار', 'No quotations found')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {showView && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-lg my-8">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="font-semibold text-white font-arabic">{t('تفاصيل عرض السعر', 'Quotation Details')}</h2>
              <button onClick={() => setShowView(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              {[
                [t('رقم العرض','Quote #'), showView.quotation_number],
                [t('العميل','Customer'), showView.customer_name],
                [t('الهاتف','Phone'), showView.customer_phone],
                [t('البريد','Email'), showView.customer_email],
                [t('تاريخ الفعالية','Event Date'), showView.event_date ? new Date(showView.event_date).toLocaleDateString('ar-AE') : null],
                [t('نوع الفعالية','Event Type'), showView.event_type],
                [t('صالح حتى','Valid Until'), showView.valid_until ? new Date(showView.valid_until).toLocaleDateString('ar-AE') : null],
                [t('المجموع الفرعي','Subtotal'), formatCurrency(showView.subtotal || 0)],
                [t('ضريبة القيمة المضافة','VAT'), formatCurrency(showView.vat_amount || 0)],
                [t('الإجمالي','Total'), formatCurrency(showView.total || 0)],
              ].map(([label, value]) => value ? (
                <div key={String(label)} className="flex justify-between text-sm">
                  <span className="text-gray-500 font-arabic">{label}</span>
                  <span className="text-gray-200 font-arabic">{value}</span>
                </div>
              ) : null)}
            </div>
            <div className="p-5 pt-0 flex gap-2">
              <button onClick={() => { setShowView(null); openEdit(showView); }} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold font-arabic hover:bg-amber-600 transition-colors">{t('تعديل','Edit')}</button>
              <button onClick={() => handleWhatsApp(showView)} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold font-arabic hover:bg-green-700 transition-colors">{t('واتساب','WhatsApp')}</button>
              <button onClick={() => setShowView(null)} className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm font-arabic hover:bg-white/10 transition-colors">{t('إغلاق','Close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-3xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="font-semibold text-white font-arabic">{editing ? t('تعديل عرض السعر', 'Edit Quotation') : t('عرض سعر جديد', 'New Quotation')}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('اسم العميل *', 'Customer Name *')}</label>
                  <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('رقم الهاتف', 'Phone')}</label>
                  <input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('البريد الإلكتروني', 'Email')}</label>
                  <input type="email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('نوع الفعالية', 'Event Type')}</label>
                  <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))} className={inputCls}>
                    <option value="">{t('اختر...', 'Select...')}</option>
                    {['زفاف','خطوبة','عقد قران','مناسبة أخرى'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('تاريخ الفعالية', 'Event Date')}</label>
                  <input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('صالح حتى', 'Valid Until')}</label>
                  <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الحالة', 'Status')}</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    {['draft','sent','approved','rejected','expired','converted'].map(s => (
                      <option key={s} value={s}>{getStatusLabel(s, 'ar')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('العملة', 'Currency')}</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className={inputCls}>
                    <option value="AED">AED - درهم</option>
                    <option value="USD">USD - دولار</option>
                    <option value="SAR">SAR - ريال</option>
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white font-arabic">{t('بنود العرض', 'Line Items')}</h3>
                  <button onClick={() => setItems(it => [...it, emptyItem()])} className="text-xs text-amber-400 hover:text-amber-300 font-arabic">+ {t('إضافة بند', 'Add Item')}</button>
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <input
                          value={item.description}
                          onChange={e => setItems(it => it.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
                          placeholder={t('وصف الخدمة...', 'Service description...')}
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => setItems(it => it.map((x, i) => i === idx ? { ...x, quantity: Number(e.target.value) } : x))}
                          placeholder={t('الكمية', 'Qty')}
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={e => setItems(it => it.map((x, i) => i === idx ? { ...x, unit_price: Number(e.target.value) } : x))}
                          placeholder={t('السعر', 'Price')}
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button onClick={() => setItems(it => it.filter((_, i) => i !== idx))} disabled={items.length <= 1} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors disabled:opacity-30">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('نسبة الخصم %', 'Discount %')}</label>
                  <input type="number" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('نسبة الضريبة %', 'VAT %')}</label>
                  <input type="number" value={form.vat_percent} onChange={e => setForm(f => ({ ...f, vat_percent: e.target.value }))} className={inputCls} />
                </div>
                <div className="bg-gray-800 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500 font-arabic">
                    <span>{t('المجموع الفرعي','Subtotal')}</span><span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 font-arabic">
                    <span>{t('الضريبة','VAT')}</span><span>{formatCurrency(vat_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-white font-arabic border-t border-white/10 pt-1.5">
                    <span>{t('الإجمالي','Total')}</span><span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('ملاحظات', 'Notes')}</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} resize-none`} />
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-2">
              <button onClick={handleSave} disabled={saving || !form.customer_name.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold font-arabic hover:bg-amber-600 transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ', 'Save')}
              </button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm font-arabic hover:bg-white/10 transition-colors">{t('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
