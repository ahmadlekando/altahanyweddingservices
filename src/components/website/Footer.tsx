import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Youtube, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

const socialLinks = [
  { icon: Instagram, href: 'https://www.instagram.com/altahany/', label: 'Instagram' },
  { icon: MessageCircle, href: 'https://wa.me/971527249190', label: 'WhatsApp' },
];

export default function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="mb-5">
            <img src="/logo.png" alt="Al Tahany Wedding & Events" className="h-12 w-auto object-contain brightness-0 invert opacity-90" />
          </div>
          <p className="text-sm leading-relaxed text-gray-400 font-arabic mb-6">
            {t(
              'نحن متخصصون في تقديم خدمات الأفراح الفاخرة في الإمارات العربية المتحدة، نجعل يومك الأميز حلمًا يتحقق.',
              'We specialize in premium wedding services across the UAE, making your special day a dream come true.'
            )}
          </p>
          <div className="flex gap-3">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-amber-500 flex items-center justify-center transition-all duration-300 group"
                aria-label={label}
              >
                <Icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </a>
            ))}
            <a
              href="https://www.tiktok.com/@altahanyweddingservices"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-amber-500 flex items-center justify-center transition-all duration-300 group"
            >
              <svg className="w-4 h-4 text-gray-400 group-hover:text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.97a8.2 8.2 0 0 0 4.78 1.52V7.05a4.85 4.85 0 0 1-1.01-.36z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-semibold text-base mb-5 font-arabic">{t('روابط سريعة', 'Quick Links')}</h3>
          <ul className="space-y-2.5">
            {[
              { ar: 'من نحن', en: 'About Us', href: '/#about' },
              { ar: 'خدماتنا', en: 'Services', href: '/#services' },
              { ar: 'الباقات والأسعار', en: 'Packages & Pricing', href: '/#packages' },
              { ar: 'معرض الأعمال', en: 'Gallery', href: '/#gallery' },
              { ar: 'آراء العملاء', en: 'Testimonials', href: '/#reviews' },
              { ar: 'المدونة', en: 'Blog', href: '/blog' },
              { ar: 'الأسئلة الشائعة', en: 'FAQ', href: '/#faq' },
            ].map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-amber-500/50 group-hover:bg-amber-500 transition-colors flex-shrink-0" />
                  <span className="font-arabic">{t(link.ar, link.en)}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h3 className="text-white font-semibold text-base mb-5 font-arabic">{t('خدماتنا', 'Our Services')}</h3>
          <ul className="space-y-2.5">
            {[
              { ar: 'الزفة', en: 'Zaffa' },
              { ar: 'الكوشة والديكور', en: 'Kousha & Decor' },
              { ar: 'الإضاءة والمؤثرات', en: 'Lighting & Effects' },
              { ar: 'الدي جي والصوت', en: 'DJ & Sound' },
              { ar: 'تجهيز المسرح', en: 'Stage Setup' },
              { ar: 'تنظيم الفعاليات', en: 'Event Planning' },
              { ar: 'الضيافة والبوفيه', en: 'Catering & Buffet' },
              { ar: 'خيام المناسبات', en: 'Event Tents' },
            ].map((service) => (
              <li key={service.en}>
                <a
                  href="/#services"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors flex items-center gap-2 group font-arabic"
                >
                  <span className="w-1 h-1 rounded-full bg-amber-500/50 group-hover:bg-amber-500 transition-colors flex-shrink-0" />
                  {t(service.ar, service.en)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-white font-semibold text-base mb-5 font-arabic">{t('تواصل معنا', 'Contact Us')}</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Phone className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5 font-arabic">{t('الهاتف', 'Phone')}</div>
                <a href="tel:+971527249190" className="text-sm text-gray-300 hover:text-amber-400 transition-colors block">+971 52 724 9190</a>
                <a href="tel:+971506973130" className="text-sm text-gray-300 hover:text-amber-400 transition-colors block">+971 50 697 3130</a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5 font-arabic">{t('البريد الإلكتروني', 'Email')}</div>
                <a href="mailto:info@altahany.com" className="text-sm text-gray-300 hover:text-amber-400 transition-colors">
                  info@altahany.com
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5 font-arabic">{t('الموقع', 'Location')}</div>
                <p className="text-sm text-gray-300 font-arabic">{t('الشارقة، الإمارات العربية المتحدة', 'Sharjah, UAE')}</p>
              </div>
            </li>
          </ul>

          {/* Google Maps */}
          <div className="mt-5 rounded-xl overflow-hidden border border-white/5">
            <iframe
              title="Altahany Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d231854.94009566688!2d55.30661765!3d25.3462552!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f5f08d36e86f7%3A0x49c72c4cbf4e8a80!2sSharjah%20-%20United%20Arab%20Emirates!5e0!3m2!1sen!2s!4v1699000000000!5m2!1sen!2s"
              width="100%"
              height="130"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500 font-arabic">
            {t(
              `© ${year} التهاني لخدمات الأفراح. جميع الحقوق محفوظة.`,
              `© ${year} ALTAHANY Wedding Services. All rights reserved.`
            )}
          </p>
          <p className="text-xs text-gray-600">
            Powered &amp; Secured by{' '}
            <span className="text-amber-500/70 font-medium">Lekando</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
