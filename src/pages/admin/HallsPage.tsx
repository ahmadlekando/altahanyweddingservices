import React, { useEffect, useState } from 'react';
import { Plus, Search, MapPin, Users, Star, CreditCard as Edit2, Trash2, X, Save, Building } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

type Hall = {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  city: string;
  address: string;
  map_url: string;
  capacity_min: number;
  capacity_max: number;
  price_per_night: number;
  features: string[];
  images: string[];
  phone: string;
  email: string;
  rating: number;
  reviews_count: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
};

const emptyHall = (): Omit<Hall, 'id' | 'rating' | 'reviews_count' | 'created_at'> => ({
  name: '',
  name_ar: '',
  description: '',
  description_ar: '',
  city: 'Sharjah',
  address: '',
  map_url: '',
  capacity_min: 0,
  capacity_max: 0,
  price_per_night: 0,
  features: [],
  images: [],
  phone: '',
  email: '',
  is_featured: false,
  is_active: true,
});

export default function HallsPage() {
  const { t } = useLang();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Hall | null>(null);
  const [form, setForm] = useState(emptyHall());
  const [saving, setSaving] = useState(false);
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('wedding_halls').select('*').order('sort_order').order('created_at', { ascending: false });
    if (data) setHalls(data);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyHall());
    setFeatureInput('');
    setShowForm(true);
  };

  const openEdit = (hall: Hall) => {
    setEditing(hall);
    setForm({
      name: hall.name,
      name_ar: hall.name_ar,
      description: hall.description,
      description_ar: hall.description_ar,
      city: hall.city,
      address: hall.address,
      map_url: hall.map_url,
      capacity_min: hall.capacity_min,
      capacity_max: hall.capacity_max,
      price_per_night: hall.price_per_night,
      features: [...hall.features],
      images: [...hall.images],
      phone: hall.phone,
      email: hall.email,
      is_featured: hall.is_featured,
      is_active: hall.is_active,
    });
    setFeatureInput('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editing) {
        await supabase.from('wedding_halls').update({ ...form, updated_at: new Date().toISOString() } as any).eq('id', editing.id);
      } else {
        await supabase.from('wedding_halls').insert({ ...form, sort_order: halls.length });
      }
      await load();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete this hall?'))) return;
    await supabase.from('wedding_halls').delete().eq('id', id);
    setHalls(prev => prev.filter(h => h.id !== id));
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setForm(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
    setFeatureInput('');
  };

  const removeFeature = (i: number) => setForm(prev => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }));

  const filtered = halls.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.name_ar.includes(search) ||
    h.city.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-arabic">{t('دليل قاعات الأفراح', 'Wedding Halls Directory')}</h1>
          <p className="text-gray-500 text-xs font-arabic mt-0.5">{halls.length} {t('قاعة', 'halls')}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors font-arabic"
        >
          <Plus className="w-4 h-4" />
          {t('إضافة قاعة', 'Add Hall')}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder={t('بحث...', 'Search halls...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 font-arabic"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl h-48 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(hall => (
            <div key={hall.id} className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden group hover:border-amber-500/20 transition-all">
              {/* Image placeholder */}
              <div className="h-32 bg-gradient-to-br from-gray-800 to-gray-700 relative overflow-hidden">
                {hall.images[0] ? (
                  <img src={hall.images[0]} alt={hall.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building className="w-10 h-10 text-gray-600" />
                  </div>
                )}
                {hall.is_featured && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-lg font-arabic">
                    {t('مميز', 'Featured')}
                  </div>
                )}
                {!hall.is_active && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-xs text-gray-400 font-arabic">{t('غير نشط', 'Inactive')}</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white font-arabic">{hall.name_ar || hall.name}</h3>
                    <p className="text-xs text-gray-500">{hall.name}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-gray-400">{hall.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span>{hall.city}{hall.address ? ` — ${hall.address.substring(0, 25)}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    <span>{hall.capacity_min} – {hall.capacity_max} {t('شخص', 'guests')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold text-sm">{formatCurrency(hall.price_per_night)}<span className="text-gray-600 font-normal text-xs">/{t('ليلة', 'night')}</span></span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(hall)}
                      className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-amber-400 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(hall.id)}
                      className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl border border-white/5 py-16 text-center">
          <Building className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-arabic text-sm">{t('لا توجد قاعات مضافة بعد', 'No halls added yet')}</p>
          <button onClick={openNew} className="mt-4 text-amber-400 text-sm font-arabic hover:text-amber-300 transition-colors">
            {t('إضافة أول قاعة', 'Add your first hall')}
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-base font-bold text-white font-arabic">
                {editing ? t('تعديل القاعة', 'Edit Hall') : t('إضافة قاعة جديدة', 'Add New Hall')}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label_ar="اسم القاعة (إنجليزي)" label_en="Hall Name (English)" field="name" />
                <Input label_ar="اسم القاعة (عربي)" label_en="Hall Name (Arabic)" field="name_ar" />
                <Input label_ar="المدينة" label_en="City" field="city" />
                <Input label_ar="العنوان" label_en="Address" field="address" />
                <Input label_ar="الحد الأدنى للطاقة" label_en="Min Capacity" field="capacity_min" type="number" />
                <Input label_ar="الحد الأقصى للطاقة" label_en="Max Capacity" field="capacity_max" type="number" />
                <Input label_ar="السعر لكل ليلة (AED)" label_en="Price Per Night (AED)" field="price_per_night" type="number" />
                <Input label_ar="رقم الهاتف" label_en="Phone" field="phone" />
                <Input label_ar="البريد الإلكتروني" label_en="Email" field="email" />
                <Input label_ar="رابط الخريطة" label_en="Map URL" field="map_url" />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الوصف (إنجليزي)', 'Description (English)')}</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الوصف (عربي)', 'Description (Arabic)')}</label>
                <textarea
                  rows={2}
                  value={form.description_ar}
                  onChange={e => setForm(p => ({ ...p, description_ar: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 resize-none font-arabic"
                />
              </div>

              {/* Features */}
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('المميزات', 'Features')}</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={e => setFeatureInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    placeholder={t('أضف ميزة...', 'Add feature...')}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 font-arabic"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-3 py-2 bg-amber-500 text-white rounded-xl text-sm hover:bg-amber-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.features.map((f, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 rounded-lg text-xs text-gray-300 font-arabic">
                      {f}
                      <button onClick={() => removeFeature(i)} className="text-gray-500 hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Toggles */}
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
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-arabic border border-white/10 hover:bg-gray-700 transition-colors"
              >
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
