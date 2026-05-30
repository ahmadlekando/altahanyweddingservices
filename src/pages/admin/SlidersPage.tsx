import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, GripVertical, Eye, EyeOff, Image as ImageIcon, Play, Star, Save, X, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

type Slider = {
  id?: string;
  title: string;
  title_ar: string;
  subtitle: string;
  subtitle_ar: string;
  image_url: string;
  video_url: string;
  cta_text: string;
  cta_text_ar: string;
  cta_url: string;
  overlay_opacity: number;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
};

const DEFAULT_SLIDER = (): Omit<Slider, 'id' | 'created_at'> => ({
  title: '',
  title_ar: '',
  subtitle: '',
  subtitle_ar: '',
  image_url: '',
  video_url: '',
  cta_text: '',
  cta_text_ar: '',
  cta_url: '',
  overlay_opacity: 0.5,
  is_active: true,
  sort_order: 0,
});

const SAMPLE_IMAGES = [
  'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1200',
];

export default function SlidersPage() {
  const { t } = useLang();
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Slider | null>(null);
  const [form, setForm] = useState<Omit<Slider, 'id' | 'created_at'>>(DEFAULT_SLIDER());
  const [saving, setSaving] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('sliders').select('*').order('sort_order').order('created_at');
    if (error) console.error('Sliders load error:', error.message, error.details);
    if (data) setSliders(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...DEFAULT_SLIDER(), sort_order: sliders.length });
    setModalOpen(true);
  };

  const openEdit = (s: Slider) => {
    setEditing(s);
    setForm({ ...s });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const payload = { ...form, updated_at: new Date().toISOString() };
    if (editing?.id) {
      const { error } = await supabase.from('sliders').update(payload).eq('id', editing.id);
      if (error) { setSaveError(error.message); setSaving(false); return; }
      await load();
    } else {
      const { error } = await supabase.from('sliders').insert(payload);
      if (error) { setSaveError(error.message); setSaving(false); return; }
      await load();
    }
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?'))) return;
    await supabase.from('sliders').delete().eq('id', id);
    setSliders(prev => prev.filter(s => s.id !== id));
  };

  const toggleActive = async (s: Slider) => {
    await supabase.from('sliders').update({ is_active: !s.is_active }).eq('id', s.id!);
    setSliders(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x));
  };

  const moveSlider = async (id: string, direction: 'up' | 'down') => {
    const idx = sliders.findIndex(s => s.id === id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sliders.length - 1)) return;

    const newSliders = [...sliders];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newSliders[idx], newSliders[swapIdx]] = [newSliders[swapIdx], newSliders[idx]];

    const updated = newSliders.map((s, i) => ({ ...s, sort_order: i }));
    setSliders(updated);

    for (const s of updated) {
      if (s.id) await supabase.from('sliders').update({ sort_order: s.sort_order }).eq('id', s.id);
    }
  };

  const activeSliders = sliders.filter(s => s.is_active);
  const previewSlider = activeSliders[previewIdx % Math.max(activeSliders.length, 1)];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white font-arabic">{t('إدارة سلايدر الهيرو', 'Hero Slider Management')}</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-arabic font-semibold hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('إضافة شريحة', 'Add Slide')}
        </button>
      </div>

      {/* Live Preview */}
      {activeSliders.length > 0 && (
        <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-sm font-semibold text-white font-arabic">{t('معاينة مباشرة', 'Live Preview')}</span>
            <div className="flex items-center gap-2">
              {activeSliders.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPreviewIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === previewIdx % activeSliders.length ? 'bg-amber-400 w-4' : 'bg-gray-600 hover:bg-gray-400'}`}
                />
              ))}
            </div>
          </div>
          {previewSlider && (
            <div className="relative h-48 overflow-hidden">
              <img
                src={previewSlider.image_url || SAMPLE_IMAGES[0]}
                alt={previewSlider.title}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = SAMPLE_IMAGES[0]; }}
              />
              <div
                className="absolute inset-0 bg-black flex items-center justify-center"
                style={{ opacity: previewSlider.overlay_opacity }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                {previewSlider.title && (
                  <h3 className="text-white text-xl font-bold mb-2">{previewSlider.title}</h3>
                )}
                {previewSlider.subtitle && (
                  <p className="text-gray-300 text-sm mb-3">{previewSlider.subtitle}</p>
                )}
                {previewSlider.cta_text && (
                  <span className="px-4 py-1.5 bg-amber-500 text-white text-xs rounded-full">{previewSlider.cta_text}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sliders List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-900 rounded-2xl animate-pulse border border-white/5" />
          ))
        ) : sliders.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-12 border border-white/5 text-center">
            <ImageIcon className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 font-arabic text-sm">{t('لا توجد شرائح بعد', 'No slides yet')}</p>
            <button onClick={openCreate} className="mt-3 text-amber-400 text-sm hover:underline font-arabic">
              {t('أضف أول شريحة', 'Add your first slide')}
            </button>
          </div>
        ) : (
          sliders.map((slide, idx) => (
            <motion.div
              key={slide.id}
              layout
              className={`bg-gray-900 rounded-2xl border p-4 transition-all ${slide.is_active ? 'border-white/5' : 'border-white/5 opacity-60'}`}
            >
              <div className="flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-16 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-800 relative">
                  {slide.image_url ? (
                    <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  {slide.video_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200 truncate">{slide.title || slide.title_ar || t('بدون عنوان', 'Untitled')}</span>
                    {!slide.is_active && <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-400 rounded-full font-arabic">{t('مخفي', 'Hidden')}</span>}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">{slide.subtitle || slide.image_url || '—'}</div>
                </div>

                {/* Order Controls */}
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveSlider(slide.id!, 'up')} disabled={idx === 0} className="p-1 text-gray-600 hover:text-gray-300 disabled:opacity-30 transition-colors">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => moveSlider(slide.id!, 'down')} disabled={idx === sliders.length - 1} className="p-1 text-gray-600 hover:text-gray-300 disabled:opacity-30 transition-colors">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleActive(slide)}
                    className={`p-2 rounded-lg transition-colors ${slide.is_active ? 'text-green-400 hover:bg-green-400/10' : 'text-gray-600 hover:bg-white/5'}`}
                    title={slide.is_active ? t('إخفاء', 'Hide') : t('إظهار', 'Show')}
                  >
                    {slide.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(slide)}
                    className="p-2 rounded-lg text-gray-400 hover:bg-white/5 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id!)}
                    className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-base font-bold text-white font-arabic">
                  {editing ? t('تعديل الشريحة', 'Edit Slide') : t('شريحة جديدة', 'New Slide')}
                </h2>
                <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg text-gray-400 hover:bg-white/5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Image URL */}
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('رابط الصورة', 'Image URL')}</label>
                  <input
                    type="text"
                    value={form.image_url}
                    onChange={e => setForm(prev => ({ ...prev, image_url: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50"
                    placeholder="https://..."
                  />
                  {/* Quick picks */}
                  <div className="flex gap-2 mt-2">
                    {SAMPLE_IMAGES.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setForm(prev => ({ ...prev, image_url: img }))}
                        className={`w-12 h-8 rounded-lg overflow-hidden border-2 transition-all ${form.image_url === img ? 'border-amber-500' : 'border-transparent hover:border-white/20'}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <span className="text-xs text-gray-600 self-center font-arabic">{t('أمثلة سريعة', 'Quick picks')}</span>
                  </div>
                </div>

                {/* Video URL */}
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('رابط الفيديو (اختياري)', 'Video URL (optional)')}</label>
                  <input
                    type="text"
                    value={form.video_url}
                    onChange={e => setForm(prev => ({ ...prev, video_url: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50"
                    placeholder="https://..."
                  />
                </div>

                {/* Titles */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('العنوان (إنجليزي)', 'Title (English)')}</label>
                    <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('العنوان (عربي)', 'Title (Arabic)')}</label>
                    <input type="text" dir="rtl" value={form.title_ar} onChange={e => setForm(p => ({ ...p, title_ar: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 font-arabic" />
                  </div>
                </div>

                {/* Subtitles */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('العنوان الفرعي (إنجليزي)', 'Subtitle (English)')}</label>
                    <input type="text" value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('العنوان الفرعي (عربي)', 'Subtitle (Arabic)')}</label>
                    <input type="text" dir="rtl" value={form.subtitle_ar} onChange={e => setForm(p => ({ ...p, subtitle_ar: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 font-arabic" />
                  </div>
                </div>

                {/* CTA */}
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('نص الزر (EN)', 'Button Text (EN)')}</label>
                    <input type="text" value={form.cta_text} onChange={e => setForm(p => ({ ...p, cta_text: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50" placeholder="Book Now" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('نص الزر (AR)', 'Button Text (AR)')}</label>
                    <input type="text" dir="rtl" value={form.cta_text_ar} onChange={e => setForm(p => ({ ...p, cta_text_ar: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 font-arabic" placeholder="احجز الآن" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('رابط الزر', 'Button URL')}</label>
                    <input type="text" value={form.cta_url} onChange={e => setForm(p => ({ ...p, cta_url: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50" placeholder="#booking" />
                  </div>
                </div>

                {/* Overlay opacity */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-gray-500 font-arabic">{t('شفافية الطبقة الداكنة', 'Overlay Opacity')}</label>
                    <span className="text-xs text-amber-400">{Math.round(form.overlay_opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={form.overlay_opacity}
                    onChange={e => setForm(p => ({ ...p, overlay_opacity: parseFloat(e.target.value) }))}
                    className="w-full accent-amber-500"
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                  <span className="text-sm text-gray-300 font-arabic">{t('نشط / مرئي', 'Active / Visible')}</span>
                  <button
                    onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-amber-500' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${form.is_active ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 p-5 border-t border-white/5 flex-col">
                {saveError && (
                  <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 font-arabic">
                    {t('خطأ:', 'Error:')} {saveError}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setModalOpen(false); setSaveError(null); }}
                    className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-arabic hover:bg-gray-700 transition-colors"
                  >
                    {t('إلغاء', 'Cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-arabic font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ', 'Save')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
