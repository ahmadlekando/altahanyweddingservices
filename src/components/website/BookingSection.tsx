import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Phone, Mail, CheckCircle, ChevronRight, ChevronLeft, LogIn } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AuthModal from './AuthModal';

type Step = 1 | 2 | 3;

export default function BookingSection() {
  const { t } = useLang();
  const { user, profile } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    event_date: '',
    event_time: '',
    event_type: 'wedding',
    venue: '',
    service: '',
    package: '',
    guests: '',
    special_requests: '',
  });

  // Pre-fill from user profile when logged in
  useEffect(() => {
    if (profile) {
      setForm(prev => ({
        ...prev,
        full_name: prev.full_name || profile.full_name || '',
        phone: prev.phone || profile.phone || '',
        email: prev.email || profile.email || '',
      }));
    } else if (user?.email) {
      setForm(prev => ({
        ...prev,
        email: prev.email || user.email || '',
        full_name: prev.full_name || (user.user_metadata?.full_name as string) || '',
      }));
    }
  }, [user, profile]);

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleNext = () => {
    // Require auth before step 2
    if (step === 1 && !user) {
      setShowAuth(true);
      return;
    }
    setStep(prev => (prev + 1) as Step);
  };

  const handleSubmit = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setLoading(true);
    try {
      const bookingNumber = `BKG${Date.now()}`;
      await supabase.from('bookings').insert({
        booking_number: bookingNumber,
        customer_name: form.full_name,
        customer_phone: form.phone,
        customer_email: form.email || user.email,
        event_date: form.event_date || null,
        event_type: form.event_type,
        venue: form.venue,
        status: 'pending',
        notes: form.special_requests,
        total_amount: 0,
      });

      await supabase.from('notifications').insert({
        type: 'booking',
        title: `New booking from ${form.full_name}`,
        title_ar: `حجز جديد من ${form.full_name}`,
        message: `التاريخ: ${form.event_date || '—'} | المكان: ${form.venue || '—'} | الخدمة: ${form.service || '—'}`,
        message_ar: `التاريخ: ${form.event_date || '—'} | المكان: ${form.venue || '—'} | الخدمة: ${form.service || '—'}`,
      });

      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to: 'info@altahany.com',
          subject: `حجز جديد #${bookingNumber} — ${form.full_name}`,
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;"><h2 style="color:#d4a439;">حجز جديد في منصة التهاني</h2><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">رقم الحجز</td><td style="padding:8px;border-bottom:1px solid #eee;">${bookingNumber}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">الاسم</td><td style="padding:8px;border-bottom:1px solid #eee;">${form.full_name}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">الهاتف</td><td style="padding:8px;border-bottom:1px solid #eee;">${form.phone}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">البريد</td><td style="padding:8px;border-bottom:1px solid #eee;">${form.email || user.email}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">التاريخ</td><td style="padding:8px;border-bottom:1px solid #eee;">${form.event_date || '—'}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">المكان</td><td style="padding:8px;border-bottom:1px solid #eee;">${form.venue || '—'}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">الخدمة</td><td style="padding:8px;border-bottom:1px solid #eee;">${form.service || '—'}</td></tr><tr><td style="padding:8px;font-weight:bold;">طلبات خاصة</td><td style="padding:8px;">${form.special_requests || '—'}</td></tr></table></div>`,
          log_type: 'booking',
          reference_id: bookingNumber,
        }),
      }).catch(() => {});

      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  const stepTitle = {
    1: { ar: 'معلوماتك', en: 'Your Info' },
    2: { ar: 'تفاصيل الفعالية', en: 'Event Details' },
    3: { ar: 'مراجعة وتأكيد', en: 'Review & Confirm' },
  };

  const step1Valid = form.event_date.length > 0; // only date required in step 1 for social login users

  return (
    <section id="booking" className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-arabic mb-4">
            <Calendar className="w-3.5 h-3.5" />
            {t('نظام الحجز الإلكتروني', 'Online Booking System')}
          </div>
          <h2 className="text-4xl font-bold text-gray-900 font-arabic">
            {t('احجز حفل زفافك', 'Book Your Wedding')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">
              {t('الآن وبكل سهولة', 'Now with Ease')}
            </span>
          </h2>
          {!user && (
            <p className="mt-3 text-sm text-gray-500 font-arabic">
              {t('تصفح بحرية — تسجيل الدخول مطلوب عند تأكيد الحجز فقط', 'Browse freely — login only required to confirm your booking')}
            </p>
          )}
        </motion.div>

        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-12 text-center border border-gray-100"
          >
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 font-arabic mb-3">
              {t('تم استقبال طلبك!', 'Your Request Received!')}
            </h3>
            <p className="text-gray-500 font-arabic mb-2">
              {t('شكراً لك! سيتواصل معك فريقنا خلال 24 ساعة لتأكيد الحجز.', "Thank you! Our team will contact you within 24 hours to confirm your booking.")}
            </p>
            <p className="text-sm text-amber-600 font-arabic mb-8">
              {t('يمكنك التواصل معنا مباشرة عبر واتساب للاستفسار', 'You can also contact us directly via WhatsApp')}
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="https://wa.me/971527249190"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-green-500 text-white rounded-xl font-arabic text-sm font-semibold hover:bg-green-600 transition-colors"
              >
                {t('تواصل واتساب', 'WhatsApp Us')}
              </a>
              <button
                onClick={() => { setDone(false); setStep(1); setForm(prev => ({ ...prev, event_date: '', event_time: '', venue: '', service: '', package: '', guests: '', special_requests: '' })); }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-arabic text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                {t('حجز جديد', 'New Booking')}
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Progress */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {([1, 2, 3] as Step[]).map((s) => (
                  <React.Fragment key={s}>
                    <div className={`flex items-center gap-2 ${s === step ? 'text-amber-600' : s < step ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        s === step ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' :
                        s < step ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {s < step ? '✓' : s}
                      </div>
                      <span className="text-xs font-arabic hidden sm:block">{t(stepTitle[s].ar, stepTitle[s].en)}</span>
                    </div>
                    {s < 3 && <div className={`flex-1 h-0.5 rounded-full transition-colors ${s < step ? 'bg-green-400' : 'bg-gray-100'}`} />}
                  </React.Fragment>
                ))}
              </div>

              {/* Login status chip */}
              {user ? (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600 font-arabic">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {t('مسجّل دخولك', 'Signed in')} — {user.email}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-arabic transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {t('سجّل دخولك للحجز بشكل أسرع', 'Sign in for faster booking')}
                </button>
              )}
            </div>

            <div className="p-8">
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <p className="text-sm text-gray-500 font-arabic mb-4">
                    {user
                      ? t('تم تعبئة بياناتك تلقائياً — عدّلها إن أردت', 'Auto-filled from your profile — edit if needed')
                      : t('أدخل بياناتك أو سجّل دخولك لتعبئتها تلقائياً', 'Enter your info or sign in to auto-fill')}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 font-arabic mb-1.5 block flex items-center gap-1">
                        <User className="w-3 h-3" />{t('الاسم الكامل', 'Full Name')}
                      </label>
                      <input
                        type="text"
                        value={form.full_name}
                        onChange={e => update('full_name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm font-arabic transition-colors"
                        placeholder={t('اسمك الكامل', 'Your full name')}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-arabic mb-1.5 block flex items-center gap-1">
                        <Phone className="w-3 h-3" />{t('رقم الهاتف', 'Phone')}
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => update('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm transition-colors"
                        placeholder="+971 50 000 0000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-arabic mb-1.5 block flex items-center gap-1">
                      <Mail className="w-3 h-3" />{t('البريد الإلكتروني', 'Email Address')}
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm transition-colors"
                      placeholder="email@example.com"
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 font-arabic mb-1.5 block flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{t('تاريخ الحفل *', 'Event Date *')}
                      </label>
                      <input
                        type="date"
                        required
                        value={form.event_date}
                        onChange={e => update('event_date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-arabic mb-1.5 block flex items-center gap-1">
                        <Clock className="w-3 h-3" />{t('وقت الحفل', 'Event Time')}
                      </label>
                      <input
                        type="time"
                        value={form.event_time}
                        onChange={e => update('event_time', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-arabic mb-1.5 block flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{t('مكان الحفل', 'Venue')}
                    </label>
                    <input
                      type="text"
                      value={form.venue}
                      onChange={e => update('venue', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm font-arabic transition-colors"
                      placeholder={t('اسم القاعة أو الفندق', 'Hall or hotel name')}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الخدمة المطلوبة', 'Required Service')}</label>
                      <select
                        value={form.service}
                        onChange={e => update('service', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm font-arabic transition-colors bg-white"
                      >
                        <option value="">{t('اختر خدمة', 'Select service')}</option>
                        <option value="zaffa">{t('الزفة', 'Zaffa')}</option>
                        <option value="kousha">{t('الكوشة والديكور', 'Kousha & Decor')}</option>
                        <option value="lighting">{t('الإضاءة والمؤثرات', 'Lighting & Effects')}</option>
                        <option value="dj">{t('الدي جي والصوت', 'DJ & Sound')}</option>
                        <option value="stage">{t('تجهيز المسرح', 'Stage Setup')}</option>
                        <option value="planning">{t('تنظيم الفعاليات', 'Event Planning')}</option>
                        <option value="catering">{t('الضيافة والبوفيه', 'Catering & Buffet')}</option>
                        <option value="tents">{t('الخيام', 'Tents')}</option>
                        <option value="photography">{t('التصوير والفيديو', 'Photography & Video')}</option>
                        <option value="full">{t('باقة كاملة', 'Full Package')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الباقة المختارة', 'Selected Package')}</label>
                      <select
                        value={form.package}
                        onChange={e => update('package', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm font-arabic transition-colors bg-white"
                      >
                        <option value="">{t('اختر الباقة', 'Select package')}</option>
                        <option value="silver">{t('الفضية', 'Silver')}</option>
                        <option value="gold">{t('الذهبية', 'Gold')}</option>
                        <option value="platinum">{t('البلاتينية', 'Platinum')}</option>
                        <option value="custom">{t('مخصصة', 'Custom')}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('طلبات خاصة', 'Special Requests')}</label>
                    <textarea
                      rows={3}
                      value={form.special_requests}
                      onChange={e => update('special_requests', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm font-arabic transition-colors resize-none"
                      placeholder={t('أي طلبات إضافية...', 'Any additional requests...')}
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <h3 className="font-bold text-gray-900 font-arabic text-lg">{t('مراجعة بيانات الحجز', 'Review Booking Details')}</h3>
                  <div className="bg-amber-50 rounded-2xl p-5 space-y-3">
                    {[
                      { label_ar: 'الاسم', label_en: 'Name', value: form.full_name || (user?.user_metadata?.full_name as string) || '-' },
                      { label_ar: 'الهاتف', label_en: 'Phone', value: form.phone || '-' },
                      { label_ar: 'البريد', label_en: 'Email', value: form.email || user?.email || '-' },
                      { label_ar: 'تاريخ الحفل', label_en: 'Event Date', value: form.event_date || '-' },
                      { label_ar: 'المكان', label_en: 'Venue', value: form.venue || '-' },
                      { label_ar: 'الخدمة', label_en: 'Service', value: form.service || '-' },
                      { label_ar: 'الباقة', label_en: 'Package', value: form.package || '-' },
                    ].map((row) => (
                      <div key={row.label_en} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 font-arabic">{t(row.label_ar, row.label_en)}</span>
                        <span className="font-medium text-gray-800 font-arabic">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 font-arabic text-center">
                    {t('بالضغط على تأكيد الحجز، توافق على شروط الخدمة وسياسة الخصوصية', 'By clicking confirm, you agree to our terms of service and privacy policy')}
                  </p>
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <button
                    onClick={() => setStep(prev => (prev - 1) as Step)}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-gray-700 font-arabic text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                    {t('السابق', 'Back')}
                  </button>
                )}
                <button
                  onClick={() => step < 3 ? handleNext() : handleSubmit()}
                  disabled={loading || (step === 2 && !form.event_date)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-arabic font-semibold hover:shadow-lg hover:shadow-amber-200 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {step === 3
                        ? t('تأكيد الحجز', 'Confirm Booking')
                        : step === 1 && !user
                          ? t('التالي (سيُطلب تسجيل الدخول)', 'Next (login required)')
                          : t('التالي', 'Next')}
                      <ChevronLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onSuccess={() => {
              setShowAuth(false);
              setStep(prev => (prev + 1) as Step);
            }}
            reason="booking"
          />
        )}
      </AnimatePresence>
    </section>
  );
}
