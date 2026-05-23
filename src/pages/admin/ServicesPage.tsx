import React, { useEffect, useState } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, X, Save, Layers } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

type Service = {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  icon: string;
  base_price: number;
  category: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

const emptyService = (): Omit<Service, 'id' | 'created_at'> => ({
  name: '',
  name_ar: '',
  description: '',
  description_ar: '',
  icon: '✨',
  base_price: 0,
  category: 'general',
  is_featured: false,
  is_active: true,
  sort_order: 0,
});

const CATEGORIES = ['general', 'music', 'photography', 'decor', 'makeup', 'transport', 'catering', 'entertainment'];

export default function ServicesPage() {
  const { t } = useLang();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(emptyService());
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('services').select('*').order('sort_order').order('created_at', { ascending: false });
    if (data) setServices(data);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyService(), sort_order: services.length });
    setShowForm(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({ name: s.name, name_ar: s.name_ar, description: s.description, description_ar: s.description_ar, icon: s.icon, base_price: s.base_price, category: s.category, is_featured: s.is_featured, is_active: s.is_active, sort_order: s.sort_order });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editing) {
        await supabase.from('services').update({ ...form, updated_at: new Date().toISOString() } as any).eq('id', editing.id);
      } else {
        await supabase.from('services').insert(form);
      }
      await load();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure?'))) return;
    await supabase.from('services').delete().eq('id', id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const Input = ({ label_ar, label_en, field, type = 'text' }: any) => (
    <div>
      <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t(label_ar, label_en)}</label>
      <input
        type={type}
        value={(form as any)[field] ?? ''}
        onChange={e => setForm(prev => ({ ...prev, [field]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
        className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 transition-colors font-arabic"
      />
    </div>
  );

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.name_ar.includes(search)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-arabic">{t('إدارة الخدمات', 'Services Management')}</h1>
          <p className="text-gray-500 text-xs font-arabic mt-0.5">{services.length} {t('خدمة', 'services')}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors font-arabic">
          <Plus className="w-4 h-4" />
          {t('إضافة خدمة', 'Add Service')}
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder={t('بحث في الخدمات...', 'Search services...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 font-arabic"
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl h-40 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(service => (
            <div key={service.id} className="bg-gray-900 rounded-2xl border border-white/5 p-5 group hover:border-amber-500/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl">
                    {service.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-arabic">{service.name_ar || service.name}</h3>
                    <p className="text-xs text-gray-500">{service.name}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(service)} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-amber-400 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(service.id)} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {service.description_ar && (
                <p className="text-xs text-gray-500 font-arabic mb-3 line-clamp-2">{service.description_ar}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold text-sm">{t('من', 'From')} {formatCurrency(service.base_price)}</span>
                <div className="flex items-center gap-2">
                  {service.is_featured && (
                    <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-lg font-arabic">{t('مميز', 'Featured')}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-arabic ${service.is_active ? 'bg-green-500/10 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                    {service.is_active ? t('نشط', 'Active') : t('مخفي', 'Hidden')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl border border-white/5 py-16 text-center">
          <Layers className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-arabic text-sm">{t('لا توجد خدمات مضافة', 'No services added yet')}</p>
          <button onClick={openNew} className="mt-4 text-amber-400 text-sm font-arabic hover:text-amber-300 transition-colors">
            {t('إضافة أول خدمة', 'Add your first service')}
          </button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-base font-bold text-white font-arabic">
                {editing ? t('تعديل الخدمة', 'Edit Service') : t('إضافة خدمة جديدة', 'Add New Service')}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label_ar="اسم الخدمة (إنجليزي)" label_en="Service Name (English)" field="name" />
                <Input label_ar="اسم الخدمة (عربي)" label_en="Service Name (Arabic)" field="name_ar" />
                <Input label_ar="الأيقونة (emoji)" label_en="Icon (emoji)" field="icon" />
                <Input label_ar="السعر الأساسي (AED)" label_en="Base Price (AED)" field="base_price" type="number" />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الفئة', 'Category')}</label>
                <select
                  value={form.category}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الوصف (إنجليزي)', 'Description (English)')}</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الوصف (عربي)', 'Description (Arabic)')}</label>
                <textarea rows={2} value={form.description_ar} onChange={e => setForm(p => ({ ...p, description_ar: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 resize-none font-arabic" />
              </div>

              <div className="flex gap-6">
                {[
                  { field: 'is_active', ar: 'نشط', en: 'Active' },
                  { field: 'is_featured', ar: 'مميز', en: 'Featured' },
                ].map(toggle => (
                  <label key={toggle.field} className="flex items-center gap-2 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, [toggle.field]: !(prev as any)[toggle.field] }))}
                      className={`relative w-10 h-5 rounded-full transition-colors ${(form as any)[toggle.field] ? 'bg-amber-500' : 'bg-gray-700'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${(form as any)[toggle.field] ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                    <span className="text-sm text-gray-400 font-arabic">{t(toggle.ar, toggle.en)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-white/5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-arabic border border-white/10 hover:bg-gray-700 transition-colors">
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-arabic hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
