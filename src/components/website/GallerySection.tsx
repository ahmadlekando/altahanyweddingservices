import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Share2, Download, ZoomIn } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

const galleryItems = [
  { id: 1, type: 'image', url: 'https://images.pexels.com/photos/1114425/pexels-photo-1114425.jpeg?auto=compress&cs=tinysrgb&w=800', title_ar: 'حفل زفاف فاخر', title_en: 'Luxury Wedding', category: 'wedding' },
  { id: 2, type: 'image', url: 'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=800', title_ar: 'كوشة رائعة', title_en: 'Stunning Kousha', category: 'decoration' },
  { id: 3, type: 'image', url: 'https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=800', title_ar: 'ديكور الزفاف', title_en: 'Wedding Décor', category: 'decoration' },
  { id: 4, type: 'image', url: 'https://images.pexels.com/photos/1444441/pexels-photo-1444441.jpeg?auto=compress&cs=tinysrgb&w=800', title_ar: 'لحظات التصوير', title_en: 'Photography Moments', category: 'photography' },
  { id: 5, type: 'image', url: 'https://images.pexels.com/photos/1478442/pexels-photo-1478442.jpeg?auto=compress&cs=tinysrgb&w=800', title_ar: 'منصة الأفراح', title_en: 'Wedding Stage', category: 'decoration' },
  { id: 6, type: 'image', url: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800', title_ar: 'أجواء رومانسية', title_en: 'Romantic Atmosphere', category: 'wedding' },
  { id: 7, type: 'image', url: 'https://images.pexels.com/photos/3985333/pexels-photo-3985333.jpeg?auto=compress&cs=tinysrgb&w=800', title_ar: 'مكياج العروس', title_en: 'Bridal Makeup', category: 'makeup' },
  { id: 8, type: 'image', url: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800', title_ar: 'موكب الزفة', title_en: 'Zaffa Procession', category: 'zaffa' },
  { id: 9, type: 'image', url: 'https://images.pexels.com/photos/3311469/pexels-photo-3311469.jpeg?auto=compress&cs=tinysrgb&w=800', title_ar: 'سيارة الأفراح', title_en: 'Wedding Car', category: 'cars' },
];

const categories = [
  { key: 'all', ar: 'الكل', en: 'All' },
  { key: 'wedding', ar: 'الأفراح', en: 'Weddings' },
  { key: 'decoration', ar: 'الديكور', en: 'Decoration' },
  { key: 'photography', ar: 'التصوير', en: 'Photography' },
  { key: 'makeup', ar: 'المكياج', en: 'Makeup' },
  { key: 'zaffa', ar: 'الزفة', en: 'Zaffa' },
];

export default function GallerySection() {
  const { t } = useLang();
  const [activeCategory, setActiveCategory] = useState('all');
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered = activeCategory === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.category === activeCategory);

  const toggleLike = (id: number) => {
    setLiked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const lightboxItem = lightbox !== null ? galleryItems.find(g => g.id === lightbox) : null;

  return (
    <section id="gallery" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-arabic mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {t('معرض أعمالنا', 'Our Portfolio')}
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 font-arabic mb-4">
            {t('لحظات لا تُنسى', 'Unforgettable Moments')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">
              {t('من إبداعنا', 'From Our Creativity')}
            </span>
          </h2>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium font-arabic transition-all duration-200 ${
                activeCategory === cat.key
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
              }`}
            >
              {t(cat.ar, cat.en)}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          <AnimatePresence>
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className="group relative break-inside-avoid rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => setLightbox(item.id)}
              >
                <img
                  src={item.url}
                  alt={t(item.title_ar, item.title_en)}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-white text-sm font-arabic font-medium">
                      {t(item.title_ar, item.title_en)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(item.id); }}
                        className={`p-1.5 rounded-lg transition-colors ${liked.has(item.id) ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}
                      >
                        <Heart className={`w-4 h-4 ${liked.has(item.id) ? 'fill-white' : ''}`} />
                      </button>
                      <button className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/40 transition-colors">
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors z-10">
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxItem.url}
                alt={t(lightboxItem.title_ar, lightboxItem.title_en)}
                className="w-full rounded-2xl"
              />
              <div className="mt-4 flex items-center justify-between">
                <h3 className="text-white font-arabic text-lg font-medium">
                  {t(lightboxItem.title_ar, lightboxItem.title_en)}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleLike(lightboxItem.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-arabic transition-all ${
                      liked.has(lightboxItem.id) ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${liked.has(lightboxItem.id) ? 'fill-white' : ''}`} />
                    {t('إعجاب', 'Like')}
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white text-sm font-arabic hover:bg-white/20 transition-all">
                    <Share2 className="w-4 h-4" />
                    {t('مشاركة', 'Share')}
                  </button>
                  <a
                    href={lightboxItem.url}
                    download
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white text-sm font-arabic hover:bg-white/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    {t('تحميل', 'Download')}
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
