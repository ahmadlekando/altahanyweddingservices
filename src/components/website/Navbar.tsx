import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Phone, Globe } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

const navLinks = [
  { ar: 'الرئيسية', en: 'Home', href: '/' },
  { ar: 'من نحن', en: 'About', href: '/#about' },
  { ar: 'خدماتنا', en: 'Services', href: '/#services' },
  { ar: 'الباقات', en: 'Packages', href: '/#packages' },
  { ar: 'معرض الأعمال', en: 'Gallery', href: '/#gallery' },
  { ar: 'آراء العملاء', en: 'Reviews', href: '/#reviews' },
  { ar: 'المدونة', en: 'Blog', href: '/blog' },
  { ar: 'اتصل بنا', en: 'Contact', href: '/#contact' },
];

export default function Navbar() {
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg shadow-black/5' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img
              src="/logo.png"
              alt="Al Tahany Wedding & Events"
              className={`h-11 w-auto object-contain transition-all duration-300 ${scrolled ? '' : 'brightness-0 invert'}`}
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-amber-50 hover:text-amber-700 ${
                  scrolled ? 'text-gray-700' : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                {t(link.ar, link.en)}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                scrolled ? 'text-gray-600 hover:bg-gray-100' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Globe className="w-4 h-4" />
              {lang === 'ar' ? 'EN' : 'عر'}
            </button>
            <a
              href="tel:+971527249190"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                scrolled ? 'text-gray-600 hover:bg-gray-100' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span className="font-arabic text-xs">{t('اتصل بنا', 'Call Us')}</span>
            </a>
            <a
              href="/#booking"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-amber-200 hover:shadow-amber-300 hover:scale-105 transition-all duration-300"
            >
              {t('احجز الآن', 'Book Now')}
            </a>
          </div>

          {/* Mobile Toggle */}
          <button
            className={`lg:hidden p-2 rounded-lg ${scrolled ? 'text-gray-700' : 'text-white'}`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 shadow-xl"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-gray-700 hover:bg-amber-50 hover:text-amber-700 rounded-xl text-base font-medium transition-colors"
                >
                  {t(link.ar, link.en)}
                </a>
              ))}
              <div className="pt-3 flex gap-2">
                <button
                  onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
                >
                  {lang === 'ar' ? 'English' : 'عربي'}
                </button>
                <a
                  href="/#booking"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold text-center"
                >
                  {t('احجز الآن', 'Book Now')}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
