import React, { useState } from 'react';
import { Sparkles, Copy, RefreshCw, FileText, Mail, Hash, Package, TrendingUp } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

type Tool = 'quotation' | 'email' | 'caption' | 'hashtag' | 'package' | 'seo';

const toolConfigs: { key: Tool; icon: React.ElementType; label_ar: string; label_en: string; placeholder_ar: string; placeholder_en: string }[] = [
  { key: 'quotation', icon: FileText, label_ar: 'مولّد عروض الأسعار', label_en: 'Quotation Generator', placeholder_ar: 'صف الخدمات المطلوبة للعرض...', placeholder_en: 'Describe the services needed...' },
  { key: 'email', icon: Mail, label_ar: 'كاتب البريد الإلكتروني', label_en: 'Email Writer', placeholder_ar: 'صف موضوع البريد الإلكتروني...', placeholder_en: 'Describe the email subject...' },
  { key: 'caption', icon: Sparkles, label_ar: 'مولّد تسميات السوشيال ميديا', label_en: 'Social Caption Generator', placeholder_ar: 'صف المنشور أو الصورة...', placeholder_en: 'Describe the post or image...' },
  { key: 'hashtag', icon: Hash, label_ar: 'مولّد الهاشتاقات', label_en: 'Hashtag Generator', placeholder_ar: 'موضوع المحتوى أو الخدمة...', placeholder_en: 'Content topic or service...' },
  { key: 'package', icon: Package, label_ar: 'منشئ الباقات الذكي', label_en: 'Package Creator', placeholder_ar: 'صف متطلبات الباقة...', placeholder_en: 'Describe package requirements...' },
  { key: 'seo', icon: TrendingUp, label_ar: 'محسّن SEO', label_en: 'SEO Optimizer', placeholder_ar: 'الصفحة أو المحتوى المراد تحسينه...', placeholder_en: 'Page or content to optimize...' },
];

export default function AIToolsPage() {
  const { t } = useLang();
  const [activeTool, setActiveTool] = useState<Tool>('quotation');
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const currentTool = toolConfigs.find(tc => tc.key === activeTool)!;

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setOutput('');
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ tool: activeTool, prompt }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setOutput(result.content || result.result || JSON.stringify(result));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white font-arabic">{t('أدوات الذكاء الاصطناعي', 'AI Tools')}</h1>
        <p className="text-gray-500 text-xs font-arabic mt-1">{t('أدوات ذكية لتسريع عملك', 'Smart tools to accelerate your work')}</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Tool Selector */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-white/5 space-y-1.5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 font-arabic px-2">{t('اختر الأداة', 'Select Tool')}</h2>
          {toolConfigs.map(tool => (
            <button
              key={tool.key}
              onClick={() => { setActiveTool(tool.key); setOutput(''); setPrompt(''); setError(''); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-arabic transition-all text-right ${
                activeTool === tool.key
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <tool.icon className="w-4 h-4 flex-shrink-0" />
              {t(tool.label_ar, tool.label_en)}
            </button>
          ))}
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <currentTool.icon className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white font-arabic">{t(currentTool.label_ar, currentTool.label_en)}</h2>
                <p className="text-xs text-gray-500 font-arabic">{t('مدعوم بالذكاء الاصطناعي', 'Powered by AI')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('المدخلات', 'Input')}</label>
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={t(currentTool.placeholder_ar, currentTool.placeholder_en)}
                  className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 resize-none font-arabic"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-arabic">{error}</div>
              )}

              <button
                onClick={generate}
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-semibold font-arabic hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" />{t('جاري التوليد...', 'Generating...')}</>
                ) : (
                  <><Sparkles className="w-4 h-4" />{t('توليد المحتوى', 'Generate Content')}</>
                )}
              </button>
            </div>
          </div>

          {output && (
            <div className="bg-gray-900 rounded-2xl p-5 border border-amber-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white font-arabic">{t('المحتوى المولّد', 'Generated Content')}</h3>
                <button
                  onClick={copy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-arabic transition-all ${
                    copied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? t('تم النسخ!', 'Copied!') : t('نسخ', 'Copy')}
                </button>
              </div>
              <pre className="text-sm text-gray-200 whitespace-pre-wrap font-arabic leading-relaxed bg-gray-800 rounded-xl p-4">
                {output}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
