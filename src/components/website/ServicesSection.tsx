import React from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../../contexts/LanguageContext';

const services = [
  {
    emoji: '🎵',
    ar: 'الزفة',
    en: 'Zaffa',
    desc_ar: 'زفة تقليدية فاخرة بالموسيقى الشرقية والرقص الحماسي لاستقبال العروسين',
    desc_en: 'Luxurious traditional Zaffa with oriental music and vibrant dance',
    image: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=600',
    accent: 'text-amber-600',
  },
  {
    emoji: '✨',
    ar: 'الكوشة والديكور',
    en: 'Kousha & Decor',
    desc_ar: 'جميع أنواع الكوش (إماراتي، هندي، كلاسيك، خارجي، حنة) بأرقى التصاميم وزهور طبيعية وصناعية',
    desc_en: 'All types of Kousha (Emirati, Indian, Classic, Outdoor, Henna) with natural and artificial floral decor',
    image: 'https://images.pexels.com/photos/1478442/pexels-photo-1478442.jpeg?auto=compress&cs=tinysrgb&w=600',
    accent: 'text-rose-600',
  },
  {
    emoji: '💡',
    ar: 'الإضاءة والمؤثرات',
    en: 'Lighting & Effects',
    desc_ar: 'Spot Light، Stage Lighting، Smoke & Fog & Snow، Dance Floor مضيء، Sparkles احتفالية',
    desc_en: 'Spot & Stage Lighting, Smoke, Fog & Snow Machines, illuminated Dance Floor, and celebratory Sparkles',
    image: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=600',
    accent: 'text-yellow-600',
  },
  {
    emoji: '🎶',
    ar: 'الدي جي والصوت',
    en: 'DJ & Sound',
    desc_ar: 'دي جي احترافي مع أحدث أجهزة الصوت، مكتبة زفات وأغانٍ منظمة، وتنسيق موسيقي كامل',
    desc_en: 'Professional DJ with top sound systems, organized music library of Zaffa & songs, full musical coordination',
    image: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=600',
    accent: 'text-cyan-600',
  },
  {
    emoji: '🏛️',
    ar: 'تجهيز المسرح والممرات',
    en: 'Stage & Walkways',
    desc_ar: 'Stage كامل، Red Carpet، ممرات Acrylic شفافة ومضيئة، تصميم مداخل VIP فاخرة',
    desc_en: 'Full Stage setup, Red Carpet, transparent & illuminated Acrylic Walkways, luxury VIP Entrance design',
    image: 'https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=600',
    accent: 'text-stone-600',
  },
  {
    emoji: '🎊',
    ar: 'تنظيم وإدارة الفعاليات',
    en: 'Event Planning & Management',
    desc_ar: 'Event Planning كامل، إشراف يوم الحدث، تنظيم دخول العروسين، وتنسيق جدول الحفل لحظة بلحظة',
    desc_en: 'Full Event Planning, day-of supervision, bride & groom entrance coordination, and minute-by-minute schedule',
    image: 'https://images.pexels.com/photos/1114425/pexels-photo-1114425.jpeg?auto=compress&cs=tinysrgb&w=600',
    accent: 'text-orange-600',
  },
  {
    emoji: '☕',
    ar: 'الضيافة والبوفيه',
    en: 'Hospitality & Catering',
    desc_ar: 'طاولات عطور، صبابات قهوة عربية، بوفيه أفراح، بوفيه خيام خارجية، وإفطار للشركات والمناسبات',
    desc_en: 'Perfume Tables, Arabic coffee service, wedding buffets, outdoor tent catering, and corporate breakfast events',
    image: 'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=600',
    accent: 'text-amber-700',
  },
  {
    emoji: '🏕️',
    ar: 'الخيام والمناسبات الخارجية',
    en: 'Tents & Outdoor Events',
    desc_ar: 'خيام زفاف، رمضانية، وعزاء مع تجهيز كامل للمناسبات الخارجية بأعلى معايير الراحة',
    desc_en: 'Wedding, Ramadan & condolence tents with full outdoor event setup at the highest comfort standards',
    image: 'https://images.pexels.com/photos/1114425/pexels-photo-1114425.jpeg?auto=compress&cs=tinysrgb&w=600',
    accent: 'text-emerald-600',
  },
  {
    emoji: '📷',
    ar: 'التصوير والفيديو',
    en: 'Photography & Video',
    desc_ar: 'تصوير احترافي وإنتاج فيديو سينمائي فاخر يخلّد أجمل لحظاتكم للأبد',
    desc_en: 'Professional photography and cinematic video production that immortalizes your most beautiful moments',
    image: 'https://images.pexels.com/photos/1444441/pexels-photo-1444441.jpeg?auto=compress&cs=tinysrgb&w=600',
    accent: 'text-blue-600',
  },
];

export default function ServicesSection() {
  const { t } = useLang();

  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-arabic mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {t('خدماتنا المتميزة', 'Our Premium Services')}
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 font-arabic mb-4">
            {t('كل ما تحتاجه', 'Everything You Need')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">
              {t('لحفل زفاف مثالي', 'For A Perfect Wedding')}
            </span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto font-arabic text-lg leading-relaxed">
            {t(
              'نقدم باقة متكاملة من خدمات الأفراح الفاخرة بأعلى معايير الجودة والاحترافية',
              'We offer a complete package of premium wedding services with the highest standards of quality and professionalism'
            )}
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.en}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-amber-200 shadow-sm hover:shadow-xl hover:shadow-amber-50 transition-all duration-400"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.en}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-xl shadow-lg">
                  {service.emoji}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className={`text-lg font-bold font-arabic mb-1.5 ${service.accent}`}>
                  {t(service.ar, service.en)}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed font-arabic">
                  {t(service.desc_ar, service.desc_en)}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <a
                    href="/#booking"
                    className="text-sm font-medium text-amber-600 hover:text-amber-700 font-arabic flex items-center gap-1 group/link"
                  >
                    {t('احجز الخدمة', 'Book Service')}
                    <span className="group-hover/link:translate-x-1 transition-transform">←</span>
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
