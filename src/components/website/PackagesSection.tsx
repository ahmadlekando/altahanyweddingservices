import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

type Package = {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  original_price: number;
  features: string[];
  features_ar: string[];
  category: string;
  badge: string;
  is_featured: boolean;
};

const fallbackPackages: Package[] = [
  {
    id: '1',
    name: 'Silver Package',
    name_ar: 'باقة الفضة',
    description: 'Perfect for intimate wedding ceremonies',
    description_ar: 'مثالية للحفلات الصغيرة',
    price: 8000,
    original_price: 10000,
    features: ['Zaffa Service', 'Basic Decoration', 'Photography (4h)', 'Bridal Makeup'],
    features_ar: ['خدمة الزفة', 'ديكور أساسي', 'تصوير (4 ساعات)', 'مكياج العروس'],
    category: 'standard',
    badge: 'Popular',
    is_featured: false,
  },
  {
    id: '2',
    name: 'Gold Package',
    name_ar: 'باقة الذهب',
    description: 'Our most popular wedding package',
    description_ar: 'باقتنا الأكثر شعبية',
    price: 15000,
    original_price: 20000,
    features: ['Full Zaffa', 'Premium Kousha', 'Full Day Photography', 'Videography', 'DJ', 'Bridal Makeup', 'Wedding Car'],
    features_ar: ['زفة كاملة', 'كوشة فاخرة', 'تصوير طوال اليوم', 'فيديو', 'دي جي', 'مكياج العروس', 'سيارة أفراح'],
    category: 'premium',
    badge: 'Best Seller',
    is_featured: true,
  },
  {
    id: '3',
    name: 'Platinum Package',
    name_ar: 'باقة البلاتين',
    description: 'Ultimate luxury wedding experience',
    description_ar: 'تجربة زفاف فاخرة بالكامل',
    price: 30000,
    original_price: 40000,
    features: ['Grand Zaffa', 'Luxury Kousha', '2-Day Photography', 'Cinematic Video', '2 DJs', 'Full Makeup Team', '2 Wedding Cars', 'Event Planner'],
    features_ar: ['زفة كبرى', 'كوشة فاخرة', 'تصوير يومين', 'فيديو سينمائي', 'دي جيان', 'فريق مكياج', 'سيارتان', 'منسق فعاليات'],
    category: 'vip',
    badge: 'VIP',
    is_featured: false,
  },
];

export default function PackagesSection() {
  const { t } = useLang();
  const [packages, setPackages] = useState<Package[]>(fallbackPackages);

  useEffect(() => {
    supabase.from('packages').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      if (data && data.length > 0) setPackages(data);
    });
  }, []);

  const categoryColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    standard: { bg: 'bg-white', text: 'text-gray-900', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700' },
    premium: { bg: 'bg-gradient-to-b from-amber-50 to-white', text: 'text-gray-900', border: 'border-amber-300', badge: 'bg-amber-500 text-white' },
    vip: { bg: 'bg-gradient-to-b from-gray-900 to-gray-800', text: 'text-white', border: 'border-amber-500', badge: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' },
  };

  return (
    <section id="packages" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-arabic mb-4">
            <Star className="w-3.5 h-3.5" />
            {t('باقاتنا المميزة', 'Our Premium Packages')}
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 font-arabic mb-4">
            {t('اختر الباقة المثالية', 'Choose Your Perfect')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">
              {t('لحفلة أفراحك', 'Wedding Package')}
            </span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto font-arabic text-lg">
            {t('باقات شاملة ومخصصة تناسب كل ميزانية وتحقق كل حلم', 'Comprehensive packages tailored to every budget and every dream')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {packages.map((pkg, i) => {
            const colors = categoryColors[pkg.category] || categoryColors.standard;
            const discount = pkg.original_price > pkg.price
              ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100)
              : 0;

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`relative rounded-3xl border-2 ${colors.border} ${colors.bg} shadow-xl overflow-hidden ${pkg.is_featured ? 'scale-105 shadow-amber-200' : ''}`}
              >
                {/* Featured badge */}
                {pkg.is_featured && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
                )}

                <div className="p-8">
                  {/* Badge & Category */}
                  <div className="flex items-center justify-between mb-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                      {pkg.badge || pkg.category.toUpperCase()}
                    </span>
                    {discount > 0 && (
                      <span className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-bold">
                        -{discount}%
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className={`text-2xl font-bold font-arabic mb-1 ${colors.text}`}>
                    {t(pkg.name_ar, pkg.name)}
                  </h3>
                  <p className={`text-sm mb-6 font-arabic ${pkg.category === 'vip' ? 'text-gray-300' : 'text-gray-500'}`}>
                    {t(pkg.description_ar, pkg.description)}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    {pkg.original_price > pkg.price && (
                      <div className={`text-sm line-through ${pkg.category === 'vip' ? 'text-gray-500' : 'text-gray-400'} mb-1`}>
                        {formatCurrency(pkg.original_price)}
                      </div>
                    )}
                    <div className={`text-4xl font-bold ${pkg.category === 'vip' ? 'text-amber-400' : 'text-amber-600'}`}>
                      {formatCurrency(pkg.price)}
                    </div>
                    <div className={`text-xs mt-1 font-arabic ${pkg.category === 'vip' ? 'text-gray-400' : 'text-gray-400'}`}>
                      {t('للحفلة الواحدة، شامل ضريبة القيمة المضافة', 'per event, VAT included')}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8">
                    {(t(pkg.features_ar?.join('|') || '', pkg.features?.join('|') || '')).split('|').filter(Boolean).map((feat, fi) => (
                      <li key={fi} className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          pkg.category === 'vip' ? 'bg-amber-500/20' : 'bg-amber-100'
                        }`}>
                          <Check className={`w-3 h-3 ${pkg.category === 'vip' ? 'text-amber-400' : 'text-amber-600'}`} />
                        </div>
                        <span className={`text-sm font-arabic ${pkg.category === 'vip' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <a
                    href="/#booking"
                    className={`w-full block text-center py-3.5 rounded-xl font-semibold font-arabic transition-all duration-300 hover:scale-[1.02] ${
                      pkg.is_featured
                        ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-200 hover:shadow-amber-300'
                        : pkg.category === 'vip'
                        ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white hover:shadow-lg hover:shadow-amber-500/30'
                        : 'bg-gray-900 text-white hover:bg-amber-600'
                    }`}
                  >
                    {t('احجز هذه الباقة', 'Book This Package')}
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 font-arabic mb-4">
            {t('لا تجد ما يناسبك؟ نقدم باقات مخصصة حسب طلبك', "Can't find what you need? We offer custom packages")}
          </p>
          <a
            href="https://wa.me/971527249190"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors font-arabic"
          >
            <Zap className="w-4 h-4" />
            {t('طلب باقة مخصصة', 'Request Custom Package')}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
