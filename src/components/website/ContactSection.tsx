import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

export default function ContactSection() {
  const { t } = useLang();
  const [form, setForm] = useState({ name: '', phone: '', email: '', service: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.from('contact_submissions').insert({
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        service: form.service || null,
        message: form.message || null,
      });

      await supabase.from('notifications').insert({
        type: 'contact',
        title: `New message from ${form.name}`,
        title_ar: `رسالة جديدة من ${form.name}`,
        message: `Service: ${form.service || 'N/A'} | Phone: ${form.phone}`,
        message_ar: `الخدمة: ${form.service || 'غير محدد'} | الهاتف: ${form.phone}`,
      });

      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to: 'info@altahany.com',
          subject: `رسالة تواصل جديدة من ${form.name}`,
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;"><h2 style="color:#d4a439;">رسالة جديدة من موقع التهاني</h2><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">الاسم</td><td style="padding:8px;border-bottom:1px solid #eee;">${form.name}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">الهاتف</td><td style="padding:8px;border-bottom:1px solid #eee;">${form.phone}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">البريد</td><td style="padding:8px;border-bottom:1px solid #eee;">${form.email || '—'}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">الخدمة</td><td style="padding:8px;border-bottom:1px solid #eee;">${form.service || '—'}</td></tr><tr><td style="padding:8px;font-weight:bold;">الرسالة</td><td style="padding:8px;">${form.message || '—'}</td></tr></table></div>`,
          log_type: 'contact',
        }),
      }).catch(() => {});

      setSent(true);
      setForm({ name: '', phone: '', email: '', service: '', message: '' });
    } catch (_) {
      // Still show success to user even if notification fails
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-arabic mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {t('نحن هنا لمساعدتك', "We're Here to Help")}
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white font-arabic mb-4">
            {t('تواصل معنا', 'Get In Touch')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              {t('ابدأ رحلتك الآن', 'Start Your Journey Now')}
            </span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Info */}
          <div className="space-y-6">
            {[
              { icon: Phone, label_ar: 'اتصل بنا', label_en: 'Call Us', value: '+971 52 724 9190 / +971 50 697 3130', href: 'tel:+971527249190', color: 'text-blue-400' },
              { icon: MessageCircle, label_ar: 'واتساب', label_en: 'WhatsApp', value: '+971 52 724 9190', href: 'https://wa.me/971527249190', color: 'text-green-400' },
              { icon: Mail, label_ar: 'البريد الإلكتروني', label_en: 'Email', value: 'info@altahany.com', href: 'mailto:info@altahany.com', color: 'text-amber-400' },
              { icon: MapPin, label_ar: 'الموقع', label_en: 'Location', value: t('الشارقة، الإمارات', 'Sharjah, UAE'), href: '#', color: 'text-red-400' },
            ].map((item, i) => (
              <motion.a
                key={i}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors flex-shrink-0">
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-arabic">{t(item.label_ar, item.label_en)}</div>
                  <div className="text-white font-medium mt-0.5">{item.value}</div>
                </div>
              </motion.a>
            ))}

            {/* Map */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-white/10 h-48"
            >
              <iframe
                title="Altahany Sharjah"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d231854.94009566688!2d55.30661765!3d25.3462552!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f5f08d36e86f7%3A0x49c72c4cbf4e8a80!2sSharjah%20-%20United%20Arab%20Emirates!5e0!3m2!1sen!2s!4v1699000000000!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'grayscale(80%) invert(90%)' }}
                allowFullScreen
                loading="lazy"
              />
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8"
          >
            {sent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-white text-xl font-bold font-arabic mb-2">
                  {t('تم إرسال رسالتك!', 'Message Sent!')}
                </h3>
                <p className="text-gray-400 font-arabic">
                  {t('سنتواصل معك في أقرب وقت ممكن', "We'll get back to you as soon as possible")}
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 px-6 py-2.5 bg-amber-500 text-white rounded-xl font-arabic text-sm hover:bg-amber-600 transition-colors"
                >
                  {t('إرسال رسالة أخرى', 'Send Another Message')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-white text-xl font-bold font-arabic mb-6">
                  {t('أرسل لنا رسالة', 'Send Us a Message')}
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-arabic mb-1.5 block">{t('الاسم الكامل *', 'Full Name *')}</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder={t('اسمك', 'Your name')}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors font-arabic text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-arabic mb-1.5 block">{t('رقم الهاتف *', 'Phone *')}</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="+971 50 000 0000"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-arabic mb-1.5 block">{t('البريد الإلكتروني', 'Email')}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-arabic mb-1.5 block">{t('الخدمة المطلوبة', 'Service Required')}</label>
                  <select
                    value={form.service}
                    onChange={e => setForm({ ...form, service: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors text-sm font-arabic"
                  >
                    <option value="" className="bg-gray-900">{t('اختر خدمة', 'Select a service')}</option>
                    <option value="zaffa" className="bg-gray-900">{t('الزفة', 'Zaffa')}</option>
                    <option value="kousha" className="bg-gray-900">{t('الكوشة والديكور', 'Kousha & Decor')}</option>
                    <option value="lighting" className="bg-gray-900">{t('الإضاءة والمؤثرات', 'Lighting & Effects')}</option>
                    <option value="dj" className="bg-gray-900">{t('الدي جي والصوت', 'DJ & Sound')}</option>
                    <option value="stage" className="bg-gray-900">{t('تجهيز المسرح', 'Stage Setup')}</option>
                    <option value="planning" className="bg-gray-900">{t('تنظيم الفعاليات', 'Event Planning')}</option>
                    <option value="catering" className="bg-gray-900">{t('الضيافة والبوفيه', 'Catering & Buffet')}</option>
                    <option value="tents" className="bg-gray-900">{t('الخيام', 'Tents')}</option>
                    <option value="photography" className="bg-gray-900">{t('التصوير والفيديو', 'Photography & Video')}</option>
                    <option value="full_package" className="bg-gray-900">{t('الباقة الكاملة', 'Full Package')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-arabic mb-1.5 block">{t('رسالتك', 'Your Message')}</label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder={t('اكتب رسالتك هنا...', 'Write your message here...')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors resize-none text-sm font-arabic"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-semibold font-arabic flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t('إرسال الرسالة', 'Send Message')}
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
