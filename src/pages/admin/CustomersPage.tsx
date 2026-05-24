import React, { useEffect, useState } from 'react';
import { Plus, Search, Mail, Phone, Tag, Eye, Pencil, Trash2, X, Save, Loader2, Star } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase, Customer } from '../../lib/supabase';

const inputCls = 'w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 font-arabic';

type CustomerForm = {
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  category: string;
  nationality: string;
  address: string;
  notes: string;
  tags: string;
};

function emptyForm(): CustomerForm {
  return { full_name: '', email: '', phone: '', whatsapp: '', category: 'individual', nationality: '', address: '', notes: '', tags: '' };
}

const catColors: Record<string, string> = {
  individual: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  corporate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  vip: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};
const catLabels: Record<string, { ar: string; en: string }> = {
  individual: { ar: 'فرد', en: 'Individual' },
  corporate: { ar: 'شركة', en: 'Corporate' },
  vip: { ar: 'VIP', en: 'VIP' },
};

export default function CustomersPage() {
  const { t } = useLang();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState<Customer | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (error) console.error('Supabase Error Details:', error?.message, error?.details, error?.hint, error?.code);
      setCustomers((data ?? []) as Customer[]);
    } catch (err) {
      console.error('fetchCustomers unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      full_name: c.full_name || '',
      email: c.email || '',
      phone: c.phone || '',
      whatsapp: c.whatsapp || '',
      category: c.category || 'individual',
      nationality: c.nationality || '',
      address: c.address || '',
      notes: c.notes || '',
      tags: (c.tags || []).join(', '),
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.full_name.trim()) return;
    setSaving(true);
    try {
      const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const payload = {
        full_name: form.full_name,
        email: form.email || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        category: form.category,
        nationality: form.nationality || null,
        address: form.address || null,
        notes: form.notes || null,
        tags,
      };
      if (editing) {
        const { error } = await supabase.from('customers').update(payload).eq('id', editing.id).select();
        if (error) console.error('Supabase Error Details:', error?.message, error?.details, error?.hint, error?.code);
      } else {
        const { data: inserted, error } = await supabase.from('customers').insert(payload).select().single();
        if (error) {
          console.error('Supabase Error Details:', error?.message, error?.details, error?.hint, error?.code);
        } else {
          console.log('Customer inserted successfully:', inserted?.id);
        }
      }
      setShowForm(false);
      fetchCustomers();
    } catch (err) {
      console.error('handleSave customer unexpected error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?'))) return;
    setDeleting(id);
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) console.error('Supabase Error Details:', error?.message, error?.details, error?.hint, error?.code);
      else fetchCustomers();
    } catch (err) {
      console.error('handleDelete customer unexpected error:', err);
    } finally {
      setDeleting(null);
    }
  }

  const filtered = customers.filter(c => {
    const matchSearch = c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search);
    return matchSearch && (catFilter === 'all' || c.category === catFilter);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-arabic">{t('العملاء', 'Customers')}</h1>
          <p className="text-gray-500 text-xs font-arabic mt-0.5">{t(`${customers.length} عميل إجمالي`, `${customers.length} total customers`)}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors font-arabic"
        >
          <Plus className="w-4 h-4" />
          {t('عميل جديد', 'New Customer')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder={t('بحث بالاسم أو الهاتف أو البريد...', 'Search by name, phone or email...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 font-arabic"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'individual', 'corporate', 'vip'].map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-arabic transition-all ${catFilter === cat ? 'bg-amber-500 text-white' : 'bg-gray-900 text-gray-400 border border-white/10 hover:border-amber-500/30'}`}
            >
              {cat === 'all' ? t('الكل', 'All') : t(catLabels[cat]?.ar, catLabels[cat]?.en)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-2xl p-5 border border-white/5 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          </div>
        )) : filtered.length > 0 ? filtered.map(c => (
          <div key={c.id} className="bg-gray-900 rounded-2xl p-5 border border-white/5 hover:border-amber-500/20 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {c.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-100 font-arabic">{c.full_name}</div>
                  <span className={`px-2 py-0.5 rounded-lg text-xs border ${catColors[c.category] || catColors.individual}`}>
                    {t(catLabels[c.category]?.ar, catLabels[c.category]?.en)}
                  </span>
                </div>
              </div>
              {c.category === 'vip' && <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />}
            </div>
            <div className="space-y-1.5">
              {c.phone && (
                <div className="flex items-center gap-2 text-xs text-gray-500"><Phone className="w-3.5 h-3.5" />{c.phone}</div>
              )}
              {c.email && (
                <div className="flex items-center gap-2 text-xs text-gray-500"><Mail className="w-3.5 h-3.5" />{c.email}</div>
              )}
              {c.tags && c.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {c.tags.slice(0, 2).map((tag: string) => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 text-xs text-gray-400">
                      <Tag className="w-2.5 h-2.5" />{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setShowView(c)} className="flex-1 py-1.5 rounded-lg bg-white/5 text-xs text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 transition-colors flex items-center justify-center gap-1.5 font-arabic">
                <Eye className="w-3.5 h-3.5" />{t('عرض', 'View')}
              </button>
              <button onClick={() => openEdit(c)} className="flex-1 py-1.5 rounded-lg bg-white/5 text-xs text-gray-400 hover:bg-amber-500/10 hover:text-amber-400 transition-colors flex items-center justify-center gap-1.5 font-arabic">
                <Pencil className="w-3.5 h-3.5" />{t('تعديل', 'Edit')}
              </button>
              <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id} className="py-1.5 px-3 rounded-lg bg-white/5 text-xs text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center justify-center">
                {deleting === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-16 text-center text-gray-600 font-arabic">{t('لا يوجد عملاء', 'No customers found')}</div>
        )}
      </div>

      {/* View Modal */}
      {showView && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-lg my-8">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="font-semibold text-white font-arabic">{t('تفاصيل العميل', 'Customer Details')}</h2>
              <button onClick={() => setShowView(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xl">
                  {showView.full_name?.charAt(0)}
                </div>
                <div>
                  <div className="text-lg font-semibold text-white font-arabic">{showView.full_name}</div>
                  <span className={`px-2 py-0.5 rounded-lg text-xs border ${catColors[showView.category] || catColors.individual}`}>
                    {t(catLabels[showView.category]?.ar, catLabels[showView.category]?.en)}
                  </span>
                </div>
              </div>
              {[
                [t('الهاتف','Phone'), showView.phone],
                [t('الواتساب','WhatsApp'), showView.whatsapp],
                [t('البريد','Email'), showView.email],
                [t('الجنسية','Nationality'), showView.nationality],
                [t('العنوان','Address'), showView.address],
              ].map(([label, value]) => value ? (
                <div key={String(label)} className="flex justify-between text-sm">
                  <span className="text-gray-500 font-arabic">{label}</span>
                  <span className="text-gray-200 font-arabic">{value}</span>
                </div>
              ) : null)}
              {showView.tags?.length > 0 && (
                <div className="flex gap-1.5 flex-wrap pt-2 border-t border-white/5">
                  {showView.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 rounded-lg bg-white/5 text-xs text-gray-400 font-arabic">{tag}</span>
                  ))}
                </div>
              )}
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
              <h2 className="font-semibold text-white font-arabic">{editing ? t('تعديل العميل', 'Edit Customer') : t('عميل جديد', 'New Customer')}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الاسم الكامل *', 'Full Name *')}</label>
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('التصنيف', 'Category')}</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
                  <option value="individual">{t('فرد', 'Individual')}</option>
                  <option value="corporate">{t('شركة', 'Corporate')}</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('رقم الهاتف', 'Phone')}</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('واتساب', 'WhatsApp')}</label>
                <input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('البريد الإلكتروني', 'Email')}</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الجنسية', 'Nationality')}</label>
                <input value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('العنوان', 'Address')}</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الوسوم (مفصولة بفاصلة)', 'Tags (comma separated)')}</label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className={inputCls} placeholder="عروس، عميل مميز، ..." />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('ملاحظات', 'Notes')}</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} resize-none`} />
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-2">
              <button onClick={handleSave} disabled={saving || !form.full_name.trim()}
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
