import React, { useEffect, useState } from 'react';
import { Plus, Search, Download, Send, Eye, Printer, FileText, Loader2 } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase, Invoice } from '../../lib/supabase';
import { formatCurrency, getStatusColor, getStatusLabel } from '../../lib/utils';
import { generateInvoicePDF, PDFInvoiceData } from '../../lib/pdf';

export default function InvoicesPage() {
  const { t } = useLang();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
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

  useEffect(() => {
    supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setInvoices(data as Invoice[]);
        setLoading(false);
      });
  }, []);

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDownloadPDF = async (invoice: Invoice, print = false) => {
    setPdfLoading(invoice.id);
    try {
      const { data: itemsData } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id).order('sort_order');
      const pdfData: PDFInvoiceData = {
        ...invoice,
        items: itemsData || [],
        company_name: settings.company_name || 'Altahany Wedding Services',
        company_name_ar: settings.company_name_ar || 'التهاني لخدمات الأفراح',
        company_phone: settings.company_phone,
        company_email: settings.company_email,
        company_address: settings.company_address,
        vat_number: settings.vat_number,
        currency: invoice.currency || settings.currency || 'AED',
      };
      await generateInvoicePDF(pdfData, !print);
    } finally {
      setPdfLoading(null);
    }
  };

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const pendingAmount = invoices.filter(i => ['draft','sent','partial'].includes(i.status)).reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-arabic">{t('الفواتير', 'Invoices')}</h1>
          <p className="text-gray-500 text-xs font-arabic mt-0.5">{t(`${invoices.length} فاتورة`, `${invoices.length} invoices`)}</p>
        </div>
        <a
          href="/admin/invoices/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors font-arabic"
        >
          <Plus className="w-4 h-4" />
          {t('فاتورة جديدة', 'New Invoice')}
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label_ar: 'إجمالي المحصل', label_en: 'Total Collected', value: formatCurrency(totalRevenue), color: 'text-emerald-400' },
          { label_ar: 'مستحق السداد', label_en: 'Pending Payment', value: formatCurrency(pendingAmount), color: 'text-amber-400' },
          { label_ar: 'فواتير مدفوعة', label_en: 'Paid Invoices', value: invoices.filter(i => i.status === 'paid').length.toString(), color: 'text-blue-400' },
          { label_ar: 'فواتير متأخرة', label_en: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length.toString(), color: 'text-red-400' },
        ].map((item, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-4 border border-white/5">
            <div className={`text-xl font-bold ${item.color} mb-1`}>{item.value}</div>
            <div className="text-xs text-gray-500 font-arabic">{t(item.label_ar, item.label_en)}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
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
          {['all', 'draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-arabic transition-all ${
                statusFilter === s ? 'bg-amber-500 text-white' : 'bg-gray-900 text-gray-400 border border-white/10 hover:border-amber-500/30'
              }`}
            >
              {s === 'all' ? t('الكل', 'All') : getStatusLabel(s, 'ar')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 font-arabic">{t('رقم الفاتورة', 'Invoice #')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 font-arabic">{t('العميل', 'Customer')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 font-arabic">{t('النوع', 'Type')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 font-arabic">{t('تاريخ الإصدار', 'Issue Date')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 font-arabic">{t('المبلغ', 'Amount')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 font-arabic">{t('الحالة', 'Status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                  ))}
                </tr>
              )) : filtered.length > 0 ? filtered.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <span className="text-sm text-amber-400 font-mono">{invoice.invoice_number}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-200 font-arabic">{invoice.customer_name}</div>
                    <div className="text-xs text-gray-500">{invoice.customer_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-arabic ${
                      invoice.invoice_type === 'tax' ? 'bg-blue-500/10 text-blue-400' :
                      invoice.invoice_type === 'proforma' ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-400'
                    }`}>
                      {invoice.invoice_type === 'tax' ? t('ضريبية', 'Tax') : invoice.invoice_type === 'proforma' ? t('أولية', 'Proforma') : t('إيصال', 'Receipt')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('ar-AE') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-100">{formatCurrency(invoice.total || 0)}</div>
                    {invoice.amount_paid > 0 && invoice.status !== 'paid' && (
                      <div className="text-xs text-emerald-400">{t('مدفوع: ', 'Paid: ')}{formatCurrency(invoice.amount_paid)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium font-arabic ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status, 'ar')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDownloadPDF(invoice, true)}
                        disabled={pdfLoading === invoice.id}
                        title={t('طباعة', 'Print')}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-blue-400 transition-colors"
                      >
                        {pdfLoading === invoice.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(invoice)}
                        disabled={pdfLoading === invoice.id}
                        title={t('تنزيل PDF', 'Download PDF')}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-amber-400 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const phone = invoice.customer_phone?.replace(/\D/g, '');
                          const msg = encodeURIComponent(`مرحباً ${invoice.customer_name}، فاتورتك رقم ${invoice.invoice_number} بإجمالي AED ${invoice.total?.toLocaleString()}. للاستفسار: ${settings.company_phone || ''}`);
                          if (phone) window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                          else if (invoice.customer_email) window.open(`mailto:${invoice.customer_email}?subject=فاتورة ${invoice.invoice_number}`);
                        }}
                        title={t('إرسال', 'Send')}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-green-400 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-600 font-arabic">
                    {t('لا توجد فواتير', 'No invoices found')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
