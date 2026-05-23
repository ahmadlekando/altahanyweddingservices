import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, MessageCircle, Play } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

const FALLBACK_SLIDES = [
  {
    image_url: 'https://images.pexels.com/photos/1114425/pexels-photo-1114425.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    title_ar: 'اجعل يومك الأميز', title: 'Make Your Special Day',
    subtitle_ar: 'لا يُنسى', subtitle: 'Unforgettable',
    cta_text: 'Book Now', cta_text_ar: 'احجز الآن', cta_url: '/#booking',
    overlay_opacity: 0.5, video_url: '',
  },
  {
    image_url: 'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    title_ar: 'خدمات أفراح', title: 'Premium Wedding',
    subtitle_ar: 'فاخرة بامتياز', subtitle: 'Services',
    cta_text: 'Book Now', cta_text_ar: 'احجز الآن', cta_url: '/#booking',
    overlay_opacity: 0.5, video_url: '',
  },
  {
    image_url: 'https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    title_ar: 'حفل زفافك', title: 'Your Dream',
    subtitle_ar: 'حلمك واقع', subtitle: 'Wedding Awaits',
    cta_text: 'Book Now', cta_text_ar: 'احجز الآن', cta_url: '/#booking',
    overlay_opacity: 0.5, video_url: '',
  },
];

type SlideData = {
  image_url: string; title: string; title_ar: string;
  subtitle: string; subtitle_ar: string;
  cta_text: string; cta_text_ar: string; cta_url: string;
  overlay_opacity: number; video_url: string;
};

export default function HeroSection() {
  const { t } = useLang();
  const [current, setCurrent] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [slides, setSlides] = useState<SlideData[]>(FALLBACK_SLIDES as SlideData[]);

  useEffect(() => {
    supabase.from('sliders').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      if (data && data.length > 0) setSlides(data as SlideData[]);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[current] || slides[0];

  return (
    <section className="relative h-screen min-h-[700px] overflow-hidden">
      {/* Background Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <img
            src={slide.image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

      {/* Gold decorative lines */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-60" />
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 text-amber-300 text-sm font-arabic mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {t('التهاني لخدمات الأفراح الفاخرة', 'ALTAHANY Premium Wedding Services')}
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4">
              <span className="font-arabic">{t(slide.title_ar, slide.title)}</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 font-arabic">
                {t(slide.subtitle_ar, slide.subtitle)}
              </span>
            </h1>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href={slide.cta_url || '/#booking'}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-2xl font-semibold text-lg shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-shadow font-arabic"
              >
                <Calendar className="w-5 h-5" />
                {t(slide.cta_text_ar || 'احجز ليلتك الآن', slide.cta_text || 'Book Your Night Now')}
              </motion.a>
              <motion.a
                href="https://wa.me/971527249190"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2.5 px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-2xl font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all font-arabic"
              >
                <MessageCircle className="w-5 h-5 text-green-400" />
                {t('تواصل واتساب', 'WhatsApp Chat')}
              </motion.a>
              <motion.button
                onClick={() => slide.video_url ? setShowVideo(true) : undefined}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2.5 px-6 py-4 bg-white/10 backdrop-blur-md text-white rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
                <span className="font-arabic text-lg">{t('شاهد أعمالنا', 'Watch Our Work')}</span>
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current ? 'w-8 h-2 bg-amber-400' : 'w-2 h-2 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6 text-white/50" />
        </motion.div>
      </div>

      {/* Stats Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-amber-900/80 via-amber-800/80 to-amber-900/80 backdrop-blur-sm border-t border-amber-600/20">
        <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { num: '1000+', ar: 'حفل زفاف', en: 'Weddings' },
            { num: '20+', ar: 'سنة خبرة', en: 'Years Exp.' },
            { num: '98%', ar: 'رضا العملاء', en: 'Satisfaction' },
            { num: '50+', ar: 'موظف محترف', en: 'Professionals' },
          ].map((stat) => (
            <div key={stat.num} className="text-center">
              <div className="text-2xl font-bold text-amber-300">{stat.num}</div>
              <div className="text-xs text-amber-100/70 font-arabic mt-0.5">{t(stat.ar, stat.en)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowVideo(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full h-full flex items-center justify-center text-white/50 font-arabic text-lg">
                {t('سيتم إضافة الفيديو قريباً', 'Video coming soon')}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
