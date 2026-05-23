import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LanguageContext';

type Props = {
  onClose: () => void;
  onSuccess: () => void;
  reason?: 'booking';
};

export default function AuthModal({ onClose, onSuccess, reason = 'booking' }: Props) {
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const { t } = useLang();
  const [mode, setMode] = useState<'choose' | 'email'>('choose');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setLoading(true);
    await signInWithGoogle();
    // OAuth redirects away; no need to handle success here
  };

  const handleApple = async () => {
    setLoading(true);
    await signInWithApple();
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (isSignUp) {
      const { error } = await signUp(email, password, name);
      if (error) {
        setError(t('حدث خطأ، تحقق من البيانات', 'An error occurred, please check your details'));
      } else {
        onSuccess();
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(t('البريد أو كلمة المرور غير صحيحة', 'Invalid email or password'));
      } else {
        onSuccess();
      }
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 px-6 pt-8 pb-6 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <img src="/logo.png" alt="Al Tahany" className="h-9 w-auto mx-auto mb-3 brightness-0 invert opacity-90" />
          <h2 className="text-lg font-bold text-white font-arabic">
            {reason === 'booking'
              ? t('سجّل دخولك لإتمام الحجز', 'Sign in to complete your booking')
              : t('تسجيل الدخول', 'Sign In')}
          </h2>
          <p className="text-gray-400 text-xs mt-1 font-arabic">
            {t('حسابك يحفظ بيانات حجزك ويسهّل التواصل', 'Your account saves booking info and simplifies communication')}
          </p>
        </div>

        <div className="p-6 space-y-3">
          <AnimatePresence mode="wait">
            {mode === 'choose' ? (
              <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {/* Google */}
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:bg-gray-50 transition-all font-medium text-gray-700 text-sm disabled:opacity-50"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-arabic flex-1 text-right">{t('متابعة مع Google', 'Continue with Google')}</span>
                </button>

                {/* Apple */}
                <button
                  onClick={handleApple}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-900 border-2 border-gray-900 rounded-2xl hover:bg-black transition-all font-medium text-white text-sm disabled:opacity-50"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.39.07 2.35.74 3.16.78 1.21-.24 2.37-.93 3.67-.84 1.56.12 2.73.72 3.51 1.9-3.26 1.95-2.47 6.06.67 7.27-.62 1.59-1.41 3.16-3.01 3.77zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span className="font-arabic flex-1 text-right">{t('متابعة مع Apple', 'Continue with Apple')}</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-arabic">{t('أو', 'or')}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Email option */}
                <button
                  onClick={() => setMode('email')}
                  className="w-full flex items-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-2xl hover:border-amber-400 hover:bg-amber-50 transition-all font-medium text-gray-700 text-sm"
                >
                  <Mail className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span className="font-arabic flex-1 text-right">{t('متابعة بالبريد الإلكتروني', 'Continue with Email')}</span>
                </button>

                <p className="text-center text-xs text-gray-400 font-arabic pt-1">
                  {t('بالمتابعة توافق على شروط الاستخدام وسياسة الخصوصية', 'By continuing you agree to our Terms & Privacy Policy')}
                </p>
              </motion.div>
            ) : (
              <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button
                  onClick={() => { setMode('choose'); setError(''); }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-4 font-arabic transition-colors"
                >
                  ← {t('رجوع', 'Back')}
                </button>

                {error && (
                  <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-arabic text-center">
                    {error}
                  </div>
                )}

                <div className="flex rounded-xl border border-gray-200 mb-4 overflow-hidden">
                  <button
                    onClick={() => setIsSignUp(false)}
                    className={`flex-1 py-2 text-sm font-arabic font-medium transition-colors ${!isSignUp ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {t('دخول', 'Sign In')}
                  </button>
                  <button
                    onClick={() => setIsSignUp(true)}
                    className={`flex-1 py-2 text-sm font-arabic font-medium transition-colors ${isSignUp ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {t('حساب جديد', 'Register')}
                  </button>
                </div>

                <form onSubmit={handleEmail} className="space-y-3">
                  {isSignUp && (
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={t('الاسم الكامل', 'Full Name')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm font-arabic transition-colors"
                    />
                  )}
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm transition-colors"
                  />
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm transition-colors pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-semibold font-arabic flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-amber-300/40 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        {isSignUp ? t('إنشاء حساب', 'Create Account') : t('دخول', 'Sign In')}
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
