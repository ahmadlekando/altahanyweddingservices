import React, { useState, useEffect } from 'react';
import { Globe, Save, RefreshCw, Plus, X, ExternalLink, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

type SeoEntry = {
  id?: string;
  page: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  keywords: string[];
  og_image: string;
  canonical_url: string;
  robots: string;
  schema_markup: object;
};

const PAGES = [
  { page: 'home', label_ar: 'الصفحة الرئيسية', label_en: 'Homepage' },
  { page: 'services', label_ar: 'الخدمات', label_en: 'Services' },
  { page: 'packages', label_ar: 'الباقات', label_en: 'Packages' },
  { page: 'gallery', label_ar: 'المعرض', label_en: 'Gallery' },
  { page: 'about', label_ar: 'من نحن', label_en: 'About Us' },
  { page: 'contact', label_ar: 'اتصل بنا', label_en: 'Contact' },
  { page: 'booking', label_ar: 'الحجز', label_en: 'Booking' },
  { page: 'halls', label_ar: 'قاعات الأفراح', label_en: 'Wedding Halls' },
];

const ROBOTS_OPTIONS = [
  'index,follow',
  'noindex,follow',
  'index,nofollow',
  'noindex,nofollow',
];

const DEFAULT_ENTRY = (): SeoEntry => ({
  page: '',
  title: '',
  title_ar: '',
  description: '',
  description_ar: '',
  keywords: [],
  og_image: '',
  canonical_url: '',
  robots: 'index,follow',
  schema_markup: {},
});

export default function SeoPage() {
  const { t } = useLang();
  const [entries, setEntries] = useState<SeoEntry[]>([]);
  const [selected, setSelected] = useState<SeoEntry>(DEFAULT_ENTRY());
  const [selectedPage, setSelectedPage] = useState('home');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [sitemapStatus, setSitemapStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [globalSettings, setGlobalSettings] = useState({ site_url: '', robots_txt: '' });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('seo_settings').select('*');
    if (data) setEntries(data);

    const { data: s } = await supabase.from('settings').select('key, value').in('key', ['site_url', 'robots_txt']);
    if (s) {
      const map: Record<string, string> = {};
      s.forEach(r => { map[r.key] = r.value; });
      setGlobalSettings({ site_url: map['site_url'] || '', robots_txt: map['robots_txt'] || 'User-agent: *\nAllow: /' });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const entry = entries.find(e => e.page === selectedPage);
    if (entry) {
      setSelected({ ...entry });
    } else {
      setSelected({ ...DEFAULT_ENTRY(), page: selectedPage });
    }
  }, [selectedPage, entries]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const payload = {
      page: selected.page,
      title: selected.title,
      title_ar: selected.title_ar,
      description: selected.description,
      description_ar: selected.description_ar,
      keywords: selected.keywords,
      og_image: selected.og_image,
      canonical_url: selected.canonical_url,
      robots: selected.robots,
      schema_markup: selected.schema_markup,
      updated_at: new Date().toISOString(),
    };

    const existing = entries.find(e => e.page === selected.page);
    if (existing?.id) {
      const { error } = await supabase.from('seo_settings').update(payload).eq('id', existing.id);
      if (error) { setSaveError(error.message); setSaving(false); return; }
      setEntries(prev => prev.map(e => e.page === selected.page ? { ...e, ...payload } : e));
    } else {
      const { data, error } = await supabase.from('seo_settings').insert(payload).select().maybeSingle();
      if (error) { setSaveError(error.message); setSaving(false); return; }
      if (data) setEntries(prev => [...prev, data]);
    }

    // Save global settings
    for (const [key, value] of Object.entries(globalSettings)) {
      if (value) {
        await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !selected.keywords.includes(kw)) {
      setSelected(prev => ({ ...prev, keywords: [...prev.keywords, kw] }));
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => {
    setSelected(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== kw) }));
  };

  const generateSitemap = async () => {
    setSitemapStatus('generating');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sitemap`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
            'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ site_url: globalSettings.site_url }),
        }
      );
      const result = await res.json();
      if (result.success) {
        setSitemapStatus('done');
      } else {
        setSitemapStatus('error');
      }
    } catch {
      setSitemapStatus('error');
    }
    setTimeout(() => setSitemapStatus('idle'), 4000);
  };

  const titleLen = selected.title.length;
  const descLen = selected.description.length;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white font-arabic">{t('محرك SEO', 'SEO Engine')}</h1>
        <div className="flex items-center gap-3">
          {saveError && (
            <span className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 font-arabic max-w-xs truncate">
              {saveError}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-arabic font-semibold transition-all ${
              saved ? 'bg-green-500 text-white' : 'bg-amber-500 text-white hover:bg-amber-600'
            } disabled:opacity-50`}
          >
            <Save className="w-4 h-4" />
            {saved ? t('تم الحفظ!', 'Saved!') : saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ التغييرات', 'Save Changes')}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-5">
        {/* Page List */}
        <div className="space-y-2">
          <div className="bg-gray-900 rounded-2xl p-3 border border-white/5">
            <div className="text-xs text-gray-500 font-arabic px-2 pb-2">{t('صفحات الموقع', 'Site Pages')}</div>
            {PAGES.map(p => {
              const hasEntry = entries.some(e => e.page === p.page);
              return (
                <button
                  key={p.page}
                  onClick={() => setSelectedPage(p.page)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-arabic transition-all ${
                    selectedPage === p.page
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{t(p.label_ar, p.label_en)}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasEntry ? 'bg-green-500' : 'bg-gray-700'}`} />
                </button>
              );
            })}
          </div>

          {/* Sitemap Generator */}
          <div className="bg-gray-900 rounded-2xl p-4 border border-white/5 space-y-3">
            <div className="text-xs font-semibold text-gray-300 font-arabic">{t('خريطة الموقع', 'Sitemap')}</div>
            <div>
              <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('رابط الموقع', 'Site URL')}</label>
              <input
                type="text"
                placeholder="https://altahany.com"
                value={globalSettings.site_url}
                onChange={e => setGlobalSettings(prev => ({ ...prev, site_url: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <button
              onClick={generateSitemap}
              disabled={sitemapStatus === 'generating'}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-arabic font-semibold transition-colors disabled:opacity-50"
            >
              {sitemapStatus === 'generating' ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t('جاري الإنشاء...', 'Generating...')}</>
              ) : sitemapStatus === 'done' ? (
                <><CheckCircle className="w-3.5 h-3.5" /> {t('تم الإنشاء!', 'Generated!')}</>
              ) : sitemapStatus === 'error' ? (
                <><AlertCircle className="w-3.5 h-3.5" /> {t('فشل', 'Failed')}</>
              ) : (
                <><Globe className="w-3.5 h-3.5" /> {t('إنشاء sitemap.xml', 'Generate sitemap.xml')}</>
              )}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white font-arabic">
                {t(PAGES.find(p => p.page === selectedPage)?.label_ar || '', PAGES.find(p => p.page === selectedPage)?.label_en || '')}
              </span>
            </div>

            <div className="space-y-4">
              {/* Titles */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-gray-500 font-arabic">{t('العنوان (إنجليزي)', 'Title (English)')}</label>
                    <span className={`text-xs ${titleLen > 60 ? 'text-red-400' : titleLen > 50 ? 'text-amber-400' : 'text-gray-600'}`}>{titleLen}/60</span>
                  </div>
                  <input
                    type="text"
                    value={selected.title}
                    onChange={e => setSelected(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 transition-colors"
                    placeholder="ALTAHANY | Premium Wedding Services in UAE"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-gray-500 font-arabic">{t('العنوان (عربي)', 'Title (Arabic)')}</label>
                  </div>
                  <input
                    type="text"
                    dir="rtl"
                    value={selected.title_ar}
                    onChange={e => setSelected(prev => ({ ...prev, title_ar: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 transition-colors font-arabic"
                    placeholder="التهاني | خدمات أفراح فاخرة في الإمارات"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-gray-500 font-arabic">{t('الوصف (إنجليزي)', 'Description (English)')}</label>
                    <span className={`text-xs ${descLen > 160 ? 'text-red-400' : descLen > 140 ? 'text-amber-400' : 'text-gray-600'}`}>{descLen}/160</span>
                  </div>
                  <textarea
                    rows={3}
                    value={selected.description}
                    onChange={e => setSelected(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 resize-none transition-colors"
                    placeholder="Premium wedding planning, photography, and event services..."
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الوصف (عربي)', 'Description (Arabic)')}</label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={selected.description_ar}
                    onChange={e => setSelected(prev => ({ ...prev, description_ar: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 resize-none transition-colors font-arabic"
                    placeholder="خدمات تخطيط حفلات الزفاف الفاخرة..."
                  />
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الكلمات المفتاحية', 'Keywords')}</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                    placeholder={t('أضف كلمة مفتاحية...', 'Add keyword...')}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                  <button
                    onClick={addKeyword}
                    className="px-3 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.keywords.map(kw => (
                    <span key={kw} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 border border-white/10 rounded-lg text-xs text-gray-300">
                      {kw}
                      <button onClick={() => removeKeyword(kw)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* OG Image + Canonical */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('صورة Open Graph (OG)', 'Open Graph Image URL')}</label>
                  <input
                    type="text"
                    value={selected.og_image}
                    onChange={e => setSelected(prev => ({ ...prev, og_image: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 transition-colors"
                    placeholder="https://altahany.com/og-home.jpg"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('رابط الـ Canonical', 'Canonical URL')}</label>
                  <input
                    type="text"
                    value={selected.canonical_url}
                    onChange={e => setSelected(prev => ({ ...prev, canonical_url: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 transition-colors"
                    placeholder="https://altahany.com/"
                  />
                </div>
              </div>

              {/* Robots */}
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('إعداد Robots', 'Robots Directive')}</label>
                <div className="flex gap-2 flex-wrap">
                  {ROBOTS_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelected(prev => ({ ...prev, robots: opt }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                        selected.robots === opt
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-800 text-gray-400 border border-white/10 hover:border-amber-500/30'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <div className="text-xs text-gray-500 font-arabic mb-3">{t('معاينة نتائج بحث Google', 'Google Search Preview')}</div>
            <div className="bg-white rounded-xl p-4 space-y-1">
              <div className="text-xs text-green-700 truncate">{selected.canonical_url || globalSettings.site_url || 'https://altahany.com'}</div>
              <div className="text-blue-700 text-base font-medium leading-snug truncate">
                {selected.title || t('عنوان الصفحة', 'Page Title')}
              </div>
              <div className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                {selected.description || t('وصف الصفحة سيظهر هنا...', 'Page description will appear here...')}
              </div>
            </div>
          </div>

          {/* Robots.txt */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-white font-arabic">{t('ملف robots.txt', 'robots.txt File')}</div>
              <a href={`${globalSettings.site_url || '#'}/robots.txt`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                <ExternalLink className="w-3 h-3" />
                {t('معاينة', 'Preview')}
              </a>
            </div>
            <textarea
              rows={6}
              value={globalSettings.robots_txt}
              onChange={e => setGlobalSettings(prev => ({ ...prev, robots_txt: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-xs text-green-400 font-mono focus:outline-none focus:border-amber-500/50 resize-none transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
