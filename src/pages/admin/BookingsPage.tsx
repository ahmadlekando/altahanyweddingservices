import React, { useEffect, useState } from 'react';
import { Plus, Search, Calendar, Phone, Eye, Pencil, Trash2, X, Save, Loader2 } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase, Booking } from '../../lib/supabase';
import { formatCurrency, getStatusColor, getStatusLabel } from '../../lib/utils';

const inputCls = 'w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 font-arabic';

type BookingForm = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  event_date: string;
  event_type: string;
  hall_name: string;
  guests_count: string;
  total_amount: string;
  paid_amount: string;
  status: string;
  notes: string;
};

function emptyForm(): BookingForm {
  return {
    customer_name: '', customer_phone: '', customer_email: '',
    event_date: '', event_type: '', hall_name: '', guests_count: '',
    total_amount: '', paid_amount: '0', status: 'pending', notes: '',
  };
}

export default function BookingsPage() {
  const { t } = useLang();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState<Booking | null>(null);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [form, setForm] = useState<BookingForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchBookings(); }, []);

  async function fetchBookings() {
    setLoading(true);
    const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (data) setBookings(data as Booking[]);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEdit(b: Booking) {
    setEditing(b);
    setForm({
      customer_name: b.customer_name || '',
      customer_phone: b.customer_phone || '',
      customer_email: b.customer_email || '',
      event_date: b.event_date || '',
      event_type: b.event_type || '',
      hall_name: b.hall_name || '',
      guests_count: String(b.guests_count || ''),
      total_amount: String(b.total_amount || ''),
      paid_amount: String(b.paid_amount || '0'),
      status: b.status || 'pending',
      notes: b.notes || '',
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.customer_name.trim()) return;
    setSaving(true);
    const payload = {
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_email: form.customer_email,
      event_date: form.event_date || null,
      event_type: form.event_type,
      hall_name: form.hall_name,
      guests_count: form.guests_count ? Number(form.guests_count) : null,
      total_amount: form.total_amount ? Number(form.total_amount) : 0,
      paid_amount: form.paid_amount ? Number(form.paid_amount) : 0,
      status: form.status,
      notes: form.notes,
    };
    if (editing) {
      await supabase.from('bookings').update(payload).eq('id', editing.id);
    } else {
      const num = `BK-${Date.now().toString().slice(-6)}`;
      await supabase.from('bookings').insert({ ...payload, booking_number: num });
    }
    setSaving(false);
    setShowForm(false);
    fetchBookings();
  }

  async function handleDelete(id: string) {
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete this booking?'))) return;
    setDeleting(id);
    await supabase.from('bookings').delete().eq('id', id);
    setDeleting(null);
    fetchBookings();
  }

  const filtered = bookings.filter(b => {
    const matchSearch = b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_number?.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (statusFilter === 'all' || b.status === statusFilter);
  });

  const statuses = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-arabic">{t('الحجوزات', 'Bookings')}</h1>
          <p className="text-gray-500 text-xs font-arabic mt-0.5">{t(`${bookings.length} حجز إجمالي`, `${bookings.length} total bookings`)}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors font-arabic"
        >
          <Plus className="w-4 h-4" />
          {t('حجز جديد', 'New Booking')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder={t('بحث بالاسم أو رقم الحجز...', 'Search by name or booking number...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 font-arabic"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-arabic transition-all ${statusFilter === s ? 'bg-amber-500 text-white' : 'bg-gray-900 text-gray-400 border border-white/10 hover:border-amber-500/30'}`}
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
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 font-arabic">{t('رقم الحجز', 'Booking #')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 font-arabic">{t('العميل', 'Customer')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 font-arabic">{t('تاريخ الفعالية', 'Event Date')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 font-arabic">{t('الخدمة', 'Service')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 font-arabic">{t('المبلغ', 'Amount')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 font-arabic">{t('الحالة', 'Status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                ))}</tr>
              )) : filtered.length > 0 ? filtered.map(b => (
                <tr key={b.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-4 py-3 text-sm text-amber-400 font-mono">{b.booking_number}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-200 font-arabic">{b.customer_name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{b.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      {b.event_date ? new Date(b.event_date).toLocaleDateString('ar-AE') : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 font-arabic">{b.event_type || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-200 font-medium">{formatCurrency(b.total_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium font-arabic ${getStatusColor(b.status)}`}>
                      {getStatusLabel(b.status, 'ar')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setShowView(b)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-blue-400 transition-colors"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-amber-400 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(b.id)} disabled={deleting === b.id} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition-colors">
                        {deleting === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="py-16 text-center text-gray-600 font-arabic">{t('لا توجد حجوزات', 'No bookings found')}</td></tr>
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
              <h2 className="font-semibold text-white font-arabic">{t('تفاصيل الحجز', 'Booking Details')}</h2>
              <button onClick={() => setShowView(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              {[
                [t('رقم الحجز','Booking #'), showView.booking_number],
                [t('العميل','Customer'), showView.customer_name],
                [t('الهاتف','Phone'), showView.customer_phone],
                [t('البريد','Email'), showView.customer_email],
                [t('تاريخ الفعالية','Event Date'), showView.event_date ? new Date(showView.event_date).toLocaleDateString('ar-AE') : '-'],
                [t('نوع الفعالية','Event Type'), showView.event_type],
                [t('القاعة','Hall'), showView.hall_name],
                [t('عدد الضيوف','Guests'), showView.guests_count],
                [t('المبلغ الإجمالي','Total Amount'), formatCurrency(showView.total_amount)],
                [t('المدفوع','Paid'), formatCurrency(showView.paid_amount)],
                [t('الحالة','Status'), getStatusLabel(showView.status, 'ar')],
              ].map(([label, value]) => value ? (
                <div key={String(label)} className="flex justify-between text-sm">
                  <span className="text-gray-500 font-arabic">{label}</span>
                  <span className="text-gray-200 font-arabic">{value}</span>
                </div>
              ) : null)}
              {showView.notes && (
                <div className="pt-2 border-t border-white/5">
                  <div className="text-xs text-gray-500 font-arabic mb-1">{t('ملاحظات','Notes')}</div>
                  <div className="text-sm text-gray-300 font-arabic">{showView.notes}</div>
                </div>
              )}
            </div>
            <div className="p-5 pt-0 flex gap-2">
              <button onClick={() => { setShowView(null); openEdit(showView); }} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold font-arabic hover:bg-amber-600 transition-colors">{t('تعديل','Edit')}</button>
              <button onClick={() => setShowView(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm font-arabic hover:bg-white/10 transition-colors">{t('إغلاق','Close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="font-semibold text-white font-arabic">{editing ? t('تعديل الحجز', 'Edit Booking') : t('حجز جديد', 'New Booking')}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('اسم العميل *', 'Customer Name *')}</label>
                <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('رقم الهاتف', 'Phone Number')}</label>
                <input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('البريد الإلكتروني', 'Email')}</label>
                <input type="email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('تاريخ الفعالية', 'Event Date')}</label>
                <input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('نوع الفعالية', 'Event Type')}</label>
                <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))} className={inputCls}>
                  <option value="">{t('اختر...', 'Select...')}</option>
                  {['زفاف','خطوبة','عقد قران','مناسبة أخرى'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('القاعة', 'Hall')}</label>
                <input value={form.hall_name} onChange={e => setForm(f => ({ ...f, hall_name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('عدد الضيوف', 'Guests Count')}</label>
                <input type="number" value={form.guests_count} onChange={e => setForm(f => ({ ...f, guests_count: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الحالة', 'Status')}</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                  {['pending','confirmed','in_progress','completed','cancelled'].map(s => (
                    <option key={s} value={s}>{getStatusLabel(s, 'ar')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('المبلغ الإجمالي (درهم)', 'Total Amount (AED)')}</label>
                <input type="number" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('المبلغ المدفوع (درهم)', 'Paid Amount (AED)')}</label>
                <input type="number" value={form.paid_amount} onChange={e => setForm(f => ({ ...f, paid_amount: e.target.value }))} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('ملاحظات', 'Notes')}</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} resize-none`} />
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
