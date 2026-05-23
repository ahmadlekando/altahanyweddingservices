import React, { useState, useEffect } from 'react';
import { Save, Building2, Globe, Sparkles, Mail, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

type Tab = 'company' | 'ai' | 'smtp' | 'seo' | 'social';

export default function SettingsPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('company');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [aiSettings, setAiSettings] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testEmailState, setTestEmailState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testEmailError, setTestEmailError] = useState('');

  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(s => { map[s.key] = s.value; });
        setSettings(map);
      }
    });
    supabase.from('ai_settings').select('*').then(({ data }) => {
      if (data) setAiSettings(data);
    });
  }, []);

  const updateSetting = (key: string, val: string) => setSettings(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestEmail = async () => {
    setTestEmailState('loading');
    setTestEmailError('');
    try {
      const toEmail = settings.smtp_email || 'info@altahany.com';
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            to: toEmail,
            subject: t('اختبار نظام البريد الإلكتروني — التهاني', 'Email System Test — Altahany'),
            html: `<p>${t('هذا بريد تجريبي للتحقق من إعدادات SMTP في منصة التهاني.', 'This is a test email to verify the SMTP configuration in the Altahany platform.')}</p>`,
            log_type: 'test',
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setTestEmailState('success');
        setTimeout(() => setTestEmailState('idle'), 4000);
      } else {
        setTestEmailState('error');
        setTestEmailError(data.error || data.message || t('فشل الإرسال', 'Delivery failed'));
      }
    } catch (err) {
      setTestEmailState('error');
      setTestEmailError(String(err));
    }
  };

  const toggleAI = async (feature: string, enabled: boolean) => {
    await supabase.from('ai_settings').update({ is_enabled: enabled }).eq('feature', feature);
    setAiSettings(prev => prev.map(s => s.feature === feature ? { ...s, is_enabled: enabled } : s));
  };

  const tabs: { key: Tab; icon: React.ElementType; ar: string; en: string }[] = [
    { key: 'company', icon: Building2, ar: 'الشركة', en: 'Company' },
    { key: 'ai', icon: Sparkles, ar: 'أدوات AI', en: 'AI Tools' },
    { key: 'smtp', icon: Mail, ar: 'البريد', en: 'Email' },
    { key: 'seo', icon: Globe, ar: 'SEO', en: 'SEO' },
    { key: 'social', icon: Globe, ar: 'السوشيال ميديا', en: 'Social Media' },
  ];

  const Field = ({ settingKey, label_ar, label_en, type = 'text' }: any) => (
    <div>
      <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t(label_ar, label_en)}</label>
      <input
        type={type}
        value={settings[settingKey] || ''}
        onChange={e => updateSetting(settingKey, e.target.value)}
        className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 transition-colors"
      />
    </div>
  );

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white font-arabic">{t('الإعدادات', 'Settings')}</h1>
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

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tabItem => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-arabic transition-all ${
              tab === tabItem.key ? 'bg-amber-500 text-white' : 'bg-gray-900 text-gray-400 border border-white/10 hover:border-amber-500/30'
            }`}
          >
            <tabItem.icon className="w-4 h-4" />
            {t(tabItem.ar, tabItem.en)}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-white/5">
        {tab === 'company' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field settingKey="company_name" label_ar="اسم الشركة (إنجليزي)" label_en="Company Name (English)" />
            <Field settingKey="company_name_ar" label_ar="اسم الشركة (عربي)" label_en="Company Name (Arabic)" />
            <Field settingKey="company_phone" label_ar="الهاتف" label_en="Phone" />
            <Field settingKey="company_email" label_ar="البريد الإلكتروني" label_en="Email" />
            <Field settingKey="company_address" label_ar="العنوان" label_en="Address" />
            <Field settingKey="vat_number" label_ar="الرقم الضريبي (TRN)" label_en="VAT Number (TRN)" />
            <Field settingKey="vat_rate" label_ar="نسبة ضريبة القيمة المضافة (%)" label_en="VAT Rate (%)" type="number" />
            <Field settingKey="currency" label_ar="العملة الافتراضية" label_en="Default Currency" />
            <Field settingKey="invoice_prefix" label_ar="بادئة رقم الفاتورة" label_en="Invoice Prefix" />
            <Field settingKey="quotation_prefix" label_ar="بادئة عرض السعر" label_en="Quotation Prefix" />
          </div>
        )}

        {tab === 'ai' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 font-arabic">
              {t('تفعيل أو تعطيل أدوات الذكاء الاصطناعي في النظام', 'Enable or disable AI tools in the system')}
            </p>
            <div className="space-y-3">
              {aiSettings.map(ai => (
                <div key={ai.feature} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-200 font-medium">{ai.feature.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</div>
                      <div className="text-xs text-gray-500">{ai.provider} / {ai.model}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAI(ai.feature, !ai.is_enabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${ai.is_enabled ? 'bg-amber-500' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${ai.is_enabled ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'smtp' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field settingKey="smtp_host" label_ar="خادم SMTP" label_en="SMTP Host" />
            <Field settingKey="smtp_port" label_ar="المنفذ" label_en="Port" />
            <Field settingKey="smtp_email" label_ar="بريد الإرسال" label_en="From Email" />
            <Field settingKey="smtp_password" label_ar="كلمة المرور" label_en="Password" type="password" />
            <div className="sm:col-span-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs text-amber-300 font-arabic">
                {t('إعدادات SMTP الافتراضية: smtp.hostinger.com | المنفذ: 465 | SSL: مفعّل | البريد: info@altahany.com', 'Default SMTP: smtp.hostinger.com | Port: 465 | SSL: Enabled | Email: info@altahany.com')}
              </p>
            </div>
            <div className="sm:col-span-2 flex flex-col gap-2">
              <button
                onClick={handleTestEmail}
                disabled={testEmailState === 'loading'}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-arabic font-semibold transition-all w-fit ${
                  testEmailState === 'success'
                    ? 'bg-green-500 text-white'
                    : testEmailState === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-60`}
              >
                {testEmailState === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                {testEmailState === 'success' && <CheckCircle className="w-4 h-4" />}
                {testEmailState === 'error' && <XCircle className="w-4 h-4" />}
                {testEmailState === 'idle' && <Send className="w-4 h-4" />}
                {testEmailState === 'loading'
                  ? t('جاري الإرسال...', 'Sending...')
                  : testEmailState === 'success'
                  ? t('تم الإرسال بنجاح!', 'Sent Successfully!')
                  : testEmailState === 'error'
                  ? t('فشل الإرسال', 'Send Failed')
                  : t('إرسال بريد تجريبي', 'Send Test Email')}
              </button>
              {testEmailState === 'error' && testEmailError && (
                <p className="text-xs text-red-400 font-arabic">{testEmailError}</p>
              )}
              {testEmailState === 'success' && (
                <p className="text-xs text-green-400 font-arabic">
                  {t(`تم إرسال بريد تجريبي إلى ${settings.smtp_email || 'info@altahany.com'}`, `Test email sent to ${settings.smtp_email || 'info@altahany.com'}`)}
                </p>
              )}
            </div>
          </div>
        )}

        {tab === 'seo' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field settingKey="seo_title" label_ar="عنوان الصفحة الرئيسية" label_en="Homepage Title" />
            <Field settingKey="seo_title_ar" label_ar="العنوان بالعربي" label_en="Title (Arabic)" />
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('وصف الموقع', 'Site Description')}</label>
              <textarea
                rows={3}
                value={settings['seo_description'] || ''}
                onChange={e => updateSetting('seo_description', e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>
            <Field settingKey="seo_keywords" label_ar="الكلمات المفتاحية" label_en="Keywords" />
            <Field settingKey="google_analytics" label_ar="كود Google Analytics" label_en="Google Analytics ID" />
          </div>
        )}

        {tab === 'social' && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { key: 'social_instagram', ar: 'رابط انستقرام', en: 'Instagram URL' },
              { key: 'social_tiktok', ar: 'رابط تيك توك', en: 'TikTok URL' },
              { key: 'social_facebook', ar: 'رابط فيسبوك', en: 'Facebook URL' },
              { key: 'social_youtube', ar: 'رابط يوتيوب', en: 'YouTube URL' },
              { key: 'social_whatsapp', ar: 'رابط واتساب', en: 'WhatsApp URL' },
              { key: 'social_telegram', ar: 'رابط تليجرام', en: 'Telegram URL' },
              { key: 'social_snapchat', ar: 'رابط سناب شات', en: 'Snapchat URL' },
            ].map(item => (
              <Field key={item.key} settingKey={item.key} label_ar={item.ar} label_en={item.en} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
