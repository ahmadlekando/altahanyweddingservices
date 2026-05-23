import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, HelpCircle, GripVertical, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

type FAQ = {
  id: string;
  question: string;
  question_ar: string;
  answer: string;
  answer_ar: string;
  category: string;
  is_active: boolean;
  sort_order: number;
};

type FAQForm = Omit<FAQ, 'id'>;

function emptyForm(): FAQForm {
  return { question: '', question_ar: '', answer: '', answer_ar: '', category: 'general', is_active: true, sort_order: 0 };
}

export default function FAQsPage() {
  const { t } = useLang();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState<FAQForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchFAQs(); }, []);

  async function fetchFAQs() {
    setLoading(true);
    const { data } = await supabase.from('faqs').select('*').order('sort_order');
    if (data) setFaqs(data as FAQ[]);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm(), sort_order: faqs.length + 1 });
    setShowForm(true);
  }

  function openEdit(faq: FAQ) {
    setEditing(faq);
    setForm({
      question: faq.question,
      question_ar: faq.question_ar,
      answer: faq.answer,
      answer_ar: faq.answer_ar,
      category: faq.category || 'general',
      is_active: faq.is_active,
      sort_order: faq.sort_order,
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await supabase.from('faqs').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id);
      } else {
        await supabase.from('faqs').insert(form);
      }
      setShowForm(false);
      await fetchFAQs();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await supabase.from('faqs').delete().eq('id', id);
    setFaqs(prev => prev.filter(f => f.id !== id));
    setDeleting(null);
  }

  async function toggleActive(faq: FAQ) {
    await supabase.from('faqs').update({ is_active: !faq.is_active }).eq('id', faq.id);
    setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, is_active: !f.is_active } : f));
  }

  const inputCls = 'w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 transition-colors font-arabic';

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-arabic">{t('الأسئلة الشائعة', 'FAQ Management')}</h1>
            <p className="text-gray-500 text-xs font-arabic">{t('إدارة الأسئلة والأجوبة في الموقع', 'Manage website FAQs')}</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-arabic font-semibold hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('إضافة سؤال', 'Add FAQ')}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-gray-900 rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-start gap-4">
                <GripVertical className="w-4 h-4 text-gray-600 mt-1 flex-shrink-0 cursor-grab" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${faq.is_active ? 'bg-green-400' : 'bg-gray-600'}`} />
                    <span className="text-xs text-gray-500 font-arabic px-2 py-0.5 bg-white/5 rounded-lg">{faq.category}</span>
                  </div>
                  <p className="text-white font-arabic font-medium text-sm mb-1">{faq.question_ar}</p>
                  <p className="text-gray-500 text-xs font-arabic line-clamp-2">{faq.answer_ar}</p>
                  <p className="text-gray-600 text-xs mt-1 line-clamp-1">{faq.question}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(faq)}
                    className={`transition-colors ${faq.is_active ? 'text-green-400 hover:text-green-300' : 'text-gray-600 hover:text-gray-400'}`}
                    title={faq.is_active ? t('إخفاء', 'Hide') : t('إظهار', 'Show')}
                  >
                    {faq.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => openEdit(faq)}
                    className="text-gray-500 hover:text-amber-400 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    disabled={deleting === faq.id}
                    className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deleting === faq.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {faqs.length === 0 && (
            <div className="text-center py-16 text-gray-600 font-arabic">
              {t('لا توجد أسئلة بعد. أضف سؤالاً جديداً.', 'No FAQs yet. Add your first question.')}
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
                {editing ? t('تعديل السؤال', 'Edit FAQ') : t('إضافة سؤال جديد', 'Add New FAQ')}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('السؤال (عربي) *', 'Question (Arabic) *')}</label>
                  <input type="text" value={form.question_ar} onChange={e => setForm(p => ({ ...p, question_ar: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('السؤال (إنجليزي)', 'Question (English)')}</label>
                  <input type="text" value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الجواب (عربي) *', 'Answer (Arabic) *')}</label>
                  <textarea rows={4} value={form.answer_ar} onChange={e => setForm(p => ({ ...p, answer_ar: e.target.value }))} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الجواب (إنجليزي)', 'Answer (English)')}</label>
                  <textarea rows={4} value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} className={`${inputCls} resize-none`} />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('التصنيف', 'Category')}</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputCls}>
                    <option value="general">{t('عام', 'General')}</option>
                    <option value="booking">{t('الحجز', 'Booking')}</option>
                    <option value="pricing">{t('الأسعار', 'Pricing')}</option>
                    <option value="services">{t('الخدمات', 'Services')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الترتيب', 'Sort Order')}</label>
                  <input type="number" min="1" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className={inputCls} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-700'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${form.is_active ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                    <span className="text-sm text-gray-400 font-arabic">{t('مفعّل', 'Active')}</span>
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
                disabled={saving || !form.question_ar}
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
