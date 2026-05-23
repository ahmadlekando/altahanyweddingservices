import React, { useEffect, useState } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, X, Save, FileText, Eye, EyeOff } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';

type Post = {
  id: string;
  title: string;
  title_ar: string;
  slug: string;
  excerpt: string;
  excerpt_ar: string;
  content: string;
  content_ar: string;
  cover_image: string;
  category: string;
  tags: string[];
  author_id: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string;
  created_at: string;
};

const CATEGORIES = ['news', 'tips', 'stories', 'packages', 'venues', 'general'];

const emptyPost = (): Omit<Post, 'id' | 'created_at' | 'author_id'> => ({
  title: '',
  title_ar: '',
  slug: '',
  excerpt: '',
  excerpt_ar: '',
  content: '',
  content_ar: '',
  cover_image: '',
  category: 'general',
  tags: [],
  status: 'draft',
  published_at: new Date().toISOString().split('T')[0],
});

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-700 text-gray-400',
  published: 'bg-green-500/15 text-green-400',
  archived: 'bg-red-500/10 text-red-400',
};

export default function BlogPage() {
  const { t } = useLang();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState(emptyPost());
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyPost());
    setTagInput('');
    setShowForm(true);
  };

  const openEdit = (post: Post) => {
    setEditing(post);
    setForm({ title: post.title, title_ar: post.title_ar, slug: post.slug, excerpt: post.excerpt, excerpt_ar: post.excerpt_ar, content: post.content, content_ar: post.content_ar, cover_image: post.cover_image, category: post.category, tags: [...(post.tags || [])], status: post.status, published_at: post.published_at?.split('T')[0] || '' });
    setTagInput('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      const slug = form.slug || slugify(form.title);
      const payload = { ...form, slug };
      if (editing) {
        await supabase.from('posts').update({ ...payload, updated_at: new Date().toISOString() } as any).eq('id', editing.id);
      } else {
        await supabase.from('posts').insert(payload as any);
      }
      await load();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure?'))) return;
    await supabase.from('posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const toggleStatus = async (post: Post) => {
    const next = post.status === 'published' ? 'draft' : 'published';
    await supabase.from('posts').update({ status: next, published_at: next === 'published' ? new Date().toISOString() : null } as any).eq('id', post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: next } : p));
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
    setTagInput('');
  };

  const filtered = posts.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.title_ar.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-arabic">{t('إدارة المدونة', 'Blog Management')}</h1>
          <p className="text-gray-500 text-xs font-arabic mt-0.5">{posts.length} {t('مقال', 'posts')}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors font-arabic">
          <Plus className="w-4 h-4" />
          {t('مقال جديد', 'New Post')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder={t('بحث في المقالات...', 'Search posts...')} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 font-arabic" />
        </div>
        <div className="flex gap-1.5">
          {['all', 'draft', 'published', 'archived'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-arabic transition-all ${statusFilter === s ? 'bg-amber-500 text-white' : 'bg-gray-900 border border-white/10 text-gray-400 hover:border-white/20'}`}>
              {s === 'all' ? t('الكل', 'All') : s === 'draft' ? t('مسودة', 'Draft') : s === 'published' ? t('منشور', 'Published') : t('أرشيف', 'Archived')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-gray-900 rounded-2xl h-20 animate-pulse border border-white/5" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(post => (
            <div key={post.id} className="bg-gray-900 rounded-2xl border border-white/5 hover:border-amber-500/20 transition-all overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                {post.cover_image ? (
                  <img src={post.cover_image} alt="" className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white font-arabic truncate">{post.title_ar || post.title}</h3>
                      {post.title_ar && <p className="text-xs text-gray-500 truncate">{post.title}</p>}
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-lg font-arabic ${STATUS_COLORS[post.status]}`}>
                      {post.status === 'draft' ? t('مسودة', 'Draft') : post.status === 'published' ? t('منشور', 'Published') : t('أرشيف', 'Archived')}
                    </span>
                  </div>
                  {post.excerpt_ar && <p className="text-xs text-gray-600 font-arabic mt-1 line-clamp-1">{post.excerpt_ar}</p>}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-600">{formatDate(post.created_at, 'en-GB')}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-800 rounded text-gray-500">{post.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleStatus(post)} title={post.status === 'published' ? t('إخفاء', 'Unpublish') : t('نشر', 'Publish')}
                    className={`p-2 rounded-lg transition-colors ${post.status === 'published' ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20' : 'text-gray-500 bg-gray-800 hover:text-green-400'}`}>
                    {post.status === 'published' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => openEdit(post)} className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-amber-400 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl border border-white/5 py-16 text-center">
          <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-arabic text-sm">{t('لا توجد مقالات بعد', 'No blog posts yet')}</p>
          <button onClick={openNew} className="mt-4 text-amber-400 text-sm font-arabic hover:text-amber-300 transition-colors">{t('كتابة أول مقال', 'Write your first post')}</button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-base font-bold text-white font-arabic">{editing ? t('تعديل المقال', 'Edit Post') : t('مقال جديد', 'New Post')}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('العنوان (إنجليزي)', 'Title (English)')} *</label>
                  <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value, slug: slugify(e.target.value) }))}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('العنوان (عربي)', 'Title (Arabic)')}</label>
                  <input type="text" value={form.title_ar} onChange={e => setForm(p => ({ ...p, title_ar: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 font-arabic" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">Slug</label>
                  <input type="text" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الفئة', 'Category')}</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('رابط صورة الغلاف', 'Cover Image URL')}</label>
                <input type="url" value={form.cover_image} onChange={e => setForm(p => ({ ...p, cover_image: e.target.value }))} placeholder="https://..."
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50" />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('المقدمة (عربي)', 'Excerpt (Arabic)')}</label>
                <textarea rows={2} value={form.excerpt_ar} onChange={e => setForm(p => ({ ...p, excerpt_ar: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 resize-none font-arabic" />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('المحتوى (عربي)', 'Content (Arabic)')}</label>
                <textarea rows={6} value={form.content_ar} onChange={e => setForm(p => ({ ...p, content_ar: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 resize-none font-arabic" />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الوسوم', 'Tags')}</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
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

              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الحالة', 'Status')}</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Post['status'] }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50">
                  <option value="draft">{t('مسودة', 'Draft')}</option>
                  <option value="published">{t('منشور', 'Published')}</option>
                  <option value="archived">{t('أرشيف', 'Archived')}</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-white/5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-arabic border border-white/10 hover:bg-gray-700 transition-colors">{t('إلغاء', 'Cancel')}</button>
              <button onClick={handleSave} disabled={saving || !form.title}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-arabic hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
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
