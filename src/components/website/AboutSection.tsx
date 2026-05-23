import React from 'react';
import { motion } from 'framer-motion';
import { Award, Users, Heart, Star } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

const stats = [
  { icon: Heart, num: '500+', ar: 'حفل زفاف ناجح', en: 'Successful Weddings' },
  { icon: Users, num: '50+', ar: 'متخصص محترف', en: 'Expert Professionals' },
  { icon: Award, num: '10+', ar: 'سنوات من الخبرة', en: 'Years of Experience' },
  { icon: Star, num: '98%', ar: 'رضا العملاء', en: 'Client Satisfaction' },
];

const timeline = [
  { year: '2014', ar: 'تأسيس التهاني', en: 'Altahany Founded', desc_ar: 'بدأنا رحلتنا في الشارقة بفريق صغير وحلم كبير', desc_en: 'We began our journey in Sharjah with a small team and a big dream' },
  { year: '2017', ar: 'التوسع الإقليمي', en: 'Regional Expansion', desc_ar: 'توسعنا لخدمة جميع إمارات الدولة', desc_en: 'We expanded to serve all UAE emirates' },
  { year: '2020', ar: 'الباقات الفاخرة', en: 'Luxury Packages', desc_ar: 'أطلقنا خط الباقات الفاخرة VIP', desc_en: 'We launched our VIP luxury packages line' },
  { year: '2024', ar: 'خدمات رقمية متكاملة', en: 'Digital Integration', desc_ar: 'أضفنا منصة حجز رقمية وخدمات ذكاء اصطناعي', desc_en: 'Added digital booking and AI-powered services' },
];

export default function AboutSection() {
  const { t } = useLang();

  return (
    <section id="about" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.pexels.com/photos/1114425/pexels-photo-1114425.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt=""
                className="rounded-2xl shadow-xl w-full h-72 object-cover"
              />
              <div className="space-y-4">
                <img
                  src="https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt=""
                  className="rounded-2xl shadow-xl w-full h-32 object-cover"
                />
                <img
                  src="https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt=""
                  className="rounded-2xl shadow-xl w-full h-32 object-cover"
                />
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-2xl p-5 shadow-2xl shadow-amber-200">
              <div className="text-3xl font-bold">10+</div>
              <div className="text-xs font-arabic opacity-90">{t('سنوات من الإبداع', 'Years of Creativity')}</div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-arabic mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {t('من نحن', 'About Us')}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 font-arabic leading-tight mb-6">
              {t('نحن نصنع أجمل', 'We Create the Most')}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">
                {t('لحظات حياتكم', 'Beautiful Moments of Your Life')}
              </span>
            </h2>
            <p className="text-gray-500 leading-relaxed font-arabic mb-8 text-lg">
              {t(
                'التهاني لخدمات الأفراح هي شركة رائدة في تنظيم حفلات الأفراح الفاخرة في الإمارات العربية المتحدة. منذ تأسيسنا، نقدم خدمات متكاملة وعالية الجودة تتجاوز توقعات عملائنا وتجعل يومهم الأميز حلماً يتحقق.',
                'Altahany Wedding Services is a leading luxury wedding company in the UAE. Since our founding, we deliver comprehensive, high-quality services that exceed client expectations and make their special day a dream come true.'
              )}
            </p>

            {/* Vision & Mission */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { title_ar: 'رؤيتنا', title_en: 'Our Vision', desc_ar: 'أن نكون الاختيار الأول لكل زوجين يبحثان عن تجربة زفاف لا مثيل لها في الخليج العربي', desc_en: 'To be the first choice for every couple seeking an unparalleled wedding experience in the Arabian Gulf' },
                { title_ar: 'رسالتنا', title_en: 'Our Mission', desc_ar: 'تقديم خدمات أفراح فاخرة بأعلى مستويات الجودة والاحترافية والابتكار', desc_en: 'Delivering luxury wedding services with the highest levels of quality, professionalism and innovation' },
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                  <h4 className="font-bold text-amber-800 font-arabic mb-2">{t(item.title_ar, item.title_en)}</h4>
                  <p className="text-sm text-amber-700/70 font-arabic leading-relaxed">{t(item.desc_ar, item.desc_en)}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-2">
                    <stat.icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.num}</div>
                  <div className="text-xs text-gray-500 font-arabic">{t(stat.ar, stat.en)}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24"
        >
          <h3 className="text-center text-3xl font-bold text-gray-900 font-arabic mb-12">
            {t('مسيرتنا عبر السنين', 'Our Journey Through the Years')}
          </h3>
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-200 to-amber-500" />
            <div className="space-y-8">
              {timeline.map((item, i) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative flex items-center ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} gap-8`}
                >
                  <div className={`flex-1 ${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <div className="inline-block p-5 bg-white rounded-2xl shadow-lg border border-gray-100 hover:border-amber-200 transition-colors">
                      <div className="text-2xl font-bold text-amber-600 mb-1">{item.year}</div>
                      <div className="font-semibold text-gray-900 font-arabic mb-1">{t(item.ar, item.en)}</div>
                      <div className="text-sm text-gray-500 font-arabic">{t(item.desc_ar, item.desc_en)}</div>
                    </div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-400 border-4 border-white shadow-md z-10" />
                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
