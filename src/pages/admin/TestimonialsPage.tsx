import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, Star, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

type Testimonial = {
  id: string;
  customer_name: string;
  customer_name_ar: string;
  customer_photo: string;
  rating: number;
  review: string;
  review_ar: string;
  event_type: string;
  is_public: boolean;
  is_featured: boolean;
  sort_order: number;
};

type TestimonialForm = Omit<Testimonial, 'id'>;

function emptyForm(): TestimonialForm {
  return {
    customer_name: '', customer_name_ar: '', customer_photo: '',
    rating: 5, review: '', review_ar: '', event_type: 'wedding',
    is_public: true, is_featured: false, sort_order: 0,
  };
}

export default function TestimonialsPage() {
  const { t } = useLang();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<TestimonialForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchTestimonials(); }, []);

  async function fetchTestimonials() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('testimonials').select('*').order('sort_order');
      if (error) console.error('Supabase Error Details:', error?.message, error?.details, error?.hint, error?.code);
      setTestimonials((data ?? []) as Testimonial[]);
    } catch (err) {
      console.error('fetchTestimonials unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm(), sort_order: testimonials.length + 1 });
    setShowForm(true);
  }

  function openEdit(t_item: Testimonial) {
    setEditing(t_item);
    setForm({
      customer_name: t_item.customer_name,
      customer_name_ar: t_item.customer_name_ar,
      customer_photo: t_item.customer_photo || '',
      rating: t_item.rating,
      review: t_item.review,
      review_ar: t_item.review_ar,
      event_type: t_item.event_type || 'wedding',
      is_public: t_item.is_public,
      is_featured: t_item.is_featured,
      sort_order: t_item.sort_order,
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from('testimonials').update(form).eq('id', editing.id).select();
        if (error) console.error('Supabase Error Details:', error?.message, error?.details, error?.hint, error?.code);
      } else {
        const { data: inserted, error } = await supabase.from('testimonials').insert(form).select().single();
        if (error) {
          console.error('Supabase Error Details:', error?.message, error?.details, error?.hint, error?.code);
        } else {
          console.log('Testimonial inserted successfully:', inserted?.id);
        }
      }
      setShowForm(false);
      await fetchTestimonials();
    } catch (err) {
      console.error('handleSave testimonial unexpected error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) console.error('Supabase Error Details:', error?.message, error?.details, error?.hint, error?.code);
      else setTestimonials(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('handleDelete testimonial unexpected error:', err);
    } finally {
      setDeleting(null);
    }
  }

  async function togglePublic(item: Testimonial) {
    try {
      const { error } = await supabase.from('testimonials').update({ is_public: !item.is_public }).eq('id', item.id).select();
      if (error) console.error('Supabase Error Details:', error?.message, error?.details, error?.hint, error?.code);
      else setTestimonials(prev => prev.map(t => t.id === item.id ? { ...t, is_public: !t.is_public } : t));
    } catch (err) {
      console.error('togglePublic unexpected error:', err);
    }
  }

  const inputCls = 'w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 transition-colors font-arabic';

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-arabic">{t('آراء العملاء', 'Testimonials')}</h1>
            <p className="text-gray-500 text-xs font-arabic">{t('إدارة تقييمات العملاء في الموقع', 'Manage customer reviews on the website')}</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-arabic font-semibold hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('إضافة تقييم', 'Add Review')}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {testimonials.map((item) => (
            <div key={item.id} className="bg-gray-900 rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                {item.customer_photo ? (
                  <img src={item.customer_photo} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 text-amber-400 font-bold text-lg">
                    {(item.customer_name_ar || item.customer_name).charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-white font-arabic font-medium text-sm truncate">{item.customer_name_ar || item.customer_name}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.is_featured && <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-lg font-arabic">مميز</span>}
                      <button onClick={() => togglePublic(item)} className={`transition-colors ${item.is_public ? 'text-green-400' : 'text-gray-600'}`}>
                        {item.is_public ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-xs font-arabic leading-relaxed line-clamp-3 mb-3">{item.review_ar}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-arabic px-2 py-0.5 bg-white/5 rounded-lg">{item.event_type}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(item)} className="text-gray-500 hover:text-amber-400 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id} className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-50">
                    {deleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {testimonials.length === 0 && (
            <div className="sm:col-span-2 text-center py-16 text-gray-600 font-arabic">
              {t('لا توجد تقييمات بعد.', 'No testimonials yet.')}
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-3xl border border-white/10 w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white font-arabic">
                {editing ? t('تعديل التقييم', 'Edit Review') : t('إضافة تقييم جديد', 'Add New Review')}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الاسم (عربي) *', 'Name (Arabic) *')}</label>
                  <input type="text" value={form.customer_name_ar} onChange={e => setForm(p => ({ ...p, customer_name_ar: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الاسم (إنجليزي)', 'Name (English)')}</label>
                  <input type="text" value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('رابط الصورة', 'Photo URL')}</label>
                <input type="url" value={form.customer_photo} onChange={e => setForm(p => ({ ...p, customer_photo: e.target.value }))} className={inputCls} placeholder="https://..." />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('التقييم (عربي) *', 'Review (Arabic) *')}</label>
                  <textarea rows={4} value={form.review_ar} onChange={e => setForm(p => ({ ...p, review_ar: e.target.value }))} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('التقييم (إنجليزي)', 'Review (English)')}</label>
                  <textarea rows={4} value={form.review} onChange={e => setForm(p => ({ ...p, review: e.target.value }))} className={`${inputCls} resize-none`} />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('التقييم النجمي', 'Rating')}</label>
                  <select value={form.rating} onChange={e => setForm(p => ({ ...p, rating: parseInt(e.target.value) }))} className={inputCls}>
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('نوع الحدث', 'Event Type')}</label>
                  <select value={form.event_type} onChange={e => setForm(p => ({ ...p, event_type: e.target.value }))} className={inputCls}>
                    <option value="wedding">{t('زواج', 'Wedding')}</option>
                    <option value="engagement">{t('خطوبة', 'Engagement')}</option>
                    <option value="corporate">{t('شركة', 'Corporate')}</option>
                    <option value="other">{t('أخرى', 'Other')}</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button type="button" onClick={() => setForm(p => ({ ...p, is_public: !p.is_public }))} className={`relative w-11 h-6 rounded-full transition-colors ${form.is_public ? 'bg-green-500' : 'bg-gray-700'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${form.is_public ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                    <span className="text-sm text-gray-400 font-arabic">{t('عام', 'Public')}</span>
                  </label>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button type="button" onClick={() => setForm(p => ({ ...p, is_featured: !p.is_featured }))} className={`relative w-11 h-6 rounded-full transition-colors ${form.is_featured ? 'bg-amber-500' : 'bg-gray-700'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${form.is_featured ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                    <span className="text-sm text-gray-400 font-arabic">{t('مميز', 'Featured')}</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-white/5">
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-arabic border border-white/10 hover:bg-gray-700 transition-colors">
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.customer_name_ar}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-arabic font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
