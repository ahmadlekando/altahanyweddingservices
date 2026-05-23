import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

type Testimonial = {
  id: string;
  customer_name: string;
  customer_name_ar: string;
  customer_photo: string;
  rating: number;
  review: string;
  review_ar: string;
  event_type: string;
};

const FALLBACK: Testimonial[] = [
  {
    id: '1',
    customer_name: 'Amira & Sultan Al-Mansouri',
    customer_name_ar: 'أميرة وسلطان المنصوري',
    customer_photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
    rating: 5,
    review: 'Altahany made our wedding legendary! The Zaffa was absolutely amazing and the Kousha exceeded our expectations. Every detail was perfect.',
    review_ar: 'التهاني جعلت حفل زفافنا أسطورياً! الزفة كانت رائعة جداً والكوشة فاقت توقعاتنا. كل التفاصيل كانت مثالية ولا أستطيع أن أشكرهم بما يكفي.',
    event_type: 'wedding',
  },
  {
    id: '2',
    customer_name: 'Noura & Abdullah Al-Zaabi',
    customer_name_ar: 'نورة وعبدالله الزعابي',
    customer_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
    rating: 5,
    review: 'Exceptional professional service! The team was very cooperative from the start. Photography and video were amazing. I highly recommend Altahany.',
    review_ar: 'خدمة احترافية بامتياز! الفريق كان متعاوناً جداً منذ البداية. التصوير والفيديو كانا رائعين. أنصح الجميع بالتعامل مع التهاني.',
    event_type: 'wedding',
  },
  {
    id: '3',
    customer_name: 'Fatima & Khalid Al-Mutairi',
    customer_name_ar: 'فاطمة وخالد المطيري',
    customer_photo: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=200',
    rating: 5,
    review: 'I could not have imagined my wedding being this beautiful! The organization and attention to detail was exceptional. Thank you Altahany team.',
    review_ar: 'لم أتخيل أن حفل زفافي سيكون بهذا الجمال! التنظيم والاهتمام بالتفاصيل كان استثنائياً. شكراً لفريق التهاني من القلب.',
    event_type: 'wedding',
  },
  {
    id: '4',
    customer_name: 'Shaikha & Mohammed Al-Shamsi',
    customer_name_ar: 'شيخة ومحمد الشامسي',
    customer_photo: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200',
    rating: 5,
    review: 'Outstanding service and professional team. The decoration was magical and the Zaffa added a wonderful spirit to the ceremony.',
    review_ar: 'خدمة متميزة وفريق محترف. الديكور كان خيالياً والزفة أضافت روحاً رائعة للحفل. سأوصي بهم لكل أحد.',
    event_type: 'wedding',
  },
];

export default function TestimonialsSection() {
  const { t } = useLang();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK);

  useEffect(() => {
    supabase
      .from('testimonials')
      .select('*')
      .eq('is_public', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data && data.length > 0) setTestimonials(data as Testimonial[]);
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const navigate = (dir: number) => {
    setDirection(dir);
    setCurrent(prev => (prev + dir + testimonials.length) % testimonials.length);
  };

  const testimonial = testimonials[current];
  if (!testimonial) return null;

  return (
    <section id="reviews" className="py-24 bg-gradient-to-b from-amber-50 to-white overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm font-arabic mb-4">
            <Star className="w-3.5 h-3.5 fill-current" />
            {t('آراء عملائنا', "Our Clients' Reviews")}
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 font-arabic mb-4">
            {t('ماذا يقول', 'What Our')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">
              {t('عملاؤنا السعداء', 'Happy Clients Say')}
            </span>
          </h2>
        </motion.div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl shadow-amber-100 p-8 sm:p-12 relative"
            >
              <Quote className="absolute top-6 right-6 w-12 h-12 text-amber-100" />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {testimonial.customer_photo && (
                  <img
                    src={testimonial.customer_photo}
                    alt={t(testimonial.customer_name_ar, testimonial.customer_name)}
                    className="w-20 h-20 rounded-2xl object-cover shadow-lg ring-4 ring-amber-100 flex-shrink-0"
                  />
                )}
                <div className="flex-1 text-center sm:text-right">
                  <div className="flex justify-center sm:justify-end gap-1 mb-3">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 text-lg leading-relaxed font-arabic mb-6 italic">
                    "{t(testimonial.review_ar, testimonial.review)}"
                  </blockquote>
                  <div>
                    <div className="font-bold text-gray-900 font-arabic text-lg">
                      {t(testimonial.customer_name_ar, testimonial.customer_name)}
                    </div>
                    <div className="text-sm text-amber-600 font-arabic mt-1">
                      {t('عريس وعروس سعيدان', 'Happy Bride & Groom')}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                  className={`transition-all duration-300 rounded-full ${
                    i === current ? 'w-8 h-2.5 bg-amber-500' : 'w-2.5 h-2.5 bg-gray-200 hover:bg-amber-300'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50 flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => navigate(1)}
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50 flex items-center justify-center transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
          {testimonials.map((item, i) => (
            <button
              key={item.id}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`p-4 rounded-2xl border-2 transition-all ${
                i === current ? 'border-amber-400 bg-amber-50' : 'border-gray-100 bg-white hover:border-amber-200'
              }`}
            >
              {item.customer_photo ? (
                <img
                  src={item.customer_photo}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover mx-auto mb-2"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-100 mx-auto mb-2 flex items-center justify-center text-amber-600 font-bold text-sm">
                  {(item.customer_name_ar || item.customer_name).charAt(0)}
                </div>
              )}
              <div className="flex justify-center gap-0.5">
                {Array.from({ length: item.rating }).map((_, ri) => (
                  <Star key={ri} className="w-3 h-3 text-amber-400 fill-amber-400" />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
