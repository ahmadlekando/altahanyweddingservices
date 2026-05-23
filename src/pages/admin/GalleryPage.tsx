import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, X, Save, Image as ImageIcon, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

type GalleryItem = {
  id: string;
  title: string;
  title_ar: string;
  description: string;
  image_url: string;
  category: string;
  tags: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

const CATEGORIES = ['all', 'weddings', 'zaffa', 'decoration', 'photography', 'makeup', 'venue'];

const emptyItem = (): Omit<GalleryItem, 'id' | 'created_at'> => ({
  title: '',
  title_ar: '',
  description: '',
  image_url: '',
  category: 'weddings',
  tags: [],
  is_featured: false,
  is_active: true,
  sort_order: 0,
});

export default function GalleryPage() {
  const { t } = useLang();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState(emptyItem());
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [preview, setPreview] = useState<GalleryItem | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('gallery_items').select('*').order('sort_order').order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyItem(), sort_order: items.length });
    setTagInput('');
    setShowForm(true);
  };

  const openEdit = (item: GalleryItem) => {
    setEditing(item);
    setForm({ title: item.title, title_ar: item.title_ar, description: item.description, image_url: item.image_url, category: item.category, tags: [...item.tags], is_featured: item.is_featured, is_active: item.is_active, sort_order: item.sort_order });
    setTagInput('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.image_url) return;
    setSaving(true);
    try {
      if (editing) {
        await supabase.from('gallery_items').update({ ...form, updated_at: new Date().toISOString() } as any).eq('id', editing.id);
      } else {
        await supabase.from('gallery_items').insert(form);
      }
      await load();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure?'))) return;
    await supabase.from('gallery_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const toggleFeatured = async (item: GalleryItem) => {
    await supabase.from('gallery_items').update({ is_featured: !item.is_featured } as any).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_featured: !i.is_featured } : i));
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
    setTagInput('');
  };

  const filtered = items.filter(i => {
    const matchCat = category === 'all' || i.category === category;
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.title_ar.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-arabic">{t('إدارة معرض الأعمال', 'Gallery Management')}</h1>
          <p className="text-gray-500 text-xs font-arabic mt-0.5">{items.length} {t('صورة', 'images')}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors font-arabic">
          <Plus className="w-4 h-4" />
          {t('إضافة صورة', 'Add Image')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder={t('بحث...', 'Search...')} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 font-arabic" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${category === cat ? 'bg-amber-500 text-white' : 'bg-gray-900 border border-white/10 text-gray-400 hover:border-white/20'}`}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square bg-gray-900 rounded-2xl animate-pulse border border-white/5" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-900 border border-white/5 hover:border-amber-500/20 transition-all cursor-pointer"
              onClick={() => setPreview(item)}>
              <img src={item.image_url} alt={item.title_ar || item.title} className="w-full h-full object-cover" loading="lazy" />
              {!item.is_active && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-xs text-gray-400 font-arabic">{t('مخفي', 'Hidden')}</span></div>}
              {item.is_featured && <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center"><Star className="w-3.5 h-3.5 text-white fill-white" /></div>}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                {item.title_ar && <p className="text-white text-xs font-arabic text-center px-2">{item.title_ar}</p>}
                <div className="flex gap-2">
                  <button onClick={e => { e.stopPropagation(); toggleFeatured(item); }}
                    className={`p-2 rounded-lg transition-colors ${item.is_featured ? 'bg-amber-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); openEdit(item); }}
                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                    <Plus className="w-3.5 h-3.5 rotate-45" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl border border-white/5 py-16 text-center">
          <ImageIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-arabic text-sm">{t('لا توجد صور في المعرض', 'No gallery images yet')}</p>
          <button onClick={openNew} className="mt-4 text-amber-400 text-sm font-arabic hover:text-amber-300 transition-colors">{t('إضافة أول صورة', 'Add your first image')}</button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-base font-bold text-white font-arabic">{editing ? t('تعديل الصورة', 'Edit Image') : t('إضافة صورة جديدة', 'Add New Image')}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('رابط الصورة', 'Image URL')} *</label>
                <input type="url" value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50" />
                {form.image_url && <img src={form.image_url} alt="" className="mt-2 w-full h-32 object-cover rounded-xl" onError={e => (e.currentTarget.style.display = 'none')} />}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('العنوان (إنجليزي)', 'Title (English)')}</label>
                  <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('العنوان (عربي)', 'Title (Arabic)')}</label>
                  <input type="text" value={form.title_ar} onChange={e => setForm(p => ({ ...p, title_ar: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 font-arabic" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الفئة', 'Category')}</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50">
                  {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الوسوم', 'Tags')}</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder={t('أضف وسماً...', 'Add tag...')}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50" />
                  <button type="button" onClick={addTag} className="px-3 py-2 bg-amber-500 text-white rounded-xl text-sm hover:bg-amber-600"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                      {tag}
                      <button onClick={() => setForm(p => ({ ...p, tags: p.tags.filter((_, idx) => idx !== i) }))} className="text-gray-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-6">
                {[{ field: 'is_active', ar: 'نشط', en: 'Active' }, { field: 'is_featured', ar: 'مميز', en: 'Featured' }].map(toggle => (
                  <label key={toggle.field} className="flex items-center gap-2 cursor-pointer">
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, [toggle.field]: !(prev as any)[toggle.field] }))}
                      className={`relative w-10 h-5 rounded-full transition-colors ${(form as any)[toggle.field] ? 'bg-amber-500' : 'bg-gray-700'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${(form as any)[toggle.field] ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                    <span className="text-sm text-gray-400 font-arabic">{t(toggle.ar, toggle.en)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-white/5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-arabic border border-white/10 hover:bg-gray-700 transition-colors">{t('إلغاء', 'Cancel')}</button>
              <button onClick={handleSave} disabled={saving || !form.image_url}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-arabic hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" />
                {saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {preview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setPreview(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
              <img src={preview.image_url} alt={preview.title_ar || preview.title} className="w-full max-h-[70vh] object-contain rounded-2xl" />
              {preview.title_ar && <p className="text-white text-center font-arabic mt-3">{preview.title_ar}</p>}
              <button onClick={() => setPreview(null)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
