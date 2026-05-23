import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

export default function NewsletterSection() {
  const { lang, t } = useLang();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await supabase.from('newsletter_subscribers').insert({ email, name, language: lang });
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-r from-amber-500 to-amber-600 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white font-arabic mb-3">
            {t('اشترك في نشرتنا البريدية', 'Subscribe to Our Newsletter')}
          </h2>
          <p className="text-amber-100 font-arabic mb-8">
            {t('احصل على أحدث العروض ونصائح الأفراح مباشرة في بريدك', 'Get the latest offers and wedding tips directly in your inbox')}
          </p>

          {done ? (
            <div className="flex items-center justify-center gap-3 text-white">
              <CheckCircle className="w-6 h-6" />
              <span className="font-arabic text-lg font-semibold">{t('شكراً! تم اشتراكك بنجاح', 'Thank you! You have been subscribed')}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('اسمك', 'Your name')}
                className="flex-1 px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder-amber-100 border border-white/30 focus:outline-none focus:border-white font-arabic text-sm"
              />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('بريدك الإلكتروني', 'Your email')}
                className="flex-1 px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder-amber-100 border border-white/30 focus:outline-none focus:border-white text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-white text-amber-600 rounded-xl font-bold font-arabic text-sm hover:bg-amber-50 transition-colors disabled:opacity-70 flex-shrink-0"
              >
                {loading ? '...' : t('اشترك', 'Subscribe')}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
